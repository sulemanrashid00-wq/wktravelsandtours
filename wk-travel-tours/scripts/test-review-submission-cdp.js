import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

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
    } catch {
      // retry
    }
    await wait(300);
  }
  throw new Error('Chrome remote debugger failed to start');
}

async function run() {
  console.log('=== VERIFYING REVIEW SUBMISSION FLOW VIA CDP ===');
  const tempProfile = process.env.TEMP + '\\chrome_review_test_' + Date.now();
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

    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER LOG:', msg.params.type, msg.params.args.map(a => a.value || a.description));
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise((resolve) => ws.onopen = resolve);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    // Open review modal
    console.log('Opening review submission modal...');
    const openRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Share Your Feedback'));
          if (btn) {
            btn.click();
            return { success: true };
          }
          return { success: false, error: 'Share Your Feedback button not found' };
        })()
      `,
      returnByValue: true,
    });
    console.log('Open modal evaluate result:', openRes.result.value);

    await wait(600);

    // Fill form using real CDP focus and insertText
    console.log('Focusing and typing customer name...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('input[placeholder*="Asad Siddiqui"]').focus()`
    });
    await send('Input.insertText', { text: 'CDP Verified Traveler' });
    await wait(200);

    console.log('Focusing and typing trip destination...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('input[placeholder*="Thailand Tour"]').focus()`
    });
    await send('Input.insertText', { text: 'Thailand Bangkok Pattaya Tour' });
    await wait(200);

    console.log('Focusing and typing review comment...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('textarea').focus()`
    });
    await send('Input.insertText', { text: 'Outstanding customer service and perfect itinerary coordination by WK Travel & Tours.' });
    await wait(200);

    console.log('Clicking Submit Review button...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Review'));
          submitBtn.click();
        })()
      `
    });

    // Wait for submission response
    console.log('Waiting for modal success message...');
    await wait(2000);

    const checkSuccessRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.querySelector('[role=\"dialog\"]') || document.querySelector('.fixed');
          const bodyText = document.body.innerText;
          const modalText = modal ? modal.innerText : '';
          const hasSuccess = bodyText.includes('Thank You for Your Feedback!') || bodyText.includes('Feedback Received');
          const hasModeration = bodyText.includes('moderation desk') || bodyText.includes('verified by our team') || bodyText.includes('administration desk');
          return { hasSuccess, hasModeration, modalText: modalText.slice(0, 300) };
        })()
      `,
      returnByValue: true,
    });
    console.log('Modal success check:', checkSuccessRes.result.value);

    if (checkSuccessRes.result.value.hasSuccess) {
      console.log('SUCCESS: Review modal successfully displayed confirmation message!');
    } else {
      throw new Error('Review submission confirmation message did not appear');
    }

    // Clean up test review from Supabase
    const supabaseUrl = 'https://lhuwxgbsrnhecljkzbfa.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodXd4Z2Jzcm5oZWNsamt6YmZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjI2NDUwOSwiZXhwIjoyMTA3ODQwNTA5fQ.SzshR2f_tEc4pqn9pmMS0z1l4RWFJCSrsd9-VYQLbKI';
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: inserted, error: fetchErr } = await admin
      .from('reviews')
      .select('id, customer_name, status')
      .eq('customer_name', 'CDP Verified Traveler');

    console.log('Supabase DB check:', { inserted, fetchErr });

    if (inserted && inserted.length > 0) {
      console.log('VERIFIED IN DATABASE: Record exists with status:', inserted[0].status);
      await admin.from('reviews').delete().eq('customer_name', 'CDP Verified Traveler');
      console.log('Pristine database cleanup completed.');
    }

    ws.close();
    chromeProcess.kill();
    console.log('=== CDP TEST COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('CDP test failed:', err);
    chromeProcess.kill();
    process.exit(1);
  }
}

run();
