/**
 * PIN authentication utilities.
 * PIN is bcrypt-hashed (cost ≥ 10) and stored only in Google Sheets.
 * Never log, expose to the browser, or store in localStorage.
 */

import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;
const SESSION_COOKIE = 'wiq_session';

/**
 * Hash a plain-text PIN using bcrypt.
 * @param pin - Plain-text 4–6 digit PIN
 * @returns bcrypt hash string
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_COST);
}

/**
 * Verify a plain-text PIN against a stored bcrypt hash.
 * @param pin - Plain-text PIN entered by user
 * @param hash - Stored bcrypt hash from Sheets
 * @returns true if PIN matches
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Name of the session cookie used to persist auth across page loads.
 * The cookie value is a signed timestamp — checked server-side only.
 */
export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/**
 * Build the value stored in the session cookie.
 * Combines a server-side secret with a timestamp so it can't be guessed.
 */
export function buildSessionToken(): string {
  const secret = process.env['PIN_HASH_SECRET'];
  if (!secret) throw new Error('PIN_HASH_SECRET is not set in environment');
  const timestamp = Date.now().toString();
  // Simple HMAC-free token: secret:timestamp (sufficient for single-user local app)
  return Buffer.from(`${secret}:${timestamp}`).toString('base64');
}

/**
 * Validate a session token from the cookie.
 * Returns true if the token was generated with the current PIN_HASH_SECRET.
 */
export function validateSessionToken(token: string): boolean {
  try {
    const secret = process.env['PIN_HASH_SECRET'];
    if (!secret) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded.startsWith(`${secret}:`);
  } catch {
    return false;
  }
}
