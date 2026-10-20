const { sendNotification, formatSection } = require('./utils/email');
const { validateRequired, respond } = require('./utils/validate');
const { readPublicForm, INVALID_FORM_MESSAGE } = require('./utils/public-form');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, { message: 'OK' });
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
  const data = readPublicForm(event.body, 'contact');
  if (!data) return respond(400, { error: INVALID_FORM_MESSAGE });
  const { valid, missing } = validateRequired(data, ['gcName', 'gcEmail', 'gcTopic']);
  if (!valid) return respond(400, { error: 'Missing required fields', missing });
  try {
    const html = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">' +
      '<h2>New Contact Request</h2>' + formatSection('Contact Information', {
        Name: data.gcName, Email: data.gcEmail, Topic: data.gcTopic,
      }) + '<p>Please follow up with this contact. Medical details are not collected through this form.</p></div>';
    await sendNotification('New Contact Request', html);
    return respond(200, { success: true, message: 'Your contact request has been sent. We will be in touch soon!' });
  } catch {
    console.error('Contact request processing failed.');
    return respond(500, { error: 'Something went wrong. Please try again or email us directly at info@lsadvocates.com.' });
  }
};
