import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reviewSubmissionSchema } from '../src/lib/validation/bookingSchema.js';

test('reviewSubmissionSchema validates valid review input', () => {
  const valid = {
    customerName: 'Kamran Akmal',
    rating: 5,
    comment: 'Exceptional group coordination on our Thailand trip. Hotels and transfers were seamless.',
    tripReference: 'Explore Thailand: Bangkok, Pattaya & Phuket',
  };

  const result = reviewSubmissionSchema.safeParse(valid);
  assert.equal(result.success, true);
  assert.equal(result.data.customerName, 'Kamran Akmal');
  assert.equal(result.data.rating, 5);
});

test('reviewSubmissionSchema permits review without tripReference', () => {
  const valid = {
    customerName: 'Ayesha Malik',
    rating: 4,
    comment: 'Prompt visa processing and very respectful customer support.',
  };

  const result = reviewSubmissionSchema.safeParse(valid);
  assert.equal(result.success, true);
  assert.equal(result.data.tripReference, undefined);
});

test('reviewSubmissionSchema rejects ratings outside 1-5', () => {
  const invalidZero = {
    customerName: 'Sara Khan',
    rating: 0,
    comment: 'Great support throughout.',
  };
  const invalidSix = {
    customerName: 'Sara Khan',
    rating: 6,
    comment: 'Great support throughout.',
  };

  assert.equal(reviewSubmissionSchema.safeParse(invalidZero).success, false);
  assert.equal(reviewSubmissionSchema.safeParse(invalidSix).success, false);
});

test('reviewSubmissionSchema rejects short names and short comments', () => {
  const shortName = {
    customerName: 'A',
    rating: 5,
    comment: 'Good journey overall.',
  };
  const shortComment = {
    customerName: 'Bilal Ahmed',
    rating: 4,
    comment: 'Good',
  };

  assert.equal(reviewSubmissionSchema.safeParse(shortName).success, false);
  assert.equal(reviewSubmissionSchema.safeParse(shortComment).success, false);
});

test('reviewSubmissionSchema rejects comments exceeding 1000 characters', () => {
  const oversized = {
    customerName: 'Zubair Qazi',
    rating: 5,
    comment: 'A'.repeat(1001),
  };

  const result = reviewSubmissionSchema.safeParse(oversized);
  assert.equal(result.success, false);
});

test('Reviews API route and SQL migration files exist on disk', () => {
  const apiRoutePath = path.resolve(process.cwd(), 'src/app/api/reviews/route.js');
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261021000000_reviews_public_insert_policy.sql');
  const reviewFormPath = path.resolve(process.cwd(), 'src/components/reviews/ReviewSubmissionForm.jsx');
  const truthfulReviewsPath = path.resolve(process.cwd(), 'src/components/home/TruthfulReviewsSection.jsx');

  assert.equal(fs.existsSync(apiRoutePath), true, 'API route must exist');
  assert.equal(fs.existsSync(migrationPath), true, 'SQL migration must exist');
  assert.equal(fs.existsSync(reviewFormPath), true, 'Review form component must exist');
  assert.equal(fs.existsSync(truthfulReviewsPath), true, 'Truthful reviews section component must exist');

  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(apiContent.includes('SUPABASE_SERVICE_ROLE_KEY'), 'API route must utilize SUPABASE_SERVICE_ROLE_KEY');
  assert.ok(apiContent.includes("status: 'pending'"), 'API route must strictly default submitted reviews to pending');

  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(migrationContent.includes('Allow public inserts'), 'Migration must contain explicit Allow public inserts policy');
  assert.ok(migrationContent.includes('for insert with check (true)'), 'Policy must allow public inserts with check true');
  assert.ok(migrationContent.includes('is_admin()'), 'Migration must provide security definer is_admin() to prevent RLS recursion');
});
