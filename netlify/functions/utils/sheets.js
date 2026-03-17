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

/* ─── In-Memory Cache ──────────────────────────────────── */
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Get cached data or fetch fresh
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function that returns fresh data
 * @returns {*} Cached or fresh data
 */
async function withCache(key, fetcher) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data;
  }
  const data = await fetcher();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

/**
 * Invalidate cache for a specific tab (call after writes)
 * @param {string} tabName - Sheet tab name to invalidate
 */
function invalidateCache(tabName) {
  cache.delete(`rows:${tabName}`);
  cache.delete('stats'); // stats depend on all tabs
}

/**
 * Clear entire cache
 */
function clearCache() {
  cache.clear();
}

/* ─── Sheet Operations ─────────────────────────────────── */

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

  // Invalidate cache since data changed
  invalidateCache(tabName);

  return response.data;
}

/**
 * Get all rows from a sheet tab (with caching)
 * @param {string} tabName - Sheet tab name
 * @returns {{ headers: string[], rows: string[][] }}
 */
async function getRows(tabName) {
  return withCache(`rows:${tabName}`, async () => {
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
  });
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

  // Invalidate cache since data changed
  invalidateCache(tabName);
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

  // Invalidate cache since data changed
  invalidateCache(tabName);
}

/**
 * Convert 0-based column index to letter (0->A, 25->Z, 26->AA)
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

/**
 * Delete a row from a sheet tab
 * @param {string} tabName - Sheet tab name
 * @param {number} rowIndex - 1-based sheet row number
 */
async function deleteRow(tabName, rowIndex) {
  const sheets = await getClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get the sheetId (numeric) for the tab
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const sheet = meta.data.sheets.find(s => s.properties.title === tabName);
  if (!sheet) throw new Error(`Sheet tab "${tabName}" not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });

  invalidateCache(tabName);
}

module.exports = { appendRow, getRows, updateCell, updateCells, deleteRow, invalidateCache, clearCache };
