import React, { Suspense } from 'react';
import { CustomTripForm } from '@/components/forms/CustomTripForm';

export const metadata = {
  title: 'Request a Custom Trip Itinerary | WK Travel & Tours',
  description:
    'Plan a personalized solo, group, family, or honeymoon holiday package tailored to your dates and preferences with WK Travel & Tours Karachi. Pricing is based on your choice.',
};

export default function CustomTripPage() {
  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full bg-white">
      <div className="border-b border-[#E1E7EB] pb-6 mb-8 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
            Tailored Travel Planning
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded bg-[#F3F6F8] border border-[#E1E7EB] text-xs font-bold text-[#087E83]">
            Price: Based on Your Choice
          </span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#10263D] tracking-tight">
          Request a Custom Itinerary
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] max-w-2xl leading-relaxed">
          Design your ideal vacation. Whether you need a private family tour, group discount plan, romantic honeymoon, or multi-country visa assistance, our Karachi consultants will build a transparent proposal. Your quotation is calculated strictly based on your choice of hotels, dates, and inclusions.
        </p>
      </div>

      <Suspense fallback={<div className="py-12 text-center text-xs text-[#586775]">Loading custom trip form...</div>}>
        <CustomTripForm />
      </Suspense>
    </main>
  );
}
