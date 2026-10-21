import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPackages, initialBanners, initialCategories } from '../src/config/initialData.js';

test('initialPackages contains 17 verified client packages', () => {
  assert.equal(initialPackages.length, 17);
});

test('each package has unique id and slug', () => {
  const ids = new Set();
  const slugs = new Set();

  for (const pkg of initialPackages) {
    assert.equal(ids.has(pkg.id), false, `Duplicate id found: ${pkg.id}`);
    assert.equal(slugs.has(pkg.slug), false, `Duplicate slug found: ${pkg.slug}`);
    ids.add(pkg.id);
    slugs.add(pkg.slug);
  }
});

test('each package has valid required fields, integer price and non-empty itineraries', () => {
  for (const pkg of initialPackages) {
    assert.ok(pkg.title && pkg.title.length > 5, `Title too short for ${pkg.id}`);
    assert.ok(pkg.destination, `Destination missing for ${pkg.id}`);
    assert.ok(Number.isInteger(pkg.price) && pkg.price > 0, `Invalid price for ${pkg.id}`);
    assert.ok(pkg.durationDays > 0, `Invalid durationDays for ${pkg.id}`);
    assert.ok(Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0, `Inclusions missing for ${pkg.id}`);
    assert.ok(Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0, `Itinerary missing for ${pkg.id}`);
    assert.ok(pkg.primaryImage.startsWith('/images/packages/'), `Image path invalid for ${pkg.id}`);
  }
});

test('initialBanners contains exactly 3 verified client banners', () => {
  assert.equal(initialBanners.length, 3);
  for (const b of initialBanners) {
    assert.ok(b.title && b.image.startsWith('/images/banners/'));
    assert.ok(b.targetUrl.startsWith('/custom-trip'));
  }
});

// Category isolation & filtering engine tests
import {
  getFeaturedTours,
  getSoloPackages,
  getFriendsPackages,
  getFamilyPackages,
  getHoneymoonPackages,
  getVisaPackages,
  filterPackages,
  isVisaPackage,
  isTourPackage,
  getPackagesByCategory,
  isCustomizedForCategory,
  getCategoryPriorityTier,
} from '../src/lib/utils/packageFilters.js';

test('packageFilters: getFeaturedTours returns only holiday tours and strictly excludes visas', () => {
  const featured = getFeaturedTours(initialPackages);
  assert.ok(featured.length > 0, 'Featured tours must not be empty');
  for (const p of featured) {
    assert.ok(p.isFeatured === true, `Featured package ${p.id} must have isFeatured true`);
    assert.equal(isVisaPackage(p), false, `Visa package ${p.id} must NEVER appear in featured tours`);
    assert.notEqual(p.serviceType, 'visa', `Visa service ${p.id} must not be in featured`);
  }
});

test('packageFilters: category isolation ensures solo packages never leak into family or honeymoon', () => {
  const solo = getSoloPackages(initialPackages);
  const family = getFamilyPackages(initialPackages);
  const honeymoon = getHoneymoonPackages(initialPackages);

  assert.ok(solo.length > 0, 'Solo packages must not be empty');
  assert.ok(family.length > 0, 'Family packages must not be empty');
  assert.ok(honeymoon.length > 0, 'Honeymoon packages must not be empty');

  // Solo package ids
  const soloIds = new Set(solo.map((p) => p.id));
  for (const p of family) {
    if (p.allowedCategories && p.allowedCategories.includes('solo')) continue;
    assert.equal(soloIds.has(p.id), false, `Solo package ${p.id} leaked into family section`);
  }
  for (const p of honeymoon) {
    if (p.allowedCategories && p.allowedCategories.includes('solo')) continue;
    assert.equal(soloIds.has(p.id), false, `Solo package ${p.id} leaked into honeymoon section`);
  }
});

test('packageFilters: visa packages only appear in getVisaPackages and never in tour categories', () => {
  const visa = getVisaPackages(initialPackages);
  assert.ok(visa.length > 0, 'Visa packages must not be empty');

  for (const p of visa) {
    assert.ok(isVisaPackage(p), `Package ${p.id} must be verified visa package`);
  }

  const solo = getSoloPackages(initialPackages);
  const friends = getFriendsPackages(initialPackages);
  const family = getFamilyPackages(initialPackages);
  const honeymoon = getHoneymoonPackages(initialPackages);
  const featured = getFeaturedTours(initialPackages);

  const visaIds = new Set(visa.map((p) => p.id));
  for (const p of [...solo, ...friends, ...family, ...honeymoon, ...featured]) {
    assert.equal(visaIds.has(p.id), false, `Visa package ${p.id} leaked into holiday tour slider!`);
  }
});

test('packageFilters: filterPackages handles query, maxPrice, and duration correctly', () => {
  const baku = filterPackages(initialPackages, { query: 'Baku' });
  assert.ok(baku.length > 0, 'Should find Baku packages');
  for (const p of baku) {
    assert.ok(
      p.title.toLowerCase().includes('baku') || p.destination.toLowerCase().includes('baku'),
      `Result ${p.title} does not match query`
    );
  }

  const under200k = filterPackages(initialPackages, { maxPrice: 150000 });
  for (const p of under200k) {
    assert.ok(p.price <= 150000, `Package price ${p.price} exceeds maxPrice 150000`);
  }

  const shortTours = filterPackages(initialPackages, { duration: 'short' });
  for (const p of shortTours) {
    assert.ok(p.durationDays <= 5, `Package duration ${p.durationDays} exceeds short limit (5)`);
  }
});

