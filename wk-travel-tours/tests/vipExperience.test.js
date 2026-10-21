import test from 'node:test';
import assert from 'node:assert/strict';
import { packageSchema } from '../src/lib/validation/packageSchema.js';
import { initialCategories, initialBanners, initialPackages } from '../src/config/initialData.js';
import { ROLES } from '../src/lib/security/roles.js';

test('packageSchema: validates fully compliant package record', () => {
  const valid = {
    title: 'Explore Istanbul & Cappadocia Historic Splendors',
    slug: 'istanbul-cappadocia-historic',
    destination: 'Turkey',
    subtitle: 'Bosphorus Cruise & Fairy Chimneys',
    price: 340000,
    pricingBasis: 'per_person',
    duration: '8 Days / 7 Nights',
    durationDays: 8,
    category: 'family',
    categories: ['family', 'honeymoon'],
    allowedCategories: ['family', 'honeymoon'],
    serviceType: 'tour',
    primaryImage: '/images/packages/thailand-bangkok-pattaya-phuket.jpeg',
    galleryImages: [],
    inclusions: ['4-Star Hotel', 'Domestic Flight', 'Breakfast'],
    exclusions: ['Visa Fees', 'Personal Expenses'],
    highlights: ['Hot Air Balloon Ride', 'Blue Mosque Visit'],
    itinerary: [{ day: 1, title: 'Arrival in Istanbul' }],
    isFeatured: true,
    isActive: true,
  };

  const parsed = packageSchema.parse(valid);
  assert.equal(parsed.title, valid.title);
  assert.equal(parsed.isFeatured, true);
  assert.equal(parsed.serviceType, 'tour');
  assert.ok(parsed.categories.includes('family'));
});

test('packageSchema: rejects package with zero or negative price', () => {
  const invalidPrice = {
    title: 'Test Package Rate',
    slug: 'test-package-rate',
    destination: 'Dubai',
    price: 0,
    duration: '5 Days',
    primaryImage: '/test.jpeg',
  };

  assert.throws(() => {
    packageSchema.parse(invalidPrice);
  }, /Price must be a positive integer in PKR/);
});

test('packageSchema: rejects package without required destination or title', () => {
  assert.throws(() => {
    packageSchema.parse({
      title: 'Valid Title Here',
      slug: 'valid-slug',
      price: 100000,
      duration: '3 Days',
      primaryImage: '/test.jpeg',
    });
  });
});

test('Custom trips pricing compliance: custom banners and routes must never display fabricated fixed prices', () => {
  // All promotional custom banners must target /custom-trip
  for (const banner of initialBanners) {
    assert.ok(banner.targetUrl.startsWith('/custom-trip'), `Banner ${banner.id} targetUrl must point to custom-trip`);
    // Banners must NOT define a fixed price property
    assert.equal(banner.price, undefined, `Custom trip banner ${banner.id} must not have a fabricated fixed price`);
  }
});

test('Canonical categories: all standard category slugs are defined with human-readable titles', () => {
  const requiredSlugs = ['all', 'featured', 'solo', 'friends', 'family', 'honeymoon', 'visa'];
  const categorySlugs = initialCategories.map((c) => c.slug);

  for (const req of requiredSlugs) {
    assert.ok(categorySlugs.includes(req), `Required canonical category "${req}" is missing in initialCategories`);
  }
});

test('Security roles: admin and customer roles are strictly defined', () => {
  assert.equal(ROLES.ADMIN, 'admin');
  assert.equal(ROLES.CUSTOMER, 'customer');
});

test('Customized package priority: Family, Friends and Honeymoon promotions have isCustomTripPromotion and displayOrder 1', () => {
  const customSlugs = ['family-customized-package', 'friends-vip-package', 'honeymoon-customized-package'];
  for (const slug of customSlugs) {
    const pkg = initialPackages.find((p) => p.slug === slug);
    assert.ok(pkg, `Customized package ${slug} must exist`);
    assert.equal(pkg.isCustomized, true, `${slug} must have isCustomized true`);
    assert.equal(pkg.isCustomTripPromotion, true, `${slug} must have isCustomTripPromotion true`);
    assert.equal(pkg.displayOrder, 1, `${slug} must have displayOrder 1`);
  }
});

test('Visit Visa single combined offer: PKR 65,000 confirmed offer is verified and distinct from unverified duplicates', () => {
  const combinedVisa = initialPackages.find((p) => p.slug === '4-in-1-visit-visa-package');
  assert.ok(combinedVisa, '4-in-1-visit-visa-package must exist');
  assert.equal(combinedVisa.price, 65000);
  assert.equal(combinedVisa.isActive, true);
  assert.equal(combinedVisa.serviceType, 'visa');
  assert.equal(combinedVisa.pricingBasis, 'visa_only');

  const unverified = initialPackages.filter((p) => p.isUnverified === true);
  assert.equal(unverified.length, 4, 'Exactly 4 unverified duplicate records should be flagged for admin review');
  for (const u of unverified) {
    assert.equal(u.isActive, false, `Unverified duplicate ${u.slug} must not be publicly active`);
    assert.ok(u.adminReviewFlag, `Unverified duplicate ${u.slug} must have admin review flag`);
  }
});

