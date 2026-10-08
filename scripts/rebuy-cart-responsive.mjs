/*
  Verifies the Rebuy Smart Cart at 1440 / 768 / 390 against
  audit/page-spec-cart-drawer.md.

  Runs against the PRODUCTION storefront with the dev theme applied, because
  Rebuy will not load reliably through `shopify theme dev`. That storefront is
  password protected, so it needs SPY_PASSWORD.

  Setup (one line, gitignored):
      echo "SPY_PASSWORD=yourpassword" >> .env

  Run:
      node scripts/rebuy-cart-responsive.mjs
      HEADED=1 to watch · THEME_ID=... CART_ID=... to override

  Exits non-zero if any width drifts.
*/
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  // no .env — fall back to the real environment
}

const STORE = process.env.SPY_STORE || 'https://spyoptic-com.myshopify.com';
const PASSWORD = process.env.SPY_PASSWORD || '';
const THEME_ID = process.env.THEME_ID || '189382623539';
const CART_ID = process.env.CART_ID || '37798';
const WIDTHS = (process.env.WIDTHS || '1440,768,390').split(',').map(Number);

if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env — the storefront is password protected.');
  process.exit(2);
}

const url = `${STORE}/?preview_theme_id=${THEME_ID}&preview_smart_cart=${CART_ID}&viewcart=true&cart_version=2`;
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
let failures = 0;
const rows = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();

  // Storefront password gate. The field sits collapsed (0x0) behind an "Enter
  // using password" toggle, and the consent banner intercepts pointer events,
  // so a real click never lands. Submit the form directly instead.
  await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.evaluate((pw) => {
    const input = document.querySelector('#Password');
    if (!input) return;
    input.value = pw;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    (document.querySelector('#login_form') || input.closest('form'))?.submit();
  }, PASSWORD);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(5000);

  // Rebuy is consent-gated; Accept lives in the <pandectes-cmp> shadow root
  await page.evaluate(() => {
    const root = document.querySelector('pandectes-cmp')?.shadowRoot;
    const button = root && [...root.querySelectorAll('button')].find((b) => /accept/i.test(b.innerText || ''));
    button?.click();
  });
  await page.waitForTimeout(2500);

  // Rebuy boots fully on the next load after consent
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);

  const measure = () => page.evaluate(() => {
    const root = document.querySelector('#rebuy-cart');
    if (!root) return null;
    const panel = root.querySelector('.rebuy-cart__flyout');
    if (!panel) return null;
    const body = getComputedStyle(document.body);
    const wrapper = document.querySelector('.page-wrapper');
    return {
      panel: Math.round(panel.getBoundingClientRect().width),
      viewport: window.innerWidth,
      bodyOverflow: body.overflow,
      wrapperMargin: wrapper ? getComputedStyle(wrapper).marginRight : '0px',
      engine: document.documentElement.getAttribute('data-cart-engine'),
    };
  });

  let measured = await measure();

  // Rebuy can lose a cold first load. Give it one more pass before failing,
  // or the harness reports a red that a rerun turns green.
  if (!measured) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(9000);
    measured = await measure();
  }

  if (!measured) {
    rows.push({ width, result: 'SMART CART DID NOT RENDER (two attempts)' });
    failures++;
    await context.close();
    continue;
  }

  // Spec: 320 at every width, never full-bleed, overlay only — no push, no lock
  const checks = {
    'panel 320': Math.abs(measured.panel - 320) <= 1,
    'not full-bleed': measured.panel < measured.viewport,
    'no body lock': measured.bodyOverflow !== 'hidden',
    'no page push': measured.wrapperMargin === '0px',
    'engine rebuy': measured.engine === 'rebuy',
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  failures += failed.length;
  rows.push({ width, panel: measured.panel, result: failed.length ? `DRIFT: ${failed.join(', ')}` : 'ok' });

  await context.close();
}

console.table(rows);
console.log(failures ? `${failures} drift(s)` : 'all widths match the spec');
await browser.close();
process.exit(failures ? 1 : 0);
