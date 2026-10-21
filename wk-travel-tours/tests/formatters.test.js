import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPKR, buildWhatsAppUrl } from '../src/lib/utils/formatters.js';

test('formatPKR formats amounts correctly in PKR', () => {
  assert.equal(formatPKR(360000), 'PKR 360,000');
  assert.equal(formatPKR(0), 'PKR 0');
});

test('buildWhatsAppUrl builds clean wa.me link with encoded text', () => {
  const url = buildWhatsAppUrl('+92 337 2614742', 'Hello World');
  assert.equal(url, 'https://wa.me/923372614742?text=Hello%20World');
});

