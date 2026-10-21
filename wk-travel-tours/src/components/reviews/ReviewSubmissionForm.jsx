'use client';

import React, { useState } from 'react';
import { initialPackages } from '@/config/initialData';
import { IconStar, IconCheck } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export function ReviewSubmissionForm({ onReviewSubmitted }) {
  const [customerName, setCustomerName] = useState('');
  const [tripReference, setTripReference] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (customerName.trim().length < 2) {
      setErrorMessage('Please provide your full name (minimum 2 characters).');
      return;
    }

    if (comment.trim().length < 10) {
      setErrorMessage('Please share a few sentences about your journey (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          rating: Number(rating),
          comment: comment.trim(),
          tripReference: tripReference.trim() || 'General Agency Experience',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit review.');
      }

      setStatusMessage(
        'Thank you for submitting your travel feedback. Your review has been forwarded to our administration desk for verification and will appear after moderation.'
      );
      setCustomerName('');
      setTripReference('');
      setRating(5);
      setComment('');

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E1E7EB] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="border-b border-[#E1E7EB] pb-4 mb-6">
        <span className="text-[11px] uppercase tracking-wider text-[#087E83] font-semibold">
          Authentic Feedback
        </span>
        <h2 className="mt-1 font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
          Share Your Travel Experience
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#586775] leading-relaxed">
          Completed a journey or visa service with WK Travel & Tours? Help fellow travelers by leaving your verified thoughts.
        </p>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed flex items-start gap-2.5">
          <IconCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-0.5">Feedback Received Successfully</p>
            <p>{statusMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-950 leading-relaxed">
          <p className="font-semibold text-sm mb-0.5">Submission Incomplete</p>
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerName" className="block text-xs font-semibold text-[#10263D] mb-1.5">
              Your Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Tariq Mehmood"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="tripReference" className="block text-xs font-semibold text-[#10263D] mb-1.5">
              Package or Tour Taken
            </label>
            <select
              id="tripReference"
              value={tripReference}
              onChange={(e) => setTripReference(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D]"
            >
              <option value="">Select Tour Package / Service</option>
              {initialPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.title}>
                  {pkg.title}
                </option>
              ))}
              <option value="Custom Family Tour">Custom Family Tour</option>
              <option value="Custom Friends VIP Group">Custom Friends VIP Group</option>
              <option value="Custom Honeymoon Tour">Custom Honeymoon Tour</option>
              <option value="4-in-1 Visit Visa Service">4-in-1 Visit Visa Service</option>
              <option value="General Agency Service">General Agency Service</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#10263D] mb-1.5">
            Your Rating <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded text-gray-300 hover:text-amber-500 transition-colors focus:outline-none"
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  <IconStar
                    className={`w-6 h-6 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300'
                    }`}
                    filled={(hoverRating || rating) >= star}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-medium text-[#586775] ml-2">
              {rating} of 5 Stars
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-xs font-semibold text-[#10263D] mb-1.5">
            Your Honest Feedback & Travel Notes <span className="text-red-600">*</span>
          </label>
          <textarea
            id="comment"
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your itinerary experience, hotel accommodations, guide support, and overall satisfaction..."
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D] placeholder:text-gray-400 leading-relaxed"
          />
          <p className="mt-1 text-[11px] text-[#586775]">
            Minimum 10 characters. Please refrain from including personal passport numbers or private banking details.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E1E7EB]">
          <p className="text-[11px] text-[#586775] max-w-sm">
            All reviews undergo editorial moderation before publication to prevent simulated or defamatory submissions.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Submitting Feedback...' : 'Submit Review for Moderation'}
          </Button>
        </div>
      </form>
    </div>
  );
}
