'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useCustomerStore } from '@/stores/customerStore';
import { formatPKR } from '@/lib/utils/formatters';
import {
  buildWhatsAppUrl,
  createCartWhatsAppMessage,
  openWhatsAppWithFallback,
} from '@/lib/utils/whatsapp';
import { siteConfig } from '@/config/site';
import { IconClose, IconShoppingBag, IconWhatsApp, IconClock, IconMapPin } from '@/components/ui/Icons';

export function CartDrawer({ isOpen: controlledIsOpen, onClose: controlledOnClose }) {
  const router = useRouter();
  const {
    items,
    isDrawerOpen: storeIsOpen,
    closeDrawer: storeCloseDrawer,
    removeItem,
    updateTravellerCount,
    clearCart,
    getGrandTotal,
    getTotalTravellers,
    hasCustomTrip,
  } = useCartStore();

  const { customer, setCustomerDetails } = useCustomerStore();
  const [mounted, setMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [promptPhone, setPromptPhone] = useState('');
  const closeButtonRef = useRef(null);

  // Support both controlled props and store-driven state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : storeIsOpen;
  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    }
    storeCloseDrawer();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (customer) {
      if (customer.fullName) setPromptName(customer.fullName);
      if (customer.phone) setPromptPhone(customer.phone);
    }
  }, [customer]);

  // Lock background scroll when open & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus the close button for accessibility
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const total = getGrandTotal();
  const totalTravellers = getTotalTravellers();
  const containsCustom = hasCustomTrip();
  const packageCount = items.length;

  const dispatchWhatsApp = (name, phone) => {
    if (items.length === 0) return;

    const custObj = {
      fullName: name || customer?.fullName || '',
      phone: phone || customer?.phone || '',
      city: customer?.city || 'Karachi',
      email: customer?.email || '',
    };

    const message = createCartWhatsAppMessage({
      customer: custObj,
      items,
      grandTotal: total,
      totalTravellers,
      containsCustom,
    });

    const url = buildWhatsAppUrl(siteConfig.contact.whatsapp, message);
    openWhatsAppWithFallback(url);
  };

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;

    if (customer?.fullName && customer?.phone) {
      dispatchWhatsApp(customer.fullName, customer.phone);
    } else {
      setShowPrompt(true);
    }
  };

  const handleExplorePackages = () => {
    handleClose();
    router.push('/packages');
  };

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-[70] flex justify-end"
    >
      {/* Restrained Backdrop (no excessive blur or distortion) */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        className="fixed inset-0 bg-[#10263D]/40 transition-opacity duration-200 ease-in-out"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full sm:max-w-md md:max-w-[440px] bg-white h-full flex flex-col shadow-2xl border-l border-[#E1E7EB] z-10 transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E1E7EB] flex items-center justify-between bg-[#F3F6F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E1E7EB] flex items-center justify-center text-[#087E83] shadow-xs">
              <IconShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="font-heading text-base sm:text-lg font-bold text-[#10263D]">
                Selected Packages ({packageCount})
              </h2>
              <span className="text-[11px] text-[#586775]">
                {packageCount === 0
                  ? 'No packages currently selected'
                  : `${packageCount} ${packageCount === 1 ? 'itinerary' : 'itineraries'} in reservation cart`}
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close cart drawer"
            className="p-2 text-[#586775] hover:text-[#10263D] hover:bg-white rounded border border-transparent hover:border-[#E1E7EB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83]"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {packageCount === 0 ? (
            /* Premium Empty-Cart Experience (Compliant with Section 2) */
            <div className="py-10 px-4 text-center my-auto flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#F3F6F8] border border-[#E1E7EB] flex items-center justify-center text-[#087E83] mb-4 shadow-xs">
                <IconShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#10263D]">
                Your journey starts here
              </h3>
              <p className="mt-2 text-xs text-[#586775] max-w-xs leading-relaxed">
                Your selected travel packages will appear here when you're ready to plan your trip.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleExplorePackages}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#087E83]"
                >
                  Explore Packages
                </button>
              </div>
            </div>
          ) : (
            /* Selected Items List */
            items.map((item) => {
              const isCustom =
                item.isCustomTrip === true ||
                item.pricingBasis === 'custom' ||
                item.price === 0 ||
                item.slug?.includes('customized') ||
                item.slug?.includes('friends-vip');

              const isVisa = item.serviceType === 'visa' || item.pricingBasis === 'visa_only';
              const detailHref = isCustom
                ? `/custom-trip?type=${encodeURIComponent(item.destination || 'custom')}`
                : `/packages/${item.slug}`;

              return (
                <div
                  key={item.packageId}
                  className="p-3.5 border border-[#E1E7EB] bg-white rounded-xl shadow-xs space-y-2.5 hover:border-[#C4D1DB] transition-colors"
                >
                  <div className="flex gap-3 items-start">
                    {/* Poster thumbnail */}
                    <div className="relative w-16 h-20 bg-[#10263D] rounded-lg overflow-hidden flex-shrink-0 border border-[#E1E7EB]">
                      <Image
                        src={item.primaryImage || '/images/logo/wk-travel-logo.jpeg'}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>

                    {/* Metadata & Controls */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={detailHref}
                          onClick={handleClose}
                          className="text-xs font-bold text-[#10263D] hover:text-[#087E83] line-clamp-2 transition-colors leading-snug"
                        >
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.packageId)}
                          aria-label={`Remove ${item.title}`}
                          className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline flex-shrink-0 font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Destination / Duration */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#586775]">
                        {item.destination && (
                          <span className="flex items-center gap-1">
                            <IconMapPin className="w-3 h-3 text-[#087E83]" />
                            <span className="truncate max-w-[140px]">{item.destination}</span>
                          </span>
                        )}
                        {item.duration && (
                          <span className="flex items-center gap-1">
                            <IconClock className="w-3 h-3 text-[#087E83]" />
                            <span>{item.duration}</span>
                          </span>
                        )}
                      </div>

                      {/* Pricing Tag */}
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <div>
                          {isCustom ? (
                            <span className="text-xs font-bold text-[#087E83]">
                              Price: Based on Your Choice
                            </span>
                          ) : (
                            <div className="text-xs font-bold text-[#10263D]">
                              {formatPKR(item.price)}{' '}
                              <span className="text-[10px] font-normal text-[#586775]">
                                {item.pricingBasis === 'per_person' ? '/ person' : '(service fee)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Traveller / Applicant Counter & Row Subtotal */}
                  <div className="pt-2 border-t border-[#F3F6F8] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#586775] font-medium">
                        {isVisa ? 'Applicants:' : 'Travellers:'}
                      </span>
                      <div className="flex items-center border border-[#E1E7EB] rounded bg-[#F3F6F8]">
                        <button
                          type="button"
                          onClick={() =>
                            updateTravellerCount(item.packageId, Math.max(1, item.travellerCount - 1))
                          }
                          aria-label="Decrease count"
                          className="w-6 h-6 flex items-center justify-center text-[#10263D] hover:bg-white rounded-l transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-[#10263D] min-w-5 text-center">
                          {item.travellerCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateTravellerCount(item.packageId, item.travellerCount + 1)}
                          aria-label="Increase count"
                          className="w-6 h-6 flex items-center justify-center text-[#10263D] hover:bg-white rounded-r transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#586775] block">Subtotal</span>
                      <span className="text-xs font-bold text-[#10263D]">
                        {isCustom
                          ? 'Custom Quote'
                          : formatPKR(
                              item.pricingBasis === 'per_person'
                                ? item.price * item.travellerCount
                                : item.price
                            )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer (Only when items exist) */}
        {packageCount > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E1E7EB] bg-[#F3F6F8] space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <div>
                <span className="text-xs text-[#586775] block font-medium">
                  Estimated Total ({totalTravellers} {totalTravellers === 1 ? 'pax' : 'travellers'}):
                </span>
                {containsCustom && (
                  <span className="text-[10px] text-[#087E83] font-semibold">
                    Includes tailored quote packages
                  </span>
                )}
              </div>
              <span className="font-heading text-lg sm:text-xl font-bold text-[#10263D]">
                {total > 0 && containsCustom
                  ? `${formatPKR(total)} + Quote`
                  : total > 0
                  ? formatPKR(total)
                  : 'Based on Choice'}
              </span>
            </div>

            <p className="text-[11px] text-[#586775] leading-relaxed">
              Opening WhatsApp sends this summary directly to our Karachi booking desk. It does not automatically charge or confirm a reservation until verified by our consultants.
            </p>

            {showPrompt ? (
              <div className="p-3 bg-white border border-[#E1E7EB] rounded-lg space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10263D]">
                    Contact Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPrompt(false)}
                    className="text-[11px] text-[#586775] hover:text-[#10263D]"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-[#586775]">
                  Please provide your name and phone number for this WhatsApp enquiry:
                </p>
                <div>
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="WhatsApp / Phone Number"
                    value={promptPhone}
                    onChange={(e) => setPromptPhone(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#E1E7EB] rounded focus:border-[#087E83] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPrompt(false)}
                    className="w-1/3 py-2 text-xs font-medium text-[#586775] bg-[#F3F6F8] border border-[#E1E7EB] rounded hover:bg-[#E1E7EB] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!promptName.trim() || !promptPhone.trim()}
                    onClick={() => {
                      if (!promptName.trim() || !promptPhone.trim()) return;
                      setCustomerDetails({
                        fullName: promptName.trim(),
                        phone: promptPhone.trim(),
                        city: customer?.city || 'Karachi',
                      });
                      setShowPrompt(false);
                      dispatchWhatsApp(promptName.trim(), promptPhone.trim());
                    }}
                    className="w-2/3 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] disabled:opacity-50 rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <IconWhatsApp className="w-3.5 h-3.5" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1 flex flex-col gap-2">
                <Link
                  href="/cart"
                  onClick={handleClose}
                  className="w-full py-2.5 text-center text-xs font-semibold text-white bg-[#10263D] hover:bg-[#0C1C2E] rounded transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10263D]"
                >
                  Review Full Cart & Checkout Details
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="w-1/3 py-2.5 text-xs font-medium text-[#586775] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] hover:text-[#10263D] rounded transition-colors"
                  >
                    Clear Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckoutWhatsApp}
                    className="w-2/3 py-2.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    <span>Instant WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
