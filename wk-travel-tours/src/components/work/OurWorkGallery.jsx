'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconWhatsApp,
  IconMapPin,
  IconCalendar,
  IconShieldCheck,
  IconClose,
  IconChevronLeft,
  IconChevronRight,
} from '@/components/ui/Icons';
import { siteConfig } from '@/config/site';
import { OUR_WORK_ITEMS, OUR_WORK_CATEGORIES } from '@/config/ourWorkData';
import { cleanWhatsAppPhone } from '@/lib/utils/whatsapp';

export function OurWorkGallery() {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState(OUR_WORK_ITEMS);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Load live operations from API with graceful fallback to OUR_WORK_ITEMS
  useEffect(() => {
    let isMounted = true;
    async function fetchOperations() {
      try {
        const res = await fetch('/api/agency-work');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) setItems(json.data);
          }
        }
      } catch (err) {
        console.error('Error fetching agency work portfolio:', err);
      }
    }
    fetchOperations();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = items.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filtered.length]);

  const activeItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;
  const whatsappNumber = cleanWhatsAppPhone(siteConfig?.contact?.whatsapp || '923372614742');

  return (
    <div className="space-y-8 bg-white">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E1E7EB] pb-4">
        {OUR_WORK_CATEGORIES.map((cat) => {
          const count =
            cat.id === 'all'
              ? items.length
              : items.filter((i) => i.category === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveTab(cat.id);
                setLightboxIndex(null);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors inline-flex items-center gap-1.5 ${
                activeTab === cat.id
                  ? 'bg-[#10263D] text-white shadow-xs'
                  : 'bg-[#F3F6F8] text-[#586775] hover:bg-[#E1E7EB]'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === cat.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E1E7EB] text-[#10263D]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Verified Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, index) => {
          const imgPath = item.imageUrl || '/images/our-work/klia-airport-departure.jpeg';

          return (
            <div
              key={item.id || index}
              data-work-item-id={item.id}
              className="bg-white border border-[#E1E7EB] rounded-2xl overflow-hidden shadow-xs hover:border-[#087E83] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Container with Badge Overlays */}
                <div
                  onClick={() => setLightboxIndex(index)}
                  className="relative aspect-[4/3] bg-[#10263D] overflow-hidden cursor-pointer"
                  title="Click to view full high-resolution photo"
                >
                  <Image
                    src={imgPath}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 max-w-[85%]">
                    <Badge variant="dark" size="sm" className="truncate">
                      {item.destination}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-700/90 backdrop-blur-xs px-2 py-0.5 rounded">
                      <IconShieldCheck className="w-3 h-3 text-emerald-300" />
                      {item.milestone || 'Verified Operator'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-[#087E83] font-medium mb-1.5">
                    <IconCalendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.travelDate || 'Recent Operation'}</span>
                  </div>

                  <h3
                    onClick={() => setLightboxIndex(index)}
                    className="font-heading text-lg font-bold text-[#10263D] leading-snug cursor-pointer hover:text-[#087E83] transition-colors"
                  >
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs text-[#586775] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {item.highlights && (
                    <div className="mt-3 bg-[#F3F6F8] p-2.5 rounded-lg border border-[#E1E7EB]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#10263D] block mb-0.5">
                        Operational Highlights
                      </span>
                      <p className="text-[11px] text-[#586775] leading-relaxed line-clamp-2">
                        {item.highlights}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-[#E1E7EB] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="text-xs font-semibold text-[#10263D] hover:text-[#087E83] transition-colors"
                  >
                    View Photo &rarr;
                  </button>

                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      `Assalam-o-Alaikum WK Travel, I saw your verified tour "${item.title}" in ${item.destination}. I would like to inquire about planning a similar itinerary.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors"
                  >
                    <IconWhatsApp className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-[#F3F6F8] rounded-2xl border border-[#E1E7EB]">
          <p className="text-sm font-semibold text-[#10263D]">
            No verified operations in this category yet.
          </p>
          <p className="text-xs text-[#586775] mt-1">
            Browse other categories to explore completed international departures.
          </p>
        </div>
      )}

      {/* Full-Screen Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
              aria-label="Close photo preview"
            >
              <IconClose className="w-5 h-5" />
            </button>

            {/* Prev/Next Controls */}
            {filtered.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
                  aria-label="Previous photo"
                >
                  <IconChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
                  aria-label="Next photo"
                >
                  <IconChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Photo Display */}
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[480px] bg-[#10263D]">
                <Image
                  src={activeItem.imageUrl}
                  alt={activeItem.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Details Column */}
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-white bg-[#087E83] px-2.5 py-0.5 rounded">
                      {activeItem.milestone || 'Verified Operation'}
                    </span>
                    <span className="text-xs text-[#586775]">
                      {activeItem.travelDate}
                    </span>
                  </div>

                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#10263D] leading-tight mb-2">
                    {activeItem.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#087E83] font-medium mb-4">
                    <IconMapPin className="w-4 h-4 shrink-0" />
                    <span>{activeItem.destination}</span>
                  </div>

                  <p className="text-xs text-[#586775] leading-relaxed mb-4">
                    {activeItem.description}
                  </p>

                  {activeItem.highlights && (
                    <div className="bg-[#F3F6F8] p-3 rounded-lg border border-[#E1E7EB] mb-4">
                      <span className="text-[11px] font-bold text-[#10263D] block mb-1">
                        Operational Highlights:
                      </span>
                      <p className="text-xs text-[#586775] leading-relaxed">
                        {activeItem.highlights}
                      </p>
                    </div>
                  )}

                  {activeItem.departurePoint && (
                    <p className="text-[11px] text-[#586775] mb-2">
                      <span className="font-semibold text-[#10263D]">Departure Desk:</span>{' '}
                      {activeItem.departurePoint}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E1E7EB] flex flex-col sm:flex-row gap-2 mt-4">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      `Assalam-o-Alaikum, I am inquiring about your verified tour "${activeItem.title}" in ${activeItem.destination}. Please share package options and customized itinerary details.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded-lg transition-colors flex-1"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    <span>Plan Similar Tour</span>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLightboxIndex(null)}
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
