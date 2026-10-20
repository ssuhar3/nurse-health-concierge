const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const helperPath = require('node:path').resolve(__dirname, '../netlify/functions/utils/supabase.js');
const source = fs.readFileSync(helperPath, 'utf8');
const sensitive = 'SENSITIVE_TEST_SUBMISSION';

function loadHelper(fetch) {
  const logs = [];
  const context = {
    module: { exports: {} },
    fetch,
    console: { error: (...args) => logs.push(args), log: (...args) => logs.push(args) },
  };
  vm.runInNewContext(source, context, { filename: helperPath });
  return { insertRecord: context.module.exports.insertRecord, logs };
}

test('successful insert preserves the request and resolves', async () => {
  let calls = 0;
  const { insertRecord, logs } = loadHelper(async (url, options) => {
    calls++;
    assert.ok(url.endsWith('/rest/v1/client_inquiries'));
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Prefer, 'return=minimal');
    assert.deepEqual(JSON.parse(options.body), { contact_name: 'Test contact' });
    return { ok: true };
  });
  await insertRecord('client_inquiries', { contact_name: 'Test contact' });
  assert.equal(calls, 1);
  assert.deepEqual(logs, []);
});

test('HTTP failure rejects without reading or logging the response body', async () => {
  let bodyRead = false;
  const { insertRecord, logs } = loadHelper(async () => ({
    ok: false,
    status: 400,
    text: async () => { bodyRead = true; return sensitive; },
  }));
  await assert.rejects(insertRecord('client_inquiries', { story: sensitive }), error => {
    assert.equal(error.message, 'Unable to save submission.');
    assert.equal(error.cause, undefined);
    assert.ok(!String(error.stack).includes(sensitive));
    return true;
  });
  assert.equal(bodyRead, false);
  assert.deepEqual(logs, []);
});

test('network failure rejects without leaking the underlying error', async () => {
  const { insertRecord, logs } = loadHelper(async () => { throw new Error(sensitive); });
  await assert.rejects(insertRecord('client_onboarding', { medications: sensitive }), error => {
    assert.equal(error.message, 'Unable to save submission.');
    assert.equal(error.cause, undefined);
    assert.ok(!String(error.stack).includes(sensitive));
    return true;
  });
  assert.deepEqual(logs, []);
});
