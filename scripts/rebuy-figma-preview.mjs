/*
  Previews an UNPUBLISHED Rebuy Smart Cart on the dev theme, for the Figma
  mini-cart build (audit/page-spec-mini-cart-figma.md).

  Keeps a warm Chrome profile, so the storefront password and the cookie
  consent are answered once, not on every run.

  Run:  node scripts/rebuy-figma-preview.mjs          (needs SPY_PASSWORD in .env)
        WIDTHS=1440,768,390   viewports to capture
        HANDLES=a,b           product handles to put in the cart ("" = empty cart)
        QTY=2                 quantity for the first line
        HEIGHT=1300           viewport height (default 900)
        TAG=empty             suffix for the screenshot names
        CART_ID=38089         the Smart Cart to preview ("live" = the published cart)
        THEME_ID=...          the theme ("live" = the published theme)
        LOCAL_CSS=1           serve the working tree's assets/tailwind.css instead of the
                              theme's, so CSS can be checked without a dev server
        EVAL=path/to/file.js  a function body run in the page before the captures; result is printed
        OUT=dir               where the screenshots go
        SCROLLBARS=1          real scrollbars, like Chrome on Windows (Playwright hides them)
        HEADED=1 to watch
*/
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const STORE = process.env.SPY_STORE || 'https://spyoptic-com.myshopify.com';
const PASSWORD = process.env.SPY_PASSWORD || '';
const THEME_ID = process.env.THEME_ID || '189382623539';
const CART_ID = process.env.CART_ID || '38089';
const WIDTHS = (process.env.WIDTHS || '1440').split(',').map(Number);
const HANDLES = (process.env.HANDLES ?? 'spy-boundless-gaming-matte-black-sunglasses').split(',').filter(Boolean);
const QTY = Number(process.env.QTY || 1);
const HEIGHT = Number(process.env.HEIGHT || 900);
const TAG = process.env.TAG ? `-${process.env.TAG}` : '';
const OUT = resolve(process.env.OUT || join(tmpdir(), 'spy-figma-cart'));
const PROFILE = process.env.PROFILE || join(tmpdir(), 'spy-figma-cart-profile');
const EVAL = process.env.EVAL ? readFileSync(process.env.EVAL, 'utf8') : '';

if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env.');
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });

// Both previews stick in the warm profile: Shopify's theme preview ends with an
// empty preview_theme_id, Rebuy's lives in the _rpreview_smart_cart cookies
const params = new URLSearchParams();
params.set('preview_theme_id', THEME_ID === 'live' ? '' : THEME_ID);
if (CART_ID !== 'live') {
  params.set('preview_smart_cart', CART_ID);
  params.set('viewcart', 'true');
  params.set('cart_version', '2');
}
const url = `${STORE}/?${params}`;
const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: process.env.HEADED !== '1',
  viewport: { width: WIDTHS[0], height: HEIGHT },
  ...(process.env.SCROLLBARS === '1' ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {}),
});
if (CART_ID === 'live') await context.clearCookies({ name: /^_rpreview_smart_cart/ });
const page = context.pages()[0] || (await context.newPage());
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));

if (process.env.LOCAL_CSS === '1') {
  // Routing also turns the HTTP cache off, so the theme's copy can't sneak in
  const css = readFileSync(new URL('../assets/tailwind.css', import.meta.url));
  let served = 0;
  await context.route('**/assets/tailwind.css*', (route) => {
    served++;
    return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css });
  });
  process.on('exit', () => console.log(`local tailwind.css served ${served}x`));
}

