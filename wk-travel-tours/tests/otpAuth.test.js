import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSecure4DigitOtp,
  hashOtp,
  verifyOtpTimingSafe,
  checkResendRateLimit,
  recordOtpSentTimestamp,
  saveOtpToMemory,
  verifyOtpFromMemory,
} from '../src/lib/security/otpService.js';
import { siteConfig } from '../src/config/site.js';

test('generateSecure4DigitOtp produces 4-digit numeric string within [1000, 9999]', () => {
  for (let i = 0; i < 50; i++) {
    const code = generateSecure4DigitOtp();
    assert.equal(typeof code, 'string');
    assert.equal(code.length, 4, `Code length must be exactly 4, got: ${code}`);
    const num = parseInt(code, 10);
    assert.ok(Number.isInteger(num));
    assert.ok(num >= 1000 && num <= 9999, `Code ${num} outside valid 4-digit range [1000, 9999]`);
  }
});

test('hashOtp computes deterministic salted SHA-256 bound to email and purpose', () => {
  const code = '4821';
  const email = 'wktravelandtour@gmail.com';
  const hash1 = hashOtp(code, email, 'login');
  const hash2 = hashOtp(code, '  WKTravelAndTour@gmail.com  ', 'login');
  const hashDiffCode = hashOtp('4822', email, 'login');
  const hashDiffPurpose = hashOtp(code, email, 'password_reset');
  const hashDiffEmail = hashOtp(code, 'client@example.com', 'login');

  assert.equal(hash1.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
  assert.equal(hash1, hash2, 'Hash must be normalized and case-insensitive for email');
  assert.notEqual(hash1, hashDiffCode, 'Different code must yield different hash');
  assert.notEqual(hash1, hashDiffPurpose, 'Different purpose must yield different hash');
  assert.notEqual(hash1, hashDiffEmail, 'Different email must yield different hash');
});

test('verifyOtpTimingSafe accurately validates code and rejects invalid attempts', () => {
  const code = '7394';
  const email = 'wktravelandtour@gmail.com';
  const validHash = hashOtp(code, email, 'login');

  assert.equal(verifyOtpTimingSafe(code, email, validHash, 'login'), true);
  assert.equal(verifyOtpTimingSafe('7395', email, validHash, 'login'), false);
  assert.equal(verifyOtpTimingSafe('739', email, validHash, 'login'), false);
  assert.equal(verifyOtpTimingSafe('73940', email, validHash, 'login'), false);
  assert.equal(verifyOtpTimingSafe(code, 'other@example.com', validHash, 'login'), false);
  assert.equal(verifyOtpTimingSafe(code, email, validHash, 'password_reset'), false);
  assert.equal(verifyOtpTimingSafe('', email, validHash, 'login'), false);
});

test('checkResendRateLimit enforces 60-second cooldown per email', () => {
  const testEmail = `test-rate-limit-${Date.now()}@wktravel.pk`;

  const initialCheck = checkResendRateLimit(testEmail);
  assert.equal(initialCheck.allowed, true);
  assert.equal(initialCheck.remainingSeconds, 0);

  recordOtpSentTimestamp(testEmail);

  const blockedCheck = checkResendRateLimit(testEmail);
  assert.equal(blockedCheck.allowed, false);
  assert.ok(blockedCheck.remainingSeconds > 0 && blockedCheck.remainingSeconds <= 60);

  // Different email should not be blocked
  const otherEmail = `test-other-${Date.now()}@wktravel.pk`;
  const otherCheck = checkResendRateLimit(otherEmail);
  assert.equal(otherCheck.allowed, true);
});

test('saveOtpToMemory and verifyOtpFromMemory handles successful verification and single-use consumption', () => {
  const email = `test-verify-${Date.now()}@wktravel.pk`;
  const code = '8152';
  const hash = hashOtp(code, email, 'login');

  saveOtpToMemory(email, hash, 'login');

  // First verification must succeed
  const result1 = verifyOtpFromMemory(email, code, 'login');
  assert.equal(result1.valid, true);

  // Second verification must fail (atomic consumption)
  const result2 = verifyOtpFromMemory(email, code, 'login');
  assert.equal(result2.valid, false);
  assert.ok(result2.error.includes('No active verification code') || result2.error.includes('already been used'));
});

test('verifyOtpFromMemory locks out after 5 consecutive failed attempts', () => {
  const email = `test-lockout-${Date.now()}@wktravel.pk`;
  const code = '9021';
  const hash = hashOtp(code, email, 'login');

  saveOtpToMemory(email, hash, 'login');

  // Attempt 1 to 4 should fail with remaining count
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = verifyOtpFromMemory(email, '0000', 'login');
    assert.equal(res.valid, false);
    assert.ok(res.error.includes('attempt'));
  }

  // Attempt 5 should fail and invalidate the code
  const res5 = verifyOtpFromMemory(email, '0000', 'login');
  assert.equal(res5.valid, false);

  // Attempt 6 or trying with the correct code now should fail because record was deleted/locked
  const resLocked = verifyOtpFromMemory(email, code, 'login');
  assert.equal(resLocked.valid, false);
});

test('siteConfig designates wktravelandtour@gmail.com as official administrator email', () => {
  assert.equal(siteConfig.adminEmail, 'wktravelandtour@gmail.com');
  assert.ok(siteConfig.contact.email);
});

