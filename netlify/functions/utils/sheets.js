const { google } = require('googleapis');

let sheetsClient = null;

/**
 * Get authenticated Google Sheets client (cached)
 */
async function getClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  await auth.authorize();
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Append a row to a specific sheet tab
 * @param {string} tabName - Sheet tab name (e.g., "Client Inquiries")
 * @param {Array} rowValues - Array of values for the row
 * @returns {Object} API response
 */
async function appendRow(tabName, rowValues) {
  const sheets = await getClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });

  return response.data;
}

module.exports = { appendRow };
