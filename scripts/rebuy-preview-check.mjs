/*
  Is Rebuy Smart Cart reachable on the local dev theme?

  Pandectes blocks rebuyengine.com until the shopper consents, and its banner is a
  <pandectes-cmp> custom element — the Accept button lives in its shadow root, which
  is why a normal selector never finds it. This grants consent the same way
  layout/theme.liquid reaches the reopen button, then reports what Rebuy exposes.

  Run:  shopify theme dev --store spyoptic-com.myshopify.com --port 9293
        node scripts/rebuy-preview-check.mjs
        SPY_BASE=... CART_ID=... to override
*/
import { chromium } from 'playwright-core';

const BASE = process.env.SPY_BASE || 'http://127.0.0.1:9293';
const CART_ID = process.env.CART_ID || '37798';
const URL = `${BASE}/?preview_smart_cart=${CART_ID}&viewcart=true&cart_version=2`;

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(6000);

// Accept cookies, or Rebuy never loads at all
const accepted = await page.evaluate(() => {
  const root = document.querySelector('pandectes-cmp')?.shadowRoot;
  const button = root && [...root.querySelectorAll('button')].find((b) => /accept/i.test(b.innerText || ''));
  if (!button) return false;
  button.click();
  return true;
});
await page.waitForTimeout(3000);

// Rebuy only boots fully on the next load after consent
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);

const result = await page.evaluate(() => ({
  rebuyRequests: performance.getEntriesByType('resource').filter((e) => /rebuy/i.test(e.name)).length,
  status: window.Rebuy?._status ?? null,
  smartCartEnabled: window.Rebuy?.smart_cart ?? null,
  smartCart: typeof window.Rebuy?.SmartCart,
  rebuyCartNode: Boolean(document.querySelector('#rebuy-cart')),
  themeDrawerNode: Boolean(document.querySelector('theme-drawer#cart-drawer')),
  engine: document.documentElement.getAttribute('data-cart-engine'),
}));

console.log('consent accepted:', accepted);
console.log(JSON.stringify(result, null, 1));

const usable = result.smartCart === 'object' && result.rebuyCartNode;
console.log(usable ? 'Smart Cart IS reachable locally' : 'Smart Cart NOT reachable locally');

await browser.close();
process.exit(usable ? 0 : 1);
