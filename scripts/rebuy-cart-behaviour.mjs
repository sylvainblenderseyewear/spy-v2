/*
  Behaviour tests for the mini-cart, against audit/page-spec-cart-drawer.md §2.

  A  Rebuy BLOCKED  -> the theme drawer must still work. This is the whole point
                       of the consent fallback, so it is tested by actually
                       blocking rebuyengine.com, not by reasoning about it.
  B  Rebuy ALLOWED  -> Smart Cart takes over, Escape and an outside click both
                       close it, and the console must stay clean.

  Smart Cart is published (12 Oct), so no preview_smart_cart parameter. The
  full live check, decline included, is scripts/production-cart-check.mjs.

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

if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env.');
  process.exit(2);
}

const url = `${STORE}/?preview_theme_id=${THEME_ID}`;
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
  // The password page is already loaded, so waitForLoadState returns at once and
  // the next goto can collide with the login redirect. Wait for the URL instead.
  await page.waitForURL((u) => !u.pathname.startsWith('/password'), { timeout: 60000 }).catch(() => {});
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

  // #rebuy-cart stays display:block when closed; only is-visible toggles
  const visible = () => page.evaluate(() => Boolean(document.querySelector('#rebuy-cart.is-visible')));
  check('B Smart Cart is open', await visible());

  // Esc closes the published cart, like our theme drawer (kept for WCAG)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  check('B Escape closes it', !(await visible()));

  // Outside click closes it, like the source
  await page.locator('[data-testid="cart-drawer-trigger"]:visible').first().click({ timeout: 15000 });
  await page.waitForTimeout(2500);
  check('B bag reopens it', await visible());
  check('B theme drawer stays shut', !(await page.evaluate(() => !!document.querySelector('theme-drawer#cart-drawer[open]'))));
  await page.mouse.click(400, 450);
  await page.waitForTimeout(1500);
  check('B outside click closes it', !(await visible()));

  check('B no errors from our code', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`B third-party console errors (not asserted): ${context.__thirdParty.length}`);
  for (const e of context.__thirdParty.slice(0, 4)) console.log('   3p:', e.slice(0, 100));
  await context.close();
}

console.table(results);
console.log(failures ? `${failures} failure(s)` : 'all behaviour checks pass');
await browser.close();
process.exit(failures ? 1 : 0);
