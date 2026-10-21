import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  OUR_WORK_ITEMS,
  OUR_WORK_CATEGORIES,
  getPublishedWork,
  getWorkByCategory,
} from '../src/config/ourWorkData.js';

describe('Authentic Our Work Portfolio & Media CMS Tests', () => {
  test('Catalog contains exactly 18 authentic operational records', () => {
    assert.equal(OUR_WORK_ITEMS.length, 18, 'Must have exactly 18 authentic records');
  });

  test('All 18 operational image files exist on disk in public/images/our-work', () => {
    for (const item of OUR_WORK_ITEMS) {
      assert.ok(item.imageUrl, `Item ${item.id} must have an imageUrl`);
      assert.ok(
        item.imageUrl.startsWith('/images/our-work/'),
        `Item ${item.id} imageUrl must point to /images/our-work/`
      );

      const relativeDiskPath = path.join('public', item.imageUrl.replace(/^\//, ''));
      const exists = fs.existsSync(relativeDiskPath);
      assert.ok(exists, `Image file on disk must exist: ${relativeDiskPath}`);

      const stat = fs.statSync(relativeDiskPath);
      assert.ok(stat.size > 50000, `Image file ${relativeDiskPath} must be > 50KB authentic photo`);
    }
  });

  test('No placeholder or package poster images are recycled as agency work', () => {
    const forbiddenPatterns = [
      'thailand-bangkok-pattaya-phuket',
      'baku-azerbaijan-tour',
      'malaysia-kuala-lumpur-langkawi',
      'turkey-istanbul-cappadocia-antalya',
      'dubai-city-of-dreams',
      'asia-explorer-5-countries',
      '4-in-1-visit-visa-package',
      'friends-vip-banner',
      'family-package-banner',
      'honeymoon-package-banner',
    ];

    for (const item of OUR_WORK_ITEMS) {
      for (const forbidden of forbiddenPatterns) {
        assert.ok(
          !item.imageUrl.includes(forbidden),
          `Item ${item.id} must NOT recycle package flyer ${forbidden}`
        );
      }
    }
  });

  test('Every item has valid metadata schema and attributes', () => {
    const allowedCategories = ['group', 'family', 'adventure', 'vip', 'transit'];
    const seenIds = new Set();
    const seenFiles = new Set();

    for (const item of OUR_WORK_ITEMS) {
      assert.ok(item.id, 'Item must have an id');
      assert.ok(!seenIds.has(item.id), `ID ${item.id} must be unique`);
      seenIds.add(item.id);

      assert.ok(item.title && item.title.trim().length > 5, `Item ${item.id} must have a valid title`);
      assert.ok(item.destination && item.destination.trim().length > 3, `Item ${item.id} must have a destination`);
      assert.ok(item.description && item.description.trim().length > 10, `Item ${item.id} must have a description`);
      assert.ok(item.travelDate, `Item ${item.id} must have a travelDate`);
      assert.ok(item.milestone, `Item ${item.id} must have a milestone`);
      assert.ok(typeof item.displayOrder === 'number', `Item ${item.id} must have numeric displayOrder`);
      assert.equal(typeof item.isPublished, 'boolean', `Item ${item.id} must have boolean isPublished`);
      assert.ok(
        allowedCategories.includes(item.category),
        `Item ${item.id} category ${item.category} must be in allowed list`
      );

      assert.ok(!seenFiles.has(item.imageUrl), `Image ${item.imageUrl} must be unique per work record`);
      seenFiles.add(item.imageUrl);
    }
  });

  test('Category definitions cover all operational segments', () => {
    assert.ok(OUR_WORK_CATEGORIES.length >= 5, 'Must have at least 5 category tabs');
    const categoryIds = OUR_WORK_CATEGORIES.map((c) => c.id);
    assert.ok(categoryIds.includes('all'));
    assert.ok(categoryIds.includes('group'));
    assert.ok(categoryIds.includes('family'));
    assert.ok(categoryIds.includes('adventure'));
    assert.ok(categoryIds.includes('vip'));
    assert.ok(categoryIds.includes('transit'));
  });

  test('getPublishedWork returns only published records ordered by displayOrder', () => {
    const published = getPublishedWork();
    assert.ok(published.length > 0);
    for (let i = 0; i < published.length - 1; i++) {
      assert.ok(
        published[i].displayOrder <= published[i + 1].displayOrder,
        'Published items must be sorted ascending by displayOrder'
      );
      assert.equal(published[i].isPublished, true);
    }
  });

  test('getWorkByCategory filters correctly across each category', () => {
    const all = getWorkByCategory('all');
    assert.equal(all.length, 18);

    const group = getWorkByCategory('group');
    assert.ok(group.length >= 4, 'Must have group departures');
    for (const item of group) {
      assert.equal(item.category, 'group');
    }

    const adventure = getWorkByCategory('adventure');
    assert.ok(adventure.length >= 3, 'Must have adventure/island excursions');
    for (const item of adventure) {
      assert.equal(item.category, 'adventure');
    }

    const family = getWorkByCategory('family');
    assert.ok(family.length >= 3, 'Must have family leisure records');
    for (const item of family) {
      assert.equal(item.category, 'family');
    }

    const vip = getWorkByCategory('vip');
    assert.ok(vip.length >= 2, 'Must have VIP transfer records');
    for (const item of vip) {
      assert.equal(item.category, 'vip');
    }

    const transit = getWorkByCategory('transit');
    assert.ok(transit.length >= 2, 'Must have transit records');
    for (const item of transit) {
      assert.equal(item.category, 'transit');
    }
  });
});

