/* ═══════════════════════════════════════════════════════
   NHC Staff Dashboard — Client-Side Application
   ═══════════════════════════════════════════════════════ */

// ─── API Layer ──────────────────────────────────────────
const API = {
  async request(url, options = {}) {
    const res = await fetch(url, { ...options, credentials: 'include' });
    if (res.status === 401) { window.location.href = '/dashboard/login.html'; return null; }
    return res.json();
  },
  listApplications() { return this.request('/.netlify/functions/dashboard-data?action=list&tab=applications'); },
  listInquiries()    { return this.request('/.netlify/functions/dashboard-data?action=list&tab=inquiries'); },
  listClients()      { return this.request('/.netlify/functions/dashboard-data?action=list&tab=clients'); },
  getStats()         { return this.request('/.netlify/functions/dashboard-data?action=stats'); },
  updateStatus(tab, id, status) {
    return this.request('/.netlify/functions/dashboard-data?action=updateStatus', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tab, id, status }),
    });
  },
  addNote(tab, id, note) {
    return this.request('/.netlify/functions/dashboard-data?action=addNote', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tab, id, note }),
    });
  },
  getTemplates() { return this.request('/.netlify/functions/dashboard-email?action=templates'); },
  sendEmail(data) {
    return this.request('/.netlify/functions/dashboard-email?action=send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  logout() {
    return this.request('/.netlify/functions/dashboard-auth?action=logout', { method: 'POST' });
  },
};

// ─── State ──────────────────────────────────────────────
let appData = null;
let inqData = null;
let clientData = null;
let emailTemplates = [];
let appPage = 1, inqPage = 1, clientPage = 1;
const PER_PAGE = 25;
let appSortCol = 0, appSortDir = -1; // default: newest first
let inqSortCol = 0, inqSortDir = -1;
let clientSortCol = 0, clientSortDir = -1;
let chartInstances = {};

// ─── Init ───────────────────────────────────────────────
(async function init() {
  // Verify session
  const res = await fetch('/.netlify/functions/dashboard-auth?action=verify', { credentials: 'include' });
  if (!res.ok) { window.location.href = '/dashboard/login.html'; return; }

  setupNav();
  setupLogout();
  setupMobile();
  setupModal();

  // Load initial view
  showView('overview');
})();

// ─── Navigation ─────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      showView(view);
    });
  });
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

  const viewEl = document.getElementById(`view-${name}`);
  const navEl = document.querySelector(`[data-view="${name}"]`);
  if (viewEl) viewEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  if (name === 'overview') loadOverview();
  if (name === 'applicants') loadApplicants();
  if (name === 'inquiries') loadInquiries();
  if (name === 'clients') loadClients();
}

// ─── Logout ─────────────────────────────────────────────
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await API.logout();
    window.location.href = '/dashboard/login.html';
  });
}

// ─── Mobile ─────────────────────────────────────────────
function setupMobile() {
  document.getElementById('mobileToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

// ─── Modal ──────────────────────────────────────────────
function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}
function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('detailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('detailModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Overview ───────────────────────────────────────────
async function loadOverview() {
  const stats = await API.getStats();
  if (!stats) return;

  // Metrics
  document.getElementById('metricsGrid').innerHTML = `
    <div class="metric-card"><div class="label">Total Applications</div><div class="value">${stats.totalApplications}</div><div class="sub">${stats.appsThisMonth} this month</div></div>
    <div class="metric-card"><div class="label">Total Inquiries</div><div class="value">${stats.totalInquiries}</div><div class="sub">${stats.inqsThisMonth} this month</div></div>
    <div class="metric-card"><div class="label">Total Clients</div><div class="value">${stats.totalClients || 0}</div><div class="sub">${stats.clientsThisMonth || 0} this month</div></div>
    <div class="metric-card"><div class="label">Pending Review</div><div class="value">${stats.pendingReview}</div><div class="sub">Needs attention</div></div>
  `;

  // Charts
  renderStatusChart(stats);
  renderClientStatusChart(stats);
  renderMonthlyChart(stats);

  // Recent activity
  const items = (stats.recent || []).map(r => `
    <div class="activity-item">
      <span class="activity-dot ${r.type}"></span>
      <span class="activity-name">${esc(r.name)}</span>
      <span class="status-badge" data-status="${esc(r.status)}">${esc(r.status)}</span>
      <span class="activity-date">${formatDate(r.date)}</span>
    </div>
  `).join('');
  document.getElementById('activityItems').innerHTML = items || '<div class="loading">No recent activity</div>';
}

function renderStatusChart(stats) {
  const ctx = document.getElementById('chartAppStatus');
  if (chartInstances.appStatus) chartInstances.appStatus.destroy();

  const labels = Object.keys(stats.appStatusCounts);
  const data = Object.values(stats.appStatusCounts);
  const colors = ['#3D7AB5', '#C9A54E', '#E65100', '#2E7D32', '#276B6B', '#C62828', '#4527A0'];

  chartInstances.appStatus = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } } },
  });
}

