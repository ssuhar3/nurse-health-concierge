const jwt = require('jsonwebtoken');

/**
 * Return the signing secret, refusing to operate without one.
 *
 * Why this is also called at module load below: every caller wraps verifySession() in
 * `try { ... } catch { return 401 }`, so a check that only ran *inside* verifySession
 * would be swallowed into "not signed in" — an unset env var would bounce staff to the
 * login screen forever instead of reporting a broken deploy. (That is the exact bug
 * fixed on the portal side in nhc-portal PR #9.) Failing at load instead means Netlify
 * logs the error and the function returns 500, which is visible and diagnosable. This
 * module is only required by the dashboard functions, and none of them can do anything
 * useful without the secret, so refusing to load is the honest outcome.
 *
 * @returns {string} The configured JWT secret
 * @throws {Error} If DASHBOARD_JWT_SECRET is unset or empty
 */
function requireSecret() {
  const value = process.env.DASHBOARD_JWT_SECRET;
  if (!value) throw new Error('DASHBOARD_JWT_SECRET must be set — refusing to run with a default JWT secret');
  return value;
}
requireSecret(); // fail at load, before any caller's catch can turn it into a 401

const SECRET = requireSecret;
const COOKIE_NAME = 'nhc_session';
const MAX_AGE = 8 * 60 * 60; // 8 hours in seconds
const EXPECTED_ROLE = 'staff';

/**
 * Verify the session cookie from an incoming request
 * @param {Object} event - Netlify function event
 * @returns {Object} Decoded JWT payload
 * @throws {Error} If no cookie, invalid/expired token, or wrong role
 */
function verifySession(event) {
  const cookieHeader = event.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) throw new Error('No session cookie');

  const payload = jwt.verify(match[1], SECRET());
  // A valid signature is not authorization. Both the cookie name (nhc_session) and the
  // secret (DASHBOARD_JWT_SECRET) are shared with the LSA portal (nhc-portal), which
  // mints its own role:"admin" tokens — so verifying the signature alone would let a
  // portal token open this dashboard. The portal checks role on its side; this is the
  // matching check on ours. createSessionCookie() below is the only mint in this repo
  // and always signs role:"staff", so live sessions are unaffected.
  if (!payload || payload.role !== EXPECTED_ROLE) throw new Error('Invalid session role');
  return payload;
}

/**
 * Create a Set-Cookie header string with a signed JWT
 * @param {number} [maxAge] - Cookie max age in seconds (default 8h)
 * @returns {string} Set-Cookie header value
 */
function createSessionCookie(maxAge = MAX_AGE) {
  const token = jwt.sign({ role: 'staff', iat: Math.floor(Date.now() / 1000) }, SECRET(), {
    expiresIn: maxAge,
  });
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/**
 * Create a Set-Cookie header that clears the session
 * @returns {string} Set-Cookie header value
 */
function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

module.exports = { verifySession, createSessionCookie, clearSessionCookie };
