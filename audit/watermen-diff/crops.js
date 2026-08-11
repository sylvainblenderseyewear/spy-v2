const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'C:/spy-v2/audit/watermen-diff/';
const shot = async (page, sel, file, pad = 40) => {
  const box = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null;
    const sc = document.querySelector('.page-wrapper'); const off = (sc && sc.scrollTop) || window.scrollY || 0;
    const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + off, w: r.width, h: r.height }; }, sel);
  if (!box) { console.log('   no ' + sel); return; }
  await page.screenshot({ path: OUT + file, timeout: 180000, animations: 'disabled',
    clip: { x: 0, y: Math.max(0, box.y - pad), width: box.x + box.w + 20, height: box.h + pad * 2 } });
  console.log('   ' + file + '  ' + Math.round(box.w) + 'x' + Math.round(box.h));
};
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of [1440, 768]) {
    const p = await b.newPage({ viewport: { width: W, height: 1000 } });
    await p.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(6000);
    let h = await p.evaluate(() => document.querySelector('.page-wrapper').scrollHeight);
    await p.setViewportSize({ width: W, height: Math.min(h + 40, 30000) }); await p.waitForTimeout(1500);
    await shot(p, '[id$="__ice_blue"]', `crop-cur-rail-${W}.png`);
    await shot(p, '[id$="__lens_options"]', `crop-cur-lensopt-${W}.png`);
    await shot(p, '[id$="__lens_benefits"]', `crop-cur-benefits-${W}.png`);
    await p.close();

    const q = await b.newPage({ viewport: { width: W, height: 1000 } });
    await q.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await q.waitForTimeout(4000);
    h = await q.evaluate(() => document.body.scrollHeight);
    await q.setViewportSize({ width: W, height: Math.min(h + 40, 30000) }); await q.waitForTimeout(1500);
    await q.evaluate(() => { const hs = [...document.querySelectorAll('h2')].find(e => /ICE BLUE/i.test(e.textContent));
      if (hs) { let n = hs; while (n && !n.classList.contains('experience-component')) n = n.parentElement;
        if (n && n.nextElementSibling) n.nextElementSibling.setAttribute('data-rail', '1'); if (n) n.setAttribute('data-railhead','1'); } });
    await shot(q, '[data-railhead]', `crop-ref-railhead-${W}.png`, 20);
    await shot(q, '[data-rail]', `crop-ref-rail-${W}.png`, 20);
    await shot(q, '.fishing-selector-container', `crop-ref-lensopt-${W}.png`);
    await shot(q, '.hbc-carousel-container, .hbc-container', `crop-ref-benefits-${W}.png`);
    await q.close();
  }
  await b.close();
})();