test('Every category has a correctly filtered sliding window adhering to authentic posters', () => {
  const featured = getFeaturedTours(initialPackages);
  const solo = getSoloPackages(initialPackages);
  const friends = getFriendsPackages(initialPackages);
  const family = getFamilyPackages(initialPackages);
  const honeymoon = getHoneymoonPackages(initialPackages);
  const visa = getVisaPackages(initialPackages);

  assert.equal(featured.length, 8, 'Featured tours must contain exactly 8 verified international tours');
  assert.equal(solo.length, 4, 'Solo packages must contain exactly 4 verified solo journeys');
  assert.equal(friends.length, 5, 'Friends packages must contain exactly 5 packages (customized priority + 4 group tours)');
  assert.equal(family.length, 5, 'Family packages must contain exactly 5 packages (customized priority + 4 family tours)');
  assert.equal(honeymoon.length, 3, 'Honeymoon packages must contain exactly 3 packages (customized priority + Turkey & Bali)');
  assert.equal(visa.length, 1, 'Visa must contain exactly 1 verified combined offer');
});

test('Visit Visa data correction: displays single verified combined PKR 65,000 package without duplicates', () => {
  const visa = getVisaPackages(initialPackages);
  assert.equal(visa.length, 1, 'Public visa listing must contain single verified combined offer');
  assert.equal(visa[0].slug, '4-in-1-visit-visa-package');
  assert.equal(visa[0].price, 65000);
  assert.equal(visa[0].pricingBasis, 'visa_only');

  // Verify that the 4 unverified duplicate copies are flagged inactive/unverified for admin review
  const duplicateIds = ['pkg-14', 'pkg-15', 'pkg-16', 'pkg-17'];
  for (const id of duplicateIds) {
    const pkg = initialPackages.find((p) => p.id === id);
    assert.ok(pkg, `Record ${id} must exist in registry`);
    assert.equal(pkg.isActive, false, `Duplicate record ${id} must NOT be active`);
    assert.equal(pkg.isUnverified, true, `Duplicate record ${id} must be flagged as unverified`);
  }
});

test('Phase 3 category ordering: Customized family package appears FIRST in family sliding window', () => {
  const family = getFamilyPackages(initialPackages);
  assert.ok(family.length >= 3, 'Family must have packages');
  assert.equal(family[0].slug, 'family-customized-package', 'First family package MUST be family-customized-package');
  assert.equal(family[0].isCustomized, true);
  assert.equal(family[0].isCustomTripPromotion, true);
});

test('Phase 3 category ordering: Customized friends package appears FIRST in friends sliding window', () => {
  const friends = getFriendsPackages(initialPackages);
  assert.ok(friends.length >= 3, 'Friends must have packages');
  assert.equal(friends[0].slug, 'friends-vip-package', 'First friends package MUST be friends-vip-package');
  assert.equal(friends[0].isCustomized, true);
  assert.equal(friends[0].isCustomTripPromotion, true);
});

test('Phase 3 category ordering: Customized honeymoon package appears FIRST in honeymoon sliding window', () => {
  const honeymoon = getHoneymoonPackages(initialPackages);
  assert.ok(honeymoon.length >= 3, 'Honeymoon must have packages');
  assert.equal(honeymoon[0].slug, 'honeymoon-customized-package', 'First honeymoon package MUST be honeymoon-customized-package');
  assert.equal(honeymoon[0].isCustomized, true);
  assert.equal(honeymoon[0].isCustomTripPromotion, true);
});

test('Phase 3 category ordering: Cross-category isolation prevents customized package leakage', () => {
  const family = getFamilyPackages(initialPackages);
  const friends = getFriendsPackages(initialPackages);
  const honeymoon = getHoneymoonPackages(initialPackages);

  const familySlugs = family.map((p) => p.slug);
  const friendsSlugs = friends.map((p) => p.slug);
  const honeymoonSlugs = honeymoon.map((p) => p.slug);

  assert.equal(familySlugs.includes('friends-vip-package'), false);
  assert.equal(familySlugs.includes('honeymoon-customized-package'), false);

  assert.equal(friendsSlugs.includes('family-customized-package'), false);
  assert.equal(friendsSlugs.includes('honeymoon-customized-package'), false);

  assert.equal(honeymoonSlugs.includes('family-customized-package'), false);
  assert.equal(honeymoonSlugs.includes('friends-vip-package'), false);
});

test('Phase 3 deterministic ordering rule: 3-tier priority ordering with synthetic packages', () => {
  const mockPackages = [
    { id: 'm-1', title: 'Standard Secondary Tour', slug: 'standard-secondary', category: 'solo', allowedCategories: ['family'], isCustomized: false, displayOrder: 10 },
    { id: 'm-2', title: 'Primary Family Tour', slug: 'primary-family', category: 'family', allowedCategories: ['family'], isCustomized: false, displayOrder: 5 },
    { id: 'm-3', title: 'Customized Family Tour', slug: 'custom-family', category: 'family', allowedCategories: ['family'], isCustomized: true, displayOrder: 1 },
    { id: 'm-4', title: 'Unrelated Honeymoon Custom', slug: 'custom-honeymoon', category: 'honeymoon', allowedCategories: ['honeymoon'], isCustomized: true, displayOrder: 1 },
  ];

  const sortedFamily = getPackagesByCategory(mockPackages, 'family');
  assert.equal(sortedFamily.length, 3, 'Should filter out unrelated honeymoon package');
  assert.equal(sortedFamily[0].slug, 'custom-family', 'Tier 1 customized package must be first');
  assert.equal(sortedFamily[1].slug, 'primary-family', 'Tier 2 primary package must be second');
  assert.equal(sortedFamily[2].slug, 'standard-secondary', 'Tier 3 allowed package must be third');
});


