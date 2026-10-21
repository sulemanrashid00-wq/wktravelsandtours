'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomerStore } from '@/stores/customerStore';
import { useCartStore } from '@/stores/cartStore';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconPhone,
  IconMapPin,
  IconShoppingBag,
  IconShieldCheck,
  IconWhatsApp,
  IconCheck,
  IconClock,
} from '@/components/ui/Icons';
import { formatPKR } from '@/lib/utils/formatters';

export function ProfileView() {
  const { customer, setCustomerDetails } = useCustomerStore();
  const { items, getGrandTotal, getSubtotal, hasCustomTrip, openDrawer } = useCartStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Karachi');
  const [email, setEmail] = useState('');
  const [travelStyle, setTravelStyle] = useState('family');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (customer) {
      setFullName(customer.fullName || '');
      setPhone(customer.phone || '');
      setCity(customer.city || 'Karachi');
      setEmail(customer.email || '');
    }
  }, [customer]);

  const handleSave = (e) => {
    e.preventDefault();
    setCustomerDetails({
      fullName: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      email: email.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const cartTotal = mounted
    ? (typeof getGrandTotal === 'function' ? getGrandTotal() : (typeof getSubtotal === 'function' ? getSubtotal() : 0))
    : 0;
  const cartCount = mounted ? items.length : 0;
  const containsCustom = mounted && typeof hasCustomTrip === 'function' ? hasCustomTrip() : false;

  return (
    <div className="space-y-10 bg-white">
      {/* Profile Overview Card */}
      <div className="bg-white border border-[#E1E7EB] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E7EB] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider text-[#087E83] font-semibold">
                Client Portal
              </span>
              <Badge variant="outline" size="sm">
                Device Encrypted
              </Badge>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#10263D]">
              {fullName ? `${fullName}` : 'Traveler Profile & Preferences'}
            </h2>
            <p className="mt-1 text-xs text-[#586775]">
              Your details are safely preserved on your device for seamless checkout and personalized travel proposals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold px-3.5 py-2 border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded text-[#10263D] transition-colors"
            >
              Sign In / Admin Access
            </Link>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Profile details saved successfully. They will automatically prefill your booking forms.</span>
          </div>
        )}

        {/* Edit Details Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profileName" className="block text-xs font-semibold text-[#10263D] mb-1.5">
                Full Legal Name (as per Passport)
              </label>
              <input
                id="profileName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tariq Mehmood"
                autoComplete="name"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D]"
              />
            </div>

            <div>
              <label htmlFor="profilePhone" className="block text-xs font-semibold text-[#10263D] mb-1.5">
                Primary Contact Number (WhatsApp enabled)
              </label>
              <input
                id="profilePhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 03372614742"
                autoComplete="tel"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profileCity" className="block text-xs font-semibold text-[#10263D] mb-1.5">
                City of Residence / Departure
              </label>
              <input
                id="profileCity"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Karachi, Lahore, Islamabad, etc."
                autoComplete="address-level2"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D]"
              />
            </div>

            <div>
              <label htmlFor="profileEmail" className="block text-xs font-semibold text-[#10263D] mb-1.5">
                Email Address (Optional)
              </label>
              <input
                id="profileEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E1E7EB] rounded focus:outline-none focus:border-[#087E83] text-[#10263D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#10263D] mb-1.5">
              Preferred Travel Style
            </label>
            <div
              role="radiogroup"
              aria-label="Preferred Travel Style"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
            >
              {[
                { id: 'family', label: 'Family Vacation' },
                { id: 'friends', label: 'Group / Friends (4+)' },
                { id: 'honeymoon', label: 'Honeymoon' },
                { id: 'solo', label: 'Solo Discovery' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  role="radio"
                  aria-checked={travelStyle === style.id}
                  onClick={() => setTravelStyle(style.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E83] ${
                    travelStyle === style.id
                      ? 'border-[#10263D] bg-[#10263D] text-white shadow-xs'
                      : 'border-[#E1E7EB] bg-white text-[#586775] hover:bg-[#F3F6F8]'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[11px] text-[#586775]">
              Changes update your local booking profile automatically.
            </span>
            <Button type="submit" variant="primary" size="md">
              Save Profile Details
            </Button>
          </div>
        </form>
      </div>

      {/* Cart & Inquiries Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E1E7EB] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-[#10263D] flex items-center gap-2">
                <IconShoppingBag className="w-4 h-4 text-[#087E83]" />
                <span>Active Booking Cart</span>
              </h3>
              <Badge variant="teal" size="sm">
                {cartCount} {cartCount === 1 ? 'Package' : 'Packages'}
              </Badge>
            </div>

            {cartCount > 0 ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {items.slice(0, 3).map((item, idx) => {
                    const isCustom =
                      item.isCustomTrip === true ||
                      item.pricingBasis === 'custom' ||
                      item.price === 0;

                    return (
                      <div
                        key={item.packageId || idx}
                        className="text-xs flex items-center justify-between text-[#10263D] pb-2 border-b border-[#E1E7EB] gap-2"
                      >
                        <div className="truncate max-w-[220px]">
                          <span className="font-semibold block truncate">{item.title}</span>
                          <span className="text-[10px] text-[#586775]">
                            {isCustom ? 'Price: Based on Your Choice' : `${formatPKR(item.price)}`}
                          </span>
                        </div>
                        <span className="font-semibold text-[11px] shrink-0 text-[#087E83]">
                          {item.travellerCount} Pax
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#10263D]">
                  <span>Estimated Subtotal:</span>
                  <span>
                    {cartTotal > 0 && containsCustom
                      ? `${formatPKR(cartTotal)} + Quote`
                      : cartTotal > 0
                      ? formatPKR(cartTotal)
                      : 'Based on Choice'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#586775] space-y-3">
                <p>Your travel cart is currently empty.</p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="px-3.5 py-2 text-xs font-semibold text-[#10263D] border border-[#E1E7EB] bg-[#F3F6F8] hover:bg-white rounded transition-colors"
                  >
                    Open Drawer
                  </button>
                  <Link
                    href="/packages"
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#087E83] hover:bg-[#06676B] rounded transition-colors shadow-xs"
                  >
                    Explore Tour Packages &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {cartCount > 0 && (
            <div className="pt-4 mt-2 border-t border-[#E1E7EB] flex gap-2">
              <button
                type="button"
                onClick={openDrawer}
                className="flex-1 py-2 text-center text-xs font-semibold text-[#10263D] bg-[#F3F6F8] hover:bg-[#E1E7EB] border border-[#E1E7EB] rounded transition-colors shadow-xs"
              >
                Open Drawer ({cartCount})
              </button>
              <Link
                href="/cart"
                className="flex-1 py-2 text-center text-xs font-semibold text-white bg-[#10263D] hover:bg-[#0C1C2E] rounded transition-colors shadow-xs"
              >
                Full Checkout &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Travel Compliance & Advisory */}
        <div className="bg-white border border-[#E1E7EB] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-heading text-base font-bold text-[#10263D] flex items-center gap-2 mb-2">
              <IconShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>International Passport Advisory</span>
            </h3>
            <p className="text-xs text-[#586775] leading-relaxed">
              Before confirming international flights or hotel vouchers, ensure your passport holds at least 6 months of validity from your planned departure date.
            </p>
            <div className="mt-4 p-3 bg-[#F3F6F8] border border-[#E1E7EB] rounded-lg text-[11px] text-[#10263D] space-y-1">
              <p className="font-semibold text-[#10263D]">Defence Karachi Office Desk:</p>
              <p>{siteConfig.contact.address}</p>
              <p className="text-[#586775]">Hours: Monday to Saturday (10:00 AM to 7:00 PM)</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E1E7EB]">
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
                `Hello WK Travel, I am ${fullName || 'a customer'} inquiring about upcoming trip plans.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors shadow-xs"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span>Direct WhatsApp Consultation</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
