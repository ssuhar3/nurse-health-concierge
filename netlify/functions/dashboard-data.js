const { getRows, updateCell, updateCells } = require('./utils/sheets');
const { verifySession } = require('./utils/dashboard-auth');
const { sanitize, respond } = require('./utils/validate');

// Column indices (0-based) for each tab
const TABS = {
  applications: {
    sheetName: 'Advocate Applications',
    statusCol: 14,
    notesCol: 15,
    idCol: 16,
    statuses: ['Packet Sent', 'Packet Received', 'Under Review', 'Interview Scheduled', 'Approved', 'Denied', 'Onboarding'],
  },
  inquiries: {
    sheetName: 'Client Inquiries',
    statusCol: 14,
    notesCol: 15,
    idCol: 16,
    statuses: ['New', 'Contacted', 'Under Review', 'Consultation Scheduled', 'Converted', 'Closed', 'Active Client'],
  },
};

function authResponse(event, statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': event.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
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
    // ── List all rows ─────────────────────────────
    if (action === 'list' && event.httpMethod === 'GET') {
      const tabKey = event.queryStringParameters?.tab;
      const tabConfig = TABS[tabKey];
      if (!tabConfig) return authResponse(event, 400, { error: 'Invalid tab' });

      const { headers, rows } = await getRows(tabConfig.sheetName);

      const records = rows.map((row, idx) => {
        const record = {};
        headers.forEach((h, i) => {
          record[h] = row[i] || '';
        });
        record._rowIndex = idx + 2; // 1-based sheet row (row 1 = headers)
        record._id = row[tabConfig.idCol] || `LEGACY-${idx + 2}`;
        return record;
      });

      return authResponse(event, 200, {
        tab: tabKey,
        headers,
        records,
        statuses: tabConfig.statuses,
      });
    }

    // ── Stats for overview ────────────────────────
    if (action === 'stats' && event.httpMethod === 'GET') {
      const [apps, inqs] = await Promise.all([
        getRows(TABS.applications.sheetName),
        getRows(TABS.inquiries.sheetName),
      ]);

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const appStatusCounts = {};
      TABS.applications.statuses.forEach(s => { appStatusCounts[s] = 0; });
      let appsThisMonth = 0;

      apps.rows.forEach(row => {
        const status = row[TABS.applications.statusCol] || 'Packet Sent';
        appStatusCounts[status] = (appStatusCounts[status] || 0) + 1;
        const ts = row[0] || '';
        if (ts.startsWith(thisMonth)) appsThisMonth++;
      });

      const inqStatusCounts = {};
      TABS.inquiries.statuses.forEach(s => { inqStatusCounts[s] = 0; });
      let inqsThisMonth = 0;

      inqs.rows.forEach(row => {
        const status = row[TABS.inquiries.statusCol] || 'New';
        inqStatusCounts[status] = (inqStatusCounts[status] || 0) + 1;
        const ts = row[0] || '';
        if (ts.startsWith(thisMonth)) inqsThisMonth++;
      });

      // Monthly trend (last 6 months)
      const monthly = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { applications: 0, inquiries: 0 };
      }
      apps.rows.forEach(row => {
        const m = (row[0] || '').substring(0, 7);
        if (monthly[m]) monthly[m].applications++;
      });
      inqs.rows.forEach(row => {
        const m = (row[0] || '').substring(0, 7);
        if (monthly[m]) monthly[m].inquiries++;
      });

      // Pending review count
      const pendingReview = (appStatusCounts['Packet Received'] || 0)
        + (appStatusCounts['Under Review'] || 0)
        + (inqStatusCounts['New'] || 0)
        + (inqStatusCounts['Contacted'] || 0);

      // Recent activity (last 10 from both tabs combined)
      const recent = [];
      apps.rows.slice(-10).forEach(row => {
        recent.push({ type: 'application', name: row[1] || '', date: row[0] || '', status: row[TABS.applications.statusCol] || '' });
      });
      inqs.rows.slice(-10).forEach(row => {
        recent.push({ type: 'inquiry', name: row[1] || '', date: row[0] || '', status: row[TABS.inquiries.statusCol] || '' });
      });
      recent.sort((a, b) => b.date.localeCompare(a.date));

      return authResponse(event, 200, {
        totalApplications: apps.rows.length,
        totalInquiries: inqs.rows.length,
        appsThisMonth,
        inqsThisMonth,
        pendingReview,
        appStatusCounts,
        inqStatusCounts,
        monthly,
        recent: recent.slice(0, 10),
      });
    }

    // ── Update status ─────────────────────────────
    if (action === 'updateStatus' && event.httpMethod === 'PATCH') {
      const { tab, id, status } = JSON.parse(event.body || '{}');
      const tabConfig = TABS[tab];
      if (!tabConfig) return authResponse(event, 400, { error: 'Invalid tab' });
      if (!tabConfig.statuses.includes(status)) return authResponse(event, 400, { error: 'Invalid status' });

      const rowIndex = await findRowById(tabConfig, id);
      if (!rowIndex) return authResponse(event, 404, { error: 'Record not found' });

      await updateCell(tabConfig.sheetName, rowIndex, tabConfig.statusCol, status);
      return authResponse(event, 200, { success: true, status });
    }

    // ── Add note ──────────────────────────────────
    if (action === 'addNote' && event.httpMethod === 'PATCH') {
      const { tab, id, note } = JSON.parse(event.body || '{}');
      const tabConfig = TABS[tab];
      if (!tabConfig) return authResponse(event, 400, { error: 'Invalid tab' });
      if (!note?.trim()) return authResponse(event, 400, { error: 'Note is required' });

      const rowIndex = await findRowById(tabConfig, id);
      if (!rowIndex) return authResponse(event, 404, { error: 'Record not found' });

      // Get existing notes, append new one with timestamp
      const { rows } = await getRows(tabConfig.sheetName);
      const existingNotes = rows[rowIndex - 2]?.[tabConfig.notesCol] || '';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      const newNotes = existingNotes
        ? `${existingNotes}\n[${timestamp}] ${sanitize(note.trim())}`
        : `[${timestamp}] ${sanitize(note.trim())}`;

      await updateCell(tabConfig.sheetName, rowIndex, tabConfig.notesCol, newNotes);
      return authResponse(event, 200, { success: true, notes: newNotes });
    }

    return authResponse(event, 400, { error: 'Invalid action' });

  } catch (err) {
    console.error('dashboard-data error:', err);
    return authResponse(event, 500, {
      error: 'Internal server error',
      debug: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }
};

/**
 * Find a row by Record ID, returns 1-based sheet row number or null
 */
async function findRowById(tabConfig, id) {
  if (!id) return null;

  // Handle legacy row index references
  if (id.startsWith('LEGACY-')) {
    const idx = parseInt(id.replace('LEGACY-', ''), 10);
    return isNaN(idx) ? null : idx;
  }

  const { rows } = await getRows(tabConfig.sheetName);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][tabConfig.idCol] === id) {
      return i + 2; // +2: row 1 is header, array is 0-indexed
    }
  }
  return null;
}
