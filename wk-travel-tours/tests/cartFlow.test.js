import test from 'node:test';
import assert from 'node:assert/strict';
import { useCartStore } from '../src/stores/cartStore.js';

test('Cart Store: initial state is empty and drawer closed', () => {
  const store = useCartStore.getState();
  store.clearCart();
  store.closeDrawer();

  assert.equal(useCartStore.getState().items.length, 0);
  assert.equal(useCartStore.getState().isDrawerOpen, false);
  assert.equal(useCartStore.getState().getGrandTotal(), 0);
  assert.equal(useCartStore.getState().getDistinctPackagesCount(), 0);
});

test('Cart Store: openDrawer and closeDrawer accurately control visibility', () => {
  const store = useCartStore.getState();
  store.openDrawer();
  assert.equal(useCartStore.getState().isDrawerOpen, true);

  store.closeDrawer();
  assert.equal(useCartStore.getState().isDrawerOpen, false);

  store.toggleDrawer();
  assert.equal(useCartStore.getState().isDrawerOpen, true);
  store.toggleDrawer();
  assert.equal(useCartStore.getState().isDrawerOpen, false);
});

test('Cart Store: addItem adds standard tour with verified price and pax calculation', () => {
  const store = useCartStore.getState();
  store.clearCart();

  const standardPkg = {
    id: 'pkg-1',
    title: 'Explore Thailand Multi-City Tour',
    slug: 'thailand-bangkok-pattaya-phuket',
    destination: 'Thailand',
    duration: '6 Days / 5 Nights',
    price: 195000,
    pricingBasis: 'per_person',
    primaryImage: '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
    serviceType: 'tour',
  };

  store.addItem(standardPkg, 2);

  const state = useCartStore.getState();
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].packageId, 'pkg-1');
  assert.equal(state.items[0].travellerCount, 2);
  assert.equal(state.items[0].price, 195000);
  assert.equal(state.items[0].isCustomTrip, false);
  assert.equal(state.getTotalTravellers(), 2);
  assert.equal(state.getGrandTotal(), 195000 * 2);
});

test('Cart Store: duplicate addItem increments count without creating duplicate entries', () => {
  const store = useCartStore.getState();
  const standardPkg = {
    id: 'pkg-1',
    title: 'Explore Thailand Multi-City Tour',
    slug: 'thailand-bangkok-pattaya-phuket',
    destination: 'Thailand',
    price: 195000,
    pricingBasis: 'per_person',
  };

  store.addItem(standardPkg, 1);
  const state = useCartStore.getState();
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].travellerCount, 3);
  assert.equal(state.getGrandTotal(), 195000 * 3);
});

test('Cart Store: custom trip packages are detected and never add fake numerical prices to grand total', () => {
  const store = useCartStore.getState();
  store.clearCart();

  const customPkg = {
    id: 'pkg-11',
    title: 'Family Customized Package: Journeys Beyond Boundaries',
    slug: 'family-customized-package',
    destination: 'Asia & Middle East',
    duration: '7 Days / 6 Nights',
    price: 310000,
    pricingBasis: 'custom',
    isCustomTripPromotion: true,
    isCustomized: true,
  };

  store.addItem(customPkg, 4);

  const state = useCartStore.getState();
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].isCustomTrip, true);
  assert.equal(state.items[0].price, 0); // Price sanitized to 0 for custom trips
  assert.equal(state.hasCustomTrip(), true);
  assert.equal(state.getGrandTotal(), 0); // Strictly 0 numerical price
  assert.equal(state.getTotalTravellers(), 4);
});

test('Cart Store: mixed cart calculates standard items while isolating custom trips', () => {
  const store = useCartStore.getState();
  store.clearCart();

  // 1. Fixed Visa service (PKR 65,000 flat)
  const visaPkg = {
    id: 'pkg-9',
    title: '4-in-1 Visit Visa Package',
    slug: '4-in-1-visit-visa-package',
    destination: 'Multi-Country Visit Visas',
    price: 65000,
    pricingBasis: 'visa_only',
    serviceType: 'visa',
  };

  // 2. Custom trip (Based on Choice)
  const customPkg = {
    id: 'pkg-10',
    title: 'VIP Friends Package',
    slug: 'friends-vip-package',
    destination: 'South East Asia',
    price: 280000,
    pricingBasis: 'custom',
    isCustomTripPromotion: true,
  };

  // 3. Standard Tour (PKR 210,000 per person x 2 pax)
  const tourPkg = {
    id: 'pkg-4',
    title: 'Baku Azerbaijan City Tour',
    slug: 'baku-azerbaijan-tour',
    destination: 'Baku, Azerbaijan',
    price: 210000,
    pricingBasis: 'per_person',
    serviceType: 'tour',
  };

  store.addItem(visaPkg, 1);
  store.addItem(customPkg, 5);
  store.addItem(tourPkg, 2);

  const state = useCartStore.getState();
  assert.equal(state.items.length, 3);
  assert.equal(state.hasCustomTrip(), true);

  // Grand total = Visa (65,000) + Tour (210,000 * 2 = 420,000) + Custom (0) = 485,000
  assert.equal(state.getGrandTotal(), 485000);
  assert.equal(state.getTotalTravellers(), 1 + 5 + 2);
});

test('Cart Store: removeItem updates count and subtotal immediately', () => {
  const store = useCartStore.getState();
  store.removeItem('pkg-4');

  const state = useCartStore.getState();
  assert.equal(state.items.length, 2);
  // Visa (65,000) + Custom (0) = 65,000
  assert.equal(state.getGrandTotal(), 65000);

  store.removeItem('pkg-9');
  store.removeItem('pkg-10');
  assert.equal(useCartStore.getState().items.length, 0);
  assert.equal(useCartStore.getState().getGrandTotal(), 0);
});

test('Cart Store: updateTravellerCount clamps to minimum 1 pax', () => {
  const store = useCartStore.getState();
  store.clearCart();

  const tourPkg = {
    id: 'pkg-1',
    title: 'Thailand Tour',
    price: 195000,
    pricingBasis: 'per_person',
  };

  store.addItem(tourPkg, 2);
  store.updateTravellerCount('pkg-1', 0); // Attempt invalid zero count
  assert.equal(useCartStore.getState().items[0].travellerCount, 1);

  store.updateTravellerCount('pkg-1', -5); // Attempt invalid negative count
  assert.equal(useCartStore.getState().items[0].travellerCount, 1);

  store.updateTravellerCount('pkg-1', 4);
  assert.equal(useCartStore.getState().items[0].travellerCount, 4);
  assert.equal(useCartStore.getState().getGrandTotal(), 195000 * 4);
});