function renderClientStatusChart(stats) {
  const ctx = document.getElementById('chartClientStatus');
  if (!ctx) return;
  if (chartInstances.clientStatus) chartInstances.clientStatus.destroy();

  const counts = stats.clientStatusCounts || {};
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = ['#276B6B', '#3D7AB5', '#C9A54E', '#E65100', '#2E7D32', '#8A8E9C'];

  chartInstances.clientStatus = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } } },
  });
}

function renderMonthlyChart(stats) {
  const ctx = document.getElementById('chartMonthly');
  if (chartInstances.monthly) chartInstances.monthly.destroy();

  const labels = Object.keys(stats.monthly).map(m => {
    const [y, mo] = m.split('-');
    return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short' });
  });
  const appValues = Object.values(stats.monthly).map(v => v.applications);
  const inqValues = Object.values(stats.monthly).map(v => v.inquiries);
  const clientValues = Object.values(stats.monthly).map(v => v.clients || 0);

  chartInstances.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Applications', data: appValues, borderColor: '#3D7AB5', backgroundColor: 'rgba(61,122,181,0.1)', fill: true, tension: 0.3 },
        { label: 'Inquiries', data: inqValues, borderColor: '#C9A54E', backgroundColor: 'rgba(201,165,78,0.1)', fill: true, tension: 0.3 },
        { label: 'Clients', data: clientValues, borderColor: '#276B6B', backgroundColor: 'rgba(39,107,107,0.1)', fill: true, tension: 0.3 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
}

// ─── Applicants Table ───────────────────────────────────
async function loadApplicants() {
  if (!appData) {
    document.getElementById('appTableBody').innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    appData = await API.listApplications();
    if (!appData) return;

    // Populate status filter
    const filter = document.getElementById('appFilter');
    filter.innerHTML = '<option value="">All Statuses</option>';
    (appData.statuses || []).forEach(s => {
      filter.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });

    // Search + filter events
    document.getElementById('appSearch').addEventListener('input', () => { appPage = 1; renderAppTable(); });
    filter.addEventListener('change', () => { appPage = 1; renderAppTable(); });

    // Sort events
    document.querySelectorAll('#appTable thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = parseInt(th.dataset.sort);
        if (appSortCol === col) { appSortDir *= -1; } else { appSortCol = col; appSortDir = 1; }
        renderAppTable();
      });
    });
  }
  renderAppTable();
}

