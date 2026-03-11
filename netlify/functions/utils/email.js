const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Get SMTP transporter (cached)
 */
function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send email notification
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 * @returns {Object} Send result
 */
async function sendNotification(subject, html, attachments = []) {
  const mail = getTransporter();

  const result = await mail.sendMail({
    from: `"Nurse Health Concierge" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFICATION_EMAIL || 'nursehealthconcierge@gmail.com',
    subject,
    html,
    attachments,
  });

  return result;
}

/**
 * Format a key-value object into a readable HTML email section
 * @param {string} sectionTitle - Section heading
 * @param {Object} data - Key-value pairs
 * @returns {string} HTML string
 */
function formatSection(sectionTitle, data) {
  const rows = Object.entries(data)
    .filter(([, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => `<tr><td style="padding:6px 12px;font-weight:600;color:#1a365d;vertical-align:top;white-space:nowrap">${key}</td><td style="padding:6px 12px">${escapeHtml(String(val))}</td></tr>`)
    .join('\n');

  if (!rows) return '';

  return `
    <h3 style="color:#1a365d;border-bottom:2px solid #c9972f;padding-bottom:4px;margin-top:24px">${sectionTitle}</h3>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
  `;
}

/**
 * Send email to an arbitrary recipient (e.g., an applicant)
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.subject - Email subject
 * @param {string} opts.html - HTML body
 * @param {string} [opts.replyTo] - Reply-To address
 * @param {Array}  [opts.attachments] - Nodemailer attachments
 * @returns {Object} Send result
 */
async function sendEmail({ to, subject, html, replyTo, attachments = [] }) {
  const mail = getTransporter();

  const mailOpts = {
    from: `"Nurse Health Concierge" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    attachments,
  };
  if (replyTo) mailOpts.replyTo = replyTo;

  return mail.sendMail(mailOpts);
}

/**
 * Escape HTML entities
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendNotification, sendEmail, formatSection, escapeHtml };
