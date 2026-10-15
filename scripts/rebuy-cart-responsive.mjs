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
      HEADED=1 to watch · THEME_ID=... to override
      PREVIEW_CART=38089 to check an unpublished cart (on the dev theme, which has its CSS)

  Smart Cart is published (12 Oct), so no preview_smart_cart parameter by default.
  The expected panel follows the live cart: 37798 is 320px everywhere, 38089 (the
  Figma redesign) is 375px and fills the screen up to 480px.

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
const WIDTHS = (process.env.WIDTHS || '1440,768,390').split(',').map(Number);

if (!PASSWORD) {
  console.error('SPY_PASSWORD is not set. Add it to .env — the storefront is password protected.');
  process.exit(2);
}

const PREVIEW_CART = process.env.PREVIEW_CART || '';
const url = `${STORE}/?preview_theme_id=${THEME_ID}&viewcart=true${PREVIEW_CART ? `&preview_smart_cart=${PREVIEW_CART}&cart_version=2` : ''}`;

// Panel width each known cart should have at a given viewport width
const PANEL = {
  37798: () => 320,
  38089: (vw) => (vw <= 480 ? vw : 375),
};
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
  // The password page is already loaded, so waitForLoadState returns at once and
  // the next goto can collide with the login redirect. Wait for the URL instead.
  await page.waitForURL((u) => !u.pathname.startsWith('/password'), { timeout: 60000 }).catch(() => {});
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

  // Rebuy boots on the next load after consent, 6-15s after each load (slower in
  // preview). Wait until it owns the bag and can open, not a fixed time.
  const rebuyReady = () => page
    .waitForFunction(
      () => document.documentElement.dataset.cartEngine === 'rebuy' && typeof window.Rebuy?.SmartCart?.show === 'function',
      null,
      { timeout: 30000 }
    )
    .then(() => true, () => false);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await rebuyReady();

  const measure = () => page.evaluate(() => {
    const root = document.querySelector('#rebuy-cart');
    if (!root) return null;
    const panel = root.querySelector('.rebuy-cart__flyout');
    if (!panel) return null;
    const wrapper = document.querySelector('.page-wrapper');
    return {
      panel: Math.round(panel.getBoundingClientRect().width),
      left: Math.round(panel.getBoundingClientRect().x),
      cartId: window.Rebuy?.SmartCart?.settings?.id ?? null,
      // the closed panel keeps its width, just off-screen
      open: root.classList.contains('is-visible'),
      viewport: window.innerWidth,
      wrapperMargin: wrapper ? getComputedStyle(wrapper).marginRight : '0px',
      engine: document.documentElement.getAttribute('data-cart-engine'),
    };
  });

  // viewcart=true does not always open a previewed cart; ask Rebuy directly
  const openCart = async () => {
    await page.evaluate(() => {
      if (!document.querySelector('#rebuy-cart.is-visible')) window.Rebuy?.SmartCart?.show?.();
    });
    await page.waitForFunction(() => document.querySelector('#rebuy-cart.is-visible'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800); // the 426ms slide
  };
  await openCart();

  let measured = await measure();

  // Rebuy can lose a cold first load. Give it one more pass before failing,
  // or the harness reports a red that a rerun turns green.
  if (!measured || !measured.open) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await rebuyReady();
    await openCart();
    measured = await measure();
  }

  if (!measured) {
    rows.push({ width, result: 'SMART CART DID NOT RENDER (two attempts)' });
    failures++;
    await context.close();
    continue;
  }

  // No lock = a real wheel behind the open cart moves the page. A computed
  // overflow check passed on 8 Oct while every desktop page was frozen.
  // Half way across the free page; the Figma cart leaves none on a phone.
  const outside = measured.left > 40 ? Math.round(measured.left / 2) : null;
  let scrolled = null;
  if (outside) {
    await page.mouse.move(outside, 700);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1200);
    scrolled = await page.evaluate(
      () => (document.querySelector('.page-wrapper')?.scrollTop || 0) + window.scrollY > 0
    );
  }

  // The live cart decides the panel: 37798 is 320 everywhere and never
  // full-bleed; 38089 is 375 and fills the screen up to 480px. Overlay only,
  // no push, no lock, for both.
  const wanted = PANEL[measured.cartId]?.(measured.viewport);
  const fullBleed = measured.panel >= measured.viewport - 1;
  const checks = {
    'cart open': measured.open,
    [`panel ${wanted ?? '?'} (cart ${measured.cartId})`]: Boolean(wanted) && Math.abs(measured.panel - wanted) <= 1,
    'full-bleed only where designed': wanted ? fullBleed === (wanted >= measured.viewport) : false,
    'no page push': measured.wrapperMargin === '0px',
    'engine rebuy': measured.engine === 'rebuy',
  };
  if (outside) checks['page scrolls behind it'] = scrolled;
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  failures += failed.length;
  rows.push({
    width,
    cart: measured.cartId,
    panel: measured.panel,
    result: (failed.length ? `DRIFT: ${failed.join(', ')}` : 'ok') + (outside ? '' : ' (no room beside the panel)'),
  });

  await context.close();
}

console.table(rows);
console.log(failures ? `${failures} drift(s)` : 'all widths match the spec');
await browser.close();
process.exit(failures ? 1 : 0);
