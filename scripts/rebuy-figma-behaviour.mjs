/*
  Click-path checks for the Figma mini-cart on an UNPUBLISHED Rebuy Smart Cart
  (preview mode, dev theme): stepper, minus-at-1 removal, bundle and
  recommendation adds, free-shipping line, keyboard and close.

  Uses the same warm Chrome profile as rebuy-figma-preview.mjs, so run that
  once first (it answers the storefront password and the cookie banner).

  Run:  node scripts/rebuy-figma-behaviour.mjs
        WIDTH=390 · CART_ID=38089 · THEME_ID=... · HEADED=1
        LOCAL_CSS=1 serves the working tree's assets/tailwind.css instead of the theme's
*/
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STORE = process.env.SPY_STORE || 'https://spyoptic-com.myshopify.com';
const THEME_ID = process.env.THEME_ID || '189382623539';
const CART_ID = process.env.CART_ID || '38089';
const WIDTH = Number(process.env.WIDTH || 1440);
const PROFILE = process.env.PROFILE || join(tmpdir(), 'spy-figma-cart-profile');
const CHEAP = 'spy-sunglass-case-small-black-sunglasses'; // $4, keeps the cart under the threshold

const url = `${STORE}/?preview_theme_id=${THEME_ID}&preview_smart_cart=${CART_ID}&viewcart=true&cart_version=2`;
const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: process.env.HEADED !== '1',
  viewport: { width: WIDTH, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());
const errors = [];
page.on('pageerror', (e) => errors.push(`${String(e).slice(0, 120)} @ ${String(e.stack || '').split('\n')[1]?.trim().slice(0, 120)}`));

if (process.env.LOCAL_CSS === '1') {
  const css = readFileSync(new URL('../assets/tailwind.css', import.meta.url));
  await context.route('**/assets/tailwind.css*', (route) => route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css }));
}

const results = [];
let failures = 0;
const check = (name, pass, detail = '') => {
  results.push({ check: name, result: pass ? 'ok' : 'FAIL', detail: String(detail).slice(0, 70) });
  if (!pass) failures++;
};

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
if (new URL(page.url()).pathname.startsWith('/password')) {
  console.error('Storefront is locked in this profile. Run scripts/rebuy-figma-preview.mjs once first.');
  await context.close();
  process.exit(2);
}

// One cheap line, then reload so Rebuy boots with it
await page.evaluate(async (handle) => {
  await fetch('/cart/clear.js', { method: 'POST' });
  const product = await fetch(`/products/${handle}.js`).then((r) => r.json());
  await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: product.variants[0].id, quantity: 1 }] }),
  });
}, CHEAP);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForFunction(() => typeof window.Rebuy?.SmartCart?.show === 'function', null, { timeout: 40000 });
await page.evaluate(() => window.Rebuy.SmartCart.show());
await page.waitForSelector('#rebuy-cart.is-visible', { state: 'attached', timeout: 15000 });
await page.waitForTimeout(4000);
await page.addStyleTag({
  content: '#PBarNextFrameWrapper, #rebuy-admin, #rebuy-bubble-global-alert-modal { display: none !important; }',
});

const state = () => page.evaluate(() => {
  const root = document.querySelector('#rebuy-cart');
  const text = (sel) => root.querySelector(sel)?.innerText.replace(/\s+/g, ' ').trim() ?? '';
  return {
    title: text('.rebuy-cart__title'),
    lines: root.querySelectorAll('ul[data-smartcart-items] > .rebuy-cart__flyout-item').length,
    qty: [...root.querySelectorAll('.rebuy-cart__flyout-item-quantity-widget-label')].map((e) => e.innerText.replace(/\D+/g, '')),
    shipping: text('.rebuy-cart__progress-bar-prompt'),
    total: text('.rebuy-cart__flyout-subtotal-amount'),
    // rows that are really on screen: the empty cart keeps the bundle in the DOM, hidden
    bundleRows: [...root.querySelectorAll('.large-style-line .rebuy-product-block')].filter((e) => e.offsetParent).length,
    bundleNames: [...root.querySelectorAll('.large-style-line .rebuy-product-block')].filter((e) => e.offsetParent).map((e) => e.querySelector('.rebuy-product-title')?.innerText.trim()),
    cards: [...root.querySelectorAll('.large-style-grid .rebuy-product-block')].filter((e) => e.offsetParent).length,
    tabs: [...root.querySelectorAll('.rebuy-tabbed-widget__tab')].filter((e) => e.offsetParent).map((e) => e.innerText.trim() + (e.getAttribute('aria-selected') === 'true' ? '*' : '')),
    tabRows: [...root.querySelectorAll('.rebuy-tabbed-widget .rebuy-product-block')].filter((e) => e.offsetParent).length,
    firstTabRow: text('.rebuy-tabbed-widget .rebuy-product-block .rebuy-product-title'),
    footer: Boolean(root.querySelector('[data-rebuy-cart-anchor="footer"]')?.offsetHeight),
    empty: text('.spy-mc-empty__copy'),
    minusLabel: root.querySelector('.rebuy-cart__flyout-item-quantity-widget-button')?.getAttribute('aria-label') ?? '',
    open: root.classList.contains('is-visible'),
  };
});
// Rebuy refetches and re-renders after every cart call
const settle = (ms = 3500) => page.waitForTimeout(ms);
const cart = '#rebuy-cart';

let s = await state();
check('one line, count in the title', s.lines === 1 && /\(1\)/.test(s.title), s.title);
check('below the threshold: "away" line', /away from Free Shipping/i.test(s.shipping), s.shipping);
check('minus at 1 is labelled Remove', /^Remove /.test(s.minusLabel), s.minusLabel);
check('footer shown with items', s.footer, s.total);

