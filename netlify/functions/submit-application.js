const crypto = require('crypto');
const { appendRow } = require('./utils/sheets');
const { insertRecord } = require('./utils/supabase');
const { sendNotification, sendEmail, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');
const { generateApplicationPdf } = require('./utils/pdf');
const { generateFillablePacket } = require('./utils/fillable-pdf');
const { uploadPdf: uploadToS3 } = require('./utils/s3');

const REQUIRED_FIELDS = ['fullName', 'email', 'phone', 'profTitle'];

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, { message: 'OK' });
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  try {
    const raw = JSON.parse(event.body || '{}');
    const data = sanitizeAll(raw);

    // Validate
    const { valid, missing } = validateRequired(data, REQUIRED_FIELDS);
    if (!valid) {
      return respond(400, {
        error: 'Missing required fields',
        missing,
      });
    }

    const timestamp = new Date().toISOString();
    data.timestamp = timestamp;

    const safeName = (data.fullName || 'applicant').replace(/[^a-zA-Z0-9]/g, '_');

    // ── Step 1: Generate both PDFs in parallel ────────
    const [summaryPdf, fillablePdf] = await Promise.all([
      generateApplicationPdf(data),
      generateFillablePacket(data),
    ]);

    // ── Step 2: Upload PDFs to S3 (encrypted) ──────
    const summaryFileName = `applications/${safeName}/Summary_${Date.now()}.pdf`;
    const packetFileName = `applications/${safeName}/Application_Packet_${Date.now()}.pdf`;

    const uploads = [
      uploadToS3(summaryFileName, summaryPdf, { applicantName: data.fullName, type: 'summary' }),
      uploadToS3(packetFileName, fillablePdf, { applicantName: data.fullName, type: 'packet' }),
    ];

    // Upload resume to S3 if provided
    let resumeS3 = null;
    if (data.resumeFile) {
      const resumeBuffer = Buffer.from(data.resumeFile, 'base64');
      const ext = (data.resumeFileName || 'resume.pdf').split('.').pop();
      const resumeKey = `applications/${safeName}/Resume_${Date.now()}.${ext}`;
      uploads.push(
        uploadToS3(resumeKey, resumeBuffer, { applicantName: data.fullName, type: 'resume' })
          .then(result => { resumeS3 = result; return result; })
      );
    }

    const [summaryS3, packetS3] = await Promise.all(uploads);

    // ── Step 3: Sheet + emails in parallel ────────────
    const address = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');

    // Sheet row — 29 columns
    const sheetRow = [
      timestamp,
      data.fullName,
      data.email,
      data.phone,
      data.address || '',
      data.city || '',
      data.state || '',
      data.zip || '',
      data.profTitle,
      data.empType || '',
      data.geoAreas || '',
      data.startDate || '',
      data.experience || '',
      summaryS3.url,
      packetS3.url,
      resumeS3 ? resumeS3.url : '',
      'Packet Sent',
      '', // Internal Notes
      crypto.randomUUID(), // Record ID
    ];

    // Admin notification email
    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">New Advocate Application</h2>
          <p style="margin:4px 0 0;opacity:0.85">${data.fullName} &mdash; ${data.profTitle}</p>
          <p style="margin:4px 0 0;opacity:0.7">${timestamp}</p>
        </div>
        <div style="padding:16px 24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          ${formatSection('Applicant Information', {
            'Name': data.fullName,
            'Email': data.email,
            'Phone': data.phone,
            'Address': address,
          })}
          ${formatSection('Professional Title', {
            'Title': data.profTitle,
          })}
          ${formatSection('Availability', {
            'Employment Type': data.empType,
            'Geographic Areas': data.geoAreas,
            'Earliest Start Date': data.startDate,
          })}
          ${data.experience ? formatSection('Experience', { 'Senior Health Advocacy': data.experience }) : ''}
          <p style="margin-top:20px;font-size:14px">
            <strong>Summary PDF:</strong>
            <a href="${summaryS3.url}" style="color:#1a365d">View / Download</a>
          </p>
          <p style="font-size:14px">
            <strong>Application Packet:</strong>
            <a href="${packetS3.url}" style="color:#1a365d">View / Download</a>
          </p>
          ${resumeS3 ? `<p style="font-size:14px"><strong>Resume:</strong> <a href="${resumeS3.url}" style="color:#1a365d">View / Download</a></p>` : ''}
          <p style="font-size:13px;color:#666;margin-top:16px">
            A fillable application packet has been emailed to the applicant at ${data.email}.
          </p>
        </div>
      </div>
    `;

    // Applicant confirmation email
    const applicantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">Application Received</h2>
          <p style="margin:4px 0 0;opacity:0.85">Senior Health Concierge</p>
        </div>
        <div style="padding:24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1e2c">Dear ${data.fullName},</p>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            Thank you for your interest in joining our team of Health Advocates! We have received your application
            and a member of our team will reach out to you <strong>within 3 business days</strong> to discuss next steps.
          </p>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            In the meantime, if you have any questions, simply reply to this email or call us directly.
          </p>
          <p style="font-size:14px;color:#1a365d;margin-top:24px">
            Warm regards,<br>
            <strong>Pat Dobbins</strong><br>
            <span style="color:#4a4e5c">Founder, Senior Health Concierge</span>
          </p>
        </div>
      </div>
    `;

    // --- Supabase (dual-write for new portal) ---
    await insertRecord('advocate_applications', {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      professional_title: data.profTitle,
      employment_type: data.empType || '',
      geographic_areas: data.geoAreas || '',
      start_date: data.startDate || '',
      experience: data.experience || '',
      summary_pdf_url: summaryS3.url,
      packet_pdf_url: packetS3.url,
      resume_pdf_url: resumeS3 ? resumeS3.url : '',
      status: 'Packet Sent',
    });

    // Fire all three in parallel
    await Promise.all([
      appendRow('Advocate Applications', sheetRow),
      sendNotification(
        `New Advocate Application — ${data.fullName} (${data.profTitle})`,
        adminHtml,
        [{ filename: summaryFileName, content: summaryPdf }]
      ),
      sendEmail({
        to: data.email,
        subject: 'Application Received — Senior Health Concierge',
        html: applicantHtml,
        replyTo: process.env.SMTP_USER,
      }),
    ]);

    return respond(200, {
      success: true,
      message: 'Your application has been submitted! Check your email for the full application packet to complete.',
    });

  } catch (err) {
    console.error('submit-application error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or email us directly at srhealthconcierge@gmail.com.',
    });
  }
};