function renderAppTable() {
  let records = [...(appData.records || [])];
  const search = document.getElementById('appSearch').value.toLowerCase();
  const statusFilter = document.getElementById('appFilter').value;

  // Filter
  if (search) {
    records = records.filter(r =>
      (r['Full Name'] || '').toLowerCase().includes(search) ||
      (r['Email'] || '').toLowerCase().includes(search) ||
      (r['Professional Title'] || '').toLowerCase().includes(search)
    );
  }
  if (statusFilter) {
    records = records.filter(r => (r['Status'] || '') === statusFilter);
  }

  // Sort
  const headers = appData.headers;
  records.sort((a, b) => {
    const aVal = (a[headers[appSortCol]] || '').toLowerCase();
    const bVal = (b[headers[appSortCol]] || '').toLowerCase();
    return aVal < bVal ? -appSortDir : aVal > bVal ? appSortDir : 0;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(records.length / PER_PAGE));
  if (appPage > totalPages) appPage = totalPages;
  const start = (appPage - 1) * PER_PAGE;
  const pageRecords = records.slice(start, start + PER_PAGE);

  // Render
  const tbody = document.getElementById('appTableBody');
  if (pageRecords.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">No records found</td></tr>';
  } else {
    tbody.innerHTML = pageRecords.map(r => `
      <tr data-id="${esc(r._id)}" data-tab="applications">
        <td>${esc(r['Full Name'] || '')}</td>
        <td>${esc(r['Email'] || '')}</td>
        <td>${esc(r['Professional Title'] || '')}</td>
        <td>${formatDate(r['Timestamp'] || '')}</td>
        <td><span class="status-badge" data-status="${esc(r['Status'] || '')}">${esc(r['Status'] || '')}</span></td>
        <td><button class="btn btn-sm btn-outline btn-detail">View</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tr = btn.closest('tr');
        const id = tr.dataset.id;
        const rec = appData.records.find(r => r._id === id);
        if (rec) openDetailModal('applications', rec, appData.statuses);
      });
    });
  }

  // Pagination
  document.getElementById('appPagination').innerHTML = `
    <button ${appPage <= 1 ? 'disabled' : ''} onclick="appPage--;renderAppTable()">Prev</button>
    <span>Page ${appPage} of ${totalPages} (${records.length} records)</span>
    <button ${appPage >= totalPages ? 'disabled' : ''} onclick="appPage++;renderAppTable()">Next</button>
  `;
}

// ─── Inquiries Table ────────────────────────────────────
async function loadInquiries() {
  if (!inqData) {
    document.getElementById('inqTableBody').innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    inqData = await API.listInquiries();
    if (!inqData) return;

    const filter = document.getElementById('inqFilter');
    filter.innerHTML = '<option value="">All Statuses</option>';
    (inqData.statuses || []).forEach(s => {
      filter.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });

    document.getElementById('inqSearch').addEventListener('input', () => { inqPage = 1; renderInqTable(); });
    filter.addEventListener('change', () => { inqPage = 1; renderInqTable(); });

    document.querySelectorAll('#inqTable thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = parseInt(th.dataset.sort);
        if (inqSortCol === col) { inqSortDir *= -1; } else { inqSortCol = col; inqSortDir = 1; }
        renderInqTable();
      });
    });
  }
  renderInqTable();
}

function renderInqTable() {
  let records = [...(inqData.records || [])];
  const search = document.getElementById('inqSearch').value.toLowerCase();
  const statusFilter = document.getElementById('inqFilter').value;

  if (search) {
    records = records.filter(r =>
      (r['Contact Name'] || '').toLowerCase().includes(search) ||
      (r['Phone'] || '').toLowerCase().includes(search) ||
      (r['Email'] || '').toLowerCase().includes(search)
    );
  }
  if (statusFilter) {
    records = records.filter(r => (r['Status'] || '') === statusFilter);
  }

  const headers = inqData.headers;
  records.sort((a, b) => {
    const aVal = (a[headers[inqSortCol]] || '').toLowerCase();
    const bVal = (b[headers[inqSortCol]] || '').toLowerCase();
    return aVal < bVal ? -inqSortDir : aVal > bVal ? inqSortDir : 0;
  });

  const totalPages = Math.max(1, Math.ceil(records.length / PER_PAGE));
  if (inqPage > totalPages) inqPage = totalPages;
  const start = (inqPage - 1) * PER_PAGE;
  const pageRecords = records.slice(start, start + PER_PAGE);

  const tbody = document.getElementById('inqTableBody');
  if (pageRecords.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">No records found</td></tr>';
  } else {
    tbody.innerHTML = pageRecords.map(r => `
      <tr data-id="${esc(r._id)}" data-tab="inquiries">
        <td>${esc(r['Contact Name'] || '')}</td>
        <td>${esc(r['Relationship'] || '')}</td>
        <td>${esc(r['Email'] || '')}</td>
        <td>${formatDate(r['Timestamp'] || '')}</td>
        <td><span class="status-badge" data-status="${esc(r['Status'] || '')}">${esc(r['Status'] || '')}</span></td>
        <td><button class="btn btn-sm btn-outline btn-detail">View</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tr = btn.closest('tr');
        const id = tr.dataset.id;
        const rec = inqData.records.find(r => r._id === id);
        if (rec) openDetailModal('inquiries', rec, inqData.statuses);
      });
    });
  }

  document.getElementById('inqPagination').innerHTML = `
    <button ${inqPage <= 1 ? 'disabled' : ''} onclick="inqPage--;renderInqTable()">Prev</button>
    <span>Page ${inqPage} of ${totalPages} (${records.length} records)</span>
    <button ${inqPage >= totalPages ? 'disabled' : ''} onclick="inqPage++;renderInqTable()">Next</button>
  `;
}

