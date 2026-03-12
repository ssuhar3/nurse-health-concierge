const { google } = require('googleapis');

let authClient = null;

/**
 * Parse service account credentials from environment
 * Prefers base64-encoded full JSON key (most reliable for Netlify)
 * Falls back to individual env vars
 */
function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString();
    const parsed = JSON.parse(json);
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
  }
  // Fallback to individual env vars
  return {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

/**
 * Get authenticated Google JWT client with Sheets + Drive scopes (cached)
 * @returns {google.auth.JWT} Authorized JWT client
 */
async function getAuth() {
  if (authClient) return authClient;

  const creds = getCredentials();

  const jwt = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ]
  );

  await jwt.authorize();
  authClient = jwt;
  return authClient;
}

module.exports = { getAuth };
