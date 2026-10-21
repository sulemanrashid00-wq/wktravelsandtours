'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PackageCard } from './PackageCard';
import { IconChevronLeft, IconChevronRight } from '@/components/ui/Icons';

export function PackageCarousel({
  title,
  subtitle,
  categorySlug,
  packages = [],
  viewAllHref,
  viewAllLabel = 'View All',
  bgSurface = false,
  autoPlayInterval = 5000,
  enableAutoPlay = true,
}) {
  const scrollContainerRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Detect user system reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const checkScrollBounds = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);

    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [checkScrollBounds, packages]);

  // Autonomous auto-advance with interaction pausing and looping
  useEffect(() => {
    if (!enableAutoPlay || isReducedMotion || isPaused || packages.length <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      // Do not animate if all cards fit comfortably within view
      if (el.scrollWidth <= el.clientWidth + 10) return;

      const firstCard = el.firstElementChild;
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 320;
      const computedStyle = window.getComputedStyle(el);
      const gap = parseFloat(computedStyle.gap) || 20;
      const scrollStep = cardWidth + gap;

      // Loop back smoothly if reached the end; otherwise advance by 1 card step
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: scrollStep, behavior: 'smooth' });
      }
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [enableAutoPlay, isReducedMotion, isPaused, autoPlayInterval, packages.length]);

  if (!packages || packages.length === 0) {
    return null;
  }

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Temporarily pause autoplay so manual user action is not interrupted
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);

    const firstCard = container.firstElementChild;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 320;
    const computedStyle = window.getComputedStyle(container);
    const gap = parseFloat(computedStyle.gap) || 20;
    const scrollStep = cardWidth + gap;

    container.scrollBy({
      left: direction === 'left' ? -scrollStep : scrollStep,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleScroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleScroll('right');
    }
  };

  const finalViewAllHref = viewAllHref || (categorySlug ? `/packages?category=${categorySlug}` : '/packages');

  return (
    <section
      className={`py-12 border-b border-[#E1E7EB] ${bgSurface ? 'bg-[#F3F6F8]' : 'bg-white'}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => {
        setTimeout(() => setIsPaused(false), 2500);
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Carousel Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-[#586775] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href={finalViewAllHref}
              className="text-xs uppercase tracking-wider font-semibold text-[#087E83] hover:text-[#06676B] underline underline-offset-4 mr-2 transition-colors"
            >
              {viewAllLabel} ({packages.length})
            </Link>

            {/* Slider Navigation Controls */}
            <div className="flex items-center gap-1.5" aria-label={`${title} navigation controls`}>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label={`Scroll ${title} carousel left`}
                className={`w-9 h-9 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83] ${
                  canScrollLeft
                    ? 'border-[#E1E7EB] bg-white hover:bg-[#F3F6F8] text-[#10263D] cursor-pointer shadow-sm'
                    : 'border-[#E1E7EB] bg-[#F3F6F8] text-[#586775]/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <IconChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label={`Scroll ${title} carousel right`}
                className={`w-9 h-9 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83] ${
                  canScrollRight
                    ? 'border-[#E1E7EB] bg-white hover:bg-[#F3F6F8] text-[#10263D] cursor-pointer shadow-sm'
                    : 'border-[#E1E7EB] bg-[#F3F6F8] text-[#586775]/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Track with smooth touch snap scrolling */}
        <div
          ref={scrollContainerRef}
          data-carousel-container={categorySlug || 'packages'}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`${title} packages list. Use left and right arrow keys to navigate.`}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83]/40 rounded"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {packages.map((pkg, idx) => (
            <div
              key={`${categorySlug || 'pkg'}-${pkg.id}`}
              className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px]"
            >
              <PackageCard pkg={pkg} priority={idx < 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
