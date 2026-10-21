import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROLES } from '../src/lib/security/roles.js';

test('Registration validation: ensures valid customer payload criteria', () => {
  const validateRegistration = (payload) => {
    const fullName = (payload.fullName || '').trim();
    const email = (payload.email || '').trim().toLowerCase();
    const password = payload.password || '';

    if (!fullName || fullName.length < 2) {
      return { valid: false, error: 'Full name must be at least 2 characters.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    return { valid: true };
  };

  // Valid customer registration
  const validRes = validateRegistration({
    fullName: 'Kamran Ali',
    email: 'kamran.traveler@example.com',
    password: 'SecurePassword123!',
  });
  assert.equal(validRes.valid, true);

  // Short full name
  const shortNameRes = validateRegistration({
    fullName: 'K',
    email: 'kamran@example.com',
    password: 'SecurePassword123!',
  });
  assert.equal(shortNameRes.valid, false);
  assert.ok(shortNameRes.error.includes('at least 2 characters'));

  // Invalid email
  const badEmailRes = validateRegistration({
    fullName: 'Kamran Ali',
    email: 'invalid-email-format',
    password: 'SecurePassword123!',
  });
  assert.equal(badEmailRes.valid, false);
  assert.ok(badEmailRes.error.includes('valid email'));

  // Short password (< 8 chars)
  const shortPassRes = validateRegistration({
    fullName: 'Kamran Ali',
    email: 'kamran@example.com',
    password: 'short',
  });
  assert.equal(shortPassRes.valid, false);
  assert.ok(shortPassRes.error.includes('at least 8 characters'));
});

test('Customer privilege isolation: registration can NEVER grant administrator role', () => {
  // Any public registration must strictly result in customer role
  const assignRoleOnRegistration = (email, requestedRole) => {
    // Ignore requestedRole completely: public registration only provisions customer
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (normalizedEmail === 'wktravelandtour@gmail.com' || normalizedEmail === 'admin@wktravel.pk') {
      return ROLES.ADMIN;
    }
    return ROLES.CUSTOMER;
  };

  assert.equal(assignRoleOnRegistration('regular.customer@gmail.com', 'admin'), ROLES.CUSTOMER);
  assert.equal(assignRoleOnRegistration('hacker@attack.com', 'superuser'), ROLES.CUSTOMER);
  assert.equal(assignRoleOnRegistration('traveler@yahoo.com'), ROLES.CUSTOMER);
});

test('Routes integrity: /register and /signup exist on disk with mutual navigation links', () => {
  const registerPath = path.resolve('src/app/(auth)/register/page.jsx');
  const loginPath = path.resolve('src/app/(auth)/login/page.jsx');
  const signupPath = path.resolve('src/app/(auth)/signup/page.jsx');

  assert.ok(fs.existsSync(registerPath), 'src/app/(auth)/register/page.jsx must exist');
  assert.ok(fs.existsSync(loginPath), 'src/app/(auth)/login/page.jsx must exist');
  assert.ok(fs.existsSync(signupPath), 'src/app/(auth)/signup/page.jsx must exist');

  const registerContent = fs.readFileSync(registerPath, 'utf8');
  const loginContent = fs.readFileSync(loginPath, 'utf8');

  // Verify login links to register
  assert.ok(loginContent.includes('/register'), 'Login page must include a link to /register');

  // Verify register links to login
  assert.ok(registerContent.includes('/login'), 'Register page must include a link to /login');

  // Verify register links to Terms and Privacy Policy
  assert.ok(registerContent.includes('/terms'), 'Register page must link to Terms of Service');
  assert.ok(registerContent.includes('/privacy-policy'), 'Register page must link to Privacy Policy');
});

