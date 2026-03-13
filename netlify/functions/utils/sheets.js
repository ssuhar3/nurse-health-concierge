const { google } = require('googleapis');
const { getAuth } = require('./auth');

let sheetsClient = null;

/**
 * Get authenticated Google Sheets client (cached)
 */
async function getClient() {
  if (sheetsClient) return sheetsClient;

  const auth = await getAuth();
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

/**
 * Get all rows from a sheet tab
 * @param {string} tabName - Sheet tab name
 * @returns {{ headers: string[], rows: string[][] }}
 */
async function getRows(tabName) {
  const sheets = await getClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:AZ`,
  });

  const allRows = response.data.values || [];
  const headers = allRows[0] || [];
  const rows = allRows.slice(1);

  return { headers, rows };
}

/**
 * Update a single cell
 * @param {string} tabName - Sheet tab name
 * @param {number} rowIndex - 1-based sheet row number
 * @param {number} colIndex - 0-based column index
 * @param {string} value - New cell value
 */
async function updateCell(tabName, rowIndex, colIndex, value) {
  const sheets = await getClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const colLetter = colIndexToLetter(colIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!${colLetter}${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}

/**
 * Update multiple cells in a single row
 * @param {string} tabName - Sheet tab name
 * @param {number} rowIndex - 1-based sheet row number
 * @param {Array<{col: number, value: string}>} updates - Array of {col (0-based), value}
 */
async function updateCells(tabName, rowIndex, updates) {
  const sheets = await getClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const data = updates.map(({ col, value }) => ({
    range: `${tabName}!${colIndexToLetter(col)}${rowIndex}`,
    values: [[value]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
}

/**
 * Convert 0-based column index to letter (0→A, 25→Z, 26→AA)
 */
function colIndexToLetter(index) {
  let letter = '';
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

module.exports = { appendRow, getRows, updateCell, updateCells };