// ─── Clients Table ─────────────────────────────────────
async function loadClients() {
  if (!clientData) {
    document.getElementById('clientTableBody').innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    clientData = await API.listClients();
    if (!clientData) return;

    const filter = document.getElementById('clientFilter');
    filter.innerHTML = '<option value="">All Statuses</option>';
    (clientData.statuses || []).forEach(s => {
      filter.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });

    document.getElementById('clientSearch').addEventListener('input', () => { clientPage = 1; renderClientTable(); });
    filter.addEventListener('change', () => { clientPage = 1; renderClientTable(); });

    document.querySelectorAll('#clientTable thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = parseInt(th.dataset.sort);
        if (clientSortCol === col) { clientSortDir *= -1; } else { clientSortCol = col; clientSortDir = 1; }
        renderClientTable();
      });
    });
  }
  renderClientTable();
}

function renderClientTable() {
  let records = [...(clientData.records || [])];
  const search = document.getElementById('clientSearch').value.toLowerCase();
  const statusFilter = document.getElementById('clientFilter').value;

  if (search) {
    records = records.filter(r =>
      (r['Client Name'] || '').toLowerCase().includes(search) ||
      (r['Email'] || '').toLowerCase().includes(search) ||
      (r['Phone'] || '').toLowerCase().includes(search)
    );
  }
  if (statusFilter) {
    records = records.filter(r => (r['Status'] || '') === statusFilter);
  }

  const headers = clientData.headers;
  records.sort((a, b) => {
    const aVal = (a[headers[clientSortCol]] || '').toLowerCase();
    const bVal = (b[headers[clientSortCol]] || '').toLowerCase();
    return aVal < bVal ? -clientSortDir : aVal > bVal ? clientSortDir : 0;
  });

  const totalPages = Math.max(1, Math.ceil(records.length / PER_PAGE));
  if (clientPage > totalPages) clientPage = totalPages;
  const start = (clientPage - 1) * PER_PAGE;
  const pageRecords = records.slice(start, start + PER_PAGE);

  const tbody = document.getElementById('clientTableBody');
  if (pageRecords.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">No records found</td></tr>';
  } else {
    tbody.innerHTML = pageRecords.map(r => `
      <tr data-id="${esc(r._id)}" data-tab="clients">
        <td>${esc(r['Client Name'] || '')}</td>
        <td>${esc(r['Email'] || '')}</td>
        <td>${esc(r['Phone'] || '')}</td>
        <td>${formatDate(r['Timestamp'] || '')}</td>
        <td><span class="status-badge" data-status="${esc(r['Status'] || '')}">${esc(r['Status'] || '')}</span></td>
        <td><button class="btn btn-sm btn-outline btn-detail">View</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tr = btn.closest('tr');
        const id = tr.dataset.id;
        const rec = clientData.records.find(r => r._id === id);
        if (rec) openDetailModal('clients', rec, clientData.statuses);
      });
    });
  }

  document.getElementById('clientPagination').innerHTML = `
    <button ${clientPage <= 1 ? 'disabled' : ''} onclick="clientPage--;renderClientTable()">Prev</button>
    <span>Page ${clientPage} of ${totalPages} (${records.length} records)</span>
    <button ${clientPage >= totalPages ? 'disabled' : ''} onclick="clientPage++;renderClientTable()">Next</button>
  `;
}

// ─── Detail Modal ───────────────────────────────────────
async function openDetailModal(tab, record, statuses) {
  const name = record['Full Name'] || record['Client Name'] || record['Contact Name'] || 'Record';
  const email = record['Email'] || '';
  const id = record._id;
  const currentStatus = record['Status'] || '';
  const notes = record['Internal Notes'] || '';

  // Build field grid
  const skipKeys = ['_rowIndex', '_id', 'Internal Notes', 'Status', 'Record ID'];
  const fields = Object.entries(record)
    .filter(([k]) => !skipKeys.includes(k))
    .map(([k, v]) => {
      if (v && (v.startsWith('http://') || v.startsWith('https://'))) {
        return `<div class="detail-field"><label>${esc(k)}</label><div class="val"><a href="${esc(v)}" target="_blank" style="color:var(--blue);text-decoration:underline">View Link</a></div></div>`;
      }
      return `<div class="detail-field"><label>${esc(k)}</label><div class="val">${esc(v || '—')}</div></div>`;
    }).join('');

  // Status options
  const statusOpts = (statuses || []).map(s =>
    `<option value="${esc(s)}" ${s === currentStatus ? 'selected' : ''}>${esc(s)}</option>`
  ).join('');

  // Onboarding invite button (inquiries only)
  const inviteBtn = tab === 'inquiries' ? `
    <div class="detail-section" style="border:2px solid var(--gold);border-radius:8px;padding:16px;background:rgba(201,165,78,0.06)">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <h3 style="margin:0 0 4px">Convert to Client</h3>
          <p style="margin:0;font-size:13px;color:var(--text-light)">Send onboarding intake form to ${esc(email || 'client')}</p>
        </div>
        <button class="btn btn-sm btn-gold" id="sendInviteBtn" ${!email ? 'disabled title="No email on record"' : ''}>Send Onboarding Invite</button>
      </div>
    </div>
  ` : '';

  const html = `
    <div class="detail-grid">${fields}</div>
    ${inviteBtn}

    <div class="detail-section">
      <h3>Status</h3>
      <div style="display:flex;gap:10px;align-items:center">
        <select class="status-select" id="detailStatus">${statusOpts}</select>
        <button class="btn btn-sm btn-primary" id="saveStatusBtn">Save</button>
      </div>
    </div>

    <div class="detail-section">
      <h3>Internal Notes</h3>
      <div class="notes-list" id="detailNotes">${esc(notes)}</div>
      <div class="note-input">
        <textarea id="noteText" placeholder="Add a note..."></textarea>
        <button class="btn btn-sm btn-primary" id="addNoteBtn" style="align-self:flex-end">Add</button>
      </div>
    </div>

    <div class="detail-section">
      <h3>Send Email</h3>
      <div class="email-compose">
        <select id="emailTemplate">
          <option value="">Custom Email</option>
        </select>
        <input type="text" id="emailSubject" placeholder="Subject">
        <textarea id="emailBody" placeholder="Email body (HTML supported)"></textarea>
        <div class="email-actions">
          <button class="btn btn-sm btn-gold" id="sendEmailBtn">Send Email</button>
        </div>
      </div>
    </div>
  `;

  openModal(name, html);

  // Load templates
  if (emailTemplates.length === 0) {
    const tmplRes = await API.getTemplates();
    if (tmplRes?.templates) emailTemplates = tmplRes.templates;
  }
  const tmplSelect = document.getElementById('emailTemplate');
  emailTemplates.forEach(t => {
    tmplSelect.innerHTML += `<option value="${esc(t.key)}">${esc(t.name)}</option>`;
  });

  // Send onboarding invite (inquiries only)
  const inviteEl = document.getElementById('sendInviteBtn');
  if (inviteEl) {
    inviteEl.addEventListener('click', async () => {
      if (!confirm(`Send onboarding invite to ${email}?`)) return;
      inviteEl.disabled = true; inviteEl.textContent = 'Sending...';
      const siteUrl = window.location.origin;
      const res = await API.sendEmail({ to: email, template: 'onboarding_invite', recordId: id, tab, name, siteUrl });
      if (res?.success) {
        inviteEl.textContent = 'Invite Sent!';
        inviteEl.style.background = '#2f855a'; inviteEl.style.color = '#fff';
      } else {
        inviteEl.textContent = 'Error — Try Again';
        setTimeout(() => { inviteEl.textContent = 'Send Onboarding Invite'; inviteEl.disabled = false; }, 2000);
      }
    });
  }

  // Status save
  document.getElementById('saveStatusBtn').addEventListener('click', async () => {
    const newStatus = document.getElementById('detailStatus').value;
    const btn = document.getElementById('saveStatusBtn');
    btn.disabled = true; btn.textContent = 'Saving...';
    const res = await API.updateStatus(tab, id, newStatus);
    if (res?.success) {
      record['Status'] = newStatus;
      // Refresh table
      if (tab === 'applications') renderAppTable();
      else if (tab === 'inquiries') renderInqTable();
      else if (tab === 'clients') renderClientTable();
      btn.textContent = 'Saved!';
      setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 1500);
    } else {
      btn.textContent = 'Error'; btn.disabled = false;
    }
  });

  // Add note
  document.getElementById('addNoteBtn').addEventListener('click', async () => {
    const noteText = document.getElementById('noteText').value;
    if (!noteText.trim()) return;
    const btn = document.getElementById('addNoteBtn');
    btn.disabled = true; btn.textContent = 'Adding...';
    const res = await API.addNote(tab, id, noteText);
    if (res?.success) {
      document.getElementById('detailNotes').textContent = res.notes;
      document.getElementById('noteText').value = '';
      record['Internal Notes'] = res.notes;
    }
    btn.textContent = 'Add'; btn.disabled = false;
  });

  // Send email
  document.getElementById('sendEmailBtn').addEventListener('click', async () => {
    const template = document.getElementById('emailTemplate').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    const btn = document.getElementById('sendEmailBtn');

    if (!template && (!subject || !body)) {
      alert('Please select a template or provide a subject and body.');
      return;
    }
    if (!email) { alert('No email address for this record.'); return; }

    btn.disabled = true; btn.textContent = 'Sending...';
    const payload = { to: email, recordId: id, tab, name };
    if (template) {
      payload.template = template;
    } else {
      payload.subject = subject;
      payload.html = body.replace(/\n/g, '<br>');
    }

    const res = await API.sendEmail(payload);
    if (res?.success) {
      btn.textContent = 'Sent!';
      document.getElementById('emailSubject').value = '';
      document.getElementById('emailBody').value = '';
      document.getElementById('emailTemplate').value = '';
      setTimeout(() => { btn.textContent = 'Send Email'; btn.disabled = false; }, 2000);
    } else {
      btn.textContent = 'Error';
      setTimeout(() => { btn.textContent = 'Send Email'; btn.disabled = false; }, 2000);
    }
  });
}

// ─── Utilities ──────────────────────────────────────────
function esc(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}
