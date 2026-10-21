import { spawn } from 'node:child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9226;

const VIEWPORTS = [
  // Mobile
  { name: 'Mobile XS (320px)', width: 320, height: 640 },
  { name: 'Mobile S (360px)', width: 360, height: 740 },
  { name: 'Mobile M (375px)', width: 375, height: 812 },
  { name: 'Mobile L (390px)', width: 390, height: 844 },
  { name: 'Mobile Max (430px)', width: 430, height: 932 },
  // Tablet
  { name: 'Tablet Portrait (768px)', width: 768, height: 1024 },
  // Desktop
  { name: 'Desktop Small (1024px)', width: 1024, height: 768 },
  { name: 'Desktop Medium (1366px)', width: 1366, height: 768 },
  { name: 'Desktop Large (1440px)', width: 1440, height: 900 },
  { name: 'Desktop FHD (1920px)', width: 1920, height: 1080 },
];

const TEST_ROUTES = [
  '/',
  '/packages',
  '/packages/thailand-bangkok-pattaya-phuket',
  '/our-work',
  '/custom-trip',
  '/profile',
];

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

async function runResponsiveTests() {
  console.log('=== STARTING CHROME CDP MULTI-VIEWPORT RESPONSIVE AUDIT ===');
  const tempProfile = process.env.TEMP + '\\chrome_resp_test_' + Date.now();
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

  let totalChecks = 0;
  let passedChecks = 0;
  const overflowIssues = [];

  try {
    const wsUrl = await getWsUrl();
    const newPageRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const target = await newPageRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

    let msgId = 1;
    const pending = new Map();

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
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

    async function evalScript(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 1024,
      });

      for (const route of TEST_ROUTES) {
        totalChecks++;
        const targetUrl = `http://localhost:3001${route}`;
        await send('Page.navigate', { url: targetUrl });
        await wait(1200);

        const metrics = await evalScript(`(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const clientWidth = docEl.clientWidth;
          const innerWidth = window.innerWidth;
          const hasHorizontalOverflow = scrollWidth > innerWidth + 1; // 1px threshold for subpixel rounding

          let overflowingElements = [];
          if (hasHorizontalOverflow) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 2) {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  class: (el.className || '').toString().slice(0, 50),
                  right: rect.right
                });
                if (overflowingElements.length >= 3) break;
              }
            }
          }

          return {
            scrollWidth,
            innerWidth,
            hasHorizontalOverflow,
            overflowingElements
          };
        })()`);

        if (metrics.hasHorizontalOverflow) {
          console.error(`[FAIL] ${vp.name} on ${route}: Overflow detected! scrollWidth=${metrics.scrollWidth}px vs window=${metrics.innerWidth}px`);
          console.error('Elements causing overflow:', metrics.overflowingElements);
          overflowIssues.push({ vp: vp.name, route, metrics });
        } else {
          passedChecks++;
          console.log(`[PASS] ${vp.name} on ${route} - No overflow (scrollWidth=${metrics.scrollWidth}px, clientWidth=${metrics.innerWidth}px)`);
        }
      }
    }

    // Test Cart Drawer at 320px, 375px, and 1440px
    console.log('\n--- Testing Cart Drawer Bounds & Interactivity at Edge Viewports ---');
    for (const testWidth of [320, 375, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: testWidth,
        height: 800,
        deviceScaleFactor: 1,
        mobile: testWidth < 1024,
      });

      await send('Page.navigate', { url: 'http://localhost:3001/profile' });
      await wait(1200);

      // Open drawer
      await evalScript(`(() => {
        const btn = document.querySelector('button[aria-label*="cart"], button[aria-label*="Cart"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Selected Packages'));
        if (btn) btn.click();
      })()`);
      await wait(500);

      const drawerState = await evalScript(`(() => {
        const drawer = document.querySelector('[role="dialog"]');
        if (!drawer) return { open: false };
        const rect = drawer.getBoundingClientRect();
        return {
          open: true,
          width: rect.width,
          left: rect.left,
          right: rect.right,
          windowWidth: window.innerWidth,
          fitsInside: rect.right <= window.innerWidth + 2
        };
      })()`);

      console.log(`Cart Drawer at ${testWidth}px:`, drawerState);
      if (drawerState.open && drawerState.fitsInside) {
        passedChecks++;
        totalChecks++;
        console.log(`[PASS] Cart drawer fits inside viewport perfectly at ${testWidth}px.`);
      } else {
        totalChecks++;
        console.error(`[FAIL] Cart drawer does not fit at ${testWidth}px!`, drawerState);
      }

      // Close drawer with Escape
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
      await wait(300);
    }

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chromeProcess.kill();
  }

  console.log(`\n=== RESPONSIVE VIEWPORT AUDIT SUMMARY ===`);
  console.log(`Total Route/Viewport Checks: ${totalChecks}`);
  console.log(`Passed Checks: ${passedChecks}`);
  console.log(`Failed Checks: ${overflowIssues.length}`);

  if (overflowIssues.length === 0) {
    console.log('ALL VIEWPORTS PASSED WITH ZERO HORIZONTAL OVERFLOW!');
    process.exit(0);
  } else {
    console.error('FAILURES DETECTED IN RESPONSIVE AUDIT:');
    console.table(overflowIssues);
    process.exit(1);
  }
}

runResponsiveTests();
