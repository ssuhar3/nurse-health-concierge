const { google } = require('googleapis');

let authClient = null;

/**
 * Get authenticated Google JWT client with Sheets + Drive scopes (cached)
 * @returns {google.auth.JWT} Authorized JWT client
 */
async function getAuth() {
  if (authClient) return authClient;

  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
