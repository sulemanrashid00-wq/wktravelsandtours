import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanWhatsAppPhone,
  buildWhatsAppUrl,
  createCustomTripWhatsAppMessage,
  createCartWhatsAppMessage,
  createPackageEnquiryWhatsAppMessage,
} from '../src/lib/utils/whatsapp.js';
import { initialPackages } from '../src/config/initialData.js';

test('cleanWhatsAppPhone sanitizes various phone number formats to international 923372614742', () => {
  // Pakistani local 11-digit starting with 0
  assert.equal(cleanWhatsAppPhone('03372614742'), '923372614742');
  assert.equal(cleanWhatsAppPhone('03001234567'), '923001234567');

  // Formatted international starting with +92
  assert.equal(cleanWhatsAppPhone('+92 337 2614742'), '923372614742');
  assert.equal(cleanWhatsAppPhone('+92-337-2614742'), '923372614742');

  // Already clean
  assert.equal(cleanWhatsAppPhone('923372614742'), '923372614742');

  // Empty or invalid fallback
  assert.equal(cleanWhatsAppPhone(''), '923372614742');
  assert.equal(cleanWhatsAppPhone(null), '923372614742');
  assert.equal(cleanWhatsAppPhone(undefined), '923372614742');
});

test('buildWhatsAppUrl generates valid wa.me URL with encoded payload', () => {
  const url = buildWhatsAppUrl('03372614742', 'Hello WK Travel & Tours');
  assert.ok(url.startsWith('https://wa.me/923372614742?text='));
  assert.ok(url.includes(encodeURIComponent('Hello WK Travel & Tours')));
});

test('createCustomTripWhatsAppMessage formats structured custom enquiry with truth in pricing', () => {
  const msg = createCustomTripWhatsAppMessage({
    referenceId: 'WK-CUST-7788',
    customer: {
      fullName: 'Muhammad Usman',
      phone: '03331112233',
      city: 'Karachi',
      email: 'usman@example.com',
    },
    formValues: {
      tripType: 'family',
      destinations: 'Baku, Azerbaijan',
      departureCity: 'Karachi',
      adultsCount: 2,
      childrenCount: 2,
      approximateDate: '2026-12-15 to 2026-12-25',
      duration: '10 Days',
      hotelStandard: '4-Star',
      budgetPreference: 'Standard',
      servicesNeeded: ['Return Air Tickets', 'Hotel Accommodation', 'Visa Assistance'],
      preferredActivities: ['City Sightseeing', 'Cultural Tours'],
      notes: 'Baby cot needed in room.',
    },
  });

  assert.ok(msg.includes('CUSTOM TRIP PROPOSAL REQUEST - WK TRAVEL & TOURS'));
  assert.ok(msg.includes('Reference ID: WK-CUST-7788'));
  assert.ok(msg.includes('Family Vacation'));
  assert.ok(msg.includes('Baku, Azerbaijan'));
  assert.ok(msg.includes('4 pax (2 Adults, 2 Children)'));
  assert.ok(msg.includes('Based on Your Choice (Tailored Quotation)'));
  assert.ok(msg.includes('Return Air Tickets'));
  assert.ok(msg.includes('City Sightseeing'));
  assert.ok(msg.includes('Muhammad Usman'));
  assert.ok(msg.includes('03331112233'));
  assert.ok(msg.includes('Baby cot needed in room.'));
});

test('createCartWhatsAppMessage accurately formats standard, custom and mixed cart enquiries', () => {
  const standardPkg = initialPackages.find((p) => p.pricingBasis === 'per_person');
  const customPkg = initialPackages.find((p) => p.isCustomTripPromotion);

  assert.ok(standardPkg, 'Standard package must exist in initial data');
  assert.ok(customPkg, 'Custom promotion package must exist in initial data');

  const items = [
    {
      packageId: standardPkg.id,
      title: standardPkg.title,
      destination: standardPkg.destination,
      price: standardPkg.price,
      pricingBasis: standardPkg.pricingBasis,
      travellerCount: 2,
      travelDate: '2026-11-10',
    },
    {
      packageId: customPkg.id,
      title: customPkg.title,
      destination: customPkg.destination,
      price: 0,
      pricingBasis: 'custom',
      isCustomTrip: true,
      travellerCount: 4,
    },
  ];

  const grandTotal = standardPkg.price * 2;

  const msg = createCartWhatsAppMessage({
    customer: {
      fullName: 'Ayesha Tariq',
      phone: '03219876543',
      city: 'Lahore',
    },
    items,
    grandTotal,
    totalTravellers: 6,
    containsCustom: true,
    notes: 'Please verify flight connections from Lahore.',
  });

  assert.ok(msg.includes('BOOKING INQUIRY - WK TRAVEL & TOURS'));
  assert.ok(msg.includes('Ayesha Tariq'));
  assert.ok(msg.includes('03219876543'));
  assert.ok(msg.includes(standardPkg.title));
  assert.ok(msg.includes('Estimated Subtotal:'));
  assert.ok(msg.includes(customPkg.title));
  assert.ok(msg.includes('Pricing: Based on Your Choice (Tailored Quote Request)'));
  assert.ok(msg.includes('Calculated Package Total:'));
  assert.ok(msg.includes('+ Custom Itinerary Quote'));
  assert.ok(msg.includes('Please verify flight connections from Lahore.'));
});

test('createPackageEnquiryWhatsAppMessage formats single package inquiry truthfully', () => {
  const standardPkg = initialPackages.find((p) => p.category === 'solo');
  const customPkg = initialPackages.find((p) => p.isCustomTripPromotion);

  // Standard tour
  const standardMsg = createPackageEnquiryWhatsAppMessage({
    customer: { fullName: 'Bilal Ahmed', phone: '03005556677' },
    pkg: standardPkg,
    travellerCount: 1,
    travelDate: '2026-12-01',
  });

  assert.ok(standardMsg.includes('PACKAGE INQUIRY - WK TRAVEL & TOURS'));
  assert.ok(standardMsg.includes(standardPkg.title));
  assert.ok(standardMsg.includes('Bilal Ahmed'));
  assert.ok(standardMsg.includes('03005556677'));
  assert.ok(standardMsg.includes('Estimated Total:'));

  // Custom tour
  const customMsg = createPackageEnquiryWhatsAppMessage({
    customer: { fullName: 'Bilal Ahmed', phone: '03005556677' },
    pkg: customPkg,
    travellerCount: 2,
  });

  assert.ok(customMsg.includes(customPkg.title));
  assert.ok(customMsg.includes('*Pricing:* Based on Your Choice (Tailored Quote Request)'));
});
