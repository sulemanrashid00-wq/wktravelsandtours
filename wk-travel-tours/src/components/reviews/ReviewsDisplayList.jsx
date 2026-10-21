'use client';

import React, { useState, useEffect } from 'react';
import { IconStar, IconShieldCheck } from '@/components/ui/Icons';

export function ReviewsDisplayList({ refreshKey }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchReviews() {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setReviews(json.data);
          }
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-[#586775]">
        Loading verified customer feedback...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-8 border border-dashed border-[#E1E7EB] bg-[#F3F6F8] rounded-xl text-center max-w-xl mx-auto my-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#087E83]">
          Transparency Pledge
        </span>
        <h3 className="mt-2 font-heading text-lg font-bold text-[#10263D]">
          Zero Simulated Testimonials
        </h3>
        <p className="mt-2 text-xs text-[#586775] leading-relaxed">
          In strict compliance with our brand guidelines, WK Travel & Tours does not deploy computer-generated customer testimonials, fabricated star ratings, or placeholder reviews. All entries shown here are directly submitted by genuine travelers and moderated by our operations desk.
        </p>
        <p className="mt-3 text-xs font-semibold text-[#10263D]">
          Have you traveled with us? We encourage you to submit your verified review using the form below.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {reviews.map((rev) => (
        <div
          key={rev.id}
          className="bg-white border border-[#E1E7EB] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="font-heading text-sm font-bold text-[#10263D] flex items-center gap-1.5">
                  {rev.customer_name}
                  <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Customer" />
                </h4>
                {rev.trip_reference && (
                  <span className="text-[11px] text-[#087E83] font-medium">
                    {rev.trip_reference}
                  </span>
                )}
              </div>
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <IconStar
                    key={i}
                    className="w-3.5 h-3.5"
                    filled={i < rev.rating}
                  />
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs text-[#10263D] leading-relaxed italic bg-[#F3F6F8] p-3 rounded-lg border border-[#E1E7EB]">
              "{rev.comment}"
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E1E7EB] flex items-center justify-between text-[11px] text-[#586775]">
            <span>Verified Travel Feedback</span>
            {rev.created_at && (
              <span>{new Date(rev.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
