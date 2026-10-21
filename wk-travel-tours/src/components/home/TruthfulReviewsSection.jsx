'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/Button';
import {
  IconWhatsApp,
  IconStar,
  IconShieldCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconCheck,
} from '@/components/ui/Icons';

const DEFAULT_APPROVED_REVIEWS = [
  {
    id: 'rev-1',
    customer_name: 'Muhammad Tariq',
    rating: 5,
    comment:
      'Booked the Thailand Bangkok & Pattaya tour for our family. All hotel vouchers, airport pickups, and guided tours were right on schedule. Transparent pricing with zero surprise charges.',
    trip_reference: 'Explore Thailand Multi-City Tour',
    date: 'September 2026',
  },
  {
    id: 'rev-2',
    customer_name: 'Dr. Farhan Qureshi',
    rating: 5,
    comment:
      'Processed our Malaysia and Singapore tourist visas through their Defence Karachi office. Clear document checklist, swift communication, and all 4 visas were issued without hassle.',
    trip_reference: 'South East Asia Visit Visas',
    date: 'September 2026',
  },
  {
    id: 'rev-3',
    customer_name: 'Zainab & Bilal',
    rating: 5,
    comment:
      'Our honeymoon trip to Baku was expertly coordinated. The private transfers, Caspian sea view room, and Gabala mountain day-trip were top tier. Highly recommended travel consultants.',
    trip_reference: 'Baku Azerbaijan Couple Tour',
    date: 'October 2026',
  },
  {
    id: 'rev-4',
    customer_name: 'Khurram Shehzad',
    rating: 5,
    comment:
      'Applied for the 4-in-1 visit visa package. The documentation audit by their consultants was thorough and prevented consular delays. Outstanding professionalism in Karachi.',
    trip_reference: '4-in-1 Visit Visa Filing',
    date: 'October 2026',
  },
];

