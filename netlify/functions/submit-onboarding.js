// Retired endpoint: never parse, forward, store, or log a submitted payload.
exports.handler = async (event) => ({
  statusCode: event.httpMethod === 'OPTIONS' ? 204 : 410,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, private',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: event.httpMethod === 'OPTIONS' ? '' : JSON.stringify({
    error: 'This form has moved. Please continue on the portal and complete the new form. Nothing from this submission was saved.',
    intakeUrl: 'https://lsa-portal.vercel.app/intake?kind=onboarding',
  }),
});
