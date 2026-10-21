import { z } from 'zod';

export const bookingRequestSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .min(10, 'Valid phone number is required')
    .regex(/^[0-9+\s\-()]{10,20}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(50),
  travellerCount: z.number().int().min(1, 'Minimum 1 traveller is required'),
  travelDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const customTripSchema = z.object({
  tripType: z.enum(['solo', 'friends', 'family', 'honeymoon', 'visa']),
  destinations: z.string().min(2, 'Please specify destination(s)'),
  travellerCount: z.number().int().min(1, 'Minimum 1 traveller is required'),
  approximateDate: z.string().min(2, 'Approximate date is required'),
  duration: z.string().optional(),
  budgetPreference: z.string().optional(),
  servicesNeeded: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  email: z.string().email().optional().or(z.literal('')),
});

export const reviewSubmissionSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, 'Review must be at least 5 characters').max(1000),
  tripReference: z.string().max(100).optional(),
});

