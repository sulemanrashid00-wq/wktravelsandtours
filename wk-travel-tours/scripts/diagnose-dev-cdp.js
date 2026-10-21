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

async function run() {
  console.log('=== RUNNING DEV SERVER CDP DIAGNOSTIC AUDIT (PORT 3005) ===');
  const tempProfile = process.env.TEMP + '\\chrome_cdp_dev_' + Date.now();
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

    const routes = [
      '/',
      '/packages',
      '/packages/thailand-bangkok-pattaya-phuket',
      '/custom-trip',
      '/our-work',
      '/reviews',
      '/cart',
      '/profile',
      '/login',
      '/register',
      '/about',
      '/contact',
    ];

    console.log('\n--- DIAGNOSING DEV SERVER FOR WEBPACK UNDEFINED.CALL & EXCEPTIONS ---');

    for (const path of routes) {
      consoleLogs.length = 0;
      pageExceptions.length = 0;

      const url = `http://localhost:3005${path}`;
      await sendCommand('Page.navigate', { url });
      // In dev mode, Next compiles on-demand on first visit
      await wait(3000);

      const titleRes = await sendCommand('Runtime.evaluate', { expression: 'document.title' });
      const title = titleRes.result?.result?.value || '';

      const bodyTextRes = await sendCommand('Runtime.evaluate', { expression: 'document.body.innerText' });
      const bodyText = bodyTextRes.result?.result?.value || '';

      const hasAppError = bodyText.includes('Application error') || bodyText.includes('a client-side exception has occurred');
      const hasWebpackError = bodyText.includes('Cannot read properties of undefined');

      const realErrors = consoleLogs.filter(
        (l) => l.type === 'error' && !l.text.includes('favicon.ico')
      );

      const status = pageExceptions.length === 0 && !hasAppError && !hasWebpackError ? 'PASS' : 'FAIL';

      console.log(`[${status}] ${path} | title="${title}" | exc=${pageExceptions.length} | appError=${hasAppError} | webpackError=${hasWebpackError}`);
      if (pageExceptions.length > 0) {
        console.log('   Exceptions:', JSON.stringify(pageExceptions, null, 2));
      }
      if (realErrors.length > 0) {
        console.log('   Console Errors:', realErrors.map(e => e.text));
      }
    }

    console.log('\n=== DEV SERVER DIAGNOSTIC COMPLETED ===');
    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('Diagnostic Fatal Error:', err);
  process.exit(1);
});

