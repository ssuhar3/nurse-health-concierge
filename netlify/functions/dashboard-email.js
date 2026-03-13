const { sendEmail } = require('./utils/email');
const { appendRow } = require('./utils/sheets');
const { verifySession } = require('./utils/dashboard-auth');
const { sanitize, respond } = require('./utils/validate');
const { getTemplate, listTemplates } = require('./utils/email-templates');

function authResponse(event, statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': event.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return authResponse(event, 200, { message: 'OK' });
  }

  // Verify session
  try {
    verifySession(event);
  } catch {
    return authResponse(event, 401, { error: 'Unauthorized' });
  }

  const action = event.queryStringParameters?.action;

  try {
    // ── List templates ────────────────────────────
    if (action === 'templates' && event.httpMethod === 'GET') {
      return authResponse(event, 200, { templates: listTemplates() });
    }

    // ── Send email ────────────────────────────────
    if (action === 'send' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { to, template, subject, html, recordId, tab, name, siteUrl } = body;

      if (!to) return authResponse(event, 400, { error: 'Recipient email is required' });

      let finalSubject, finalHtml, templateName = 'Custom';

      if (template) {
        // Use pre-built template
        const tmpl = getTemplate(template);
        if (!tmpl) return authResponse(event, 400, { error: 'Unknown template' });
        const data = { name: name || '', siteUrl: siteUrl || '' };
        finalSubject = tmpl.subject(data);
        finalHtml = tmpl.html(data);
        templateName = tmpl.name;
      } else {
        // Custom email
        if (!subject || !html) {
          return authResponse(event, 400, { error: 'Subject and body are required for custom emails' });
        }
        finalSubject = sanitize(subject);
        finalHtml = html; // HTML is sent as-is (staff-generated)
      }

      await sendEmail({
        to: sanitize(to),
        subject: finalSubject,
        html: finalHtml,
        replyTo: process.env.SMTP_USER,
      });

      // Log to Email Log sheet
      const timestamp = new Date().toISOString();
      await appendRow('Email Log', [
        timestamp,
        recordId || '',
        tab || '',
        sanitize(to),
        finalSubject,
        templateName,
        'Sent',
      ]);

      return authResponse(event, 200, { success: true, message: 'Email sent' });
    }

    return authResponse(event, 400, { error: 'Invalid action' });

  } catch (err) {
    console.error('dashboard-email error:', err);
    return authResponse(event, 500, { error: 'Failed to send email' });
  }
};
