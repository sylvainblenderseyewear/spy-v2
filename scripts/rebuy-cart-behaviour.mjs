/*
  Behaviour tests for the mini-cart, against audit/page-spec-cart-drawer.md §2.

  A  Rebuy BLOCKED  -> the theme drawer must still work. This is the whole point
                       of the consent fallback, so it is tested by actually
                       blocking rebuyengine.com, not by reasoning about it.
  B  Rebuy ALLOWED  -> Smart Cart takes over; Escape must NOT close it, an
                       outside click must, and the console must stay clean.

  Run:  node scripts/rebuy-cart-behaviour.mjs        (needs SPY_PASSWORD in .env)
        HEADED=1 to watch
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
const CART_ID = process.env.CART_ID || '37798';

if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env.');
  process.exit(2);
}

const url = `${STORE}/?preview_theme_id=${THEME_ID}&preview_smart_cart=${CART_ID}&cart_version=2`;
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const results = [];
let failures = 0;

const check = (name, pass, detail = '') => {
  results.push({ check: name, result: pass ? 'ok' : 'FAIL', detail });
  if (!pass) failures++;
};

async function open(blockRebuy) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (blockRebuy) {
    // Exactly what Pandectes does for a shopper who has not consented
    await context.route('**://*.rebuyengine.com/**', (route) => route.abort());
  }
  const page = await context.newPage();
  // Only OUR code is allowed to be error-free. A real storefront always emits
  // third-party noise — Shop Pay CSP, accessiBe's 404, Shopify's pixel manager,
  // and in scenario A the Rebuy requests this test aborts on purpose. Those are
  // counted and printed, never asserted on, so the check keeps its meaning.
  const OURS = /spy-cart-handoff|spy-[a-z-]+\.js|tailwind\.css|cart-drawer\.js|cart-products|cart-summary/i;
  const ours = [];
  const thirdParty = [];
  const note = (text) => (OURS.test(text) ? ours : thirdParty).push(text.slice(0, 140));
  page.on('console', (m) => { if (m.type() === 'error') note(m.text()); });
  page.on('pageerror', (e) => note('PAGEERROR ' + String(e)));
  const errors = ours;
  page.on('close', () => {});
  context.on('close', () => {});
  // expose for reporting
  context.__thirdParty = thirdParty;

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

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    const root = document.querySelector('pandectes-cmp')?.shadowRoot;
    [...(root?.querySelectorAll('button') || [])].find((b) => /accept/i.test(b.innerText || ''))?.click();
  });
  await page.waitForTimeout(2500);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  return { context, page, errors };
}

// Put an item in the cart. Clicking a product card is unreliable — the card
// image intercepts pointer events — so use Shopify's cart AJAX API instead.
async function seedCart(page) {
  await page.goto(`${STORE}/collections/all`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const added = await page.evaluate(async () => {
    const link = [...document.querySelectorAll('a[href*="/products/"]')]
      .map((a) => a.getAttribute('href'))
      .find(Boolean);
    if (!link) return 'no product link';
    const handle = link.split('/products/')[1].split(/[?#]/)[0];

    const product = await fetch(`/products/${handle}.js`).then((r) => r.json());
    const variant = (product.variants || []).find((v) => v.available) || product.variants?.[0];
    if (!variant) return 'no variant';

    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] }),
    });
    return res.ok ? 'ok' : 'add failed ' + res.status;
  });

  if (added !== 'ok') console.error('seedCart:', added);
  await page.waitForTimeout(1500);
}

// ── A: Rebuy blocked, the theme drawer must carry the cart ─────────────────
{
  const { context, page, errors } = await open(true);
  const engine = await page.evaluate(() => document.documentElement.getAttribute('data-cart-engine'));
  check('A engine stays "theme" when Rebuy is blocked', engine === 'theme', `got ${engine}`);
  check('A no Rebuy cart node', !(await page.evaluate(() => !!document.querySelector('#rebuy-cart'))));

  await seedCart(page);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(5000);

  await page.locator('[data-testid="cart-drawer-trigger"]').click({ timeout: 15000 }).catch((e) =>
    console.error('A bag click:', e.message.slice(0, 60))
  );
  await page.waitForTimeout(2000);
  const drawerOpened = await page.evaluate(() => !!document.querySelector('theme-drawer#cart-drawer[open]'));
  check('A theme drawer opens from the bag', drawerOpened);
  check('A cart has items in the drawer', await page.evaluate(() => !!document.querySelector('.cart-items__table-row')));
  check('A no errors from our code', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`A third-party console errors (not asserted): ${context.__thirdParty.length}`);
  await context.close();
}

// ── B: Rebuy allowed, Smart Cart owns the cart ─────────────────────────────
{
  const { context, page, errors } = await open(false);
  await seedCart(page);
  await page.goto(`${url}&viewcart=true`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(9000);

  const engine = await page.evaluate(() => document.documentElement.getAttribute('data-cart-engine'));
  check('B engine switches to "rebuy"', engine === 'rebuy', `got ${engine}`);

  const visible = () => page.evaluate(() => {
    const el = document.querySelector('#rebuy-cart');
    return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  });
  check('B Smart Cart is open', await visible());

  // The source cart ignores Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  check('B Escape does NOT close it', await visible());

  // NOT TESTED: outside-click-to-close. Rebuy's preview mode holds the cart
  // open — it is already open on load without viewcart=true, and even a direct
  // Rebuy.SmartCart.hide() does not close it. So the preview cannot tell us
  // whether outside click works. Verify once Smart Cart is published.

  check('B no errors from our code', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`B third-party console errors (not asserted): ${context.__thirdParty.length}`);
  for (const e of context.__thirdParty.slice(0, 4)) console.log('   3p:', e.slice(0, 100));
  await context.close();
}

console.table(results);
console.log(failures ? `${failures} failure(s)` : 'all behaviour checks pass');
await browser.close();
process.exit(failures ? 1 : 0);
