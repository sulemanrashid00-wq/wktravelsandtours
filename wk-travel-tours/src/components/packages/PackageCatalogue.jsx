'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initialPackages, initialCategories } from '@/config/initialData';
import { getPackagesByCategory } from '@/lib/utils/packageFilters';
import { PackageCard } from './PackageCard';
import { formatPKR } from '@/lib/utils/formatters';
import { buildWhatsAppUrl, createPackageEnquiryWhatsAppMessage } from '@/lib/utils/whatsapp';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/stores/cartStore';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconSearch,
  IconFilter,
  IconClose,
  IconClock,
  IconShoppingBag,
  IconWhatsApp,
  IconCheck,
} from '@/components/ui/Icons';

export function PackageCatalogue() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Sync with searchParams on navigation
  useEffect(() => {
    const q = searchParams.get('search');
    const cat = searchParams.get('category');
    if (q !== null) setSearch(q);
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  // Filter and sort logic using centralized classification
  const filteredPackages = useMemo(() => {
    // 1. Category isolation step
    const categorySubset = getPackagesByCategory(initialPackages, selectedCategory);

    // 2. Search, budget, duration filters
    return categorySubset
      .filter((pkg) => {
        // Search filter
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchTitle = pkg.title.toLowerCase().includes(query);
          const matchDest = pkg.destination.toLowerCase().includes(query);
          const matchCities = pkg.cities?.some((c) => c.toLowerCase().includes(query));
          const matchTag = pkg.tagline?.toLowerCase().includes(query);
          if (!matchTitle && !matchDest && !matchCities && !matchTag) return false;
        }

        // Budget filter
        if (budgetFilter === 'under250') {
          if (pkg.price > 250000) return false;
        } else if (budgetFilter === '250to350') {
          if (pkg.price < 250000 || pkg.price > 350000) return false;
        } else if (budgetFilter === 'above350') {
          if (pkg.price < 350000) return false;
        }

        // Duration filter
        if (durationFilter === 'short') {
          if ((pkg.durationDays || 0) > 6) return false;
        } else if (durationFilter === 'medium') {
          if ((pkg.durationDays || 0) < 7 || (pkg.durationDays || 0) > 10) return false;
        } else if (durationFilter === 'long') {
          if ((pkg.durationDays || 0) < 11) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'duration') return (a.durationDays || 0) - (b.durationDays || 0);
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        // Default featured
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [search, selectedCategory, budgetFilter, durationFilter, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setBudgetFilter('all');
    setDurationFilter('all');
    setSortBy('featured');
    router.push('/packages');
  };

  const isFiltered =
    search.trim() !== '' ||
    selectedCategory !== 'all' ||
    budgetFilter !== 'all' ||
    durationFilter !== 'all' ||
    sortBy !== 'featured';

  return (
    <div className="w-full space-y-8">
      {/* Search and Category Quick Bar */}
      <div className="border border-[#E1E7EB] bg-[#F3F6F8] p-4 sm:p-6 rounded-xl space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#586775]">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by destination, country, or package name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded text-[#10263D] placeholder:text-[#586775]/70 focus:outline-none focus:border-[#087E83] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#586775] hover:text-[#10263D]"
              >
                <IconClose className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort packages"
              className="px-3 py-2.5 text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded text-[#10263D] focus:outline-none focus:border-[#087E83] transition-colors"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="duration">Duration: Shortest</option>
              <option value="name">Destination Name (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex border border-[#E1E7EB] rounded overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid layout"
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#087E83] text-white'
                    : 'bg-white text-[#10263D] hover:bg-[#F3F6F8]'
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List layout"
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#087E83] text-white'
                    : 'bg-white text-[#10263D] hover:bg-[#F3F6F8]'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {initialCategories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 text-xs rounded transition-all font-semibold shadow-sm ${
                  isSelected
                    ? 'bg-[#087E83] text-white border border-[#087E83]'
                    : 'bg-white text-[#10263D] border border-[#E1E7EB] hover:bg-[#F3F6F8]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Budget & Duration */}
        <div className="pt-4 border-t border-[#E1E7EB] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#10263D]">Budget:</span>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E1E7EB] rounded text-[#10263D] focus:outline-none focus:border-[#087E83]"
              >
                <option value="all">All Budgets</option>
                <option value="under250">Under PKR 250,000</option>
                <option value="250to350">PKR 250,000 - 350,000</option>
                <option value="above350">Above PKR 350,000</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#10263D]">Duration:</span>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#E1E7EB] rounded text-[#10263D] focus:outline-none focus:border-[#087E83]"
              >
                <option value="all">All Durations</option>
                <option value="short">1 - 6 Days</option>
                <option value="medium">7 - 10 Days</option>
                <option value="long">11+ Days</option>
              </select>
            </div>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#087E83] hover:underline inline-flex items-center gap-1"
            >
              <IconClose className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#586775] px-1">
        <span>
          Showing <strong className="text-[#10263D] font-bold">{filteredPackages.length}</strong> travel package{filteredPackages.length === 1 ? '' : 's'}
        </span>
        {search && <span>Filtering for &ldquo;{search}&rdquo;</span>}
      </div>

      {/* Empty State */}
      {filteredPackages.length === 0 ? (
        <div className="p-12 border border-dashed border-[#E1E7EB] bg-[#F3F6F8] rounded-xl text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#E1E7EB] flex items-center justify-center text-[#586775]">
            <IconFilter className="w-6 h-6 text-[#087E83]" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-[#10263D]">
              No matching itineraries found
            </h3>
            <p className="mt-1 text-xs text-[#586775] leading-relaxed">
              We couldn&apos;t find any package matching your current combination of destination, category, and budget.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors shadow-sm"
            >
              Reset Filters
            </button>
            <Link
              href="/custom-trip"
              className="px-4 py-2 text-xs font-semibold text-[#10263D] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded transition-colors"
            >
              Request Custom Itinerary
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        /* List Layout */
        <div className="space-y-4">
          {filteredPackages.map((pkg) => (
            <PackageListItem key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}

// Subcomponent for responsive List View
function PackageListItem({ pkg }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const isCustomTrip =
    pkg.isCustomTripPromotion === true ||
    pkg.is_custom_trip_promotion === true ||
    pkg.isCustomized === true ||
    pkg.is_customized === true ||
    pkg.pricingBasis === 'custom';

  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem(pkg, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappMessage = createPackageEnquiryWhatsAppMessage({ pkg, travellerCount: 1 });
  const whatsappUrl = buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessage);
  const customTripHref = `/custom-trip?type=${pkg.category || 'custom'}&destination=${encodeURIComponent(pkg.destination || '')}`;

  return (
    <article className="border border-[#E1E7EB] bg-white rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between hover:border-[#087E83] transition-all shadow-sm">
      <div className="flex gap-4 items-start sm:items-center">
        <div className="relative w-20 h-24 sm:w-28 sm:h-32 bg-[#10263D] rounded overflow-hidden flex-shrink-0">
          <Image
            src={pkg.primaryImage}
            alt={pkg.title}
            fill
            className="object-contain"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#10263D] text-white px-2 py-0.5 rounded">
              {pkg.destination}
            </span>
            <span className="text-xs text-[#586775] flex items-center gap-1">
              <IconClock className="w-3.5 h-3.5 text-[#087E83]" />
              <span>{pkg.duration}</span>
            </span>
          </div>

          <Link href={isCustomTrip ? customTripHref : `/packages/${pkg.slug}`}>
            <h3 className="font-heading text-base sm:text-lg font-bold text-[#10263D] hover:text-[#087E83] transition-colors">
              {pkg.title}
            </h3>
          </Link>
          <p className="text-xs text-[#586775] line-clamp-1 max-w-lg">
            {pkg.tagline}
          </p>

          <div className="flex flex-wrap gap-1 pt-1">
            {pkg.inclusions?.slice(0, 3).map((inc, i) => (
              <span
                key={i}
                className="text-[10px] bg-[#F3F6F8] text-[#10263D] px-2 py-0.5 rounded border border-[#E1E7EB]"
              >
                {inc}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full sm:w-auto sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E1E7EB] flex sm:flex-col justify-between items-center sm:items-end gap-3 flex-shrink-0">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#586775] block">
            {isCustomTrip
              ? 'Vacation Planning'
              : pkg.pricingBasis === 'per_person'
              ? 'Per Person'
              : 'Service Fee'}
          </span>
          <span className={`font-heading font-bold text-[#10263D] ${isCustomTrip ? 'text-sm text-[#087E83]' : 'text-lg'}`}>
            {isCustomTrip ? 'Price: Based on Your Choice' : formatPKR(pkg.price)}
          </span>
        </div>

        <div className="flex gap-2">
          {isCustomTrip ? (
            <Link
              href={customTripHref}
              className="py-1.5 px-3 text-xs font-semibold rounded bg-[#087E83] hover:bg-[#06676B] text-white flex items-center gap-1 shadow-sm"
            >
              <span>Customize</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className={`py-1.5 px-3 text-xs font-semibold rounded border transition-colors flex items-center gap-1 ${
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
                  <span>Cart</span>
                </>
              )}
            </button>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 text-xs font-semibold rounded bg-[#128C7E] hover:bg-[#075E54] text-white flex items-center gap-1 shadow-sm"
          >
            <IconWhatsApp className="w-3.5 h-3.5" />
            <span>Inquire</span>
          </a>
        </div>
      </div>
    </article>
  );
}
