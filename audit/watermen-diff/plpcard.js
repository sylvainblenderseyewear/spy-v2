// Measure the default PLP card so the watermen carousel card can match it.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = process.argv[2] || 'http://127.0.0.1:9292/collections/sunglasses';
const OUT = process.argv[3] || 'plpcard';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);
  const data = await page.evaluate(() => {
    const card = document.querySelector('.product-card');
    if (!card) return { error: 'no card' };
    const base = card.getBoundingClientRect();
    const g = (el, name) => {
      if (!el) return { name, missing: true };
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return { name, w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +(r.left - base.left).toFixed(1), y: +(r.top - base.top).toFixed(1),
        pad: cs.padding, mar: cs.margin, pos: cs.position, disp: cs.display,
        fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, ta: cs.textAlign,
        color: cs.color, bg: cs.backgroundColor, bd: cs.border, op: cs.opacity, vis: cs.visibility,
        txt: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
    };
    const q = (s) => g(card.querySelector(s), s);
    return {
      card: g(card, 'card'),
      parts: ['.product-card__content', '.spy-tech-badge', '.card-gallery', '.card-gallery img',
        '.spy-quick-view-btn', '.spy-new-badge', '.spy-new-badge > *', '.spy-variant-name',
        '.spy-swatches', '.spy-swatches__item', '.text-block p', 'product-price', '.price'].map(q),
      html: card.outerHTML.replace(/\s+/g, ' ').slice(0, 4000)
    };
  });
  fs.writeFileSync(`C:/spy-v2/audit/watermen-diff/${OUT}.json`, JSON.stringify(data, null, 2));
  const card = page.locator('.product-card').first();
  await card.screenshot({ path: `C:/spy-v2/audit/watermen-diff/${OUT}.png`, scale: 'css' }).catch(() => {});
  console.log(JSON.stringify(data.parts || data, null, 1));
  await browser.close();
})();
