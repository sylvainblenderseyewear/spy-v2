/*
  Did any of the Rebuy mini-cart work leak onto the LIVE theme?

  The coordinator and the Smart Cart CSS were pushed to main, which syncs to the
  published spy-v2/main theme. Smart Cart itself is still unpublished in Rebuy,
  so on production the theme drawer must still be the cart and nothing should
  look different to a shopper. No preview parameters are used here on purpose.

  Run:  node scripts/production-cart-check.mjs      (needs SPY_PASSWORD in .env)
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
if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env.');
  process.exit(2);
}

const OURS = /spy-cart-handoff|spy-[a-z-]+\.js|tailwind\.css|cart-drawer\.js|cart-products|cart-summary/i;
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const ourErrors = [];
page.on('console', (m) => { if (m.type() === 'error' && OURS.test(m.text())) ourErrors.push(m.text().slice(0, 140)); });
page.on('pageerror', (e) => { if (OURS.test(String(e))) ourErrors.push(String(e).slice(0, 140)); });

const results = [];
let failures = 0;
const check = (name, pass, detail = '') => {
  results.push({ check: name, result: pass ? 'ok' : 'FAIL', detail });
  if (!pass) failures++;
};

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

// Plain production — live theme, no preview parameters at all
await page.goto(`${STORE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(() => {
  const root = document.querySelector('pandectes-cmp')?.shadowRoot;
  [...(root?.querySelectorAll('button') || [])].find((b) => /accept/i.test(b.innerText || ''))?.click();
});
await page.waitForTimeout(2500);
await page.goto(`${STORE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(7000);

// Empty cart first
await page.evaluate(async () => { await fetch('/cart/clear.js', { method: 'POST' }); });
await page.goto(`${STORE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);

const live = await page.evaluate(() => {
  const count = document.querySelector('.cart-bubble__text-count');
  const bubble = count?.closest('.cart-bubble');
  return {
    handoff: Boolean(document.querySelector('script[src*="spy-cart-handoff"]')),
    engine: document.documentElement.getAttribute('data-cart-engine'),
    rebuyCart: Boolean(document.querySelector('#rebuy-cart')),
    smartCart: typeof window.Rebuy?.SmartCart,
    themeDrawer: Boolean(document.querySelector('theme-drawer#cart-drawer')),
    badgeHidden: Boolean(bubble?.classList.contains('visually-hidden')),
    bodyOverflow: getComputedStyle(document.body).overflow,
  };
});

check('coordinator is live', live.handoff);
check('engine is "theme" (Smart Cart unpublished)', live.engine === 'theme', `got ${live.engine}`);
check('no Rebuy cart rendered to shoppers', !live.rebuyCart);
check('theme drawer present', live.themeDrawer);
check('empty cart shows no badge', live.badgeHidden);
// NOTE: body overflow is hidden BY DESIGN on this theme — .page-wrapper is the
// scroll container. Assert that the page actually scrolls, not a CSS value.
// (Pandectes also holds .page-wrapper at overflow:hidden until consent.)
await page.mouse.move(720, 500);
await page.mouse.wheel(0, 1000);
await page.waitForTimeout(1200);
const scrolled = await page.evaluate(() => (document.querySelector('.page-wrapper')?.scrollTop || 0) > 0 || window.scrollY > 0);
check('page scrolls', scrolled);

// Now with an item, open the drawer from the bag
await page.goto(`${STORE}/collections/all`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
await page.goto(`${STORE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);

check('badge shows when cart has items', await page.evaluate(() => {
  const c = document.querySelector('.cart-bubble__text-count');
  return Boolean(c) && !c.classList.contains('hidden') && c.textContent.trim() !== '0';
}));

await page.locator('[data-testid="cart-drawer-trigger"]').click({ timeout: 15000 }).catch((e) =>
  console.error('bag click:', e.message.slice(0, 60))
);
await page.waitForTimeout(2500);
check('theme drawer opens from the bag', await page.evaluate(() => !!document.querySelector('theme-drawer#cart-drawer[open]')));
check('drawer has the item', await page.evaluate(() => !!document.querySelector('.cart-items__table-row')));
check('no errors from our code', ourErrors.length === 0, ourErrors.slice(0, 2).join(' | '));

console.table(results);
console.log(failures ? `${failures} failure(s) on the LIVE theme` : 'production is unaffected — theme drawer still owns the cart');
await browser.close();
process.exit(failures ? 1 : 0);
