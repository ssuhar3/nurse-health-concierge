const { sanitizeAll } = require('./validate');

const FIELDS = {
  inquiry: ['contactName', 'relationship', 'phone', 'email', 'contactMethod', 'contactTime', 'referralSource', 'timeframe', 'seniorLocation'],
  onboarding: ['clientName', 'dob', 'address', 'city', 'state', 'zip', 'phone', 'email', 'primaryContactName', 'primaryContactRelationship', 'primaryContactPhone', 'primaryContactEmail', 'emergencyContactName', 'emergencyContactPhone'],
  contact: ['gcName', 'gcEmail', 'gcTopic'],
};
const TOPICS = ['Consultation', 'Joining the team', 'Existing client support', 'Other question'];
const INVALID_FORM_MESSAGE = 'Please reload this page and use the current contact-only form. Medical information cannot be submitted here.';

// Validate the raw payload before PDFs, storage, email, or logging. Unknown fields
// are rejected, not silently discarded, so older medical forms cannot submit.
function readPublicForm(body, kind) {
  let raw;
  try { raw = JSON.parse(body || '{}'); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (Object.entries(raw).some(([key, value]) =>
    !FIELDS[kind].includes(key) || typeof value !== 'string' || value.length > 320
  )) return null;
  const data = sanitizeAll(raw);
  if (data.contactMethod && !['Phone', 'Email'].includes(data.contactMethod)) return null;
  if (kind === 'contact' && !TOPICS.includes(data.gcTopic)) return null;
  return data;
}

module.exports = { readPublicForm, INVALID_FORM_MESSAGE };