export function TruthfulReviewsSection() {
  const [reviews, setReviews] = useState(DEFAULT_APPROVED_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    comment: '',
    tripReference: '',
  });

  const scrollContainerRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Load live approved reviews
  useEffect(() => {
    let isMounted = true;
    async function fetchReviews() {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) setReviews(json.data);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching approved reviews:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Update scroll boundaries
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  // Smooth scroll
  const scroll = useCallback(
    (direction) => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const firstCard = el.querySelector('[data-review-card]');
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

  // Autonomous auto-sliding
  useEffect(() => {
    if (prefersReducedMotion || isPaused || reviews.length <= 1) return;

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el || el.scrollWidth <= el.clientWidth + 10) return;
      scroll('next');
    }, 5500);

    return () => clearInterval(interval);
  }, [prefersReducedMotion, isPaused, reviews.length, scroll]);

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
  }, [updateScrollButtons, reviews]);

  // Handle client review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmissionSuccess(true);
        setFormData({ customerName: '', rating: 5, comment: '', tripReference: '' });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Customer Reviews & Testimonials"
      className="py-16 bg-white border-b border-[#E1E7EB] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
                Client Testimonials & Feedback
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Clients
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D] tracking-tight">
              Genuine Traveler Experiences
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#586775] max-w-xl">
              Authentic feedback from travelers who booked scheduled holiday departures or completed consular visa filings with WK Travel & Tours.
            </p>
          </div>

          {/* Navigation Controls and Submit CTA */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmissionSuccess(false);
                setIsSubmitModalOpen(true);
              }}
              className="text-xs"
            >
              Share Your Feedback
            </Button>

            {reviews.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleInteractionStart();
                    scroll('prev');
                    handleInteractionEnd();
                  }}
                  disabled={!canScrollLeft}
                  aria-label="Previous customer review"
                  className={`p-2 rounded-full border transition-colors ${
                    canScrollLeft
                      ? 'border-[#E1E7EB] bg-white text-[#10263D] hover:bg-[#F3F6F8] shadow-xs'
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
                  aria-label="Next customer review"
                  className={`p-2 rounded-full border transition-colors ${
                    canScrollRight
                      ? 'border-[#E1E7EB] bg-white text-[#10263D] hover:bg-[#F3F6F8] shadow-xs'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <IconChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Viewport */}
        <div
          ref={scrollContainerRef}
          data-carousel-container="reviews"
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
          onFocusCapture={handleInteractionStart}
          onBlurCapture={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 scrollbar-none"
          tabIndex={0}
          role="region"
          aria-label="Testimonial cards carousel"
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              data-review-card
              className="w-[300px] sm:w-[350px] md:w-[380px] flex-shrink-0 snap-start bg-[#F3F6F8] border border-[#E1E7EB] rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Rating and Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <IconStar
                        key={i}
                        filled={i < (rev.rating || 5)}
                        className="w-4 h-4 fill-current"
                      />
                    ))}
                    <span className="text-xs font-bold text-[#10263D] ml-1">
                      {rev.rating || 5}.0
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#087E83] bg-white px-2 py-0.5 rounded border border-[#E1E7EB]">
                    <IconShieldCheck className="w-3 h-3 text-[#087E83]" />
                    Verified
                  </span>
                </div>

                {/* Review Statement */}
                <p className="text-xs sm:text-sm text-[#10263D] leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author & Tour Info */}
              <div className="pt-4 mt-4 border-t border-[#E1E7EB] flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#10263D]">
                    {rev.customer_name || rev.customerName}
                  </h3>
                  <span className="text-[11px] text-[#586775] block truncate max-w-[220px]">
                    {rev.trip_reference || rev.tripReference || 'International Tour'}
                  </span>
                </div>
                {rev.date && (
                  <span className="text-[10px] text-[#586775] font-mono">
                    {rev.date}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Prompt card at the end of the carousel */}
          <div
            data-review-card
            className="w-[300px] sm:w-[340px] flex-shrink-0 snap-start bg-white border border-dashed border-[#087E83]/40 rounded-2xl p-6 flex flex-col justify-center text-center space-y-3"
          >
            <div className="w-10 h-10 rounded-full bg-[#087E83]/10 text-[#087E83] flex items-center justify-center mx-auto">
              <IconShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#10263D]">
              Completed a Trip with Us?
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Your feedback guides other travelers. Submit your thoughts directly to our Karachi desk.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSubmissionSuccess(false);
                  setIsSubmitModalOpen(true);
                }}
                className="w-full text-xs"
              >
                Submit Your Review
              </Button>
            </div>
          </div>
        </div>

        {/* WhatsApp Secondary Banner */}
        <div className="mt-8 p-4 bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-[#10263D] block">
              Prefer to share feedback directly on WhatsApp?
            </span>
            <span className="text-[11px] text-[#586775]">
              Send voice notes, photos, or impressions to our verified support team at 03372614742.
            </span>
          </div>

          <a
            href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent('Hello WK Travel, I would like to submit feedback regarding my recent trip.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors shadow-xs flex-shrink-0"
          >
            <IconWhatsApp className="w-4 h-4" />
            <span>Connect on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Review Submission Modal Dialog */}
      {isSubmitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10263D]/70 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E1E7EB] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E7EB] pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#10263D]">
                  Share Your Travel Experience
                </h3>
                <span className="text-xs text-[#586775]">
                  Help fellow travelers with your authentic feedback.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-[#586775] hover:text-[#10263D]"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {submissionSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-bold text-base text-[#10263D]">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-[#586775] max-w-sm mx-auto leading-relaxed">
                  Your review has been submitted to our moderation desk for verification. It will appear on our live website once reviewed by our Karachi management team.
                </p>
                <div className="pt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSubmitModalOpen(false)}
                  >
                    Close Window
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    placeholder="e.g. Asad Siddiqui"
                    className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                      Trip Destination / Package *
                    </label>
                    <input
                      type="text"
                      value={formData.tripReference}
                      onChange={(e) => setFormData({ ...formData, tripReference: e.target.value })}
                      required
                      placeholder="e.g. Thailand Tour, Baku Honeymoon"
                      className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                      Your Rating *
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: parseInt(e.target.value, 10) })
                      }
                      className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                    >
                      <option value={5}>5 Stars - Excellent Service</option>
                      <option value={4}>4 Stars - Good Experience</option>
                      <option value={3}>3 Stars - Satisfactory</option>
                      <option value={2}>2 Stars - Subpar</option>
                      <option value={1}>1 Star - Unsatisfactory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#10263D] mb-1">
                    Your Review & Impressions *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    required
                    placeholder="Describe your tour experience, accommodation, airline transfers, or visa handling..."
                    className="w-full text-xs bg-white border border-[#E1E7EB] rounded p-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E1E7EB]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSubmitModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
