import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'wk-travel-secure-otp-salt-2026-production';
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// In-memory cache for rate-limiting and fallback development verification
const memoryOtpStore = new Map();
const lastSentTimestamps = new Map();

/**
 * Generates a cryptographically secure 4-digit numeric OTP code.
 * Uses crypto.randomInt which is backed by system entropy.
 * Range: 1000 to 9999 (inclusive)
 * @returns {string} 4-digit string
 */
export function generateSecure4DigitOtp() {
  const codeInt = crypto.randomInt(1000, 10000);
  return codeInt.toString();
}

/**
 * Computes a salted SHA-256 hash bound to the target email and purpose.
 * Prevents code reuse across different emails.
 * @param {string} code 4-digit code
 * @param {string} email Target normalized email
 * @param {string} [purpose='login']
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashOtp(code, email, purpose = 'login') {
  const normalizedEmail = email.toLowerCase().trim();
  const payload = `${code}:${normalizedEmail}:${purpose}:${OTP_SECRET}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Performs timing-safe comparison between candidate code and stored hash.
 * @param {string} candidateCode
 * @param {string} email
 * @param {string} storedHash
 * @param {string} [purpose='login']
 * @returns {boolean}
 */
export function verifyOtpTimingSafe(candidateCode, email, storedHash, purpose = 'login') {
  if (!candidateCode || !storedHash || candidateCode.length !== 4) {
    return false;
  }
  const computedHash = hashOtp(candidateCode, email, purpose);
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');

  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates whether an email is eligible to request an OTP (resend cooldown).
 * @param {string} email
 * @returns {{ allowed: boolean, remainingSeconds: number }}
 */
export function checkResendRateLimit(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const lastSent = lastSentTimestamps.get(normalizedEmail);
  const now = Date.now();

  if (lastSent && now - lastSent < RESEND_COOLDOWN_SECONDS * 1000) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - lastSent)) / 1000);
    return { allowed: false, remainingSeconds };
  }

  return { allowed: true, remainingSeconds: 0 };
}

/**
 * Records that an OTP was requested for rate limiting.
 * @param {string} email
 */
export function recordOtpSentTimestamp(email) {
  const normalizedEmail = email.toLowerCase().trim();
  lastSentTimestamps.set(normalizedEmail, Date.now());
}

/**
 * Fallback in-memory store for verification testing when database is offline
 */
export function saveOtpToMemory(email, hash, purpose = 'login') {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  memoryOtpStore.set(`${normalizedEmail}:${purpose}`, {
    hash,
    attempts: 0,
    expiresAt,
    consumed: false,
  });
}

export function verifyOtpFromMemory(email, code, purpose = 'login') {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `${normalizedEmail}:${purpose}`;
  const record = memoryOtpStore.get(key);

  if (!record) {
    return { valid: false, error: 'No active verification code found for this email.' };
  }

  if (record.consumed) {
    return { valid: false, error: 'This code has already been used. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    memoryOtpStore.delete(key);
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    memoryOtpStore.delete(key);
    return { valid: false, error: 'Too many incorrect attempts. Code has been invalidated.' };
  }

  const isMatch = verifyOtpTimingSafe(code, normalizedEmail, record.hash, purpose);
  if (!isMatch) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Consume code atomically
  record.consumed = true;
  memoryOtpStore.delete(key);
  return { valid: true };
}

