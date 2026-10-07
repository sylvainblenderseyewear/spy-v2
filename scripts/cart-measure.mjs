/*
  Measures the mini-cart against audit/page-spec-cart-drawer.md §10.
  Works on either engine so both paths are held to one spec.

  Run:  node scripts/cart-measure.mjs --engine=theme --width=1440
  Exit: 0 = match, 1 = drift or cart did not open.
*/
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const ENGINE = arg('engine', 'theme');
const WIDTH = Number(arg('width', 1440));
const STORE = process.env.SPY_BASE || 'http://127.0.0.1:9292';
const PASSWORD = process.env.SPY_PASSWORD || '';
const PREVIEW = process.env.PREVIEW_THEME_ID ? `?preview_theme_id=${process.env.PREVIEW_THEME_ID}` : '';

// Panel root per engine. The rebuy root is untested until Smart Cart is enabled.
const ROOT = ENGINE === 'rebuy' ? '#rebuy-cart' : 'dialog.cart-drawer__panel';

// Selectors per element, theme first and rebuy second (rebuy ones are first guesses).
const SEL = {
  header: '.theme-drawer__header, .rebuy-cart__header',
  title: '.theme-drawer__title, .rebuy-cart__title',
  image: '.cart-items__media-image, .rebuy-cart__flyout-item-image img',
  name: '.cart-items__title, .rebuy-cart__flyout-item-title',
  variant: '.cart-items__variants-wrapper, .rebuy-cart__flyout-item-variant',
  linePrice: '.cart-items__price, .rebuy-cart__flyout-item-price',
  cta: '.cart__checkout-button, .rebuy-cart__checkout-button',
};

// From audit/page-spec-cart-drawer.md §10, measured at 1440.
// Numbers allow 1px (the source panel's own left border). Strings must match exactly.
const EXPECT = {
  panel:     { w: 320, h: null },
  header:    { h: 41 },
  title:     { fontSize: '13px', lineHeight: '18.2px', fontWeight: '600', color: 'rgb(29, 42, 43)' },
  image:     { w: 95, h: 95 },
  name:      { fontSize: '15px', lineHeight: '18px', fontWeight: '700', color: 'rgb(29, 42, 43)' },
  variant:   { fontSize: '13px', lineHeight: '18.2px', fontWeight: '400' },
  linePrice: { fontSize: '16px', lineHeight: '22.4px', color: 'rgb(34, 34, 34)' },
  cta:       { h: 52, fontSize: '12px', lineHeight: '16.8px', backgroundColor: 'rgb(242, 126, 55)' },
};

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });

if (PASSWORD) {
  await page.goto(`${STORE}/password`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="password"]', PASSWORD).catch(() => {});
  await page.press('input[name="password"]', 'Enter').catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

await page.goto(`${STORE}/${PREVIEW}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

// Consent: grant for rebuy, decline for theme (declining proves the fallback is real).
const wanted = ENGINE === 'rebuy' ? /accept|allow all|agree/i : /decline|reject|only necessary/i;
const btn = page.getByRole('button', { name: wanted }).first();
if (await btn.isVisible().catch(() => false)) await btn.click();
await page.waitForTimeout(2000);
// Rebuy only boots fully on the next load after consent
if (ENGINE === 'rebuy') {
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(7000);
}

// Open a product by URL (a click is blocked by the card overlay), then add one item
await page.goto(`${STORE}/collections/all${PREVIEW}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const href = await page.locator('a[href*="/products/"]').first().getAttribute('href');
await page.goto(new URL(href, STORE).href, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.locator('button[name="add"], add-to-cart-component button').first().click();
await page.waitForTimeout(4000);

const root = page.locator(ROOT).first();
// Give the drawer time to open on a slow dev server
const opened = await root.waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false);
if (!opened) {
  console.error(`FAIL: ${ENGINE} cart did not open (root ${ROOT} not visible)`);
  await browser.close();
  process.exit(1);
}

const measured = await page.evaluate(([sel, map]) => {
  const pick = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      fontSize: c.fontSize, lineHeight: c.lineHeight, fontWeight: c.fontWeight,
      color: c.color, backgroundColor: c.backgroundColor,
    };
  };
  const root = document.querySelector(sel);
  const out = { panel: pick(root) };
  for (const [k, s] of Object.entries(map)) out[k] = pick(root.querySelector(s));
  return out;
}, [ROOT, SEL]);

let failed = 0;
const rows = [];
for (const [key, want] of Object.entries(EXPECT)) {
  const got = measured[key];
  for (const [prop, expected] of Object.entries(want)) {
    if (expected === null) continue;
    const actual = got?.[prop];
    const numeric = typeof expected === 'number';
    const ok = Boolean(got) && (numeric ? Math.abs(actual - expected) <= 1 : actual === expected);
    if (!ok) failed++;
    rows.push({
      element: `${key}.${prop}`, expected, actual: actual ?? '(missing)',
      delta: numeric && got ? actual - expected : '', ok: ok ? 'ok' : 'DRIFT',
    });
  }
}
console.table(rows);
console.log(`${ENGINE} @ ${WIDTH}: ${failed} drift(s)`);
await browser.close();
process.exit(failed ? 1 : 0);