await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);
if (new URL(page.url()).pathname.startsWith('/password')) {
  // The field sits 0x0 behind a toggle, so submit the form directly
  await page.evaluate((pw) => {
    const input = document.querySelector('#Password');
    if (!input) return;
    input.value = pw;
    (document.querySelector('#login_form') || input.closest('form'))?.submit();
  }, PASSWORD);
  await page.waitForURL((u) => !u.pathname.startsWith('/password'), { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

// Rebuy is consent-gated; Accept lives in the <pandectes-cmp> shadow root
const accept = await page
  .waitForFunction(() => {
    const root = document.querySelector('pandectes-cmp')?.shadowRoot;
    return [...(root?.querySelectorAll('button') || [])].find(
      (b) => /^accept/i.test((b.innerText || '').trim()) && b.getBoundingClientRect().width > 0
    );
  }, null, { timeout: 8000 })
  .catch(() => null);
if (accept) {
  await accept.evaluate((b) => b.click());
  await page.waitForTimeout(2500);
}

// Seed the cart to the wanted lines, then reload so Rebuy boots with them
const seeded = await page.evaluate(async ({ handles, qty }) => {
  await fetch('/cart/clear.js', { method: 'POST' });
  const items = [];
  for (const [i, handle] of handles.entries()) {
    const product = await fetch(`/products/${handle}.js`).then((r) => (r.ok ? r.json() : null));
    if (!product) continue;
    const variant = product.variants.find((v) => v.available) || product.variants[0];
    items.push({ id: variant.id, quantity: i === 0 ? qty : 1 });
  }
  if (!items.length) return 'empty cart';
  const res = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return `${items.length} line(s), add ${res.status}`;
}, { handles: HANDLES, qty: QTY });
console.log('cart:', seeded);

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // Rebuy boots 6-15s after load, and can lose a cold first load.
  // viewcart=true does not always open it, so ask for it once it can answer.
  const openCart = async () => {
    await page
      .waitForFunction(() => typeof window.Rebuy?.SmartCart?.show === 'function', null, { timeout: 30000 })
      .catch(() => {});
    await page.evaluate(() => window.Rebuy?.SmartCart?.show?.());
    // the root node has no box of its own, so wait for it to be attached, not visible
    return page.waitForSelector('#rebuy-cart.is-visible', { state: 'attached', timeout: 15000 }).catch(() => null);
  };
  let open = await openCart();
  if (!open) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    open = await openCart();
  }
  if (!open) {
    const why = await page.evaluate(() => ({
      url: location.pathname + location.search,
      rebuy: typeof window.Rebuy,
      smartCart: typeof window.Rebuy?.SmartCart,
      node: Boolean(document.querySelector('#rebuy-cart')),
      banner: Boolean(document.querySelector('pandectes-cmp')?.shadowRoot?.querySelector('button')),
    }));
    console.log(width, 'SMART CART DID NOT OPEN', JSON.stringify(why));
    continue;
  }
  await page.waitForTimeout(4000); // widgets render after the cart

  // Preview chrome (Shopify's bar, Rebuy's bar) covers the cart footer
  await page.addStyleTag({
    content: '#PBarNextFrameWrapper, #rebuy-admin, #rebuy-bubble-global-alert-modal { display: none !important; }',
  });

  const info = await page.evaluate(() => {
    const panel = document.querySelector('#rebuy-cart .rebuy-cart__flyout');
    const r = panel.getBoundingClientRect();
    return {
      cartId: window.Rebuy?.SmartCart?.settings?.id ?? null,
      engine: document.documentElement.getAttribute('data-cart-engine'),
      panel: `x${Math.round(r.x)} y${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  });
  console.log(width, JSON.stringify(info));

  // EVAL runs first, so it can set up a state (and measure) before the captures
  if (EVAL) {
    const result = await page.evaluate(`(async () => { ${EVAL} })()`).catch((e) => `EVAL ERROR: ${e.message}`);
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 1));
  }

  await page.screenshot({ path: join(OUT, `cart-${width}${TAG}.png`) });
  await page.locator('#rebuy-cart .rebuy-cart__flyout').screenshot({ path: join(OUT, `panel-${width}${TAG}.png`) });
}

console.log('screenshots in', OUT);
await context.close();
