import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_ROUTES = [
  'src/app/(website)/page.jsx',
  'src/app/(website)/packages/page.jsx',
  'src/app/(website)/packages/[slug]/page.jsx',
  'src/app/(website)/custom-trip/page.jsx',
  'src/app/(website)/reviews/page.jsx',
  'src/app/(website)/our-work/page.jsx',
  'src/app/(website)/about/page.jsx',
  'src/app/(website)/contact/page.jsx',
  'src/app/(website)/privacy-policy/page.jsx',
  'src/app/(website)/terms/page.jsx',
  'src/app/(website)/profile/page.jsx',
  'src/app/(auth)/login/page.jsx',
  'src/app/admin/page.jsx',
];

test('all 13 required public and admin routes exist on disk', () => {
  for (const relPath of REQUIRED_ROUTES) {
    const fullPath = path.resolve(process.cwd(), relPath);
    assert.equal(fs.existsSync(fullPath), true, `Missing required route file: ${relPath}`);
  }
});

test('robots.js and sitemap.js exist for crawler compliance', () => {
  const robotsPath = path.resolve(process.cwd(), 'src/app/robots.js');
  const sitemapPath = path.resolve(process.cwd(), 'src/app/sitemap.js');
  assert.equal(fs.existsSync(robotsPath), true, 'robots.js must exist');
  assert.equal(fs.existsSync(sitemapPath), true, 'sitemap.js must exist');
});

