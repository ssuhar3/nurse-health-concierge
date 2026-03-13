const crypto = require('crypto');
const { appendRow } = require('./utils/sheets');
const { sendNotification, sendEmail, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');
const { generateOnboardingSummaryPdf } = require('./utils/client-summary-pdf');
const { generateClientPacket } = require('./utils/client-packet-pdf');
const { uploadPdf: uploadToS3 } = require('./utils/s3');

const REQUIRED_FIELDS = [
  'clientName', 'dob', 'phone', 'email',
  'primaryContactName', 'primaryContactPhone',
  'emergencyContactName', 'emergencyContactPhone',
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, { message: 'OK' });
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  try {
    const raw = JSON.parse(event.body || '{}');
    const data = sanitizeAll(raw);

    const { valid, missing } = validateRequired(data, REQUIRED_FIELDS);
    if (!valid) {
      return respond(400, { error: 'Missing required fields', missing });
    }

    const timestamp = new Date().toISOString();
    data.timestamp = timestamp;

    const safeName = (data.clientName || 'client').replace(/[^a-zA-Z0-9]/g, '_');

    // Collect care needs checkboxes
    const careNeeds = [];
    if (data.need_medication) careNeeds.push('Medication Management');
    if (data.need_appointments) careNeeds.push('Appointment Coordination');
    if (data.need_insurance) careNeeds.push('Insurance Navigation');
    if (data.need_homeVisits) careNeeds.push('Home Health Visits');
    if (data.need_postHospital) careNeeds.push('Post-Hospital Transition');
    if (data.need_wellness) careNeeds.push('Wellness Check-ins');
    if (data.need_endOfLife) careNeeds.push('End-of-Life Planning');

    // Collect care goals
    const careGoals = [
      data.careGoal1,
      data.careGoal2,
      data.careGoal3,
    ].filter(Boolean).join(' | ');

    // ── Step 1: Generate both PDFs in parallel ────────
    const [summaryPdf, packetPdf] = await Promise.all([
      generateOnboardingSummaryPdf(data),
      generateClientPacket(data),
    ]);

    // ── Step 2: Upload PDFs to S3 (encrypted) ─────────
    const summaryFileName = `onboarding/${safeName}/Onboarding_Summary_${Date.now()}.pdf`;
    const packetFileName = `onboarding/${safeName}/NHC_Client_Packet_${Date.now()}.pdf`;

    const [summaryS3, packetS3] = await Promise.all([
      uploadToS3(summaryFileName, summaryPdf, { clientName: data.clientName, type: 'summary' }),
      uploadToS3(packetFileName, packetPdf, { clientName: data.clientName, type: 'packet' }),
    ]);

    // ── Step 3: Sheet + emails in parallel ────────────
    const address = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');

    // Sheet row — 31 columns (A–AE)
    const sheetRow = [
      timestamp,                              // A: Timestamp
      data.clientName,                        // B: Client Name
      data.dob,                               // C: DOB
      data.address || '',                     // D: Address
      data.city || '',                        // E: City
      data.state || '',                       // F: State
      data.zip || '',                         // G: Zip
      data.phone,                             // H: Phone
      data.email,                             // I: Email
      data.primaryContactName,                // J: Primary Contact Name
      data.primaryContactRelationship || '',  // K: Primary Contact Relationship
      data.primaryContactPhone,               // L: Primary Contact Phone
      data.primaryContactEmail || '',         // M: Primary Contact Email
      data.emergencyContactName,              // N: Emergency Contact Name
      data.emergencyContactPhone,             // O: Emergency Contact Phone
      data.pcp || '',                         // P: PCP
      data.specialists || '',                 // Q: Specialists
      data.medicalConditions || '',           // R: Medical Conditions
      data.medications || '',                 // S: Medications
      data.allergies || '',                   // T: Allergies
      data.hospitalPreference || '',          // U: Hospital Preference
      data.medicareMedicaid || '',            // V: Medicare/Medicaid
      data.supplementalInsurance || '',       // W: Supplemental Insurance
      data.pharmacy || '',                    // X: Pharmacy
      careNeeds.join(', '),                   // Y: Care Needs
      careGoals,                              // Z: Care Goals
      summaryS3.url,                            // AA: Summary PDF Link
      packetS3.url,                             // AB: Agreement Packet Link
      'New',                                  // AC: Status
      '',                                     // AD: Internal Notes
      crypto.randomUUID(),                    // AE: Record ID
    ];

    // Admin notification email
    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">New Client Onboarding</h2>
          <p style="margin:4px 0 0;opacity:0.85">${data.clientName}</p>
          <p style="margin:4px 0 0;opacity:0.7">${timestamp}</p>
        </div>
        <div style="padding:16px 24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          ${formatSection('Client Information', {
            'Name': data.clientName,
            'Date of Birth': data.dob,
            'Phone': data.phone,
            'Email': data.email,
            'Address': address || 'Not provided',
          })}
          ${formatSection('Primary Contact', {
            'Name': data.primaryContactName,
            'Relationship': data.primaryContactRelationship || 'Not specified',
            'Phone': data.primaryContactPhone,
            'Email': data.primaryContactEmail || 'Not provided',
          })}
          ${formatSection('Emergency Contact', {
            'Name': data.emergencyContactName,
            'Phone': data.emergencyContactPhone,
          })}
          ${careNeeds.length ? formatSection('Care Needs', {
            'Selected Services': careNeeds.join(', '),
          }) : ''}
          ${careGoals ? formatSection('Care Goals', {
            'Goals': careGoals,
          }) : ''}
          <p style="margin-top:20px;font-size:14px">
            <strong>Summary PDF:</strong>
            <a href="${summaryS3.url}" style="color:#1a365d">Download from S3</a> (also attached)
          </p>
          <p style="font-size:14px">
            <strong>Agreement Packet:</strong>
            <a href="${packetS3.url}" style="color:#1a365d">Download from S3</a> (emailed to client)
          </p>
          <p style="font-size:12px;color:#888;margin-top:8px">
            S3 links expire in 7 days. PDFs are stored permanently in encrypted S3 storage.
          </p>
        </div>
      </div>
    `;

    // Client email with fillable agreement packet
    const clientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">Your NHC Client Agreement Packet</h2>
          <p style="margin:4px 0 0;opacity:0.85">Nurse Health Concierge</p>
        </div>
        <div style="padding:24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1e2c">Dear ${data.clientName},</p>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            Thank you for choosing Nurse Health Concierge! Attached you will find your
            <strong>Client Agreement Packet</strong> with your information already filled in.
          </p>
          <div style="background:#fff;border:1px solid #c9a54e;border-radius:8px;padding:20px;margin:20px 0">
            <h3 style="color:#1a365d;margin:0 0 12px">Next Steps:</h3>
            <ol style="color:#4a4e5c;font-size:14px;line-height:1.8;padding-left:20px;margin:0">
              <li><strong>Open</strong> the attached PDF in Adobe Acrobat Reader (free) or your preferred PDF viewer</li>
              <li><strong>Review</strong> each agreement carefully</li>
              <li><strong>Fill out</strong> and sign all signature fields</li>
              <li><strong>Save</strong> the completed PDF to your computer</li>
              <li><strong>Reply to this email</strong> with the signed PDF attached</li>
            </ol>
          </div>
          <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
            The packet includes 5 agreements: HIPAA Authorization, Service Agreement,
            Payment Authorization, Emergency Protocol, and Family Communication Consent.
            Please complete all sections and return at your earliest convenience.
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
      appendRow('Client Onboarding', sheetRow),
      sendNotification(
        `New Client Onboarding — ${data.clientName}`,
        adminHtml,
        [{ filename: summaryFileName, content: summaryPdf }]
      ),
      sendEmail({
        to: data.email,
        subject: 'Your NHC Client Agreement Packet',
        html: clientHtml,
        replyTo: process.env.SMTP_USER,
        attachments: [{ filename: packetFileName, content: packetPdf }],
      }),
    ]);

    return respond(200, {
      success: true,
      message: 'Your onboarding form has been submitted! Check your email for your agreement packet to review and sign.',
    });

  } catch (err) {
    console.error('submit-onboarding error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or contact us directly.',
    });
  }
};
