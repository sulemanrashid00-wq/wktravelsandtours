import React, { Suspense } from 'react';
import { PackageCatalogue } from '@/components/packages/PackageCatalogue';

export const metadata = {
  title: 'All Tour Packages & Visit Visas | WK Travel & Tours',
  description:
    'Browse our complete international portfolio of verified holiday packages, family getaways, solo expeditions, and tourist visa services from Karachi.',
};

export default function PackagesPage() {
  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-white">
      <div className="border-b border-[#E1E7EB] pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
          Curated International Journeys
        </span>
        <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#10263D] tracking-tight">
          Complete Package & Visa Catalogue
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] max-w-2xl leading-relaxed">
          Every itinerary features confirmed return flights, quality hotel accommodations, transparent per-person pricing, and complete visa filing support.
        </p>
      </div>

      <Suspense fallback={<div className="py-12 text-center text-xs text-[#586775]">Loading travel catalogue...</div>}>
        <PackageCatalogue />
      </Suspense>
    </main>
  );
}
