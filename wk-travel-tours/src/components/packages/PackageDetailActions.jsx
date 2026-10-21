'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useCustomerStore } from '@/stores/customerStore';
import { formatPKR } from '@/lib/utils/formatters';
import {
  buildWhatsAppUrl,
  createPackageEnquiryWhatsAppMessage,
  openWhatsAppWithFallback,
} from '@/lib/utils/whatsapp';
import { siteConfig } from '@/config/site';
import { IconShoppingBag, IconWhatsApp, IconCheck } from '@/components/ui/Icons';

export function PackageDetailActions({ pkg }) {
  const addItem = useCartStore((state) => state.addItem);
  const customer = useCustomerStore((state) => state.customer);
  const [travellerCount, setTravellerCount] = useState(1);
  const [travelDate, setTravelDate] = useState('');
  const [added, setAdded] = useState(false);

  const isCustomTrip =
    pkg.isCustomTripPromotion === true ||
    pkg.is_custom_trip_promotion === true ||
    pkg.isCustomized === true ||
    pkg.is_customized === true ||
    pkg.pricingBasis === 'custom';

  const multiplier = pkg.pricingBasis === 'per_person' ? travellerCount : 1;
  const calculatedTotal = pkg.price * multiplier;

  const handleAddToCart = () => {
    addItem(pkg, travellerCount, travelDate);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleWhatsAppBooking = () => {
    const msg = createPackageEnquiryWhatsAppMessage({
      customer,
      pkg,
      travellerCount,
      travelDate,
    });

    const url = buildWhatsAppUrl(siteConfig.contact.whatsapp, msg);
    openWhatsAppWithFallback(url);
  };

  const customTripHref = `/custom-trip?type=${pkg.category || 'custom'}&destination=${encodeURIComponent(pkg.destination || '')}&adults=${travellerCount}`;

  return (
    <div className="border border-[#E1E7EB] bg-[#F3F6F8] p-5 sm:p-6 rounded-xl space-y-5 shadow-sm">
      <div className="flex items-baseline justify-between border-b border-[#E1E7EB] pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#586775] block font-medium">
            {isCustomTrip ? 'Vacation Pricing' : 'Confirmed Rate'}
          </span>
          <span className={`font-heading font-bold text-[#10263D] ${isCustomTrip ? 'text-xl sm:text-2xl text-[#087E83]' : 'text-2xl sm:text-3xl'}`}>
            {isCustomTrip ? 'Price: Based on Your Choice' : formatPKR(pkg.price)}
          </span>
          <span className="text-xs text-[#586775] ml-1.5">
            {isCustomTrip
              ? '• Tailored Quote'
              : pkg.pricingBasis === 'per_person'
              ? '/ person'
              : 'all-inclusive fee'}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#087E83] bg-white border border-[#E1E7EB] px-3 py-1 rounded shadow-sm">
          {pkg.duration}
        </span>
      </div>

      {/* Selectors */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
            Number of Travellers
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTravellerCount((c) => Math.max(1, c - 1))}
              className="w-9 h-9 rounded border border-[#E1E7EB] bg-white text-[#10263D] font-bold hover:bg-[#F3F6F8] transition-colors shadow-sm"
            >
              -
            </button>
            <span className="text-sm font-bold text-[#10263D] min-w-8 text-center">
              {travellerCount}
            </span>
            <button
              type="button"
              onClick={() => setTravellerCount((c) => c + 1)}
              className="w-9 h-9 rounded border border-[#E1E7EB] bg-white text-[#10263D] font-bold hover:bg-[#F3F6F8] transition-colors shadow-sm"
            >
              +
            </button>
            <span className="text-xs text-[#586775] ml-2">
              ({travellerCount} {travellerCount === 1 ? 'person' : 'persons'})
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
            Preferred Departure Date (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              placeholder="e.g. 15 November 2026"
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Total Calculation Display */}
      <div className="p-3 bg-white border border-[#E1E7EB] rounded-lg flex items-center justify-between shadow-sm">
        <span className="text-xs text-[#586775] font-medium">
          {isCustomTrip ? 'Budget Guidance:' : 'Calculated Estimated Total:'}
        </span>
        <span className={`font-heading font-bold text-[#10263D] ${isCustomTrip ? 'text-xs sm:text-sm text-[#087E83]' : 'text-lg'}`}>
          {isCustomTrip ? 'Quote Personalized to Your Itinerary' : formatPKR(calculatedTotal)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleWhatsAppBooking}
          className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <IconWhatsApp className="w-4 h-4" />
          <span>{isCustomTrip ? 'Plan Itinerary on WhatsApp' : 'Inquire & Book via WhatsApp'}</span>
        </button>

        {isCustomTrip ? (
          <a
            href={customTripHref}
            className="w-full py-3 px-4 text-xs font-semibold rounded bg-[#087E83] hover:bg-[#06676B] text-white border border-[#087E83] transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
          >
            <span>Request Custom Trip Itinerary Form</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-3 px-4 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-2 shadow-sm ${
              added
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-[#087E83] text-white border-[#087E83] hover:bg-[#06676B]'
            }`}
          >
            {added ? (
              <>
                <IconCheck className="w-4 h-4" />
                <span>Package Added to Cart</span>
              </>
            ) : (
              <>
                <IconShoppingBag className="w-4 h-4" />
                <span>Add to Travel Cart</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#586775] leading-relaxed italic border-t border-[#E1E7EB] pt-3">
        Sending a request connects you directly with our Karachi operations desk. It does not initiate payment until air seats and hotel rooms are re-verified with you.
      </p>
    </div>
  );
}
