const bcrypt = require('bcryptjs');
const { verifySession, createSessionCookie, clearSessionCookie } = require('./utils/dashboard-auth');
const { respond } = require('./utils/validate');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, { message: 'OK' });
  }

  const action = event.queryStringParameters?.action;

  try {
    // ── Login ──────────────────────────────────────
    if (action === 'login' && event.httpMethod === 'POST') {
      const { password } = JSON.parse(event.body || '{}');
      if (!password) {
        return respond(400, { error: 'Password is required' });
      }

      const hash = process.env.DASHBOARD_PASSWORD_HASH;
      if (!hash) {
        console.error('DASHBOARD_PASSWORD_HASH not configured');
        return respond(500, { error: 'Dashboard not configured' });
      }

      const valid = await bcrypt.compare(password, hash);
      if (!valid) {
        return respond(401, { error: 'Invalid password' });
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': createSessionCookie(),
          'Access-Control-Allow-Origin': event.headers.origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({ success: true }),
      };
    }

    // ── Verify session ────────────────────────────
    if (action === 'verify' && event.httpMethod === 'GET') {
      try {
        verifySession(event);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': event.headers.origin || '*',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: JSON.stringify({ valid: true }),
        };
      } catch {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': event.headers.origin || '*',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: JSON.stringify({ valid: false }),
        };
      }
    }

    // ── Logout ────────────────────────────────────
    if (action === 'logout' && event.httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearSessionCookie(),
          'Access-Control-Allow-Origin': event.headers.origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({ success: true }),
      };
    }

    return respond(400, { error: 'Invalid action' });

  } catch (err) {
    console.error('dashboard-auth error:', err);
    return respond(500, { error: 'Internal server error' });
  }
};
