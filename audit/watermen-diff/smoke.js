// Smoke check the pages touched by the shared-component edits.
const { chromium } = require('playwright-core');
const path = require('path');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'C:/spy-v2/audit/watermen-diff';

const PAGES = [
  ['home', 'http://127.0.0.1:9292/'],
  ['ansi', 'http://127.0.0.1:9292/pages/ansi-photochromic'],
  ['plp', 'http://127.0.0.1:9292/collections/sunglasses'],
  ['pdp', 'http://127.0.0.1:9292/products/spy-dirk-matte-black-sunglasses'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [name, url] of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    console.log('  ->', name, page.url(), await page.title());
    await page.waitForTimeout(3000);
    await page.evaluate(async () => {
      const w = document.querySelector('.page-wrapper') || document.documentElement;
      for (let y = 0; y < w.scrollHeight; y += 500) { w.scrollTop = y; window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      w.scrollTop = 0; window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => {
      const g = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      };
      return {
        banner: g('.spy-feature-link-banner'),
        card: g('.product-card'),
        gallery: g('.product-card .card-gallery'),
        media: g('.product-card .card-gallery slideshow-slide'),
        carouselCard: g('.section-carousel .card'),
      };
    });
    // shots: first product carousel and the banner if present
    for (const [k, sel] of [['banner', '.spy-feature-link-banner'], ['list', '.section-resource-list'], ['carousel', '.section-carousel']]) {
      const loc = page.locator(sel).first();
      if (await loc.count()) await loc.screenshot({ path: path.join(OUT, `smoke-${name}-${k}.png`), scale: 'css' }).catch(() => {});
    }
    console.log(name, JSON.stringify(info), 'pageerrors:', errs.length, errs.slice(0, 3).join(' | '));
    await page.close();
  }
  await browser.close();
})();
