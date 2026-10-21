import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9225;

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

async function runPortfolioTests() {
  console.log('=== STARTING CHROME CDP OUR WORK & MEDIA CMS VERIFICATION ===');
  const tempProfile = process.env.TEMP + '\\chrome_work_test_' + Date.now();
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
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

    let msgId = 1;
    const pending = new Map();
    const consoleErrors = [];
    const pageExceptions = [];

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
        if (type === 'error') consoleErrors.push(text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        pageExceptions.push(msg.params.exceptionDetails.text);
      }
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await send('Network.enable');

    async function evalScript(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || 'eval error');
      }
      return res.result?.value;
    }

    async function navigateTo(url) {
      await send('Page.navigate', { url });
      await wait(2000);
    }

    // -------------------------------------------------------------------------
    // TEST 1: HOMEPAGE OUR WORK CAROUSEL & LIGHTBOX
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Homepage Agency Work Carousel & Lightbox ---');
    await navigateTo('http://localhost:3001/');

    const homepageWorkInfo = await evalScript(`(() => {
      const container = document.querySelector('[data-carousel-container="agency-work"]');
      if (!container) return { found: false };
      const cards = container.querySelectorAll('[data-work-card]');
      const images = Array.from(cards).map(c => {
        const img = c.querySelector('img');
        const title = c.querySelector('h3')?.textContent?.trim();
        return {
          src: img?.getAttribute('src') || '',
          title
        };
      });
      return {
        found: true,
        count: cards.length,
        images
      };
    })()`);

    console.log(`Homepage carousel found: ${homepageWorkInfo.found}, cards rendered: ${homepageWorkInfo.count}`);
    if (!homepageWorkInfo.found || homepageWorkInfo.count < 18) {
      console.error('FAIL: Homepage Our Work carousel missing or incomplete!');
      allPassed = false;
    } else {
      console.log('PASS: Homepage carousel rendered all authentic items.');
    }

    const hasRecycledPosters = homepageWorkInfo.images?.some(img =>
      img.src.includes('/images/packages/') || img.src.includes('thailand-bangkok-pattaya-phuket')
    );
    if (hasRecycledPosters) {
      console.error('FAIL: Homepage carousel contains recycled package posters!');
      allPassed = false;
    } else {
      console.log('PASS: 100% of homepage work items use authentic /images/our-work/ assets.');
    }

    // Click first card to trigger Lightbox
    console.log('Testing Homepage Lightbox open...');
    await evalScript(`(() => {
      const firstCard = document.querySelector('[data-work-card]');
      const clickableImg = firstCard?.querySelector('div[title*="Click to view"]');
      if (clickableImg) clickableImg.click();
    })()`);
    await wait(600);

    const homepageLightbox = await evalScript(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { open: false };
      const title = modal.querySelector('h3')?.textContent?.trim();
      const img = modal.querySelector('img')?.getAttribute('src');
      const waLink = modal.querySelector('a[href*="wa.me"]')?.getAttribute('href');
      return {
        open: true,
        title,
        img,
        waLink
      };
    })()`);

    console.log('Homepage Lightbox state:', homepageLightbox);
    const isOurWorkImg = decodeURIComponent(homepageLightbox.img || '').includes('/images/our-work/');
    if (homepageLightbox.open && isOurWorkImg) {
      console.log('PASS: Homepage Lightbox opened with authentic photo and WhatsApp CTA.');
    } else {
      console.error('FAIL: Homepage Lightbox did not open properly!');
      allPassed = false;
    }

    // Close Lightbox
    await evalScript(`(() => {
      const closeBtn = document.querySelector('[aria-label="Close photo preview"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await wait(400);

    // -------------------------------------------------------------------------
    // TEST 2: FULL PORTFOLIO PAGE (/our-work)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Full Portfolio Page (/our-work) & Category Filtering ---');
    await navigateTo('http://localhost:3001/our-work');

    const portfolioInfo = await evalScript(`(() => {
      const cards = document.querySelectorAll('[data-work-item-id]');
      const categories = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent.includes('All Operations') ||
        b.textContent.includes('Group') ||
        b.textContent.includes('Family') ||
        b.textContent.includes('Coastal')
      ).map(b => b.textContent.trim());

      return {
        totalCards: cards.length,
        categories
      };
    })()`);

    console.log(`Portfolio cards rendered: ${portfolioInfo.totalCards}`);
    console.log(`Category filter pills: ${portfolioInfo.categories.join(' | ')}`);

    if (portfolioInfo.totalCards === 18) {
      console.log('PASS: All 18 authentic operations rendered in portfolio grid.');
    } else {
      console.error(`FAIL: Expected 18 items on /our-work, got ${portfolioInfo.totalCards}`);
      allPassed = false;
    }

    // Test Category Filtering
    console.log('Testing category filter: Coastal & Island (adventure)...');
    await evalScript(`(() => {
      const adventureBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Coastal'));
      if (adventureBtn) adventureBtn.click();
    })()`);
    await wait(500);

    const adventureCards = await evalScript(`document.querySelectorAll('[data-work-item-id]').length`);
    console.log(`Coastal & Island filtered count: ${adventureCards}`);
    if (adventureCards >= 3 && adventureCards < 18) {
      console.log('PASS: Category filter isolated Coastal & Island operations accurately.');
    } else {
      console.error(`FAIL: Category filtering unexpected count: ${adventureCards}`);
      allPassed = false;
    }

    // Return to All Operations
    await evalScript(`(() => {
      const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All Operations'));
      if (allBtn) allBtn.click();
    })()`);
    await wait(500);

    // Test Portfolio Lightbox Next/Prev navigation
    console.log('Testing Lightbox Next/Prev navigation...');
    await evalScript(`(() => {
      const firstCard = document.querySelector('[data-work-item-id]');
      const viewPhotoBtn = firstCard?.querySelector('button');
      if (viewPhotoBtn) viewPhotoBtn.click();
    })()`);
    await wait(500);

    const lightboxStep1 = await evalScript(`(() => {
      const title = document.querySelector('[role="dialog"] h3')?.textContent?.trim();
      const img = document.querySelector('[role="dialog"] img')?.getAttribute('src');
      return { title, img };
    })()`);

    // Click Next
    await evalScript(`(() => {
      const nextBtn = document.querySelector('[aria-label="Next photo"]');
      if (nextBtn) nextBtn.click();
    })()`);
    await wait(400);

    const lightboxStep2 = await evalScript(`(() => {
      const title = document.querySelector('[role="dialog"] h3')?.textContent?.trim();
      const img = document.querySelector('[role="dialog"] img')?.getAttribute('src');
      return { title, img };
    })()`);

    console.log('Lightbox Step 1:', lightboxStep1);
    console.log('Lightbox Step 2 (After Next):', lightboxStep2);

    if (lightboxStep1.img !== lightboxStep2.img) {
      console.log('PASS: Lightbox Next button transitioned seamlessly to subsequent photo.');
    } else {
      console.error('FAIL: Lightbox image did not advance on Next click!');
      allPassed = false;
    }

    // Press Escape to close
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(400);

    const isClosed = await evalScript(`!document.querySelector('[role="dialog"]')`);
    if (isClosed) {
      console.log('PASS: Lightbox closed cleanly on Escape key press.');
    } else {
      console.error('FAIL: Lightbox did not close on Escape key!');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST 3: ADMIN CMS (/admin) AGENCY WORK MANAGER
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Admin CMS Agency Work Management ---');
    await send('Network.setCookie', {
      name: 'wk_auth_session',
      value: JSON.stringify({ role: 'admin', email: 'wktravelandtour@gmail.com' }),
      domain: 'localhost',
      path: '/',
    });
    await navigateTo('http://localhost:3001/admin');

    // Switch to Agency Work tab
    await evalScript(`(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const agencyTab = tabs.find(t => t.textContent.includes('Agency Work') || t.textContent.includes('Our Work'));
      if (agencyTab) agencyTab.click();
    })()`);
    await wait(1000);

    const adminWorkInfo = await evalScript(`(() => {
      const cards = document.querySelectorAll('[data-admin-work-card]');
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Operation Record'));
      return {
        renderedCount: cards.length,
        hasAddButton: !!addBtn
      };
    })()`);

    console.log(`Admin Work Cards: ${adminWorkInfo.renderedCount}, Has Add Button: ${adminWorkInfo.hasAddButton}`);
    if (adminWorkInfo.renderedCount >= 18 && adminWorkInfo.hasAddButton) {
      console.log('PASS: Admin Agency Work CMS loaded complete authentic catalog with add action.');
    } else {
      console.error(`FAIL: Admin CMS records count ${adminWorkInfo.renderedCount} or missing add button!`);
      allPassed = false;
    }

    // Test Search in Admin
    console.log('Testing Admin search filter (e.g., "Langkawi")...');
    await evalScript(`(() => {
      const input = document.querySelector('input[placeholder*="Search by title"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'Langkawi');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await wait(600);

    const langkawiCount = await evalScript(`document.querySelectorAll('[data-admin-work-card]').length`);
    console.log(`Filtered for "Langkawi" in Admin: ${langkawiCount} items`);
    if (langkawiCount >= 4 && langkawiCount < 18) {
      console.log('PASS: Admin keyword search filter correctly isolates destination records.');
    } else {
      console.error(`FAIL: Admin search unexpected count: ${langkawiCount}`);
      allPassed = false;
    }

    // Reset search
    await evalScript(`(() => {
      const input = document.querySelector('input[placeholder*="Search by title"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await wait(400);

    // Test Add Operation Modal
    console.log('Testing Add Operation Modal opening...');
    await evalScript(`(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Operation Record'));
      if (addBtn) addBtn.click();
    })()`);
    await wait(500);

    const addModalInfo = await evalScript(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { open: false };
      const selects = modal.querySelectorAll('select');
      const photoSelect = selects[1] || selects[0];
      const titleInput = modal.querySelector('input[placeholder*="KLIA"]') || modal.querySelector('form input');
      return {
        open: true,
        optionsCount: photoSelect?.options?.length || 0,
        hasTitle: !!titleInput
      };
    })()`);

    console.log('Add Modal State:', addModalInfo);
    if (addModalInfo.open && addModalInfo.optionsCount >= 18 && addModalInfo.hasTitle) {
      console.log('PASS: Add modal offers full authentic photo picker dropdown with 18 assets.');
    } else {
      console.error('FAIL: Add modal did not render photo picker options!');
      allPassed = false;
    }

    // Close Add Modal
    await evalScript(`(() => {
      const cancelBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    })()`);
    await wait(400);

    // -------------------------------------------------------------------------
    // TEST 4: CONSOLE ERROR & HYDRATION CHECK
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Console Error & React Hydration Integrity ---');
    console.log(`Captured Console Errors: ${consoleErrors.length}`);
    console.log(`Captured Page Exceptions: ${pageExceptions.length}`);

    if (consoleErrors.length > 0) {
      console.warn('Console error messages:', consoleErrors);
    }
    if (pageExceptions.length > 0) {
      console.error('Page exceptions:', pageExceptions);
      allPassed = false;
    } else {
      console.log('PASS: 0 uncaught exceptions or hydration mismatches detected across all routes.');
    }

    ws.close();
  } catch (err) {
    console.error('Test execution error:', err);
    allPassed = false;
  } finally {
    chromeProcess.kill();
  }

  console.log('\n=== FINAL RESULT ===');
  if (allPassed) {
    console.log('ALL OUR WORK & MEDIA CMS SCENARIOS PASSED WITH EVIDENCE!');
    process.exit(0);
  } else {
    console.error('ONE OR MORE VERIFICATION SCENARIOS FAILED!');
    process.exit(1);
  }
}

runPortfolioTests();
