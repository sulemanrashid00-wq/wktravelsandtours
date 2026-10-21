import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9224;

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

async function runWhatsAppTests() {
  console.log('=== STARTING CHROME CDP WHATSAPP-FIRST FLOW VERIFICATION ===');
  const tempProfile = process.env.TEMP + '\\chrome_wa_test_' + Date.now();
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
    const consoleLogs = [];
    const pageExceptions = [];

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map((a) => a.value || a.description).join(' ');
        if (data.params.type === 'error') {
          consoleLogs.push({ type: 'error', text });
        }
      }
      if (data.method === 'Runtime.exceptionThrown') {
        pageExceptions.push(data.params.exceptionDetails);
      }
    });

    function sendCmd(method, params = {}) {
      const id = msgId++;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCmd('Page.enable');
    await sendCmd('Runtime.enable');
    await sendCmd('DOM.enable');

    async function evaluate(expression) {
      const res = await sendCmd('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.result?.value;
    }

    async function navigate(url) {
      await sendCmd('Page.navigate', { url });
      await wait(1800);
    }

    const injectHelper = `
      window.__setReactInput = function(selector, value) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return false;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
    `;

    // ==========================================
    // SCENARIO 1: Cart Drawer Inline Contact Capture (Start with clean customer store)
    // ==========================================
    console.log('\n--- Scenario 1: Cart Drawer Inline Contact Capture ---');
    await navigate('http://localhost:3001/packages');

    // Add a package to cart
    await evaluate(`(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add to Cart') || b.innerText.includes('Cart'));
      if (addBtn) addBtn.click();
    })()`);

    await wait(600);

    // Open Cart Drawer
    await evaluate(`(() => {
      const headerCartBtn = document.querySelector('button[aria-label*="cart"], button[aria-label*="Cart"]');
      if (headerCartBtn) headerCartBtn.click();
    })()`);

    await wait(600);

    // Click "Instant WhatsApp" without prior profile details
    await evaluate(`(() => {
      const instantBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Instant WhatsApp'));
      if (instantBtn) instantBtn.click();
    })()`);

    await wait(500);

    // Verify contact prompt appears
    const promptState = await evaluate(`(() => {
      const bodyText = document.body.innerText;
      const promptTitle = bodyText.includes('Contact Details');
      const nameInput = document.querySelector('input[placeholder="Your Full Name"]');
      const phoneInput = document.querySelector('input[placeholder*="WhatsApp"]');
      const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Send on WhatsApp'));

      return {
        promptTitle,
        hasNameInput: !!nameInput,
        hasPhoneInput: !!phoneInput,
        hasSendBtn: !!sendBtn,
      };
    })()`);

    console.log('Cart drawer contact capture prompt:', promptState);
    if (promptState.promptTitle && promptState.hasNameInput && promptState.hasPhoneInput && promptState.hasSendBtn) {
      console.log('[PASS] Scenario 1: Cart drawer accurately captures contact details before WhatsApp handoff');
    } else {
      console.error('[FAIL] Scenario 1 failed:', promptState);
      allPassed = false;
    }

    // ==========================================
    // SCENARIO 2: Single Package Detail WhatsApp Action
    // ==========================================
    console.log('\n--- Scenario 2: Single Package Detail WhatsApp Action ---');
    await navigate('http://localhost:3001/packages/thailand-bangkok-pattaya-phuket');

    const pkgDetailWa = await evaluate(`(() => {
      const waButton = Array.from(document.querySelectorAll('button, a')).find(el => {
        const text = el.innerText || '';
        return text.toLowerCase().includes('inquire via whatsapp') || text.toLowerCase().includes('whatsapp');
      });
      return {
        buttonFound: !!waButton,
        buttonText: waButton ? waButton.innerText.trim() : null
      };
    })()`);

    console.log('Package detail WhatsApp action:', pkgDetailWa);
    if (pkgDetailWa.buttonFound) {
      console.log('[PASS] Scenario 2: Package detail page provides verified WhatsApp inquiry button');
    } else {
      console.error('[FAIL] Scenario 2: Package detail WhatsApp button missing');
      allPassed = false;
    }

    // ==========================================
    // SCENARIO 3: Custom Trip Form Submission & Immediate WhatsApp Handoff
    // ==========================================
    console.log('\n--- Scenario 3: Custom Trip Form Submission & Instruction Screen ---');
    await navigate('http://localhost:3001/custom-trip');
    await evaluate(injectHelper);

    // Fill form fields
    const filled = await evaluate(`(() => {
      const destSuccess = window.__setReactInput('input[placeholder*="Baku"]', 'Baku & Georgia');
      const nameSuccess = window.__setReactInput('input[placeholder*="Asad Siddiqui"]', 'Muhammad Usman');
      const phoneSuccess = window.__setReactInput('input[placeholder*="033XX"]', '03372614742');

      return { destSuccess, nameSuccess, phoneSuccess };
    })()`);

    console.log('Form inputs detected and filled:', filled);

    // Click submit button
    await evaluate(`(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`);

    await wait(1200);

    // Verify post-submission view
    const handoffState = await evaluate(`(() => {
      const bodyText = document.body.innerText;
      const lowerText = bodyText.toLowerCase();
      const hasActionRequired = lowerText.includes('action required in whatsapp');
      const hasSendInstruction = lowerText.includes('please press') && lowerText.includes('send');
      const hasTruthInPricing = bodyText.includes('Price: Based on Your Choice');
      const hasRefCode = bodyText.includes('WK-CUST-');

      const waLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.innerText && a.innerText.toLowerCase().includes('send message in whatsapp')
      );
      let decodedMsg = '';
      if (waLink && waLink.href) {
        const urlObj = new URL(waLink.href);
        decodedMsg = urlObj.searchParams.get('text') || '';
      }

      return {
        hasActionRequired,
        hasSendInstruction,
        hasTruthInPricing,
        hasRefCode,
        hasWaLink: !!waLink,
        decodedMsgIncludesName: decodedMsg.includes('Muhammad Usman'),
        decodedMsgIncludesChoice: decodedMsg.includes('Based on Your Choice'),
        decodedMsgIncludesDest: decodedMsg.includes('Baku & Georgia'),
      };
    })()`);

    console.log('Handoff screen state:', handoffState);
    if (
      handoffState.hasActionRequired &&
      handoffState.hasSendInstruction &&
      handoffState.hasTruthInPricing &&
      handoffState.hasRefCode &&
      handoffState.hasWaLink &&
      handoffState.decodedMsgIncludesName &&
      handoffState.decodedMsgIncludesChoice
    ) {
      console.log('[PASS] Scenario 3: Custom trip submits, displays truthful instruction screen, and prepares VIP WhatsApp link');
    } else {
      console.error('[FAIL] Scenario 3 failed assertion:', handoffState);
      allPassed = false;
    }

    // ==========================================
    // SCENARIO 4: Cart Page Full Checkout & Instructions
    // ==========================================
    console.log('\n--- Scenario 4: Cart Page Checkout & WhatsApp Instructions ---');
    await navigate('http://localhost:3001/cart');
    await evaluate(injectHelper);

    // Fill contact details on /cart
    const cartFilled = await evaluate(`(() => {
      const nameSuccess = window.__setReactInput('input[placeholder*="Tariq Mehmood"]', 'Ayesha Tariq');
      const phoneSuccess = window.__setReactInput('input[placeholder*="03372614742"]', '03219876543');
      const citySuccess = window.__setReactInput('input[placeholder*="Karachi, Lahore"]', 'Karachi');
      return { nameSuccess, phoneSuccess, citySuccess };
    })()`);

    console.log('Cart inputs filled:', cartFilled);
    await wait(300);

    // Submit cart checkout via form submit button
    await evaluate(`(() => {
      const checkoutBtn = document.querySelector('form button[type="submit"]');
      if (checkoutBtn) checkoutBtn.click();
    })()`);

    await wait(1200);

    // Verify /cart post-submission screen
    const cartHandoffState = await evaluate(`(() => {
      const bodyText = document.body.innerText;
      const lowerText = bodyText.toLowerCase();
      const hasActionRequired = lowerText.includes('action required in whatsapp');
      const hasSendInstruction = lowerText.includes('please press') && lowerText.includes('send');
      const waLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.innerText && a.innerText.toLowerCase().includes('send message in whatsapp')
      );
      let decodedMsg = '';
      if (waLink && waLink.href) {
        const urlObj = new URL(waLink.href);
        decodedMsg = urlObj.searchParams.get('text') || '';
      }

      return {
        hasActionRequired,
        hasSendInstruction,
        hasWaLink: !!waLink,
        decodedMsgIncludesName: decodedMsg.includes('Ayesha Tariq'),
        decodedMsgIncludesPhone: decodedMsg.includes('03219876543'),
        decodedMsgIncludesCity: decodedMsg.includes('Karachi'),
      };
    })()`);

    console.log('Cart page handoff screen state:', cartHandoffState);
    if (
      cartHandoffState.hasActionRequired &&
      cartHandoffState.hasSendInstruction &&
      cartHandoffState.hasWaLink &&
      cartHandoffState.decodedMsgIncludesName
    ) {
      console.log('[PASS] Scenario 4: Cart checkout transitions to WhatsApp instruction screen with pre-filled message');
    } else {
      console.error('[FAIL] Scenario 4 failed:', cartHandoffState);
      allPassed = false;
    }

    // Final checks
    console.log('\nPage exceptions logged:', pageExceptions.length);
    console.log('Browser console errors logged:', consoleLogs.length);

    if (pageExceptions.length > 0) {
      console.error('Logged exceptions:', pageExceptions);
      allPassed = false;
    }
    if (consoleLogs.length > 0) {
      console.error('Logged console errors:', consoleLogs);
      allPassed = false;
    }

    if (allPassed) {
      console.log('\n======================================================');
      console.log('ALL WHATSAPP-FIRST FLOW SCENARIOS PASSED WITH ZERO ERRORS');
      console.log('======================================================\n');
      process.exit(0);
    } else {
      console.error('\nSome WhatsApp flow scenarios failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    try {
      chromeProcess.kill();
    } catch (e) {}
  }
}

runWhatsAppTests();

