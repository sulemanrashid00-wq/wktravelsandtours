import React from 'react';
import Link from 'next/link';
import { initialPackages } from '@/config/initialData';
import {
  getFeaturedTours,
  getSoloPackages,
  getFriendsPackages,
  getFamilyPackages,
  getHoneymoonPackages,
  getVisaPackages,
} from '@/lib/utils/packageFilters';
import { siteConfig } from '@/config/site';
import { HeroSection } from '@/components/home/HeroSection';
import { PromotionalBannerSlider } from '@/components/home/PromotionalBannerSlider';
import { PackageCarousel } from '@/components/packages/PackageCarousel';
import { AgencyCredibilitySection } from '@/components/home/AgencyCredibilitySection';
import { AgencyWorkPreview } from '@/components/home/AgencyWorkPreview';
import { TruthfulReviewsSection } from '@/components/home/TruthfulReviewsSection';
import { IconPhone, IconWhatsApp, IconMapPin } from '@/components/ui/Icons';

export const metadata = {
  title: 'WK Travel & Tours | Journeys Beyond Boundaries',
  description:
    'Premier Karachi travel agency offering curated international packages, customized group & family vacations, and transparent visit visa processing.',
};

export default function HomePage() {
  // Filter packages using centralized classification engine with strict category isolation
  const featuredPackages = getFeaturedTours(initialPackages);
  const soloPackages = getSoloPackages(initialPackages);
  const friendsPackages = getFriendsPackages(initialPackages);
  const familyPackages = getFamilyPackages(initialPackages);
  const honeymoonPackages = getHoneymoonPackages(initialPackages);
  const visaPackages = getVisaPackages(initialPackages);

  return (
    <div className="flex flex-col w-full bg-white">
      {/* 1. Brand-led Hero Section with Destination Search */}
      <HeroSection />

      {/* 2. Custom-Trip Promotional Banner Slider */}
      <PromotionalBannerSlider />

      {/* 3. Featured International Tours (holiday tours only, no visa services) */}
      <PackageCarousel
        title="Featured International Tours"
        subtitle="Hand-picked international itineraries with verified return flights, star accommodations, and full guided sightseeing."
        categorySlug="featured"
        packages={featuredPackages}
      />

      {/* 4. Dedicated Solo Travel Section */}
      <PackageCarousel
        title="Solo Travelers & Explorers"
        subtitle="Carefully designed solo adventures offering cultural immersion, secure logistics, and flexible schedules."
        categorySlug="solo"
        packages={soloPackages}
        bgSurface={true}
      />

      {/* 5. Dedicated Friends and Group Tours Section */}
      <PackageCarousel
        title="Friends & Group Journeys"
        subtitle="Vibrant travel packages with special group rate discounts for minimum 4 travelers."
        categorySlug="friends"
        packages={friendsPackages}
      />

      {/* 6. Dedicated Family Vacations Section (Strictly distinct from Honeymoon) */}
      <PackageCarousel
        title="Family Vacations"
        subtitle="Spacious family itineraries featuring private vehicle transfers, child-friendly excursions, and premium stays."
        categorySlug="family"
        packages={familyPackages}
        bgSurface={true}
      />

      {/* 7. Dedicated Honeymoon & Romantic Escapes Section (Strictly distinct from Family) */}
      <PackageCarousel
        title="Honeymoon & Romantic Escapes"
        subtitle="Exclusive couple getaways featuring candlelight dinners, scenic beachfront villas, and intimate sightseeing."
        categorySlug="honeymoon"
        packages={honeymoonPackages}
      />

      {/* 8. Dedicated Tourist Visa Solutions Section (Visa-only services) */}
      <PackageCarousel
        title="Tourist Visa Solutions"
        subtitle="Consular filing, official document review, and multi-country visit visa preparation with transparent processing fees."
        categorySlug="visa"
        packages={visaPackages}
        bgSurface={true}
      />

      {/* 9. Actual Agency Work and Completed Tours Archive */}
      <AgencyWorkPreview />

      {/* 10. Agency Credibility & Operating Standards */}
      <AgencyCredibilitySection />

      {/* 11. Truthful Customer Reviews & Rating Invitation */}
      <TruthfulReviewsSection />

      {/* 12. Karachi Direct Consultation Callout */}
      <section className="py-14 bg-[#10263D] text-white border-b border-[#0C1C2E]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold block">
            Plan Directly with Local Experts
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
            Ready to Plan Your Next Journey?
          </h2>
          <p className="text-xs sm:text-sm text-[#C4D1DB] max-w-xl mx-auto leading-relaxed">
            Our Karachi travel desk is open for phone consultations and in-person appointments. Get clear quotes and confirmed itineraries today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent('Hello WK Travel, I would like to book a consultation for an international trip.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors shadow-sm"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span>Connect on WhatsApp</span>
            </a>
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white border border-[#586775] hover:bg-[#172E44] rounded transition-colors"
            >
              <IconPhone className="w-4 h-4 text-[#087E83]" />
              <span>Call Desk: {siteConfig.contact.phone}</span>
            </a>
            <Link
              href="/custom-trip"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#10263D] bg-white hover:bg-[#F3F6F8] rounded transition-colors"
            >
              Custom Request Form
            </Link>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-[#9DB3C4]">
            <IconMapPin className="w-3.5 h-3.5 text-[#087E83]" />
            <span>Visit us: {siteConfig.contact.address}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