// Stepper up
await page.locator(`${cart} .rebuy-cart__flyout-item-quantity-widget-button`).nth(1).click();
await settle();
s = await state();
check('plus: quantity 2', s.qty[0] === '2' && /\(2\)/.test(s.title), `${s.qty[0]} ${s.title} ${s.total}`);
check('minus at 2 is labelled Decrease', /^Decrease /.test(s.minusLabel), s.minusLabel);

// Stepper down, then minus at 1 removes the line
await page.locator(`${cart} .rebuy-cart__flyout-item-quantity-widget-button`).nth(0).click();
await settle();
s = await state();
check('minus: quantity 1', s.qty[0] === '1', s.qty[0]);
await page.locator(`${cart} .rebuy-cart__flyout-item-quantity-widget-button`).nth(0).click();
// Removal is the slow call: Rebuy can take well over 3s, so wait for the list, not the clock
await page
  .waitForFunction(() => !document.querySelector('#rebuy-cart ul[data-smartcart-items] > .rebuy-cart__flyout-item'), null, { timeout: 15000 })
  .catch(() => {});
await settle(1500);
s = await state();
check('minus at 1 removes the line', s.lines === 0, `${s.lines} lines`);
check('empty: message, no footer, no bundle box, no band', /currently empty/i.test(s.empty) && !s.footer && s.bundleRows === 0 && s.cards === 0, s.empty);
check('empty: title keeps (0)', /\(0\)/.test(s.title), s.title);

// Empty cart: four tabs of best sellers; a tab switches the list
const active = (label) => String(label || '').endsWith('*');
check('empty: four tabs, first one active', s.tabs.length === 4 && active(s.tabs[0]), s.tabs.join(' '));
check('empty: best sellers listed', s.tabRows > 0, `${s.tabRows} rows · ${s.firstTabRow}`);
const firstRow = s.firstTabRow;
await page.locator(`${cart} .rebuy-tabbed-widget__tab`).nth(2).click();
await settle(2500);
s = await state();
check('tab click switches the list', active(s.tabs[2]) && s.tabRows > 0 && s.firstTabRow !== firstRow, `${s.tabs.join(' ')} · ${s.firstTabRow}`);

// Add from the empty-cart list: the cart fills and the tabs give way to the normal cart.
// Back to the first tab first: Rebuy has recommendations for sunglasses, not always for a goggle.
await page.locator(`${cart} .rebuy-tabbed-widget__tab`).nth(0).click();
await settle(2500);
await page.locator(`${cart} .rebuy-tabbed-widget .rebuy-product-actions .rebuy-button`).first().click();
await settle(6000);
s = await state();
check('best seller + ADD adds a line', s.lines === 1 && s.footer, `${s.lines} lines · ${s.total}`);
check('with items the tabs are gone', s.tabs.length === 0, `${s.tabs.length} tabs`);

// Add from You Might Also Like, then from the bundle box
const cardButton = page.locator(`${cart} .large-style-grid .rebuy-product-actions .rebuy-button`).first();
if (s.cards > 0) {
  const linesBefore = s.lines;
  await cardButton.click();
  await settle(6000);
  s = await state();
  check('recommendation + ADD adds a line', s.lines === linesBefore + 1, `${linesBefore} -> ${s.lines} lines · ${s.total}`);
} else {
  check('recommendation + ADD adds a line', false, 'Rebuy returned no recommendations for this cart');
}

const before = s;
const bundleButton = page.locator(`${cart} .large-style-line .rebuy-product-actions .rebuy-button`).first();
if (await bundleButton.count()) {
  await bundleButton.click();
  await settle(5000);
  s = await state();
  check('bundle + ADD adds a line', s.lines === before.lines + 1, `${before.lines} -> ${s.lines} lines`);
  // the box refills from the next rule, so check the product, not the row count
  const added = before.bundleNames[0];
  check('added accessory leaves the bundle box', Boolean(added) && !s.bundleNames.includes(added), `${added} gone · ${s.bundleNames.join(', ')}`);
} else {
  check('bundle + ADD adds a line', false, 'bundle box not shown');
}

// Over the threshold the line flips
await page.evaluate(async () => {
  const product = await fetch('/products/spy-boundless-gaming-matte-black-sunglasses.js').then((r) => r.json());
  await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: product.variants[0].id, quantity: 1 }] }),
  });
});
await settle(6000);
s = await state();
check('over the threshold: "unlocked" line', /unlocked Free Shipping/i.test(s.shipping), s.shipping);

// Keyboard: focus stays inside, Escape closes
await page.locator(`${cart} .rebuy-cart__flyout-close`).focus();
let inside = true;
for (let i = 0; i < 25; i++) {
  await page.keyboard.press('Tab');
  inside = inside && (await page.evaluate(() => Boolean(document.activeElement?.closest('#rebuy-cart'))));
}
check('25 Tabs stay inside the cart', inside);
await page.keyboard.press('Escape');
await page.waitForTimeout(1200);
s = await state();
check('Escape closes the cart', !s.open);
const leak = await page.evaluate(() => {
  const controls = [...document.querySelectorAll('#rebuy-cart a[href], #rebuy-cart button, #rebuy-cart select, #rebuy-cart input, #rebuy-cart [tabindex="0"]')];
  return controls.filter((el) => { el.focus(); return document.activeElement === el; }).length;
});
check('closed cart takes no focus', leak === 0, `${leak} focusable`);

// Leave the test cart empty
await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));

check('no page errors', errors.length === 0, errors[0] || '');
console.table(results);
console.log(failures ? `${failures} failure(s)` : 'all checks passed', `· ${WIDTH}px`);
await context.close();
process.exit(failures ? 1 : 0);
