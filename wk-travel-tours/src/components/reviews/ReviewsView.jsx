'use client';

import React, { useState } from 'react';
import { ReviewsDisplayList } from './ReviewsDisplayList';
import { ReviewSubmissionForm } from './ReviewSubmissionForm';
import { siteConfig } from '@/config/site';
import { IconWhatsApp } from '@/components/ui/Icons';

export function ReviewsView() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReviewSubmitted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-12">
      {/* Moderated Reviews Display */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-brand-gold font-semibold">
              Traveler Experiences
            </span>
            <h2 className="text-xl font-heading font-bold text-brand-navy-950">
              Published Client Reviews
            </h2>
          </div>
          <a
            href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent('Hello WK Travel, I have a query about traveler experiences.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:underline"
          >
            <IconWhatsApp className="w-4 h-4" />
            <span>Direct WhatsApp Inquiries</span>
          </a>
        </div>

        <ReviewsDisplayList refreshKey={refreshKey} />
      </div>

      {/* Review Submission Form */}
      <div>
        <ReviewSubmissionForm onReviewSubmitted={handleReviewSubmitted} />
      </div>
    </div>
  );
}

