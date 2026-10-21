'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { initialBanners } from '@/config/initialData';
import { Badge } from '@/components/ui/Badge';
import { IconChevronLeft, IconChevronRight } from '@/components/ui/Icons';

export function PromotionalBannerSlider({ autoPlayInterval = 5500, enableAutoPlay = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const timerRef = useRef(null);

  // Detect user system reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const prevSlide = () => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 4000);
    setCurrentIndex((prev) => (prev === 0 ? initialBanners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 4000);
    setCurrentIndex((prev) => (prev === initialBanners.length - 1 ? 0 : prev + 1));
  };

  // Autonomous auto-advance with pause on interaction
  useEffect(() => {
    if (!enableAutoPlay || isReducedMotion || isPaused || initialBanners.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === initialBanners.length - 1 ? 0 : prev + 1));
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enableAutoPlay, isReducedMotion, isPaused, autoPlayInterval]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  const currentBanner = initialBanners[currentIndex];

  return (
    <section
      aria-label="Promotional Custom Trip Campaigns"
      data-banner-slider="banners"
      className="py-12 bg-white border-b border-[#E1E7EB]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold block mb-1">
              Custom Travel Planning
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D] tracking-tight">
              Specialized Custom Packages
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#586775]">
              Select any campaign below to design a personalized itinerary for your family, group, or honeymoon. Pricing is based on your choice.
            </p>
          </div>

          {/* Slider Pagination Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[#586775] font-medium mr-2">
              {currentIndex + 1} of {initialBanners.length}
            </span>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous promotional campaign"
              className="w-9 h-9 rounded border border-[#E1E7EB] bg-white hover:bg-[#F3F6F8] text-[#10263D] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83] shadow-sm"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next promotional campaign"
              className="w-9 h-9 rounded border border-[#E1E7EB] bg-white hover:bg-[#F3F6F8] text-[#10263D] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83] shadow-sm"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Banner Showcase Card */}
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`${currentBanner.title} campaign slide. Use left and right arrow keys to navigate.`}
          className="border border-[#E1E7EB] bg-[#F3F6F8] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83]/40 transition-all duration-300"
        >
          {/* Banner Graphic Frame with strict aspect preservation */}
          <div className="lg:col-span-5 bg-[#10263D] p-4 sm:p-6 flex items-center justify-center">
            <div className="relative aspect-[3/4] w-full max-w-sm rounded-lg overflow-hidden border border-[#E1E7EB]/20 shadow-md">
              <Image
                src={currentBanner.image}
                alt={currentBanner.title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>

          {/* Banner Content & Trip Pre-fill CTA */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="md">
                {currentBanner.badge}
              </Badge>
              <span className="text-xs text-[#087E83] font-semibold bg-white px-2.5 py-0.5 rounded border border-[#E1E7EB]">
                Price: Based on Your Choice
              </span>
            </div>

            <div>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D] leading-tight">
                {currentBanner.title}
              </h3>
              <p className="mt-3 text-sm text-[#586775] leading-relaxed max-w-xl">
                {currentBanner.subtitle}
              </p>
            </div>

            {currentBanner.popularDestinations && (
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#087E83] font-semibold block mb-2">
                  Popular Destinations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentBanner.popularDestinations.map((dest, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white border border-[#E1E7EB] text-[#10263D] px-3 py-1 rounded shadow-sm"
                    >
                      {dest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <Link
                href={currentBanner.targetUrl}
                className="inline-flex items-center justify-center px-6 py-3 text-xs uppercase tracking-wider font-semibold text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors shadow-sm"
              >
                Plan {currentBanner.badge} Itinerary
              </Link>
              <Link
                href="/packages"
                className="inline-flex items-center justify-center px-6 py-3 text-xs uppercase tracking-wider font-semibold text-[#10263D] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded transition-colors"
              >
                Browse All Packages
              </Link>
            </div>
          </div>
        </div>

        {/* Thumbnail Selector Tabs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {initialBanners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => {
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 4000);
                setCurrentIndex(index);
              }}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                index === currentIndex
                  ? 'border-[#087E83] bg-white text-[#087E83] ring-1 ring-[#087E83] shadow-sm'
                  : 'border-[#E1E7EB] bg-[#F3F6F8] text-[#586775] hover:bg-white hover:text-[#10263D]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block font-semibold mb-0.5">
                {banner.badge}
              </span>
              <span className="text-xs font-heading font-semibold line-clamp-1 text-[#10263D]">
                {banner.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
