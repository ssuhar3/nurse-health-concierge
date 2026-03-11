const { appendRow } = require('./utils/sheets');
const { sendNotification, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');
const { generateApplicationPdf } = require('./utils/pdf');
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

    // ── Generate PDF ─────────────────────────────────
    const pdfBuffer = await generateApplicationPdf(data);

    // ── Upload PDF to Google Drive ───────────────────
    const safeName = (data.fullName || 'applicant').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Application_${safeName}_${Date.now()}.pdf`;
    const { webViewLink } = await uploadPdf(fileName, pdfBuffer);

    // ── Google Sheet ─────────────────────────────────
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
      webViewLink,
    ];

    await appendRow('Advocate Applications', sheetRow);

    // ── Email Notification ───────────────────────────
    const address = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');

    const html = `
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
            <strong>Full Application PDF:</strong>
            <a href="${webViewLink}" style="color:#1a365d">${webViewLink}</a>
          </p>
        </div>
      </div>
    `;

    await sendNotification(
      `New Advocate Application — ${data.fullName} (${data.profTitle})`,
      html,
      [{ filename: fileName, content: pdfBuffer }]
    );

    return respond(200, {
      success: true,
      message: 'Your application has been submitted successfully! We will review it and be in touch.',
    });

  } catch (err) {
    console.error('submit-application error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or email us directly at pdobbers@aol.com.',
    });
  }
};
