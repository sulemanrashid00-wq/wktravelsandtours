const routes = [
  { path: '/', expect: 'WK Travel' },
  { path: '/packages', expect: 'Complete Package &amp; Visa Catalogue' },
  { path: '/packages/family-customized-package', expect: 'Based on Your Choice' },
  { path: '/packages/friends-vip-package', expect: 'Based on Your Choice' },
  { path: '/packages/honeymoon-customized-package', expect: 'Based on Your Choice' },
  { path: '/packages/4-in-1-visit-visa-package', expect: '65,000' },
  { path: '/custom-trip', expect: 'Custom' },
  { path: '/login', expect: 'Loading sign in portal' },
  { path: '/register', expect: 'Register' },
  { path: '/signup', expect: 'Register' },
  { path: '/admin', expect: 'Loading sign in portal' },
  { path: '/reviews', expect: 'Reviews' },
  { path: '/our-work', expect: 'Work' },
  { path: '/api/packages', expect: '4-in-1-visit-visa-package' }
];

async function run() {
  console.log('--- E2E ROUTE & DATA VERIFICATION ---');
  let allPass = true;
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3001${r.path}`);
      const text = await res.text();
      const hasExpect = text.includes(r.expect);
      const pass = (res.status === 200 || res.status === 307 || res.status === 308) && hasExpect;
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${r.path} -> Status: ${res.status}, Matches "${r.expect}": ${hasExpect}`);
      if (!pass) allPass = false;
    } catch (e) {
      console.error(`[FAIL] ${r.path} -> ${e.message}`);
      allPass = false;
    }
  }

  // Also verify API packages deactivates unverified visas
  try {
    const apiRes = await fetch('http://localhost:3001/api/packages');
    const json = await apiRes.json();
    const packages = json.data || json;
    const unverifiedSlugs = ['malaysia-tourist-evisa', 'thailand-tourist-visa', 'sri-lanka-visit-visa', 'indonesia-visit-visa'];
    const activeDuplicates = packages.filter(p => unverifiedSlugs.includes(p.slug) && p.isActive !== false);
    if (activeDuplicates.length === 0) {
      console.log('[PASS] /api/packages -> Correctly omits or flags inactive unverified duplicate visas');
    } else {
      console.error('[FAIL] /api/packages -> Still contains active unverified duplicate visas:', activeDuplicates.map(p => p.slug));
      allPass = false;
    }

    // Verify 4-in-1 visa exists and has price 65000
    const visa4in1 = packages.find(p => p.slug === '4-in-1-visit-visa-package');
    if (visa4in1 && visa4in1.price === 65000) {
      console.log('[PASS] /api/packages -> 4-in-1 Visit Visa package confirmed at PKR 65,000');
    } else {
      console.error('[FAIL] /api/packages -> 4-in-1 Visit Visa package missing or incorrect price:', visa4in1);
      allPass = false;
    }

    // Verify custom trip pricing compliance in initialPackages
    const customSlugs = ['family-customized-package', 'friends-vip-package', 'honeymoon-customized-package'];
    const customPkgs = packages.filter(p => customSlugs.includes(p.slug));
    const allCustomFlagged = customPkgs.every(p => p.isCustomTripPromotion === true && p.displayOrder === 1);
    if (allCustomFlagged) {
      console.log('[PASS] /api/packages -> Customized packages flagged with isCustomTripPromotion=true and displayOrder=1');
    } else {
      console.error('[FAIL] /api/packages -> Customized packages missing promotion flags:', customPkgs);
      allPass = false;
    }
  } catch (e) {
    console.error(`[FAIL] API check error: ${e.message}`);
    allPass = false;
  }

  if (!allPass) {
    console.error('\nVerification FAILED');
    process.exit(1);
  } else {
    console.log('\nAll E2E checks PASSED successfully!');
  }
}

run();

