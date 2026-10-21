'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomerStore } from '@/stores/customerStore';
import { siteConfig } from '@/config/site';
import {
  buildWhatsAppUrl,
  createCustomTripWhatsAppMessage,
  openWhatsAppWithFallback,
} from '@/lib/utils/whatsapp';
import { IconWhatsApp, IconShieldCheck, IconCheck } from '@/components/ui/Icons';

export function CustomTripForm() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'family';

  const { customer, setCustomerDetails } = useCustomerStore();

  const [tripType, setTripType] = useState(initialType);
  const [destinations, setDestinations] = useState('');
  const [departureCity, setDepartureCity] = useState('Karachi');
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [approximateDate, setApproximateDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isFlexible, setIsFlexible] = useState(false);
  const [duration, setDuration] = useState('7 Days');
  const [hotelStandard, setHotelStandard] = useState('4star');
  const [budgetPreference, setBudgetPreference] = useState('standard');
  const [servicesNeeded, setServicesNeeded] = useState([
    'Return Air Tickets',
    'Hotel Accommodation',
    'Visa Assistance',
    'Airport Transfers',
  ]);
  const [preferredActivities, setPreferredActivities] = useState([
    'City Sightseeing',
    'Cultural Tours',
  ]);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  useEffect(() => {
    const t = searchParams.get('type');
    if (t) setTripType(t);
  }, [searchParams]);

  useEffect(() => {
    if (customer) {
      if (customer.fullName) setCustomerName(customer.fullName);
      if (customer.phone) setPhone(customer.phone);
      if (customer.city) setDepartureCity(customer.city);
      if (customer.email) setEmail(customer.email);
    }
  }, [customer]);

  const toggleService = (service) => {
    if (servicesNeeded.includes(service)) {
      setServicesNeeded(servicesNeeded.filter((s) => s !== service));
    } else {
      setServicesNeeded([...servicesNeeded, service]);
    }
  };

  const toggleActivity = (act) => {
    if (preferredActivities.includes(act)) {
      setPreferredActivities(preferredActivities.filter((a) => a !== act));
    } else {
      setPreferredActivities([...preferredActivities, act]);
    }
  };

  const totalTravellers = adultsCount + childrenCount;

  const validate = () => {
    const errs = {};
    if (!destinations.trim()) {
      errs.destinations = 'Please specify at least one desired country or city.';
    }
    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = 'Please enter your full name.';
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please provide a valid 10+ digit contact number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    // Save contact info locally in customer profile store
    setCustomerDetails({
      fullName: customerName.trim(),
      phone: phone.trim(),
      city: departureCity.trim(),
      email: email.trim(),
    });

    const payload = {
      tripType,
      destinations: destinations.trim(),
      travellerCount: totalTravellers,
      approximateDate: isFlexible
        ? 'Flexible Travel Dates'
        : approximateDate + (returnDate ? ` to ${returnDate}` : ''),
      duration,
      budgetPreference: `${hotelStandard.toUpperCase()} Hotel Standard (${budgetPreference})`,
      servicesNeeded: [
        ...servicesNeeded,
        ...preferredActivities.map((a) => `Activity: ${a}`),
      ],
      notes: `Departure City: ${departureCity}. Adults: ${adultsCount}, Children: ${childrenCount}. Notes: ${notes.trim()}`,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    };

    let referenceId = 'WK-CUST-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch('/api/custom-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.data?.id) {
        referenceId = json.data.id;
      }
    } catch (err) {
      console.warn('Custom trip enquiry saved offline notice:', err);
    }

    // Build centralized, structured VIP WhatsApp message
    const whatsappMsg = createCustomTripWhatsAppMessage({
      referenceId,
      customer: {
        fullName: customerName.trim(),
        phone: phone.trim(),
        city: departureCity.trim(),
        email: email.trim(),
      },
      formValues: {
        tripType,
        destinations: destinations.trim(),
        departureCity: departureCity.trim(),
        travellerCount: totalTravellers,
        adultsCount,
        childrenCount,
        approximateDate: isFlexible
          ? 'Flexible Travel Dates'
          : approximateDate + (returnDate ? ` to ${returnDate}` : ''),
        duration,
        hotelStandard: `${hotelStandard.toUpperCase()} Hotel Standard`,
        budgetPreference,
        servicesNeeded,
        preferredActivities,
        notes: notes.trim(),
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      },
    });

    const whatsappUrl = buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMsg);

    // Immediate WhatsApp launch
    const popupOpened = openWhatsAppWithFallback(whatsappUrl);

    setSubmissionSuccess({
      id: referenceId,
      payload,
      whatsappUrl,
      popupBlocked: !popupOpened,
    });
    setIsSubmitting(false);
  };

  const openWhatsAppHandoff = () => {
    if (!submissionSuccess?.whatsappUrl) return;
    window.open(submissionSuccess.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const availableServices = [
    'Return Air Tickets',
    'Hotel Accommodation',
    'Visa Assistance',
    'Airport Transfers',
    'City Sightseeing Tours',
    'Daily Breakfast',
    'Private Car with Chauffeur',
  ];

  const availableActivities = [
    'City Sightseeing',
    'Cultural Tours',
    'Beach & Island Excursions',
    'Shopping & Malls',
    'Nature & Wildlife',
    'Desert Safari',
    'Adventure & Water Sports',
  ];

  // Success / WhatsApp Handoff View
  if (submissionSuccess) {
    return (
      <div className="bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl p-8 sm:p-10 space-y-6 text-center max-w-2xl mx-auto shadow-sm">
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
            Reference Code: <strong className="text-[#10263D]">{submissionSuccess.id}</strong>
          </p>
        </div>

        {submissionSuccess.popupBlocked ? (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
            Your browser blocked the automatic WhatsApp window. Please tap the button below to send your enquiry now.
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
            WhatsApp has been opened with your inquiry pre-filled. Tap <strong>Send</strong> in WhatsApp to deliver it to our desk.
          </div>
        )}

        <div className="p-4 bg-white border border-[#E1E7EB] rounded-lg text-left text-xs space-y-2 text-[#586775]">
          <div className="flex justify-between border-b border-[#E1E7EB] pb-2 font-medium">
            <span>Destination:</span>
            <span className="text-[#10263D] font-bold">{destinations}</span>
          </div>
          <div className="flex justify-between border-b border-[#E1E7EB] pb-2 font-medium">
            <span>Travellers:</span>
            <span className="text-[#10263D] font-bold">
              {totalTravellers} pax ({adultsCount} Adults, {childrenCount} Children)
            </span>
          </div>
          <div className="flex justify-between border-b border-[#E1E7EB] pb-2 font-medium">
            <span>Departure City:</span>
            <span className="text-[#10263D] font-bold">{departureCity}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Quotation Basis:</span>
            <span className="text-[#087E83] font-bold">Price: Based on Your Choice</span>
          </div>
        </div>

        <p className="text-xs text-[#586775] leading-relaxed">
          Our travel specialists at Royal Defence Mall Karachi receive your preferences directly via WhatsApp. We will prepare an itemized proposal with confirmed airfares and hotel vouchers.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href={submissionSuccess.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-[#128C7E] hover:bg-[#075E54] rounded transition-colors shadow-sm"
          >
            <IconWhatsApp className="w-4 h-4" />
            <span>Send Message in WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => setSubmissionSuccess(null)}
            className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#10263D] bg-white border border-[#E1E7EB] hover:bg-[#F3F6F8] rounded transition-colors shadow-sm"
          >
            Plan Another Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white">
      {/* Price Notice Callout */}
      <div className="p-4 rounded-xl border border-[#087E83]/30 bg-[#F0FDFA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#087E83] block">
            Transparent Custom Pricing
          </span>
          <p className="text-xs text-[#10263D] mt-0.5">
            Every custom itinerary is built from scratch. You only pay for the hotels, flights, and services you choose.
          </p>
        </div>
        <div className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-white border border-[#087E83]/40 text-xs font-bold text-[#087E83] shadow-sm">
          Price: Based on Your Choice
        </div>
      </div>

      {/* 1. Trip Profile */}
      <div className="bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#10263D] border-b border-[#E1E7EB] pb-3">
          1. Journey Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Trip Category
            </label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            >
              <option value="solo">Solo Travel (Individual Discovery)</option>
              <option value="friends">Friends / Group Journey (Min 4 Pax Discount)</option>
              <option value="family">Family Holiday (Tailored Comfort)</option>
              <option value="honeymoon">Honeymoon Special (Romantic Stays)</option>
              <option value="visa">Visit Visa Only (Multi-country filing)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Preferred Destination(s) *
            </label>
            <input
              type="text"
              value={destinations}
              onChange={(e) => setDestinations(e.target.value)}
              placeholder="e.g. Thailand & Malaysia, Baku, or Turkey"
              className={`w-full text-xs sm:text-sm bg-white border ${
                errors.destinations ? 'border-rose-600' : 'border-[#E1E7EB]'
              } rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]`}
            />
            {errors.destinations && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.destinations}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Departure City
            </label>
            <input
              type="text"
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              placeholder="e.g. Karachi, Lahore, Islamabad"
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Adults (12+ yrs)
            </label>
            <input
              type="number"
              min="1"
              value={adultsCount}
              onChange={(e) => setAdultsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Children (0-11 yrs)
            </label>
            <input
              type="number"
              min="0"
              value={childrenCount}
              onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            />
          </div>
        </div>

        {/* Dates & Flexibility */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Departure Date
            </label>
            <input
              type="text"
              disabled={isFlexible}
              value={approximateDate}
              onChange={(e) => setApproximateDate(e.target.value)}
              placeholder="e.g. 15 Nov 2026"
              className={`w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83] ${
                isFlexible ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Return Date (Optional)
            </label>
            <input
              type="text"
              disabled={isFlexible}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              placeholder="e.g. 23 Nov 2026"
              className={`w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83] ${
                isFlexible ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 7 Days / 6 Nights"
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="flexible-dates"
            checked={isFlexible}
            onChange={(e) => setIsFlexible(e.target.checked)}
            className="w-4 h-4 rounded text-[#087E83] border-[#E1E7EB] focus:ring-[#087E83]"
          />
          <label htmlFor="flexible-dates" className="text-xs text-[#586775] cursor-pointer">
            My travel dates are flexible (looking for best seasonal rates)
          </label>
        </div>

        {/* Accommodation standard & budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Hotel Standard
            </label>
            <select
              value={hotelStandard}
              onChange={(e) => setHotelStandard(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            >
              <option value="3star">3-Star Standard (Clean, central, verified)</option>
              <option value="4star">4-Star Premium (Comfortable, breakfast included)</option>
              <option value="5star">5-Star Luxury (Top international hospitality)</option>
              <option value="boutique">Boutique / Beachfront Resort</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Budget Guidance (Optional)
            </label>
            <select
              value={budgetPreference}
              onChange={(e) => setBudgetPreference(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
            >
              <option value="best_value">Best Value / Economy</option>
              <option value="standard">Moderate / Balanced</option>
              <option value="luxury">Luxury / Premium</option>
              <option value="flexible">No strict budget / Advise on options</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Services Needed */}
      <div className="bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#10263D] border-b border-[#E1E7EB] pb-3">
          2. Required Inclusions & Logistics
        </h2>
        <p className="text-xs text-[#586775]">
          Select all services you would like included in your tailored quotation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {availableServices.map((service) => {
            const isChecked = servicesNeeded.includes(service);
            return (
              <button
                type="button"
                key={service}
                onClick={() => toggleService(service)}
                className={`p-3 text-left rounded-lg border transition-all flex items-center justify-between text-xs shadow-sm ${
                  isChecked
                    ? 'border-[#087E83] bg-white text-[#087E83] font-semibold ring-1 ring-[#087E83]'
                    : 'border-[#E1E7EB] bg-white text-[#10263D] hover:bg-[#F3F6F8]'
                }`}
              >
                <span>{service}</span>
                {isChecked && <IconCheck className="w-4 h-4 text-[#087E83]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferred Activities */}
      <div className="bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#10263D] border-b border-[#E1E7EB] pb-3">
          3. Experiences & Activities
        </h2>
        <p className="text-xs text-[#586775]">
          Help our trip planners customize sightseeing to your style:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {availableActivities.map((act) => {
            const isChecked = preferredActivities.includes(act);
            return (
              <button
                type="button"
                key={act}
                onClick={() => toggleActivity(act)}
                className={`p-3 text-left rounded-lg border transition-all flex items-center justify-between text-xs shadow-sm ${
                  isChecked
                    ? 'border-[#087E83] bg-white text-[#087E83] font-semibold ring-1 ring-[#087E83]'
                    : 'border-[#E1E7EB] bg-white text-[#10263D] hover:bg-[#F3F6F8]'
                }`}
              >
                <span>{act}</span>
                {isChecked && <IconCheck className="w-4 h-4 text-[#087E83]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Contact Details */}
      <div className="bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#10263D] border-b border-[#E1E7EB] pb-3">
          4. Contact Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Asad Siddiqui"
              className={`w-full text-xs sm:text-sm bg-white border ${
                errors.customerName ? 'border-rose-600' : 'border-[#E1E7EB]'
              } rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]`}
            />
            {errors.customerName && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
              WhatsApp / Mobile Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="033XXXXXXXX or +9233XXXXXXXX"
              className={`w-full text-xs sm:text-sm bg-white border ${
                errors.phone ? 'border-rose-600' : 'border-[#E1E7EB]'
              } rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]`}
            />
            {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#10263D] mb-1.5">
            Special Requests / Family Needs / Preferences
          </label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Let us know about room configurations, connecting rooms, baby cot requirements, dietary needs, or specific attractions."
            className="w-full text-xs sm:text-sm bg-white border border-[#E1E7EB] rounded px-3 py-2.5 text-[#10263D] focus:outline-none focus:border-[#087E83]"
          ></textarea>
        </div>
      </div>

      {/* Disclaimers & Submission Button */}
      <div className="space-y-4">
        <div className="p-4 bg-[#F3F6F8] border border-[#E1E7EB] rounded-xl flex items-start gap-3 text-xs text-[#586775] leading-relaxed italic">
          <IconShieldCheck className="w-5 h-5 text-[#087E83] mt-0.5 flex-shrink-0" />
          <span>
            <strong>Enquiry Notice:</strong> Custom trip requests do not carry a fixed price. Submitting this form does not confirm availability or constitute a financial commitment. Your quotation will be calculated <strong>Based on Your Choice</strong> and delivered by our Karachi travel desk.
          </span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 text-xs uppercase tracking-wider font-semibold text-white bg-[#087E83] hover:bg-[#06676B] disabled:opacity-50 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <span>Submitting Custom Enquiry...</span>
          ) : (
            <span>Request Custom Itinerary Quotation</span>
          )}
        </button>
      </div>
    </form>
  );
}
