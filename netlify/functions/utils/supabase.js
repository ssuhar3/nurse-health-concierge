const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

async function insertRecord(table, data) {
  const supabase = getClient();
  const { error } = await supabase.from(table).insert(data);
  if (error) {
    console.error(`Supabase insert error (${table}):`, error.message);
    // Don't throw — we don't want Supabase failures to break the form submission
    // Google Sheets is still the primary store during migration
  }
}

module.exports = { insertRecord };
