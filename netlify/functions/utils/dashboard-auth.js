const jwt = require('jsonwebtoken');

const SECRET = () => process.env.DASHBOARD_JWT_SECRET;
const COOKIE_NAME = 'nhc_session';
const MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

/**
 * Verify the session cookie from an incoming request
 * @param {Object} event - Netlify function event
 * @returns {Object} Decoded JWT payload
 * @throws {Error} If no cookie or invalid/expired token
 */
function verifySession(event) {
  const cookieHeader = event.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) throw new Error('No session cookie');

  return jwt.verify(match[1], SECRET());
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
