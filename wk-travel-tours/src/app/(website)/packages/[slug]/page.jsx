import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { initialPackages } from '@/config/initialData';
import { isVisaPackage } from '@/lib/utils/packageFilters';
import { siteConfig } from '@/config/site';
import { PackageDetailActions } from '@/components/packages/PackageDetailActions';
import { PackageCarousel } from '@/components/packages/PackageCarousel';
import { Badge } from '@/components/ui/Badge';
import {
  IconClock,
  IconPlane,
  IconShieldCheck,
} from '@/components/ui/Icons';

export async function generateStaticParams() {
  return initialPackages.map((pkg) => ({
    slug: pkg.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pkg = initialPackages.find((p) => p.slug === slug);
  if (!pkg) return { title: 'Package Not Found' };

  const isCustomTrip =
    pkg.isCustomTripPromotion === true ||
    pkg.isCustomized === true ||
    pkg.pricingBasis === 'custom';

  const rateText = isCustomTrip
    ? 'Price: Based on Your Choice'
    : `Confirmed rate PKR ${pkg.price.toLocaleString()} (${pkg.pricingBasis})`;

  return {
    title: `${pkg.title} | ${siteConfig.name}`,
    description: `${pkg.subtitle} - ${rateText}. Inclusions: ${pkg.inclusions.slice(0, 4).join(', ')}.`,
    openGraph: {
      title: `${pkg.title} | ${siteConfig.name}`,
      description: pkg.tagline,
      images: [{ url: pkg.primaryImage }],
    },
  };
}

export default async function PackageDetailPage({ params }) {
  const { slug } = await params;
  const pkg = initialPackages.find((p) => p.slug === slug);

  if (!pkg) {
    notFound();
  }

  const isCustomTrip =
    pkg.isCustomTripPromotion === true ||
    pkg.isCustomized === true ||
    pkg.pricingBasis === 'custom';

  // Related packages with strict category isolation:
  // - Visa packages only recommend other visa options
  // - Holiday tours never recommend visa services
  const isVisa = isVisaPackage(pkg);
  const relatedPackages = initialPackages
    .filter((p) => {
      if (p.slug === pkg.slug) return false;
      if (isVisa) return isVisaPackage(p);
      if (isVisaPackage(p)) return false;
      return (
        p.destination === pkg.destination ||
        (pkg.category && p.category === pkg.category) ||
        (Array.isArray(pkg.allowedCategories) && pkg.allowedCategories.some((c) => p.allowedCategories?.includes(c)))
      );
    })
    .slice(0, 4);

  const tripJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.title,
    description: pkg.subtitle,
    image: `${siteConfig.url}${pkg.primaryImage}`,
    touristType: pkg.categories || [pkg.category],
    ...(isCustomTrip
      ? {
          description: `${pkg.subtitle} - Price: Based on Your Choice. Custom tailored vacation with private transfers and personalized hotels.`,
        }
      : {
          offers: {
            '@type': 'Offer',
            price: pkg.price,
            priceCurrency: 'PKR',
            availability: 'https://schema.org/InStock',
            validFrom: '2026-01-01',
          },
        }),
    provider: {
      '@type': 'TravelAgency',
      name: siteConfig.name,
      telephone: siteConfig.contact.phone,
      url: siteConfig.url,
    },
  };

  return (
    <div className="py-10 bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[#586775]">
          <Link href="/" className="hover:text-[#087E83] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/packages" className="hover:text-[#087E83] transition-colors">
            Packages
          </Link>
          <span>/</span>
          <span className="text-[#10263D] font-semibold truncate max-w-xs sm:max-w-md">
            {pkg.title}
          </span>
        </nav>

        {/* Hero Package Grid: Flyer Poster + Primary Info + Booking Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* Left: Official Flyer Poster Frame */}
          <div className="lg:col-span-5 bg-[#10263D] rounded-xl p-3 sm:p-5 border border-[#E1E7EB] shadow-sm">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto rounded overflow-hidden">
              <Image
                src={pkg.primaryImage}
                alt={pkg.title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            <p className="text-[11px] text-center text-[#C4D1DB] mt-3 italic">
              Verified promotional flyer issued by WK Travel & Tours Karachi.
            </p>
          </div>

          {/* Right: Core Information & Interactive Booking Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="dark" size="md">
                  {pkg.destination}
                </Badge>
                {pkg.badge && (
                  <Badge variant="gold" size="md">
                    {pkg.badge}
                  </Badge>
                )}
                <span className="text-xs text-[#586775] flex items-center gap-1 ml-auto font-medium">
                  <IconClock className="w-3.5 h-3.5 text-[#087E83]" />
                  <span>{pkg.duration}</span>
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#10263D] leading-tight">
                {pkg.title}
              </h1>

              <p className="text-sm sm:text-base text-[#586775] leading-relaxed font-medium">
                {pkg.subtitle}
              </p>
            </div>

            {/* Departure information note */}
            {pkg.departureInfo && (
              <div className="p-3.5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg flex items-center gap-2.5 text-xs text-[#10263D]">
                <IconPlane className="w-4 h-4 text-[#087E83] flex-shrink-0" />
                <span>
                  <strong>Departure Protocol:</strong> {pkg.departureInfo}
                </span>
              </div>
            )}

            {/* Interactive Pricing, Traveller Count & WhatsApp Checkout Widget */}
            <PackageDetailActions pkg={pkg} />

            {/* Key Highlights */}
            {pkg.highlights && pkg.highlights.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#10263D]">
                  Featured Highlights
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm text-[#586775]">
                  {pkg.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <span className="text-[#087E83] font-bold mt-0.5">•</span>
                      <span className="leading-relaxed text-[#10263D]">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Day-by-Day Itinerary Section */}
        {pkg.itinerary && pkg.itinerary.length > 0 && (
          <section className="mb-14 border-t border-[#E1E7EB] pt-10">
            <div className="max-w-3xl mb-8">
              <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold block mb-1">
                Trip Breakdown
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D]">
                Detailed Itinerary
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#586775]">
                A structured overview of each stage of your journey, from Karachi departure to arrival and daily guided tours.
              </p>
            </div>

            <div className="space-y-4 max-w-4xl">
              {pkg.itinerary.map((item, index) => (
                <div
                  key={index}
                  className="p-5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-[#10263D] text-white px-2.5 py-1 rounded">
                      {item.day}
                    </span>
                    <h3 className="font-heading text-base font-bold text-[#10263D]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#586775] leading-relaxed pl-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Side-by-Side Inclusions & Exclusions */}
        <section className="mb-14 border-t border-[#E1E7EB] pt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inclusions */}
          <div className="p-6 bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#10263D] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Included in Package</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-[#586775]">
              {pkg.inclusions?.map((inc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold mt-0.5">+</span>
                  <span className="leading-relaxed text-[#10263D]">{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          <div className="p-6 bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#10263D] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
              <span>Not Included / Optional</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-[#586775]">
              {pkg.exclusions?.map((exc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold mt-0.5">-</span>
                  <span className="leading-relaxed text-[#10263D]">{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Important Conditions & Legal Visa Disclaimer */}
        <section className="mb-14 border-t border-[#E1E7EB] pt-10 space-y-6">
          <div className="p-6 bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#10263D]">
              <IconShieldCheck className="w-4 h-4 text-[#087E83]" />
              <span>Important Booking Conditions & Requirements</span>
            </div>
            <ul className="space-y-2 text-xs text-[#586775]">
              {pkg.conditions?.map((cond, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#087E83] font-bold">•</span>
                  <span className="text-[#10263D]">{cond}</span>
                </li>
              ))}
            </ul>

            {pkg.disclaimer && (
              <div className="pt-3 border-t border-[#E1E7EB] text-xs text-[#586775] italic">
                <strong className="text-[#10263D]">Consular & Immigration Notice:</strong> {pkg.disclaimer}
              </div>
            )}
          </div>
        </section>

        {/* Related Packages Carousel */}
        {relatedPackages.length > 0 && (
          <div className="border-t border-[#E1E7EB] pt-10">
            <PackageCarousel
              title="You May Also Consider"
              subtitle="Alternative itineraries featuring similar destinations or travel styles."
              packages={relatedPackages}
              viewAllHref="/packages"
              viewAllLabel="Browse All"
            />
          </div>
        )}
      </div>
    </div>
  );
}
