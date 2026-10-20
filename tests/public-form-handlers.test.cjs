const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const functions = path.join(root, 'netlify/functions');
const validate = require(path.join(functions, 'utils/validate'));
const publicForm = require(path.join(functions, 'utils/public-form'));
const sentinel = 'PRIVATE_MEDICAL_SENTINEL';
const valid = { gcName: 'Example Contact', gcEmail: 'example@example.test', gcTopic: 'Consultation' };

function loadContact(fail = false) {
  const calls = [];
  const logs = [];
  const modules = {
    './utils/validate': validate,
    './utils/public-form': publicForm,
    './utils/email': {
      sendNotification: async (...args) => { calls.push(args); if (fail) throw new Error(sentinel); },
      formatSection: (_, values) => JSON.stringify(values),
    },
  };
  const context = { exports: {}, require: key => { assert.ok(modules[key]); return modules[key]; }, console: { error: (...args) => logs.push(args.join(' ')) } };
  vm.runInNewContext(fs.readFileSync(path.join(functions, 'submit-contact.js'), 'utf8'), context);
  return { calls, logs, run: data => context.exports.handler({ httpMethod: 'POST', body: JSON.stringify(data) }) };
}

for (const kind of ['inquiry', 'onboarding']) {
  for (const body of ['{invalid', JSON.stringify({ medicalConditions: sentinel }), '{}', 'null']) {
    test(kind + ': retired endpoint rejects payload without side effects ' + body.slice(0, 20), async () => {
      const context = { exports: {}, require: () => { throw new Error('No imports permitted'); }, console: { error: () => { throw new Error('No logging permitted'); } } };
      vm.runInNewContext(fs.readFileSync(path.join(functions, 'submit-' + kind + '.js'), 'utf8'), context);
      const response = await context.exports.handler({ httpMethod: 'POST', body });
      assert.equal(response.statusCode, 410);
      assert.equal(JSON.parse(response.body).intakeUrl, 'https://lsa-portal.vercel.app/intake?kind=' + kind);
      assert.ok(!response.body.includes(sentinel));
      assert.match(response.headers['Cache-Control'], /no-store/);
    });
  }
  test(kind + ': never accesses request body, supports preflight', async () => {
    const context = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(functions, 'submit-' + kind + '.js'), 'utf8'), context);
    const event = { httpMethod: 'POST', get body() { throw new Error('Payload was accessed'); } };
    assert.equal((await context.exports.handler(event)).statusCode, 410);
    assert.equal((await context.exports.handler({ httpMethod: 'OPTIONS' })).statusCode, 204);
  });
  test(kind + ': static fallback contains no form or analytics and correct portal link', () => {
    const html = fs.readFileSync(path.join(root, 'client-' + kind + '.html'), 'utf8');
    assert.ok(html.includes('https://lsa-portal.vercel.app/intake?kind=' + kind));
    assert.ok(!/<(form|input|textarea|script)\b/i.test(html));
  });
}

test('contact: valid topic-only request succeeds', async () => {
  const state = loadContact();
  const response = await state.run(valid);
  assert.equal(response.statusCode, 200);
  assert.equal(state.calls.length, 1);
});
for (const legacy of ['medicalConditions', 'medications', 'allergies', 'story', 'need_hospital', 'gcMessage', 'careGoal1']) {
  test('contact: rejects legacy ' + legacy + ' before email', async () => {
    const state = loadContact();
    const response = await state.run({ ...valid, [legacy]: sentinel });
    assert.equal(response.statusCode, 400);
    assert.equal(state.calls.length, 0);
    assert.equal(state.logs.length, 0);
    assert.ok(!response.body.includes(sentinel));
  });
}
for (const data of [null, [], 'text', { ...valid, gcName: {} }, { ...valid, gcName: 'x'.repeat(321) }, { ...valid, gcTopic: sentinel }]) {
  test('contact: invalid payload rejected ' + JSON.stringify(data).slice(0, 30), async () => {
    const state = loadContact();
    assert.equal((await state.run(data)).statusCode, 400);
    assert.equal(state.calls.length, 0);
  });
}
test('contact: notification failure returns generic failure without sensitive logs', async () => {
  const state = loadContact(true);
  const response = await state.run(valid);
  assert.equal(response.statusCode, 500);
  assert.ok(!response.body.includes(sentinel));
  assert.ok(!JSON.stringify(state.logs).includes(sentinel));
});
test('website links and legacy redirects target portal and preserve AGENTS protection', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!html.includes('href="client-inquiry.html"'));
  assert.ok(html.includes('name="gcTopic"'));
  assert.ok(!html.includes('name="gcMessage"'));
  const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
  for (const kind of ['inquiry', 'onboarding']) for (const suffix of ['', '.html']) {
    const entry = config.split('[[redirects]]').find(part => part.includes('from = "/client-' + kind + suffix + '"'));
    assert.ok(entry);
    assert.ok(entry.includes('to = "https://lsa-portal.vercel.app/intake?kind=' + kind + '"'));
    assert.ok(entry.includes('status = 302'));
    assert.ok(entry.includes('force = true'));
  }
  const protectedInstructions = config.split('[[redirects]]').find(part => part.includes('from = "/AGENTS.md"'));
  assert.ok(protectedInstructions.includes('status = 404'));
  assert.ok(protectedInstructions.includes('force = true'));
});