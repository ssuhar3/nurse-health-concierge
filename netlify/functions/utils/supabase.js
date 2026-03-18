// Supabase REST API insert — uses anon key + RLS (anon can insert)
// No SDK needed, no extra env vars needed — keeps Netlify under 4KB limit

const SUPABASE_URL = 'https://rtulqglpbfeocbfskczu.supabase.co';
// Publishable anon key — safe to include in server code
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dWxxZ2xwYmZlb2NiZnNrY3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTc5NTMsImV4cCI6MjA4OTMzMzk1M30.hxsRpMc0pblgO2V_0KmXAOlj82ofY02l7qcDGASQRLI';

async function insertRecord(table, data) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Supabase insert error (${table}):`, res.status, text);
    }
  } catch (err) {
    console.error(`Supabase insert error (${table}):`, err.message);
    // Don't throw — Google Sheets is still the primary store during migration
  }
}

module.exports = { insertRecord };
