/*
  The LIVE mini-cart, now that Rebuy Smart Cart 37798 is published (12 Oct).

  Two shoppers, two engines, one cart each:
    DECLINED  Pandectes blocks rebuyengine.com, so the theme drawer is the cart
    ACCEPTED  Smart Cart owns the bag, and the theme drawer must stay shut

  No preview parameters, so this is exactly what a shopper gets. Set THEME_ID to
  run the same checks against an unpublished theme before it goes live.

  Two Rebuy carts exist: 37798 (the 320px source copy) and 38089 (the Figma
  redesign, 375px, full width on phones). The checks follow whichever one is
  live; where a check needs room beside the panel and the panel fills the
  screen, it is reported as n/a.

  Run:  node scripts/production-cart-check.mjs        (needs SPY_PASSWORD in .env)
        WIDTH=390 for mobile · THEME_ID=189382623539 for the dev theme · HEADED=1
        CART_ID=38089 to insist on one cart · PREVIEW_CART=38089 to run against an
        unpublished cart (use it with the dev theme, which has its CSS)
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
const THEME_ID = process.env.THEME_ID || '';
const PREVIEW_CART = process.env.PREVIEW_CART || '';
const CART_ID = Number(process.env.CART_ID || PREVIEW_CART || 0); // 0 = whichever known cart is live
const WIDTH = Number(process.env.WIDTH || 1440);
if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env.');
  process.exit(2);
}

// Panel width each known cart should have at a given viewport width
const PANEL = {
  37798: () => 320,
  38089: (vw) => (vw <= 480 ? vw : 375),
};

const at = (path) => {
  const url = new URL(STORE + path);
  if (THEME_ID) url.searchParams.set('preview_theme_id', THEME_ID);
  if (PREVIEW_CART) {
    url.searchParams.set('preview_smart_cart', PREVIEW_CART);
    url.searchParams.set('cart_version', '2');
  }
  return url.toString();
};
const BAG = '[data-testid="cart-drawer-trigger"]:visible';
const ATC = 'button[name="add"]:visible, add-to-cart-component button:visible';
const OURS = /spy-cart-handoff|spy-[a-z-]+\.js|tailwind\.css|cart-drawer\.js|cart-products|cart-summary/i;

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const results = [];
let failures = 0;
const check = (name, pass, detail = '') => {
  results.push({ check: name, result: pass ? 'ok' : 'FAIL', detail: String(detail).slice(0, 60) });
  if (!pass) failures++;
};
const skip = (name, why) => results.push({ check: name, result: 'n/a', detail: why });

// Where the open panel starts, so "outside the cart" is measured, not assumed
const panelBox = (page) => page.evaluate(() => {
  const r = document.querySelector('#rebuy-cart .rebuy-cart__flyout')?.getBoundingClientRect();
  return r ? { x: Math.round(r.x), width: Math.round(r.width) } : null;
});

async function session() {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 900 } });
  const page = await context.newPage();
  const ourErrors = [];
  page.on('console', (m) => { if (m.type() === 'error' && OURS.test(m.text())) ourErrors.push(m.text()); });
  page.on('pageerror', (e) => { if (OURS.test(String(e.stack || e))) ourErrors.push(String(e)); });
  const rebuy = { requests: 0 };
  page.on('request', (r) => { if (/rebuyengine\.com/.test(r.url())) rebuy.requests++; });

  // The password field sits 0x0 behind a toggle, so submit the form directly
  await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate((pw) => {
    const input = document.querySelector('#Password');
    if (!input) return;
    input.value = pw;
    (document.querySelector('#login_form') || input.closest('form'))?.submit();
  }, PASSWORD);
  // The password page is already loaded, so waitForLoadState returns at once and
  // the next goto can collide with the login redirect. Wait for the URL instead.
  await page.waitForURL((u) => !u.pathname.startsWith('/password'), { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return { context, page, ourErrors, rebuy };
}

// The banner buttons live in the <pandectes-cmp> shadow root, and the banner
// can take a while to render, so wait for the button instead of a fixed delay
async function answerBanner(page, wanted) {
  await page.goto(at('/'), { waitUntil: 'domcontentloaded', timeout: 60000 });
  const button = await page
    .waitForFunction((source) => {
      const re = new RegExp(source, 'i');
      const root = document.querySelector('pandectes-cmp')?.shadowRoot;
      return [...(root?.querySelectorAll('button') || [])].find(
        (b) => re.test((b.innerText || '').trim()) && b.getBoundingClientRect().width > 0
      );
    }, wanted.source, { timeout: 20000 })
    .catch(() => null);
  const clicked = await button?.evaluate((b) => { b.click(); return b.innerText.trim(); });
  await page.waitForTimeout(2500);
  return clicked ?? null;
}

const go = async (page, path, settle = 6000) => {
  await page.goto(at(path), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(settle);
};

// A product off the open collection page. /products.json gets rate limited
// (429) after a few runs, /products/<handle>.js does not.
const seedCart = (page) => page.evaluate(async () => {
  const link = [...document.querySelectorAll('a[href*="/products/"]')].map((a) => a.getAttribute('href')).find(Boolean);
  const handle = link.split('/products/')[1].split(/[?#]/)[0];
  const product = await fetch(`/products/${handle}.js`).then((r) => r.json());
  const variant = product.variants.find((v) => v.available) || product.variants[0];
  const res = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] }),
  });
  return { ok: res.ok, handle };
});

const clearCart = (page) => page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));

const state = (page) => page.evaluate(() => {
  const count = document.querySelector('.cart-bubble__text-count');
  const active = document.activeElement;
  return {
    engine: document.documentElement.getAttribute('data-cart-engine'),
    cartId: window.Rebuy?.SmartCart?.settings?.id ?? null,
    rebuyOpen: Boolean(document.querySelector('#rebuy-cart.is-visible')),
    drawerOpen: Boolean(document.querySelector('theme-drawer#cart-drawer[open]')),
    title: document.querySelector('#rebuy-cart .rebuy-cart__title')?.innerText.trim() ?? '',
    badge: count && !count.classList.contains('hidden') ? count.textContent.trim() : '',
    focusOnBag: Boolean(active?.closest?.('[data-testid="cart-drawer-trigger"]')),
    focusInCart: Boolean(active?.closest?.('#rebuy-cart')),
  };
});

// A real wheel over the page, not a computed style: from 990px .page-wrapper
// is the scroller, below it the window is
async function pageScrolls(page, x) {
  await page.evaluate(() => {
    document.querySelector('.page-wrapper')?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.mouse.move(x, 700);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1200);
  return page.evaluate(() => (document.querySelector('.page-wrapper')?.scrollTop || 0) + window.scrollY > 0);
}

// ── DECLINED: no Rebuy at all, the theme drawer carries the cart ───────────
{
  const { context, page, ourErrors, rebuy } = await session();
  const clicked = await answerBanner(page, /^(decline|reject|deny)/);
  check('D banner declined', Boolean(clicked), clicked ?? 'no Decline button');

  await clearCart(page);
  rebuy.requests = 0;
  await go(page, '/collections/all');
  let s = await state(page);
  check('D zero Rebuy requests', rebuy.requests === 0, `${rebuy.requests} requests`);
  check('D engine is "theme"', s.engine === 'theme', s.engine);
  check('D empty cart shows no badge', s.badge === '', s.badge);
  check('D page scrolls', await pageScrolls(page, WIDTH / 2));

  await seedCart(page);
  await go(page, '/collections/all');
  check('D badge shows with an item', (await state(page)).badge === '1');
  await page.locator(BAG).first().click({ timeout: 15000 });
  await page.waitForTimeout(2500);
  s = await state(page);
  check('D bag opens the theme drawer', s.drawerOpen && !s.rebuyOpen);
  check('D drawer lists the item', await page.evaluate(() => Boolean(document.querySelector('.cart-items__table-row'))));
  check('D no errors from our code', ourErrors.length === 0, ourErrors[0]);
  await clearCart(page);
  await context.close();
}

// ── ACCEPTED: Smart Cart owns the bag ──────────────────────────────────────
{
  const { context, page, ourErrors } = await session();
  const clicked = await answerBanner(page, /^(accept|allow)/);
  check('A banner accepted', Boolean(clicked), clicked ?? 'no Accept button');

  await clearCart(page);
  // Rebuy boots on the load after consent, 6-15s after each load (slower in
  // preview), and can lose a cold first load. Wait for the handover, not the clock.
  const rebuyOwnsTheBag = () => page
    .waitForFunction(() => document.documentElement.dataset.cartEngine === 'rebuy', null, { timeout: 30000 })
    .then(() => true, () => false);
  await go(page, '/collections/all', 3000);
  if (!(await rebuyOwnsTheBag())) {
    await go(page, '/collections/all', 3000);
    await rebuyOwnsTheBag();
  }
  let s = await state(page);
  check('A engine is "rebuy"', s.engine === 'rebuy', s.engine);
  check(
    CART_ID ? `A live Smart Cart is ${CART_ID}` : 'A live Smart Cart is a known one',
    CART_ID ? s.cartId === CART_ID : Boolean(PANEL[s.cartId]),
    s.cartId
  );
  check('A empty cart shows no badge', s.badge === '', s.badge);
  check('A page scrolls (cart closed)', await pageScrolls(page, WIDTH / 2));

  const { handle } = await seedCart(page);
  await go(page, '/collections/all', 3000);
  await rebuyOwnsTheBag();
  check('A badge shows with an item', (await state(page)).badge === '1');

  // Mouse: one cart only
  await page.locator(BAG).first().click({ timeout: 15000 });
  await page.waitForTimeout(2500);
  s = await state(page);
  check('A bag opens Smart Cart', s.rebuyOpen, s.title);
  check('A theme drawer stays shut', !s.drawerOpen);
  check('A title counts the item', /\(1\)/.test(s.title), s.title);
  const box = await panelBox(page);
  const wanted = PANEL[s.cartId]?.(WIDTH);
  check('A panel width fits this cart', Boolean(box && wanted) && Math.abs(box.width - wanted) <= 1, `${box?.width}px, want ${wanted ?? '?'} (cart ${s.cartId})`);

  // Half way across the free page. The Figma cart fills a phone screen, so
  // there is no "outside" there; close it with its own button instead.
  const outside = box && box.x > 40 ? Math.round(box.x / 2) : null;
  if (outside) {
    check('A page scrolls behind the open cart', await pageScrolls(page, outside));
    await page.mouse.click(outside, 450);
    await page.waitForTimeout(1500);
    check('A outside click closes it', !(await state(page)).rebuyOpen);
  } else {
    skip('A page scrolls behind the open cart', `panel fills the ${WIDTH}px screen`);
    skip('A outside click closes it', `panel fills the ${WIDTH}px screen`);
    await page.locator('#rebuy-cart .rebuy-cart__flyout-close').click({ timeout: 5000 });
    await page.waitForTimeout(1500);
  }

  // Keyboard: Enter opens, focus moves in, close returns it to the bag
  await page.locator(BAG).first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  s = await state(page);
  check('A Enter on the bag opens it', s.rebuyOpen && !s.drawerOpen);
  check('A focus moves into the cart', s.focusInCart);
  await page.locator('#rebuy-cart .rebuy-cart__flyout-close').click({ timeout: 5000 });
  await page.waitForTimeout(1500);
  s = await state(page);
  check('A close button closes it', !s.rebuyOpen);
  check('A focus returns to the bag', s.focusOnBag);

  // Add to cart on a PDP, once Rebuy owns the cart: Smart Cart, never the drawer
  await go(page, `/products/${handle}`, 0);
  await page.waitForFunction(() => document.documentElement.dataset.cartEngine === 'rebuy', null, { timeout: 60000 });
  // Rebuy refetches the cart before it opens, about 2-3s after the click
  const addedAt = Date.now();
  await page.locator(ATC).first().click({ timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#rebuy-cart.is-visible'), null, { timeout: 10000 }).catch(() => {});
  const openedIn = ((Date.now() - addedAt) / 1000).toFixed(1);
  await page.waitForTimeout(800);
  s = await state(page);
  check('A PDP add opens Smart Cart', s.rebuyOpen, `${s.title} after ${openedIn}s`);
  check('A PDP add leaves the drawer shut', !s.drawerOpen);
  check('A count follows the add', /\(2\)/.test(s.title) && s.badge === '2', `${s.title} / ${s.badge}`);

  // Handover. Rebuy boots 6-15s after load, so an early add gets the drawer.
  // Once Rebuy takes over, the shopper must still only ever see one cart.
  await page.goto(at(`/products/${handle}`), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => customElements.get('product-form-component') && customElements.get('theme-drawer'), null, { timeout: 30000 });
  const early = (await state(page)).engine === 'theme';
  await page.locator(ATC).first().click({ timeout: 15000 });
  await page.waitForTimeout(2500);
  s = await state(page);
  check('H early add opens the drawer', !early || (s.drawerOpen && !s.rebuyOpen), early ? '' : 'Rebuy beat the click');

  await page.waitForFunction(() => document.documentElement.dataset.cartEngine === 'rebuy', null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  s = await state(page);
  check('H handover leaves one cart', !(s.drawerOpen && s.rebuyOpen));

  // Rebuy opening on its own (its add handler) shuts the drawer and keeps focus
  await page.evaluate(() => window.Rebuy.SmartCart.show());
  await page.waitForTimeout(2500);
  s = await state(page);
  check('H Smart Cart replaces the drawer', s.rebuyOpen && !s.drawerOpen);
  check('H focus lands in Smart Cart', s.focusInCart);
  await page.evaluate(() => window.Rebuy.SmartCart.hide());
  await page.waitForTimeout(1500);

  // Any later road into the drawer opens Smart Cart instead
  const viaActions = await page.evaluate(() => {
    if (!window.Shopify?.actions?.openCart) return false;
    window.Shopify.actions.openCart();
    return true;
  });
  await page.waitForTimeout(2500);
  s = await state(page);
  if (viaActions) check('H Shopify.actions.openCart opens Smart Cart', s.rebuyOpen && !s.drawerOpen);

  check('A no errors from our code', ourErrors.length === 0, ourErrors[0]);
  await clearCart(page);
  await context.close();
}

console.log(`${THEME_ID ? `theme ${THEME_ID}` : 'LIVE theme'}${PREVIEW_CART ? ` · preview cart ${PREVIEW_CART}` : ''} · ${WIDTH}px`);
console.table(results);
console.log(failures ? `${failures} failure(s)` : 'both engines behave — one cart per shopper');
await browser.close();
process.exit(failures ? 1 : 0);
