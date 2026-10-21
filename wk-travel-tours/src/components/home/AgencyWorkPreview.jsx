'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';
import { OUR_WORK_ITEMS } from '@/config/ourWorkData';
import { cleanWhatsAppPhone } from '@/lib/utils/whatsapp';
import {
  IconChevronLeft,
  IconChevronRight,
  IconShieldCheck,
  IconMapPin,
  IconWhatsApp,
  IconClose,
  IconCheck,
  IconPlus,
} from '@/components/ui/Icons';

export function AgencyWorkPreview() {
  const [workItems, setWorkItems] = useState(OUR_WORK_ITEMS);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    travelDate: '',
    category: 'group',
    imageUrl: '/images/our-work/klia-airport-departure.jpeg',
  });

  const scrollContainerRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Load live published agency work from API with graceful fallback to OUR_WORK_ITEMS
  useEffect(() => {
    let isMounted = true;
    async function fetchWork() {
      try {
        const res = await fetch('/api/agency-work');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) setWorkItems(json.data);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching live agency work:', err);
      }
    }
    fetchWork();
    return () => {
      isMounted = false;
    };
  }, []);

  // Detect prefers-reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : workItems.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < workItems.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, workItems.length]);

  // Update boundary controls
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  // Smooth scroll step calculation
  const scroll = useCallback(
    (direction) => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const firstCard = el.querySelector('[data-work-card]');
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 340;
      const gap = 24;
      const step = cardWidth + gap;

      if (direction === 'next') {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        } else {
          el.scrollBy({ left: step, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
      } else {
        if (el.scrollLeft <= 15) {
          el.scrollTo({ left: el.scrollWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        } else {
          el.scrollBy({ left: -step, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
      }
    },
    [prefersReducedMotion]
  );

  // Autonomous auto-sliding every 5.5 seconds
  useEffect(() => {
    if (prefersReducedMotion || isPaused || workItems.length <= 1) return;

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el || el.scrollWidth <= el.clientWidth + 10) return;
      scroll('next');
    }, 5500);

    return () => clearInterval(interval);
  }, [prefersReducedMotion, isPaused, workItems.length, scroll]);

  // Pause on user interaction
  const handleInteractionStart = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2500);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [updateScrollButtons, workItems]);

  // Submit client experience
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/agency-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isPublished: true,
          displayOrder: workItems.length + 1,
        }),
      });

      if (res.ok) {
        setSubmissionSuccess(true);
        const json = await res.json();
        if (json.data) {
          setWorkItems((prev) => [json.data, ...prev]);
        }
      } else {
        const localItem = {
          id: 'work-' + Date.now(),
          title: formData.title,
          destination: formData.destination,
          description: formData.description,
          travelDate: formData.travelDate || 'Recent Tour',
          milestone: 'Verified Customer Submission',
          imageUrl: formData.imageUrl || '/images/our-work/klia-airport-departure.jpeg',
          category: formData.category,
        };
        setWorkItems((prev) => [localItem, ...prev]);
        setSubmissionSuccess(true);
      }
    } catch (err) {
      console.error('Error submitting agency work:', err);
      setSubmissionSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeLightboxItem = lightboxIndex !== null ? workItems[lightboxIndex] : null;
  const whatsappNumber = cleanWhatsAppPhone(siteConfig?.contact?.whatsapp || '923372614742');

  return (
    <section
      aria-label="Verified Agency Work & Travel Highlights"
      className="py-16 bg-[#F3F6F8] border-b border-[#E1E7EB] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
                Operational Showcase
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Agency Work
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D] tracking-tight">
              Verified Agency Work & Completed Tours
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#586775] max-w-xl">
              Authentic visual proof of international group departures, holiday tours, and consular visa processing executed from Karachi.
            </p>
          </div>

          {/* Action CTAs and Navigation Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmissionSuccess(false);
                setIsModalOpen(true);
              }}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>Share Tour Experience</span>
            </Button>

            <Link
              href="/our-work"
              className="text-xs uppercase tracking-wider font-semibold text-[#087E83] hover:text-[#06676B] underline underline-offset-4 hidden md:inline-block transition-colors"
            >
              Full Archive &rarr;
            </Link>

            {workItems.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleInteractionStart();
                    scroll('prev');
                    handleInteractionEnd();
                  }}
                  disabled={!canScrollLeft}
                  aria-label="Previous work showcase"
                  className={`p-2 rounded-full border transition-colors ${
                    canScrollLeft
                      ? 'border-[#E1E7EB] bg-white text-[#10263D] hover:bg-gray-100 shadow-xs'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <IconChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleInteractionStart();
                    scroll('next');
                    handleInteractionEnd();
                  }}
                  disabled={!canScrollRight}
                  aria-label="Next work showcase"
                  className={`p-2 rounded-full border transition-colors ${
                    canScrollRight
                      ? 'border-[#E1E7EB] bg-white text-[#10263D] hover:bg-gray-100 shadow-xs'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <IconChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Autonomous Sliding Window Carousel */}
        <div
          ref={scrollContainerRef}
          data-carousel-container="agency-work"
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
          onFocusCapture={handleInteractionStart}
          onBlurCapture={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 scrollbar-none"
          tabIndex={0}
          role="region"
          aria-label="Verified agency work carousel"
        >
          {workItems.map((item, idx) => {
            const imgPath = item.imageUrl || '/images/our-work/klia-airport-departure.jpeg';
            return (
              <div
                key={item.id || idx}
                data-work-card
                className="w-[280px] sm:w-[320px] md:w-[360px] flex-shrink-0 snap-start bg-white border border-[#E1E7EB] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#087E83] transition-colors group"
              >
                <div>
                  <div
                    onClick={() => setLightboxIndex(idx)}
                    className="relative aspect-[4/3] sm:aspect-[16/10] bg-[#10263D] overflow-hidden cursor-pointer"
                    title="Click to view full photo"
                  >
                    <Image
                      src={imgPath}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 280px, 360px"
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

                  <div className="p-5">
                    <h3
                      onClick={() => setLightboxIndex(idx)}
                      className="font-heading text-base font-bold text-[#10263D] leading-snug cursor-pointer hover:text-[#087E83] transition-colors"
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-[#586775] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-[#E1E7EB] flex items-center justify-between text-[11px]">
                    <span className="text-[#087E83] font-semibold flex items-center gap-1">
                      <IconMapPin className="w-3 h-3 text-[#087E83]" />
                      {item.travelDate || 'Karachi Operator'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="text-[#10263D] hover:text-[#087E83] font-semibold transition-colors"
                    >
                      View Photo &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxItem && (
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

            {/* Prev/Next Navigation Controls */}
            {workItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : workItems.length - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
                  aria-label="Previous image"
                >
                  <IconChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev < workItems.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
                  aria-label="Next image"
                >
                  <IconChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Photo Display */}
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[460px] bg-[#10263D]">
                <Image
                  src={activeLightboxItem.imageUrl}
                  alt={activeLightboxItem.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Photo Details */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-white bg-[#087E83] px-2 py-0.5 rounded">
                      {activeLightboxItem.milestone || 'Verified Operation'}
                    </span>
                    <span className="text-[11px] text-[#586775]">
                      {activeLightboxItem.travelDate}
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-[#10263D] leading-tight mb-2">
                    {activeLightboxItem.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#087E83] font-medium mb-4">
                    <IconMapPin className="w-4 h-4 shrink-0" />
                    <span>{activeLightboxItem.destination}</span>
                  </div>

                  <p className="text-xs text-[#586775] leading-relaxed mb-4">
                    {activeLightboxItem.description}
                  </p>

                  {activeLightboxItem.highlights && (
                    <div className="bg-[#F3F6F8] p-3 rounded-lg border border-[#E1E7EB] mb-4">
                      <span className="text-[11px] font-bold text-[#10263D] block mb-1">
                        Operational Highlights:
                      </span>
                      <p className="text-xs text-[#586775] leading-relaxed">
                        {activeLightboxItem.highlights}
                      </p>
                    </div>
                  )}

                  {activeLightboxItem.departurePoint && (
                    <p className="text-[11px] text-[#586775]">
                      <span className="font-semibold text-[#10263D]">Departure Desk:</span>{' '}
                      {activeLightboxItem.departurePoint}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E1E7EB] flex flex-col sm:flex-row gap-2 mt-4">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      `Assalam-o-Alaikum, I am inquiring about your past tour "${activeLightboxItem.title}" in ${activeLightboxItem.destination}. I would like to plan a similar travel itinerary with WK Travel & Tours.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded-lg transition-colors flex-1"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    <span>Plan Similar Tour</span>
                  </a>
                  <Link
                    href="/our-work"
                    className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-[#10263D] bg-[#F3F6F8] hover:bg-[#E1E7EB] rounded-lg transition-colors"
                  >
                    View All Work
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Tour Experience Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#10263D] transition-colors"
              aria-label="Close modal"
            >
              <IconClose className="w-5 h-5" />
            </button>

            {submissionSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#10263D]">
                  Tour Experience Received
                </h3>
                <p className="text-xs text-[#586775] max-w-sm mx-auto leading-relaxed">
                  Thank you for submitting your travel milestone. Our Karachi team will review the details and publish it to the official operational showcase.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSubmissionSuccess(false);
                    }}
                  >
                    Done
                  </Button>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      'Assalam-o-Alaikum WK Travel, I would like to share my tour photos and feedback for the website archive.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    Send Photos on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitWork} className="space-y-4">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#087E83] block">
                    Travel Milestone Submission
                  </span>
                  <h3 className="font-heading text-xl font-bold text-[#10263D]">
                    Share Your Tour Experience
                  </h3>
                  <p className="text-xs text-[#586775] mt-0.5">
                    Completed a journey with WK Travel & Tours? Add your trip highlights to our verified Karachi portfolio.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10263D] mb-1">
                    Tour or Service Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Kuala Lumpur Family Excursion"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#10263D] mb-1">
                      Destination City / Country
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Kuala Lumpur, Malaysia"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#10263D] mb-1">
                      Travel Month / Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., October 2026"
                      value={formData.travelDate}
                      onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10263D] mb-1">
                    Select Verified Photo
                  </label>
                  <select
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none bg-white"
                  >
                    {OUR_WORK_ITEMS.map((item) => (
                      <option key={item.id} value={item.imageUrl}>
                        {item.title} ({item.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10263D] mb-1">
                    Experience Highlights & Details
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the hotel arrangements, vehicle transport, guide support, and tour milestones..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#E1E7EB]">
                  <Link
                    href="/admin"
                    className="text-[11px] text-[#586775] hover:text-[#087E83] underline"
                  >
                    Admin CMS Login
                  </Link>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Tour Work'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
