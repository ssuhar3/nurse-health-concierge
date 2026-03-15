const { sendNotification, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');

const REQUIRED_FIELDS = ['gcName', 'gcEmail', 'gcMessage'];

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

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">New General Inquiry</h2>
          <p style="margin:4px 0 0;opacity:0.85">${timestamp}</p>
        </div>
        <div style="padding:16px 24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          ${formatSection('Contact Information', {
            'Name': data.gcName,
            'Email': data.gcEmail,
          })}
          ${formatSection('Message', {
            'Details': data.gcMessage,
          })}
        </div>
      </div>
    `;

    await sendNotification(
      `General Inquiry — ${data.gcName}`,
      html
    );

    return respond(200, {
      success: true,
      message: 'Your message has been sent. We\'ll be in touch soon!',
    });

  } catch (err) {
    console.error('submit-contact error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or email us directly at nursehealthconcierge@gmail.com.',
    });
  }
};
