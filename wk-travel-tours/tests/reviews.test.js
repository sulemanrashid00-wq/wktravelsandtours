import test from 'node:test';
import assert from 'node:assert/strict';
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

test('reviewSubmissionSchema rejects comments shorter than 5 characters', () => {
  const shortComment = {
    customerName: 'Bilal Ahmed',
    rating: 4,
    comment: 'Good',
  };

  const result = reviewSubmissionSchema.safeParse(shortComment);
  assert.equal(result.success, false);
});

