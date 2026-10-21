import { siteConfig } from '../../config/site.js';
import { formatPKR } from './formatters.js';

/**
 * Sanitizes any phone number into clean WhatsApp international format.
 * Defaults to official agency WhatsApp (923372614742) if empty or invalid.
 * If 11 digits starting with 0 (e.g. 03372614742), translates to 923372614742.
 * @param {string} phone
 * @returns {string}
 */
export function cleanWhatsAppPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return siteConfig?.contact?.whatsapp || '923372614742';
  }
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) {
    return siteConfig?.contact?.whatsapp || '923372614742';
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    clean = '92' + clean.slice(1);
  }
  return clean;
}

/**
 * Builds a clean WhatsApp web / app redirect URL.
 * @param {string} phone 
 * @param {string} message 
 * @returns {string}
 */
export function buildWhatsAppUrl(phone, message) {
  const targetPhone = cleanWhatsAppPhone(phone);
  const text = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${targetPhone}?text=${text}`;
}

/**
 * Builds an itemized, highly structured VIP WhatsApp enquiry message for custom trips.
 * Truth-in-pricing: Always uses "Based on Your Choice" for customized pricing.
 * @param {Object} params
 * @param {string} [params.referenceId]
 * @param {Object} [params.customer]
 * @param {Object} [params.formValues]
 * @returns {string}
 */
export function createCustomTripWhatsAppMessage({
  referenceId,
  customer = {},
  formValues = {},
} = {}) {
  const name = formValues.customerName || customer.fullName || 'Valued Guest';
  const phone = formValues.phone || customer.phone || '';
  const email = formValues.email || customer.email || '';
  const departureCity = formValues.departureCity || customer.city || 'Karachi';

  const tripTypeLabels = {
    solo: 'Solo Travel',
    friends: 'Friends / Group Tour (4+ pax)',
    family: 'Family Vacation',
    honeymoon: 'Honeymoon Special',
    visa: 'Visit Visa Assistance Only',
    custom: 'Custom Itinerary',
  };

  const categoryLabel = tripTypeLabels[formValues.tripType] || formValues.tripType || 'Custom Journey';

  let msg = `*CUSTOM TRIP PROPOSAL REQUEST - WK TRAVEL & TOURS*\n`;
  if (referenceId) {
    msg += `Reference ID: ${referenceId}\n`;
  }
  msg += `\n`;
  msg += `*Trip Category:* ${categoryLabel}\n`;
  msg += `*Desired Destination(s):* ${formValues.destinations || 'Flexible / To Be Advised'}\n`;
  msg += `*Departure City:* ${departureCity}\n`;

  const totalPax =
    formValues.travellerCount ||
    (Number(formValues.adultsCount || 0) + Number(formValues.childrenCount || 0)) ||
    1;
  const paxDetails =
    formValues.adultsCount !== undefined
      ? ` (${formValues.adultsCount} Adults, ${formValues.childrenCount || 0} Children)`
      : '';
  msg += `*Travellers:* ${totalPax} pax${paxDetails}\n`;

  if (formValues.approximateDate) {
    msg += `*Travel Dates:* ${formValues.approximateDate}\n`;
  }
  if (formValues.duration) {
    msg += `*Duration:* ${formValues.duration}\n`;
  }

  // Truth in pricing - never fabricate fixed numbers for custom trips
  msg += `*Pricing Basis:* Based on Your Choice (Tailored Quotation)\n`;

  if (formValues.hotelStandard) {
    msg += `*Hotel Preference:* ${formValues.hotelStandard}\n`;
  }
  if (formValues.budgetPreference) {
    msg += `*Budget Tier:* ${formValues.budgetPreference}\n`;
  }

  if (Array.isArray(formValues.servicesNeeded) && formValues.servicesNeeded.length > 0) {
    msg += `\n*Services Requested:*\n`;
    formValues.servicesNeeded.forEach((s) => {
      msg += `• ${s}\n`;
    });
  }

  if (Array.isArray(formValues.preferredActivities) && formValues.preferredActivities.length > 0) {
    msg += `\n*Preferred Activities:*\n`;
    formValues.preferredActivities.forEach((a) => {
      msg += `• ${a}\n`;
    });
  }

  if (formValues.notes && formValues.notes.trim()) {
    msg += `\n*Special Notes / Instructions:*\n${formValues.notes.trim()}\n`;
  }

  msg += `\n*Client Contact Details:*\n`;
  msg += `• Name: ${name}\n`;
  if (phone) msg += `• Phone: ${phone}\n`;
  if (departureCity) msg += `• Departure City: ${departureCity}\n`;
  if (email) msg += `• Email: ${email}\n`;

  msg += `\n_Please review availability and provide a tailored proposal with verified rates. Thank you._`;

  return msg;
}

/**
 * Builds a unified, structured WhatsApp enquiry message for items in the customer's cart.
 * Properly handles mixed carts with standard tours and custom itinerary quotes.
 * @param {Object} params
 * @param {Object} [params.customer]
 * @param {Array} [params.items]
 * @param {number} [params.grandTotal]
 * @param {number} [params.totalTravellers]
 * @param {boolean} [params.containsCustom]
 * @param {string} [params.notes]
 * @returns {string}
 */
export function createCartWhatsAppMessage({
  customer = {},
  items = [],
  grandTotal = 0,
  totalTravellers = 0,
  containsCustom = false,
  notes = '',
} = {}) {
  let msg = `*BOOKING INQUIRY - WK TRAVEL & TOURS*\n\n`;

  if (customer.fullName || customer.phone || customer.city) {
    msg += `*Client Details:*\n`;
    if (customer.fullName) msg += `• Name: ${customer.fullName}\n`;
    if (customer.phone) msg += `• Phone: ${customer.phone}\n`;
    if (customer.city) msg += `• City: ${customer.city}\n`;
    if (customer.email) msg += `• Email: ${customer.email}\n`;
    msg += `\n`;
  }

  msg += `*Selected Package(s) (${items.length}):*\n`;
  items.forEach((item, index) => {
    const isCustom =
      item.isCustomTrip === true ||
      item.is_custom_trip_promotion === true ||
      item.pricingBasis === 'custom' ||
      item.price === 0;

    msg += `${index + 1}. *${item.title}*\n`;
    if (item.destination) {
      msg += `   Destination: ${item.destination}\n`;
    }
    msg += `   Travellers: ${item.travellerCount || 1} pax\n`;
    if (item.travelDate) {
      msg += `   Requested Date: ${item.travelDate}\n`;
    }

    if (isCustom) {
      msg += `   Pricing: Based on Your Choice (Tailored Quote Request)\n\n`;
    } else {
      const subtotal =
        item.pricingBasis === 'per_person'
          ? (item.price || 0) * (item.travellerCount || 1)
          : (item.price || 0);
      msg += `   Estimated Subtotal: ${formatPKR(subtotal)}\n\n`;
    }
  });

  if (grandTotal > 0 && containsCustom) {
    msg += `*Calculated Package Total:* ${formatPKR(grandTotal)} + Custom Itinerary Quote\n`;
  } else if (grandTotal > 0) {
    msg += `*Calculated Total:* ${formatPKR(grandTotal)}\n`;
  } else {
    msg += `*Pricing Basis:* Based on Your Choice (Tailored Quotation)\n`;
  }

  if (notes && notes.trim()) {
    msg += `\n*Special Notes / Instructions:*\n${notes.trim()}\n`;
  }

  msg += `\n_Please verify flight and hotel availability and send booking confirmation instructions. Thank you._`;

  return msg;
}

/**
 * Builds a package-specific enquiry message for single package view or card.
 * @param {Object} params
 * @param {Object} [params.customer]
 * @param {Object} [params.pkg]
 * @param {number} [params.travellerCount]
 * @param {string} [params.travelDate]
 * @param {string} [params.notes]
 * @returns {string}
 */
export function createPackageEnquiryWhatsAppMessage({
  customer = {},
  pkg = {},
  travellerCount = 1,
  travelDate = '',
  notes = '',
} = {}) {
  const isCustom =
    pkg.isCustomTripPromotion === true ||
    pkg.is_custom_trip_promotion === true ||
    pkg.isCustomized === true ||
    pkg.is_customized === true ||
    pkg.pricingBasis === 'custom' ||
    pkg.price === 0;

  let msg = `*PACKAGE INQUIRY - WK TRAVEL & TOURS*\n\n`;
  msg += `*Package:* ${pkg.title || 'Travel Package'}\n`;
  if (pkg.category) {
    msg += `*Category:* ${pkg.category}\n`;
  }
  if (pkg.destination) {
    msg += `*Destination:* ${pkg.destination}\n`;
  }
  if (pkg.duration) {
    msg += `*Duration:* ${pkg.duration}\n`;
  }
  msg += `*Travellers:* ${travellerCount} pax\n`;
  if (travelDate) {
    msg += `*Requested Travel Date:* ${travelDate}\n`;
  }

  if (isCustom) {
    msg += `*Pricing:* Based on Your Choice (Tailored Quote Request)\n`;
  } else {
    const multiplier = pkg.pricingBasis === 'per_person' ? travellerCount : 1;
    const total = (pkg.price || 0) * multiplier;
    msg += `*Price Basis:* ${pkg.pricingBasis === 'per_person' ? 'Per Person' : 'Service Fee'}\n`;
    msg += `*Estimated Total:* ${formatPKR(total)}\n`;
  }

  if (customer && (customer.fullName || customer.phone || customer.city)) {
    msg += `\n*Client Details:*\n`;
    if (customer.fullName) msg += `• Name: ${customer.fullName}\n`;
    if (customer.phone) msg += `• Phone: ${customer.phone}\n`;
    if (customer.city) msg += `• City: ${customer.city}\n`;
  }

  if (notes && notes.trim()) {
    msg += `\n*Notes:*\n${notes.trim()}\n`;
  }

  if (isCustom) {
    msg += `\n_Please share flight schedules, hotel options, and a tailored estimate from Karachi. Thank you._`;
  } else {
    msg += `\n_Please confirm seat and hotel availability from Karachi. Thank you._`;
  }

  return msg;
}

/**
 * Attempts to open a WhatsApp popup in the browser and returns boolean success.
 * If blocked by browser popup blocker, returns false so callers can render a fallback action.
 * @param {string} url
 * @returns {boolean}
 */
export function openWhatsAppWithFallback(url) {
  if (typeof window === 'undefined') return false;
  try {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

