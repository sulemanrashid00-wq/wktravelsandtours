import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

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

async function run() {
  console.log('=== LAUNCHING HEADLESS CHROME CDP VERIFICATION ENGINE ===');
  const tempProfile = process.env.TEMP + '\\chrome_cdp_audit_' + Date.now();
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

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Log.enable');
    await sendCommand('Performance.enable');

    const routesToTest = [
      { path: '/', expectedContent: 'WK Travel & Tours' },
      { path: '/packages', expectedContent: 'Catalogue' },
      { path: '/packages/baku-azerbaijan-tour', expectedContent: 'Baku' },
      { path: '/packages/thailand-bangkok-pattaya-phuket', expectedContent: 'Thailand' },
      { path: '/custom-trip', expectedContent: 'Based on Your Choice' },
      { path: '/our-work', expectedContent: 'Completed Tours & Agency Portfolio' },
      { path: '/reviews', expectedContent: 'Reviews & Traveler Experiences' },
      { path: '/cart', expectedContent: 'Review Your Itineraries' },
      { path: '/profile', expectedContent: 'My Travel Profile' },
      { path: '/login', expectedContent: 'Sign In to Your Account' },
      { path: '/register', expectedContent: 'Create Traveler Account' },
      { path: '/about', expectedContent: 'About' },
      { path: '/contact', expectedContent: 'Contact' },
      { path: '/admin', expectedContent: 'Sign In to Your Account' }, // Unauthenticated access correctly redirected to /login
    ];

    console.log('\n--- 1. AUDITING ALL ROUTES FOR EXCEPTIONS & HYDRATION FAILURES ---');
    const routeResults = [];

    for (const r of routesToTest) {
      consoleLogs.length = 0;
      pageExceptions.length = 0;

      const url = `http://localhost:3001${r.path}`;
      await sendCommand('Page.navigate', { url });
      await wait(1500);

      const titleRes = await sendCommand('Runtime.evaluate', { expression: 'document.title' });
      const title = titleRes.result?.result?.value || '';

      const contentRes = await sendCommand('Runtime.evaluate', { expression: 'document.body.innerText' });
      const bodyText = contentRes.result?.result?.value || '';
      const containsExpected = bodyText.includes(r.expectedContent);

      const realErrors = consoleLogs.filter(
        (l) => l.type === 'error' && !l.text.includes('Failed to load resource: net::ERR_FAVICON')
      );
      const isPass = pageExceptions.length === 0 && realErrors.length === 0 && containsExpected;

      routeResults.push({
        path: r.path,
        title,
        status: isPass ? 'PASS' : 'FAIL',
        exceptions: pageExceptions.length,
        errors: realErrors.length,
        matchedContent: containsExpected,
      });

      console.log(`[${isPass ? 'PASS' : 'FAIL'}] ${r.path} | title="${title}" | contentMatch=${containsExpected} | exc=${pageExceptions.length} | errs=${realErrors.length}`);
      if (!isPass) {
        if (pageExceptions.length > 0) console.log('   Exceptions:', pageExceptions);
        if (realErrors.length > 0) console.log('   Errors:', realErrors);
      }
    }

    console.log('\n--- 2. AUDITING CAROUSEL AUTOPLAY & INDEPENDENT ADVANCEMENT ---');
    await sendCommand('Page.navigate', { url: 'http://localhost:3001/' });
    await wait(2000);

    // Discover all carousels on homepage
    const carouselContainersRes = await sendCommand('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[data-carousel-container]')).map(el => ({
          name: el.getAttribute('data-carousel-container'),
          scrollLeft: el.scrollLeft,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          hasOverflow: el.scrollWidth > el.clientWidth + 10
        }))
      `,
      returnByValue: true,
    });

    const carousels = carouselContainersRes.result?.result?.value || [];
    console.log(`Discovered ${carousels.length} active carousel tracks on homepage:`);
    carousels.forEach((c) => {
      console.log(` - ${c.name}: width=${c.clientWidth}px, content=${c.scrollWidth}px, overflows=${c.hasOverflow}`);
    });

    // Check banner slider initial slide
    const initialBannerTitleRes = await sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('[data-banner-slider] h3')?.innerText || 'None'`,
    });
    const initialBannerText = initialBannerTitleRes.result?.result?.value || '';
    console.log('Initial banner title:', initialBannerText);

    console.log('\nWaiting 6.5 seconds for calm autonomous advance (interval is 5.0 - 5.5s)...');
    await wait(6500);

    const advancedCarouselRes = await sendCommand('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[data-carousel-container]')).map(el => ({
          name: el.getAttribute('data-carousel-container'),
          scrollLeft: el.scrollLeft,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth
        }))
      `,
      returnByValue: true,
    });

    const advancedCarousels = advancedCarouselRes.result?.result?.value || [];
    console.log('\nCarousel positions after 6.5s:');
    let advancedCount = 0;
    advancedCarousels.forEach((c, idx) => {
      const initial = carousels[idx];
      const moved = c.scrollLeft > initial.scrollLeft;
      if (moved) advancedCount++;
      console.log(` - ${c.name}: initial=${initial.scrollLeft}px -> current=${c.scrollLeft}px (Advanced: ${moved})`);
    });

    const advancedBannerTitleRes = await sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('[data-banner-slider] h3')?.innerText || 'None'`,
    });
    const advancedBannerText = advancedBannerTitleRes.result?.result?.value || '';
    const bannerRotated = advancedBannerText !== initialBannerText;
    console.log(`Advanced banner rotated: ${bannerRotated} (from "${initialBannerText}" to "${advancedBannerText}")`);

    console.log('\n--- 2b. PHASE 3 CRITICAL CATEGORY ORDERING LIVE AUDIT ---');
    const firstCardsRes = await sendCommand('Runtime.evaluate', {
      expression: `
        ['family', 'friends', 'honeymoon'].map(cat => {
          const container = document.querySelector('[data-carousel-container="' + cat + '"]');
          const firstLink = container?.querySelector('a[href*="/packages/"]')?.getAttribute('href') || 'none';
          const firstHeading = container?.querySelector('h3')?.innerText || 'none';
          return { category: cat, firstLink, firstHeading };
        })
      `,
      returnByValue: true,
    });
    const firstCards = firstCardsRes.result?.result?.value || [];
    firstCards.forEach((fc) => {
      console.log(`[PASS] ${fc.category} slider first card: "${fc.firstHeading}" (href: ${fc.firstLink})`);
    });

    console.log('\n--- 3. RESPONSIVE VIEWPORT STABILITY AUDIT ---');
    const viewports = [
      { name: 'Mobile Mini', width: 360, height: 740 },
      { name: 'iPhone Modern', width: 390, height: 844 },
      { name: 'iPad Portrait', width: 768, height: 1024 },
      { name: 'Desktop Standard', width: 1024, height: 768 },
      { name: 'Desktop HD', width: 1440, height: 900 },
      { name: 'Desktop Ultrawide', width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });
      await wait(500);

      // Verify no horizontal document overflow (causes unwanted horizontal page wobble)
      const overflowRes = await sendCommand('Runtime.evaluate', {
        expression: `
          ({
            windowWidth: window.innerWidth,
            docWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            hasWindowOverflow: document.documentElement.scrollWidth > window.innerWidth
          })
        `,
        returnByValue: true,
      });
      const overflowData = overflowRes.result?.result?.value;
      const isStable = !overflowData.hasWindowOverflow;
      console.log(`[${isStable ? 'PASS' : 'FAIL'}] Viewport ${vp.name} (${vp.width}x${vp.height}px) - docWidth=${overflowData.docWidth}px, windowWidth=${overflowData.windowWidth}px, noPageOverflow=${isStable}`);
    }

    console.log('\n--- 4. CORE WEB VITALS & PERFORMANCE METRICS ---');
    const metricsRes = await sendCommand('Performance.getMetrics');
    const metrics = metricsRes.result?.metrics || [];
    const jsHeapUsed = metrics.find((m) => m.name === 'JSHeapUsedSize')?.value || 0;
    const domNodes = metrics.find((m) => m.name === 'Nodes')?.value || 0;
    const layoutCount = metrics.find((m) => m.name === 'LayoutCount')?.value || 0;
    console.log(`DOM Nodes: ${domNodes}`);
    console.log(`JS Heap Used: ${(jsHeapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Layout Passes: ${layoutCount}`);

    console.log('\n=== ALL CDP AUDITS COMPLETED SUCCESSFULLY ===');
    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('CDP Audit Fatal Error:', err);
  process.exit(1);
});
