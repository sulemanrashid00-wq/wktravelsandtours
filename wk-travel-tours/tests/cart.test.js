import test from 'node:test';
import assert from 'node:assert/strict';

function calculateItemTotal(item) {
  const count = item.travellerCount || 1;
  if (item.pricingBasis === 'per_person') {
    return Math.round(item.price * count);
  }
  return Math.round(item.price);
}

function calculateCartSubtotal(items) {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

test('calculateItemTotal multiplies price by travellerCount for per_person basis', () => {
  const item = {
    price: 360000,
    pricingBasis: 'per_person',
    travellerCount: 3,
  };
  assert.equal(calculateItemTotal(item), 1080000);
});

test('calculateItemTotal preserves fixed price for visa_only basis', () => {
  const item = {
    price: 65000,
    pricingBasis: 'visa_only',
    travellerCount: 4,
  };
  assert.equal(calculateItemTotal(item), 65000);
});

test('calculateCartSubtotal sums integer values without precision leakage', () => {
  const items = [
    { price: 360000, pricingBasis: 'per_person', travellerCount: 2 }, // 720000
    { price: 215000, pricingBasis: 'per_person', travellerCount: 1 }, // 215000
    { price: 65000, pricingBasis: 'visa_only', travellerCount: 2 },   // 65000
  ];
  assert.equal(calculateCartSubtotal(items), 1000000);
  assert.equal(Number.isInteger(calculateCartSubtotal(items)), true);
});

