'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPKR } from '@/lib/utils/formatters';
import { buildWhatsAppUrl, createPackageEnquiryWhatsAppMessage } from '@/lib/utils/whatsapp';
import { useCartStore } from '@/stores/cartStore';
import { siteConfig } from '@/config/site';
import { Badge } from '@/components/ui/Badge';
import { IconClock, IconShoppingBag, IconWhatsApp, IconCheck } from '@/components/ui/Icons';

export function PackageCard({ pkg, priority = false }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isCustomTrip =
    pkg.isCustomTripPromotion === true ||
    pkg.is_custom_trip_promotion === true ||
    pkg.isCustomized === true ||
    pkg.is_customized === true ||
    pkg.pricingBasis === 'custom';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(pkg, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappMessage = createPackageEnquiryWhatsAppMessage({ pkg, travellerCount: 1 });
  const whatsappUrl = buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessage);

  const customTripHref = `/custom-trip?type=${pkg.category || 'custom'}&destination=${encodeURIComponent(pkg.destination || '')}`;

  return (
    <article className="group flex flex-col h-full bg-white border border-[#E1E7EB] rounded-lg overflow-hidden transition-all duration-200 hover:border-[#087E83] hover:shadow-sm">
      {/* Primary Poster Frame with Aspect Ratio preserving flyer graphics */}
      <Link
        href={isCustomTrip ? customTripHref : `/packages/${pkg.slug}`}
        className="relative aspect-[4/5] w-full bg-[#10263D] overflow-hidden block"
      >
        <Image
          src={imageError ? '/images/packages/asia-grand-tour-4-countries.jpeg' : pkg.primaryImage}
          alt={pkg.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          onError={() => setImageError(true)}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <Badge variant="dark" size="sm">
            {pkg.destination}
          </Badge>
          {pkg.badge && (
            <Badge variant="gold" size="sm">
              {pkg.badge}
            </Badge>
          )}
        </div>
      </Link>

      {/* Package Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#586775] mb-1.5 font-medium">
            <IconClock className="w-3.5 h-3.5 text-[#087E83]" />
            <span>{pkg.duration}</span>
          </div>

          <Link href={isCustomTrip ? customTripHref : `/packages/${pkg.slug}`}>
            <h3 className="font-heading text-base sm:text-lg font-bold text-[#10263D] group-hover:text-[#087E83] transition-colors leading-snug line-clamp-2">
              {pkg.title}
            </h3>
          </Link>

          <p className="mt-1 text-xs text-[#586775] line-clamp-2 leading-relaxed">
            {pkg.tagline || pkg.subtitle}
          </p>

          {/* Quick inclusions preview */}
          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {pkg.inclusions.slice(0, 3).map((inc, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-[#F3F6F8] text-[#10263D] px-2 py-0.5 rounded border border-[#E1E7EB]"
                >
                  {inc}
                </span>
              ))}
              {pkg.inclusions.length > 3 && (
                <span className="text-[10px] text-[#586775] px-1 py-0.5">
                  +{pkg.inclusions.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing and Actions */}
        <div className="pt-3 border-t border-[#E1E7EB]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#586775] block font-medium">
                {isCustomTrip
                  ? 'Vacation Planning'
                  : pkg.pricingBasis === 'per_person'
                  ? 'Starting From'
                  : 'Service Fee'}
              </span>
              <span className={`font-heading font-bold text-[#10263D] ${isCustomTrip ? 'text-xs sm:text-sm text-[#087E83]' : 'text-base sm:text-lg'}`}>
                {isCustomTrip ? 'Price: Based on Your Choice' : formatPKR(pkg.price)}
              </span>
            </div>
            <span className="text-[11px] text-[#586775]">
              {isCustomTrip
                ? 'Tailored Quote'
                : pkg.pricingBasis === 'per_person'
                ? 'Per Person'
                : 'All-Inclusive'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {isCustomTrip ? (
              <Link
                href={customTripHref}
                className="py-2 px-2.5 text-xs font-semibold rounded bg-[#087E83] hover:bg-[#06676B] text-white border border-[#087E83] transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
              >
                <span>Customize</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`py-2 px-2.5 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                  added
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-[#10263D] border-[#E1E7EB] hover:bg-[#F3F6F8] hover:border-[#087E83]'
                }`}
              >
                {added ? (
                  <>
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <IconShoppingBag className="w-3.5 h-3.5 text-[#087E83]" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2.5 text-xs font-semibold rounded bg-[#128C7E] hover:bg-[#075E54] text-white border border-[#128C7E] transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
            >
              <IconWhatsApp className="w-3.5 h-3.5" />
              <span>Inquire</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
