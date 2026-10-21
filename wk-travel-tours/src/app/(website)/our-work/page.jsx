import React from 'react';
import { OurWorkGallery } from '@/components/work/OurWorkGallery';

export const metadata = {
  title: 'Our Completed Operations & Field Archive | WK Travel & Tours',
  description:
    'Visual documentation of verified international group tours, family getaways, honeymoon itineraries, and visit visa filings managed by WK Travel & Tours Karachi.',
};

export default function OurWorkPage() {
  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-white">
      {/* Header */}
      <div className="border-b border-[#E1E7EB] pb-6 mb-8 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Proven Agency Track Record
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D]">
          Completed Tours & Agency Portfolio
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] max-w-3xl leading-relaxed">
          Every journey documented below represents genuine agency operations executed for clients departing from Karachi and across Pakistan. Browse through past group departures, bespoke family vacations, and embassy visa filings.
        </p>
      </div>

      <OurWorkGallery />
    </main>
  );
}
