'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useCustomerStore } from '@/stores/customerStore';
import { formatPKR } from '@/lib/utils/formatters';
import {
  buildWhatsAppUrl,
  createCartWhatsAppMessage,
  openWhatsAppWithFallback,
} from '@/lib/utils/whatsapp';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/Button';
import {
  IconShoppingBag,
  IconClose,
  IconWhatsApp,
  IconShieldCheck,
  IconCheck,
  IconMapPin,
  IconClock,
} from '@/components/ui/Icons';

export function CartView() {
  const {
    items,
    removeItem,
    updateTravellerCount,
    updateTravelDate,
    clearCart,
    getGrandTotal,
    getTotalTravellers,
    hasCustomTrip,
  } = useCartStore();

  const { customer, setCustomerDetails } = useCustomerStore();

  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Karachi');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (customer) {
      if (customer.fullName) setFullName(customer.fullName);
      if (customer.phone) setPhone(customer.phone);
      if (customer.city) setCity(customer.city);
    }
  }, [customer]);

  if (!mounted) {
    return (
      <div className="py-20 text-center text-xs text-[#586775]">
        Loading cart summary...
      </div>
    );
  }

  const grandTotal = getGrandTotal();
  const totalTravellers = getTotalTravellers();
  const containsCustom = typeof hasCustomTrip === 'function' ? hasCustomTrip() : false;

  const validateForm = () => {
    const newErrors = {};
    if (!fullName || fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name (at least 2 characters).';
    }
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Please provide a valid contact number (at least 10 digits).';
    }
    if (!city || city.trim().length < 2) {
      newErrors.city = 'Please specify your departure or residence city.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    // Save customer details for next time
    setCustomerDetails({
      fullName: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
    });

    // 1. Asynchronously persist booking request to backend database
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          notes: notes.trim() || undefined,
          items: items.map((item) => {
            const isCustom =
              item.isCustomTrip === true || item.pricingBasis === 'custom' || item.price === 0;
            const subtotal = isCustom
              ? 0
              : item.pricingBasis === 'per_person'
              ? item.price * item.travellerCount
              : item.price;
            return {
              packageId: item.packageId,
              packageTitle: item.title,
              price: item.price,
              travellerCount: item.travellerCount,
              subtotal,
            };
          }),
          totalAmount: grandTotal,
        }),
      });
    } catch (err) {
      console.warn('Booking database persistence logged offline notice:', err);
    }

    // 2. Build properly encoded WhatsApp message
    const msg = createCartWhatsAppMessage({
      customer: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      },
      items,
      grandTotal,
      totalTravellers,
      containsCustom,
      notes: notes.trim(),
    });

    const whatsappUrl = buildWhatsAppUrl(siteConfig.contact.whatsapp, msg);
    const popupOpened = openWhatsAppWithFallback(whatsappUrl);

    setBookingSuccess({
      whatsappUrl,
      popupBlocked: !popupOpened,
      itemsCount: items.length,
    });
    setIsSubmitting(false);
  };

  // WhatsApp Handoff / Submission State View
  if (bookingSuccess) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto">
        <div className="bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl p-8 sm:p-10 space-y-6 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#128C7E]/10 border border-[#128C7E]/30 flex items-center justify-center text-[#128C7E]">
            <IconWhatsApp className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#087E83] block mb-1">
              Action Required in WhatsApp
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#10263D]">
              Please Press &ldquo;Send&rdquo; in WhatsApp
            </h2>
            <p className="mt-2 text-xs text-[#586775]">
              Booking Enquiry for {bookingSuccess.itemsCount} Package{bookingSuccess.itemsCount > 1 ? 's' : ''} ({totalTravellers} pax)
            </p>
          </div>

          {bookingSuccess.popupBlocked ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
              Your browser blocked the automatic WhatsApp window. Please tap the button below to send your enquiry now.
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
              WhatsApp has been opened with your inquiry pre-filled. Tap <strong>Send</strong> in WhatsApp to deliver it to our booking desk.
            </div>
          )}

          <div className="p-4 bg-white border border-[#E1E7EB] rounded-lg text-left text-xs space-y-2 text-[#586775]">
            <div className="flex justify-between border-b border-[#E1E7EB] pb-2 font-medium">
              <span>Client Name:</span>
              <span className="text-[#10263D] font-bold">{fullName}</span>
            </div>
            <div className="flex justify-between border-b border-[#E1E7EB] pb-2 font-medium">
              <span>Contact Phone:</span>
              <span className="text-[#10263D] font-bold">{phone}</span>
            </div>
            <div className="flex justify-between border-b border-[#E1E7EB] pb-2 font-medium">
              <span>Departure City:</span>
              <span className="text-[#10263D] font-bold">{city}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Quotation:</span>
              <span className="text-[#087E83] font-bold">
                {grandTotal > 0 && containsCustom
                  ? `${formatPKR(grandTotal)} + Custom Itinerary Quote`
                  : grandTotal > 0
                  ? formatPKR(grandTotal)
                  : 'Price: Based on Your Choice'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#586775] leading-relaxed">
            Our booking consultants at Royal Defence Mall Karachi receive this summary directly in WhatsApp. Flights, hotel vouchers, and seats will be verified directly with you before any reservation is confirmed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={bookingSuccess.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors shadow-sm"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span>Send Message in WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => setBookingSuccess(null)}
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#10263D] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded transition-colors shadow-sm"
            >
              Modify Enquiry
            </button>
            <button
              type="button"
              onClick={() => {
                clearCart();
                setBookingSuccess(null);
              }}
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-rose-700 bg-white border border-[#E1E7EB] hover:bg-rose-50 rounded transition-colors shadow-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-white">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#F3F6F8] border border-[#E1E7EB] flex items-center justify-center text-[#586775] mb-4">
          <IconShoppingBag className="w-8 h-8 text-[#087E83]" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#10263D]">
          Your Travel Cart is Empty
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#586775] leading-relaxed">
          You haven&apos;t added any tour packages or visa services to your cart yet. Explore our confirmed itineraries to start planning.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/packages"
            className="px-6 py-3 text-xs uppercase tracking-wider font-semibold text-white bg-[#10263D] hover:bg-[#0C1C2E] rounded transition-colors shadow-xs"
          >
            Browse Package Catalogue
          </Link>
          <Link
            href="/custom-trip"
            className="px-6 py-3 text-xs uppercase tracking-wider font-semibold text-[#10263D] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded transition-colors"
          >
            Request Custom Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Cart Items List */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E7EB]">
          <h2 className="font-heading text-lg font-bold text-[#10263D]">
            Selected Itineraries ({items.length})
          </h2>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-[#586775] hover:text-red-700 font-medium transition-colors"
          >
            Clear Entire Cart
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
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

            const subtotal =
              item.pricingBasis === 'per_person' ? item.price * item.travellerCount : item.price;

            return (
              <div
                key={item.packageId}
                className="border border-[#E1E7EB] bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start shadow-xs hover:border-[#C4D1DB] transition-colors"
              >
                {/* Thumbnail Poster */}
                <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#10263D] rounded-xl overflow-hidden flex-shrink-0 border border-[#E1E7EB]">
                  <Image
                    src={item.primaryImage || '/images/logo/wk-travel-logo.jpeg'}
                    alt={item.title}
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={detailHref}
                      className="font-heading text-sm sm:text-base font-bold text-[#10263D] hover:text-[#087E83] transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.packageId)}
                      aria-label={`Remove ${item.title}`}
                      className="text-xs text-red-600 hover:text-red-800 hover:underline flex-shrink-0 font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#586775]">
                    {item.destination && (
                      <span className="flex items-center gap-1">
                        <IconMapPin className="w-3.5 h-3.5 text-[#087E83]" />
                        <span>{item.destination}</span>
                      </span>
                    )}
                    {item.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <IconClock className="w-3.5 h-3.5 text-[#087E83]" />
                          <span>{item.duration}</span>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    {isCustom ? (
                      <span className="font-bold text-[#087E83]">Price: Based on Your Choice</span>
                    ) : (
                      <>
                        <span className="font-semibold text-[#10263D]">
                          {formatPKR(item.price)}
                        </span>
                        <span className="text-[11px]">
                          ({item.pricingBasis === 'per_person' ? 'per person' : 'service fee'})
                        </span>
                      </>
                    )}
                  </div>

                  {/* Traveler count & Travel Date controls */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E1E7EB] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#10263D] font-medium">
                        {isVisa ? 'Applicants:' : 'Travellers:'}
                      </span>
                      <div className="flex items-center border border-[#E1E7EB] rounded bg-[#F3F6F8]">
                        <button
                          type="button"
                          onClick={() =>
                            updateTravellerCount(
                              item.packageId,
                              Math.max(1, item.travellerCount - 1)
                            )
                          }
                          aria-label="Decrease count"
                          className="w-7 h-7 flex items-center justify-center hover:bg-[#E1E7EB] font-bold text-[#10263D] transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-[#10263D]">
                          {item.travellerCount}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateTravellerCount(item.packageId, item.travellerCount + 1)
                          }
                          aria-label="Increase count"
                          className="w-7 h-7 flex items-center justify-center hover:bg-[#E1E7EB] font-bold text-[#10263D] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#10263D] font-medium">Date:</span>
                      <input
                        type="text"
                        value={item.travelDate || ''}
                        onChange={(e) => updateTravelDate(item.packageId, e.target.value)}
                        placeholder="e.g. Mid Nov"
                        className="text-xs bg-white border border-[#E1E7EB] rounded px-2 py-1 w-28 text-[#10263D] focus:outline-none focus:border-[#087E83]"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#586775] block">Subtotal</span>
                      <span className="font-heading font-bold text-sm text-[#10263D]">
                        {isCustom ? 'Custom Quote' : formatPKR(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Checkout Form & Total Calculation */}
      <div className="lg:col-span-5 bg-[#F3F6F8] border border-[#E1E7EB] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#087E83] font-semibold">
            Booking Dispatch
          </span>
          <h2 className="font-heading text-xl font-bold text-[#10263D] mt-1">
            Customer Checkout
          </h2>
          <p className="mt-1 text-xs text-[#586775]">
            Prefill your contact information. We verify seats and rates directly with you on WhatsApp.
          </p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Tariq Mehmood"
              autoComplete="name"
              className={`w-full text-xs sm:text-sm bg-white border ${
                errors.fullName ? 'border-red-600' : 'border-[#E1E7EB]'
              } rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]`}
            />
            {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1">
              WhatsApp Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03372614742"
              autoComplete="tel"
              className={`w-full text-xs sm:text-sm bg-white border ${
                errors.phone ? 'border-red-600' : 'border-[#E1E7EB]'
              } rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83] font-mono`}
            />
            {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1">
              City of Departure / Residence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Karachi, Lahore, Islamabad"
              autoComplete="address-level2"
              className={`w-full text-xs sm:text-sm bg-white border ${
                errors.city ? 'border-red-600' : 'border-[#E1E7EB]'
              } rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]`}
            />
            {errors.city && <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1">
              Special Notes / Requests (Optional)
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us about room sharing, child bed requirements, or special dates."
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            />
          </div>

          {/* Pricing Calculation Summary */}
          <div className="pt-4 border-t border-[#E1E7EB] space-y-2">
            <div className="flex justify-between text-xs text-[#586775]">
              <span>Total Travelers:</span>
              <span className="font-semibold text-[#10263D]">{totalTravellers} pax</span>
            </div>
            {containsCustom && (
              <div className="flex justify-between text-xs text-[#087E83] font-semibold">
                <span>Custom Itineraries:</span>
                <span>Included (Tailored Quote)</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-[#E1E7EB]">
              <span className="font-semibold text-sm text-[#10263D]">Estimated Total:</span>
              <span className="font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
                {grandTotal > 0 && containsCustom
                  ? `${formatPKR(grandTotal)} + Quote`
                  : grandTotal > 0
                  ? formatPKR(grandTotal)
                  : 'Based on Choice'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="whatsapp"
              size="lg"
              disabled={isSubmitting}
              className="w-full text-xs uppercase tracking-wider font-semibold"
            >
              <IconWhatsApp className="w-4 h-4 mr-1.5" />
              <span>{isSubmitting ? 'Dispatching Inquiry...' : 'Send Request to Agency on WhatsApp'}</span>
            </Button>
          </div>

          <div className="pt-2 flex items-start gap-2 text-[11px] text-[#586775] leading-relaxed italic">
            <IconShieldCheck className="w-4 h-4 text-[#087E83] mt-0.5 flex-shrink-0" />
            <span>
              Sending this checkout request does not charge your card. Our team validates real-time airline ticket availability and connects on WhatsApp to confirm details.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
