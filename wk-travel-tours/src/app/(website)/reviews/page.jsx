import React from 'react';
import Link from 'next/link';
import { ReviewsView } from '@/components/reviews/ReviewsView';

export const metadata = {
  title: 'Customer Reviews & Feedback | WK Travel & Tours',
  description:
    'Read verified traveler feedback and submit your own reviews for group tours, family holidays, and visit visa services arranged by WK Travel & Tours Karachi.',
};

export default function ReviewsPage() {
  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full bg-white">
      {/* Editorial Header */}
      <div className="border-b border-[#E1E7EB] pb-6 mb-8 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Customer Voices & Integrity
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D]">
          Reviews & Traveler Experiences
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] max-w-3xl leading-relaxed">
          At WK Travel & Tours, we pride ourselves on authentic, transparent service. In accordance with our anti-fabrication standards, we never publish simulated testimonials or fake star ratings. Every review shown below has been directly submitted by verified clients and moderated by our operations desk.
        </p>
      </div>

      <ReviewsView />
    </main>
  );
}
