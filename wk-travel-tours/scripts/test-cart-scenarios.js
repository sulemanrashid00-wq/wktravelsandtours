import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {
      // retry
    }
    await wait(300);
  }
  throw new Error('Chrome remote debugger failed to start');
}

async function runCartTests() {
  console.log('=== STARTING CHROME CDP CART & BOOKING FLOW VERIFICATION ===');
  const tempProfile = process.env.TEMP + '\\chrome_cart_test_' + Date.now();
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      `--user-data-dir=${tempProfile}`,
    ],
    { stdio: 'ignore' }
  );

  let allPassed = true;

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to Chrome DevTools Protocol at:', wsUrl);

    const newPageRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const target = await newPageRes.json();
    const pageWsUrl = target.webSocketDebuggerUrl;

    const ws = new WebSocket(pageWsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let messageId = 1;
    const callbacks = new Map();
    const consoleLogs = [];
    const pageExceptions = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => (a.value !== undefined ? a.value : a.description || '')).join(' ');
        consoleLogs.push({ type: msg.params.type, text });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        pageExceptions.push(msg.params.exceptionDetails);
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = messageId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evalCode(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.result?.value;
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Log.enable');

    // SCENARIO 1: Open & Close Empty Cart from Header on /profile
    console.log('\n--- Scenario 1: Empty Cart Drawer on /profile ---');
    await sendCommand('Page.navigate', { url: 'http://localhost:3001/profile' });
    await wait(1800);

    // Verify initial cart badge is absent / 0
    const initialBadge = await evalCode(`document.querySelector('header button[aria-label*="Open cart"] span')?.innerText || 'none'`);
    console.log(`Initial header cart badge: ${initialBadge}`);

    // Click cart button in header
    await evalCode(`document.querySelector('header button[aria-label*="Open cart"]').click()`);
    await wait(400);

    // Verify drawer is open and scroll is locked
    const isDialogOpen = await evalCode(`document.querySelector('[role="dialog"]') !== null`);
    const overflowAfterOpen = await evalCode(`document.body.style.overflow`);
    const titleText = await evalCode(`document.getElementById('cart-drawer-title')?.innerText || ''`);
    const emptyHeading = await evalCode(`document.querySelector('[role="dialog"] h3')?.innerText || ''`);
    const emptySubtext = await evalCode(`document.querySelector('[role="dialog"] p')?.innerText || ''`);
    const exploreBtnText = await evalCode(`document.querySelector('[role="dialog"] button:has-text, [role="dialog"] button')?.innerText || ''`);

    console.log(`Drawer open: ${isDialogOpen}, Title: "${titleText}", Overflow locked: "${overflowAfterOpen}"`);
    console.log(`Empty Heading: "${emptyHeading}"`);
    console.log(`Empty Subtext: "${emptySubtext}"`);

    const s1Pass =
      isDialogOpen &&
      titleText.includes('Selected Packages (0)') &&
      overflowAfterOpen === 'hidden' &&
      emptyHeading.includes('Your journey starts here') &&
      emptySubtext.includes('Your selected travel packages will appear here when you');

    console.log(`[${s1Pass ? 'PASS' : 'FAIL'}] Scenario 1: Empty cart displays exact required copy & locks background scroll`);
    if (!s1Pass) allPassed = false;

    // Test close via Escape key
    console.log('\n--- Scenario 2: Close via Escape Key ---');
    await evalCode(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await wait(300);

    const isClosedAfterEsc = await evalCode(`document.querySelector('[role="dialog"]') === null`);
    const overflowAfterEsc = await evalCode(`document.body.style.overflow`);
    console.log(`Drawer closed after Escape: ${isClosedAfterEsc}, Overflow restored: "${overflowAfterEsc === ''}"`);

    const s2Pass = isClosedAfterEsc && overflowAfterEsc === '';
    console.log(`[${s2Pass ? 'PASS' : 'FAIL'}] Scenario 2: Escape key closes drawer and restores scroll`);
    if (!s2Pass) allPassed = false;

    // SCENARIO 3: Open cart from Profile quick status card
    console.log('\n--- Scenario 3: Open Cart from Profile Quick Status ---');
    await evalCode(`
      const profileOpenBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open Drawer'));
      if (profileOpenBtn) profileOpenBtn.click();
    `);
    await wait(400);

    const isProfileOpen = await evalCode(`document.querySelector('[role="dialog"]') !== null`);
    console.log(`Drawer opened via profile button: ${isProfileOpen}`);

    // Click backdrop to close
    await evalCode(`document.querySelector('[role="dialog"] [aria-hidden="true"]').click()`);
    await wait(300);

    const isClosedAfterBackdrop = await evalCode(`document.querySelector('[role="dialog"]') === null`);
    console.log(`Drawer closed via backdrop click: ${isClosedAfterBackdrop}`);

    const s3Pass = isProfileOpen && isClosedAfterBackdrop;
    console.log(`[${s3Pass ? 'PASS' : 'FAIL'}] Scenario 3: Profile page trigger and backdrop closing work seamlessly`);
    if (!s3Pass) allPassed = false;

    // SCENARIO 4: Test Explore Packages navigation button
    console.log('\n--- Scenario 4: Explore Packages button navigation ---');
    await evalCode(`document.querySelector('header button[aria-label*="Open cart"]').click()`);
    await wait(300);

    await evalCode(`
      const exploreBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('Explore Packages'));
      if (exploreBtn) exploreBtn.click();
    `);
    await wait(1000);

    const currentUrl = await evalCode(`window.location.pathname`);
    const isClosedAfterExplore = await evalCode(`document.querySelector('[role="dialog"]') === null`);
    console.log(`Navigated to: ${currentUrl}, Drawer closed: ${isClosedAfterExplore}`);

    const s4Pass = currentUrl === '/packages' && isClosedAfterExplore;
    console.log(`[${s4Pass ? 'PASS' : 'FAIL'}] Scenario 4: Explore Packages button navigates to /packages and closes drawer`);
    if (!s4Pass) allPassed = false;

    // SCENARIO 5: Add Packages to Cart & Verify Synchronized State
    console.log('\n--- Scenario 5: Add Standard Package & Custom Trip to Cart ---');
    // Add standard package directly via cartStore on client
    await evalCode(`
      // Fetch initial packages or add verified items
      const cartStore = window.localStorage.getItem('wk_cart_storage');
      // Use cartStore actions
      const addRes = (function() {
        // Access React fiber or trigger Add to Cart button on page
        const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add to Cart'));
        if (addBtn) {
          addBtn.click();
          return 'clicked_card_button';
        }
        return 'no_btn_found';
      })();
    `);
    await wait(500);

    // Verify header badge updated
    const headerBadgeAfterAdd = await evalCode(`document.querySelector('header button[aria-label*="Open cart"] span')?.innerText || 'none'`);
    console.log(`Header badge after adding: ${headerBadgeAfterAdd}`);

    // Open drawer to inspect selected package
    await evalCode(`document.querySelector('header button[aria-label*="Open cart"]').click()`);
    await wait(400);

    const drawerTitleAfterAdd = await evalCode(`document.getElementById('cart-drawer-title')?.innerText || ''`);
    const itemCountInDrawer = await evalCode(`document.querySelectorAll('[role="dialog"] .overflow-y-auto > div').length`);
    console.log(`Drawer title: "${drawerTitleAfterAdd}", Item cards in drawer: ${itemCountInDrawer}`);

    const s5Pass = headerBadgeAfterAdd === '1' && drawerTitleAfterAdd.includes('Selected Packages (1)');
    console.log(`[${s5Pass ? 'PASS' : 'FAIL'}] Scenario 5: Package addition updates header badge & drawer immediately`);
    if (!s5Pass) allPassed = false;

    // SCENARIO 6: Add Custom Trip Package & Test Truth-in-Pricing
    console.log('\n--- Scenario 6: Custom Trip Package Truth-in-Pricing ---');
    await evalCode(`
      // Close drawer first
      const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close cart drawer"]');
      if (closeBtn) closeBtn.click();
    `);
    await wait(300);

    // Add a custom package using localStorage / store
    await evalCode(`
      const raw = localStorage.getItem('wk_cart_storage');
      let state = raw ? JSON.parse(raw) : { state: { items: [] } };
      state.state.items.push({
        packageId: 'pkg-11',
        title: 'Family Customized Package: Journeys Beyond Boundaries',
        slug: 'family-customized-package',
        destination: 'Asia & Middle East',
        duration: '7 Days / 6 Nights',
        price: 0,
        pricingBasis: 'custom',
        isCustomTrip: true,
        primaryImage: '/images/packages/family-customized-package.jpeg',
        travellerCount: 4,
        travelDate: 'Late Dec 2026'
      });
      localStorage.setItem('wk_cart_storage', JSON.stringify(state));
      window.location.reload();
    `);
    await wait(1800);

    // Header badge should now be 2
    const badgeAfterCustom = await evalCode(`document.querySelector('header button[aria-label*="Open cart"] span')?.innerText || 'none'`);
    console.log(`Header badge after adding custom package: ${badgeAfterCustom}`);

    // Open drawer and check price display
    await evalCode(`document.querySelector('header button[aria-label*="Open cart"]').click()`);
    await wait(400);

    const drawerBodyText = await evalCode(`document.querySelector('[role="dialog"] .overflow-y-auto')?.innerText || ''`);
    const hasBasedOnChoice = drawerBodyText.includes('Price: Based on Your Choice');
    const hasCustomQuote = drawerBodyText.includes('Custom Quote');
    console.log(`Custom trip displays "Price: Based on Your Choice": ${hasBasedOnChoice}`);
    console.log(`Custom trip displays subtotal "Custom Quote": ${hasCustomQuote}`);

    const s6Pass = badgeAfterCustom === '2' && hasBasedOnChoice && hasCustomQuote;
    console.log(`[${s6Pass ? 'PASS' : 'FAIL'}] Scenario 6: Custom trip displays "Price: Based on Your Choice" and does not invent fake numbers`);
    if (!s6Pass) allPassed = false;

    // SCENARIO 7: Mobile Viewport Stacking & Layout Verification
    console.log('\n--- Scenario 7: Mobile Viewport (375px) Stacking & Dimensions ---');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(400);

    const drawerRect = await evalCode(`(() => {
      const panel = document.querySelector('[role="dialog"] > div:last-child');
      if (!panel) return null;
      const rect = panel.getBoundingClientRect();
      return { width: Math.round(rect.width), left: Math.round(rect.left), right: Math.round(rect.right) };
    })()`);
    console.log('Mobile drawer dimensions:', drawerRect);

    // Verify WhatsApp button is NOT covering checkout button
    const zIndexes = await evalCode(`(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const wa = document.querySelector('aside[aria-label="Quick WhatsApp Contact"]');
      return {
        dialogZ: dialog ? window.getComputedStyle(dialog).zIndex : 'none',
        waZ: wa ? window.getComputedStyle(wa).zIndex : 'none'
      };
    })()`);
    console.log('Z-Index Stacking order:', zIndexes);

    const s7Pass =
      drawerRect &&
      drawerRect.width >= 350 &&
      parseInt(zIndexes.dialogZ, 10) > parseInt(zIndexes.waZ, 10);

    console.log(`[${s7Pass ? 'PASS' : 'FAIL'}] Scenario 7: Mobile drawer takes full safe width and dialog (z-${zIndexes.dialogZ}) sits above WhatsApp widget (z-${zIndexes.waZ})`);
    if (!s7Pass) allPassed = false;

    // Reset device metrics
    await sendCommand('Emulation.clearDeviceMetricsOverride');
    await wait(200);

    // SCENARIO 8: Remove Package and Clear Cart
    console.log('\n--- Scenario 8: Remove Package and Verify Immediate Update ---');
    await evalCode(`
      const removeBtns = Array.from(document.querySelectorAll('[role="dialog"] button')).filter(b => b.innerText.includes('Remove'));
      if (removeBtns[0]) removeBtns[0].click();
    `);
    await wait(300);

    const countAfterRemove = await evalCode(`document.querySelectorAll('[role="dialog"] .overflow-y-auto > div').length`);
    console.log(`Item count after removing one package: ${countAfterRemove}`);

    // Click Clear Cart
    await evalCode(`
      const clearBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('Clear Cart'));
      if (clearBtn) clearBtn.click();
    `);
    await wait(300);

    const emptyAfterClear = await evalCode(`document.querySelector('[role="dialog"] h3')?.innerText || ''`);
    console.log(`Empty state after clearing cart: "${emptyAfterClear}"`);

    const s8Pass = countAfterRemove === 1 && emptyAfterClear.includes('Your journey starts here');
    console.log(`[${s8Pass ? 'PASS' : 'FAIL'}] Scenario 8: Package removal & Clear Cart transition cleanly to empty state`);
    if (!s8Pass) allPassed = false;

    // Close drawer
    await evalCode(`document.querySelector('[role="dialog"] [aria-hidden="true"]').click()`);
    await wait(300);

    // Check Console errors
    const realErrors = consoleLogs.filter(
      (l) => l.type === 'error' && !l.text.includes('ERR_FAVICON')
    );
    console.log(`\nPage exceptions logged: ${pageExceptions.length}`);
    console.log(`Browser console errors logged: ${realErrors.length}`);

    if (pageExceptions.length > 0) {
      console.error('Exceptions:', pageExceptions);
      allPassed = false;
    }
    if (realErrors.length > 0) {
      console.error('Errors:', realErrors);
      allPassed = false;
    }

  } catch (err) {
    console.error('CDP test failed with error:', err);
    allPassed = false;
  } finally {
    chromeProcess.kill('SIGKILL');
  }

  if (allPassed) {
    console.log('\n======================================================');
    console.log('ALL CART & BOOKING FLOW SCENARIOS PASSED WITH ZERO ERRORS');
    console.log('======================================================');
    process.exit(0);
  } else {
    console.error('\nOne or more scenarios FAILED.');
    process.exit(1);
  }
}

runCartTests();
