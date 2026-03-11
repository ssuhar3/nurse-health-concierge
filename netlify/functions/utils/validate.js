/**
 * Validate required fields are present and non-empty
 * @param {Object} data - Form data object
 * @param {string[]} requiredFields - Array of required field names
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter(
    (field) => !data[field] || String(data[field]).trim() === ''
  );
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize a string (trim + basic XSS prevention)
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, '');
}

/**
 * Sanitize all string values in an object
 */
function sanitizeAll(data) {
  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    clean[key] = typeof val === 'string' ? sanitize(val) : val;
  }
  return clean;
}

/**
 * Build a standard JSON response
 */
function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

module.exports = { validateRequired, sanitize, sanitizeAll, respond };
