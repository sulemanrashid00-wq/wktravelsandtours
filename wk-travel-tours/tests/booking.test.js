import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingRequestSchema, customTripSchema } from '../src/lib/validation/bookingSchema.js';

test('bookingRequestSchema validates valid booking request', () => {
  const validData = {
    customerName: 'Muhammad Ali',
    phone: '03372614742',
    city: 'Karachi',
    travellerCount: 3,
  };

  const result = bookingRequestSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test('bookingRequestSchema rejects invalid short names and phone numbers', () => {
  const invalidData = {
    customerName: 'A',
    phone: '123',
    city: 'K',
    travellerCount: 0,
  };

  const result = bookingRequestSchema.safeParse(invalidData);
  assert.equal(result.success, false);
});

test('customTripSchema validates custom trip request', () => {
  const validCustom = {
    tripType: 'family',
    destinations: 'Malaysia and Thailand',
    travellerCount: 4,
    approximateDate: 'December 2026',
    customerName: 'Fatima Zahra',
    phone: '03022614742',
  };

  const result = customTripSchema.safeParse(validCustom);
  assert.equal(result.success, true);
});

