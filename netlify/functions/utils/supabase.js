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
      throw new Error('Unable to save submission.');
    }
  } catch (err) {
    // Never expose database response bodies or network errors containing submitted data.
    throw new Error('Unable to save submission.');
  }
}

module.exports = { insertRecord };
