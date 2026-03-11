const { appendRow } = require('./utils/sheets');
const { sendNotification, sendEmail, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');
const { generateApplicationPdf } = require('./utils/pdf');
const { generateFillablePacket } = require('./utils/fillable-pdf');
const { uploadPdf } = require('./utils/drive');

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

    // ── Step 2: Upload both to Drive in parallel ──────
    const summaryFileName = `Summary_${safeName}_${Date.now()}.pdf`;
    const packetFileName = `NHC_Application_Packet_${safeName}.pdf`;

    const [summaryUpload, packetUpload] = await Promise.all([
      uploadPdf(summaryFileName, summaryPdf),
      uploadPdf(packetFileName, fillablePdf),
    ]);

    // ── Step 3: Sheet + emails in parallel ────────────
    const address = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');

    // Sheet row — 15 columns
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
      summaryUpload.webViewLink,
      packetUpload.webViewLink,
      'Packet Sent',
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
          <p style="margin-top:20px;font-size:14px">
            <strong>Summary PDF:</strong>
            <a href="${summaryUpload.webViewLink}" style="color:#1a365d">View in Drive</a>
          </p>
          <p style="font-size:14px">
            <strong>Application Packet:</strong>
            <a href="${packetUpload.webViewLink}" style="color:#1a365d">View in Drive</a>
          </p>
          <p style="font-size:13px;color:#666;margin-top:16px">
            A fillable application packet has been emailed to the applicant at ${data.email}.
          </p>
        </div>
      </div>
    `;

    // Applicant email with fillable PDF
    const applicantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">Your NHC Application Packet</h2>
          <p style="margin:4px 0 0;opacity:0.85">Nurse Health Concierge</p>
        </div>
        <div style="padding:24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1e2c">Dear ${data.fullName},</p>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            Thank you for your interest in joining our team of Health Advocates! Attached you will find your
            <strong>Health Advocate Application Packet</strong> with your basic information already filled in.
          </p>
          <div style="background:#fff;border:1px solid #c9a54e;border-radius:8px;padding:20px;margin:20px 0">
            <h3 style="color:#1a365d;margin:0 0 12px">Next Steps:</h3>
            <ol style="color:#4a4e5c;font-size:14px;line-height:1.8;padding-left:20px;margin:0">
              <li><strong>Open</strong> the attached PDF in Adobe Acrobat Reader (free) or your preferred PDF viewer</li>
              <li><strong>Fill out</strong> all remaining sections (credentials, experience, agreements, references, skills)</li>
              <li><strong>Save</strong> the completed PDF to your computer</li>
              <li><strong>Reply to this email</strong> with the completed PDF attached</li>
            </ol>
          </div>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            The packet includes 6 forms covering professional credentials, background authorization,
            HIPAA compliance, contractor agreement, references, and a skills assessment. Please complete
            all sections as thoroughly as possible.
          </p>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            If you have any questions, simply reply to this email or call us directly.
          </p>
          <p style="font-size:14px;color:#1a365d;margin-top:24px">
            Warm regards,<br>
            <strong>Pat Dobbins</strong><br>
            <span style="color:#4a4e5c">Founder, Nurse Health Concierge</span>
          </p>
        </div>
      </div>
    `;

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
        subject: 'Your NHC Health Advocate Application Packet',
        html: applicantHtml,
        replyTo: process.env.SMTP_USER,
        attachments: [{ filename: packetFileName, content: fillablePdf }],
      }),
    ]);

    return respond(200, {
      success: true,
      message: 'Your application has been submitted! Check your email for the full application packet to complete.',
    });

  } catch (err) {
    console.error('submit-application error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or email us directly at nursehealthconcierge@gmail.com.',
    });
  }
};
