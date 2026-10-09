/*
  The cart PAGE must be untouched by the Rebuy mini-cart work.

  audit/page-spec-cart-drawer.md §10 signs it off as: "promo form 74px, no Horizon
  discount block, subtotal + total, stepper intact, Check out button intact".
  The Smart Cart CSS is scoped to #rebuy-cart, but the coordinator and the
  cart-bubble fix run on every page, so this checks the page did not drift.

  Run:  node scripts/cart-page-regression.mjs      (needs SPY_PASSWORD in .env)
*/
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const STORE = process.env.SPY_STORE || 'https://spyoptic-com.myshopify.com';
const PASSWORD = process.env.SPY_PASSWORD || '';
const THEME_ID = process.env.THEME_ID || '189382623539';
const WIDTHS = (process.env.WIDTHS || '1440,768,390').split(',').map(Number);

if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env.');
  process.exit(2);
}

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const rows = [];
let failures = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate((pw) => {
    const input = document.querySelector('#Password');
    if (!input) return;
    input.value = pw;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    (document.querySelector('#login_form') || input.closest('form'))?.submit();
  }, PASSWORD);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  // Apply the dev theme, then put something in the cart
  await page.goto(`${STORE}/collections/all?preview_theme_id=${THEME_ID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    const link = [...document.querySelectorAll('a[href*="/products/"]')].map((a) => a.getAttribute('href')).find(Boolean);
    const handle = link.split('/products/')[1].split(/[?#]/)[0];
    const product = await fetch(`/products/${handle}.js`).then((r) => r.json());
    const variant = (product.variants || []).find((v) => v.available) || product.variants[0];
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] }),
    });
  });

  await page.goto(`${STORE}/cart`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const found = await page.evaluate(() => {
    const has = (sel) => Boolean(document.querySelector(sel));
    const promo = document.querySelector('.spy-cart-promo, [class*="spy-cart-promo"]');
    return {
      lineItems: document.querySelectorAll('.cart-items__table-row').length,
      // the page uses the cart-totals family; cart__*-container is drawer-only
      totals: has('.cart-totals'),
      totalRow: has('.cart-totals__total-label') && has('.cart-totals__total-value'),
      taxNote: has('.cart-totals__tax-note'),
      checkout: has('.cart__checkout-button'),
      promo: Boolean(promo),
      promoH: promo ? Math.round(promo.getBoundingClientRect().height) : 0,
      stepper: document.querySelectorAll('.cart-items__table-row button').length > 0,
      // the mini-cart must not leak onto the page
      rebuyCart: has('#rebuy-cart'),
      engine: document.documentElement.getAttribute('data-cart-engine'),
    };
  });

  const checks = {
    'has line items': found.lineItems > 0,
    'totals block': found.totals,
    'total label + value': found.totalRow,
    'tax note (page keeps it, drawer drops it)': found.taxNote,
    'checkout button': found.checkout,
    'promo form': found.promo,
    'quantity stepper intact': found.stepper,
    'no Rebuy cart on the page': !found.rebuyCart,
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  failures += failed.length;
  rows.push({ width, items: found.lineItems, promoH: found.promoH, result: failed.length ? `FAIL: ${failed.join(', ')}` : 'ok' });

  await context.close();
}

console.table(rows);
console.log(failures ? `${failures} failure(s)` : 'cart page unregressed at all widths');
await browser.close();
process.exit(failures ? 1 : 0);
