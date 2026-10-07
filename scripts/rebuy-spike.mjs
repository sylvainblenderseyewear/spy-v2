/*
  Task 0 spike: how does Rebuy Smart Cart behave on this store?
  Run: node scripts/rebuy-spike.mjs   (HEADED=1 to watch)
  Needs `shopify theme dev` on SPY_BASE (default 127.0.0.1:9292).
*/
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const STORE = process.env.SPY_BASE || 'http://127.0.0.1:9292';
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { consent: {} };

// Accept the Pandectes banner, or record that we could not
await page.goto(`${STORE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
report.consent.bannerButtons = await page.evaluate(() =>
  [...document.querySelectorAll('[id*="pandectes" i] button, [class*="pandectes" i] button, [class*="cc-" i] a, [class*="cc-" i] button')]
    .map((b) => (b.innerText || '').trim() + ' | ' + (b.className || '')).slice(0, 15)
);
const accept = page.locator('.cc-allow, .cc-btn.cc-allow, button:has-text("Accept all"), button:has-text("Accept"), a.cc-allow').first();
if (await accept.isVisible().catch(() => false)) {
  report.consent.clicked = (await accept.innerText().catch(() => '')).trim();
  await accept.click();
} else report.consent.clicked = null;
await page.waitForTimeout(2000);
// Rebuy only boots fully on the next load after consent
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(7000);

report.rebuy = await page.evaluate(() => {
  const R = window.Rebuy;
  if (!R) return { present: false, rebuyScripts: [...document.scripts].map((s) => s.src).filter((s) => /rebuy/i.test(s)) };
  return {
    present: true,
    status: R._status ?? null,
    smart_cart: R.smart_cart ?? null, // false = no Smart Cart in Rebuy admin
    activePackages: R.shop?.active_packages ?? null,
    smartCartKeys: R.SmartCart ? Object.keys(R.SmartCart) : null,
    smartCartStatus: R.SmartCart?.status ?? null,
    rootFound: Boolean(document.querySelector('#rebuy-cart')),
    rebuyScripts: [...document.scripts].map((s) => s.src).filter((s) => /rebuy/i.test(s)),
  };
});

async function dumpTemplates(name) {
  return page.evaluate(() =>
    [...document.querySelectorAll('script[type="text/template"]')].map((s) => ({ id: s.id, html: s.innerHTML }))
  );
}

// Product page, add to cart
await page.goto(`${STORE}/collections/all`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const href = await page.locator('a[href*="/products/"]').first().getAttribute('href');
await page.goto(new URL(href, STORE).href, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
report.pdp = href;
report.atcCandidates = await page.evaluate(() =>
  [...document.querySelectorAll('button')].filter((b) => /add to (cart|bag)/i.test(b.innerText) || b.name === 'add').map((b) => b.outerHTML.slice(0, 200))
);
const atc = page.locator('button[name="add"], add-to-cart-component button, button:has-text("Add to bag"), button:has-text("Add to cart")').first();
if (await atc.isVisible().catch(() => false)) { await atc.click(); await page.waitForTimeout(4000); }

report.afterAddToCart = await page.evaluate(() => {
  const d = document.querySelector('theme-drawer#cart-drawer, #cart-drawer, cart-drawer-component');
  return {
    themeDrawerTag: d ? d.tagName + '#' + d.id : null,
    themeDrawerOpen: Boolean(document.querySelector('theme-drawer#cart-drawer[open], dialog[open]')),
    rebuyCartVisible: window.Rebuy?.SmartCart?.visible ?? null,
    rebuyCartEl: (() => { const e = document.querySelector('#rebuy-cart'); return e ? { cls: e.className, visible: !!(e.offsetWidth || e.offsetHeight) } : null; })(),
  };
});

const templates = await dumpTemplates();
const withCart = await page.evaluate(() => document.querySelector('#rebuy-cart')?.outerHTML.slice(0, 6000) ?? null);
report.templateIds = templates.map((t) => t.id);
writeFileSync(
  new URL('../audit/rebuy-default-smartcart-template.html', import.meta.url),
  templates.length
    ? templates.map((t) => `<!-- ===== ${t.id} ===== -->\n${t.html}`).join('\n\n')
    : '<!-- No script[type="text/template"] found on the page. -->\n'
);
report.rebuyCartDomSample = withCart;

report.styleOrder = await page.evaluate(() =>
  [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((n, i) => ({ i, href: n.getAttribute('href') || '(inline ' + (n.id || '') + ')' }))
    .filter((s) => /rebuy|tailwind|base/i.test(s.href))
);

console.log(JSON.stringify(report, null, 2));
await browser.close();
