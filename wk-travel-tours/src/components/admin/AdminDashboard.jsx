'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminPackagesManager } from './AdminPackagesManager';
import { AdminCategoriesManager } from './AdminCategoriesManager';
import { AdminBannersManager } from './AdminBannersManager';
import { AdminReviewsModerator } from './AdminReviewsModerator';
import { AdminAgencyWorkManager } from './AdminAgencyWorkManager';
import { signOutUser } from '@/services/authService';
import { IconShieldCheck } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('packages');

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // Ignored
    }
    router.push('/login');
    router.refresh();
  };

  const tabs = [
    { id: 'packages', label: 'Package Catalogue' },
    { id: 'categories', label: 'Categories & Sections' },
    { id: 'banners', label: 'Promotional Banners' },
    { id: 'reviews', label: 'Reviews Moderation' },
    { id: 'work', label: 'Agency Work Gallery' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#10263D] flex flex-col font-sans">
      {/* Admin Top Bar */}
      <header className="bg-[#10263D] text-white border-b border-[#0C1C2E] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-white p-1 flex-shrink-0 border border-white/20">
              <Image
                src="/images/logo/wk-travel-logo.jpeg"
                alt="WK Travel & Tours"
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-sm sm:text-base text-white block leading-tight truncate">
                WK Travel & Tours
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#087E83] font-bold block truncate">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 text-white/90 border border-white/10">
              <IconShieldCheck className="w-4 h-4 text-[#087E83]" />
              <span className="font-medium">Verified Admin</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="px-2.5 py-1.5 border border-white/20 hover:bg-white/10 text-white rounded transition-colors text-xs font-medium"
            >
              <span className="hidden sm:inline">Public Website &rarr;</span>
              <span className="sm:hidden">Site &rarr;</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-2.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded font-semibold transition-colors text-xs"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Mobile Tab Quick Selector (compact for phone screens) */}
        <div className="block sm:hidden px-3 py-2 bg-[#0C1C2E] border-t border-white/10">
          <label htmlFor="adminSectionSelect" className="sr-only">
            Select Admin Section
          </label>
          <select
            id="adminSectionSelect"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full text-xs bg-[#10263D] text-white font-semibold border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#087E83]"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                📂 {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop & Tablet Tab Navigation Strip */}
        <div className="hidden sm:block border-t border-white/10 bg-[#0C1C2E] overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#087E83] text-[#087E83] bg-[#10263D] font-bold'
                    : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'packages' && <AdminPackagesManager />}
        {activeTab === 'categories' && <AdminCategoriesManager />}
        {activeTab === 'banners' && <AdminBannersManager />}
        {activeTab === 'reviews' && <AdminReviewsModerator />}
        {activeTab === 'work' && <AdminAgencyWorkManager />}
      </main>

      {/* Admin Footer */}
      <footer className="py-4 border-t border-[#E1E7EB] text-center text-xs text-[#586775] bg-[#F3F6F8]">
        WK Travel & Tours Internal Operations Portal • Royal Defence Mall, 3rd Floor, Off 101, Karachi • All operations secured
      </footer>
    </div>
  );
}
