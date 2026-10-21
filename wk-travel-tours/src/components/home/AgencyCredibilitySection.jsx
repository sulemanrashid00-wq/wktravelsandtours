import React from 'react';
import Link from 'next/link';

export function AgencyCredibilitySection() {
  return (
    <section className="py-16 bg-white border-b border-[#E1E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Agency Philosophy */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold block mb-1">
              Authentic Travel Operations
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D] tracking-tight">
              Why Karachi Travelers Trust WK Travel & Tours
            </h2>
            <p className="text-sm text-[#586775] leading-relaxed">
              We eliminate the uncertainty often associated with international travel bookings. Every package presented in our catalog is backed by verified supplier agreements, confirmed air travel arrangements, and authentic visa filing expertise.
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="text-xs uppercase tracking-wider font-semibold text-[#087E83] hover:text-[#06676B] underline underline-offset-4 transition-colors"
              >
                Read Our Agency Heritage &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: 4 Core Operational Principles (2x2 grid, NOT 3 in a row) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg space-y-2">
              <div className="w-8 h-8 rounded bg-white text-[#087E83] border border-[#E1E7EB] flex items-center justify-center font-bold text-xs shadow-sm">
                01
              </div>
              <h3 className="font-heading text-base font-bold text-[#10263D]">
                Physical Walk-In Office
              </h3>
              <p className="text-xs text-[#586775] leading-relaxed">
                Consult with our trip planners face-to-face at Royal Defence Mall in Karachi to discuss visa paperwork and review hotel vouchers.
              </p>
            </div>

            <div className="p-5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg space-y-2">
              <div className="w-8 h-8 rounded bg-white text-[#087E83] border border-[#E1E7EB] flex items-center justify-center font-bold text-xs shadow-sm">
                02
              </div>
              <h3 className="font-heading text-base font-bold text-[#10263D]">
                Transparent Cost Basis
              </h3>
              <p className="text-xs text-[#586775] leading-relaxed">
                Clear prices in Pakistani Rupees with distinct per-person or service fee basis. No unexpected charges or ambiguous pricing structures.
              </p>
            </div>

            <div className="p-5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg space-y-2">
              <div className="w-8 h-8 rounded bg-white text-[#087E83] border border-[#E1E7EB] flex items-center justify-center font-bold text-xs shadow-sm">
                03
              </div>
              <h3 className="font-heading text-base font-bold text-[#10263D]">
                Multi-Country Visa Support
              </h3>
              <p className="text-xs text-[#586775] leading-relaxed">
                Thorough document checking and official embassy application submission for Thailand, Malaysia, Indonesia, Sri Lanka, Turkey, and Azerbaijan.
              </p>
            </div>

            <div className="p-5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg space-y-2">
              <div className="w-8 h-8 rounded bg-white text-[#087E83] border border-[#E1E7EB] flex items-center justify-center font-bold text-xs shadow-sm">
                04
              </div>
              <h3 className="font-heading text-base font-bold text-[#10263D]">
                Direct WhatsApp Concierge
              </h3>
              <p className="text-xs text-[#586775] leading-relaxed">
                Instant communication with our team before, during, and after your trip for flight updates, transfer coordinates, and local guidance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
