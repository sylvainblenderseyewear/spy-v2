import { chromium } from 'playwright-core';

const BASE = process.env.SPY_BASE || 'http://127.0.0.1:9293';
const CART_ID = process.env.CART_ID || '37798';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const url = `${BASE}/?preview_smart_cart=${CART_ID}`;
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);

// consent: Rebuy will not boot until accepted
for (const name of [/^accept/i, /allow all/i, /^agree/i, /accept all/i]) {
  const b = page.getByRole('button', { name }).first();
  if (await b.isVisible().catch(() => false)) { await b.click().catch(()=>{}); break; }
}
await page.waitForTimeout(2500);
await page.goto(url, { waitUntil: 'domcontentloaded' });  // Rebuy fully boots next load
await page.waitForTimeout(5000);

const r = await page.evaluate(() => ({
  rebuyPresent: typeof window.Rebuy !== 'undefined',
  status: window.Rebuy?._status ?? null,
  smartCartFlag: window.Rebuy?.smart_cart ?? null,
  smartCartObj: typeof window.Rebuy?.SmartCart,
  rebuyCartNode: !!document.querySelector('#rebuy-cart'),
  themeDrawerNode: !!document.querySelector('theme-drawer#cart-drawer'),
  previewBar: !!document.querySelector('[class*="rebuy-preview"], [id*="rebuy-preview"]'),
  rebuyScripts: performance.getEntriesByType('resource')
      .filter(e => /rebuy/i.test(e.name)).length,
}));
console.log(JSON.stringify(r, null, 1));
await browser.close();
