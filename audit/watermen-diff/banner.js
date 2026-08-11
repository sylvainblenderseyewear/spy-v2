const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 1440, height: 5000 } });
  await p.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(6000);
  const q = await b.newPage({ viewport: { width: 1440, height: 5000 } });
  await q.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await q.waitForTimeout(4000);
  for (const W of [1440, 769, 768, 390]) {
    await p.setViewportSize({width:W,height:5000}); await q.setViewportSize({width:W,height:5000});
    await p.waitForTimeout(900); await q.waitForTimeout(900);
    const c = await p.evaluate(() => { const e = document.querySelector('.spy-feature-link-banner');
      const img = e && e.querySelector('img'); const r = e && e.getBoundingClientRect();
      return e ? { h: +r.height.toFixed(0), w: +r.width.toFixed(0),
        img: img ? +img.getBoundingClientRect().height.toFixed(0)+'h src…'+(img.currentSrc||'').slice(-34) : 'none' } : null; });
    const r = await q.evaluate(() => { const e = document.querySelector('.hero-banner, .banner-container, .experience-assets-banner');
      const cand = [...document.querySelectorAll('img')].find(i => /banner|shop/i.test(i.src));
      const box = e && e.getBoundingClientRect();
      return { h: box ? +box.height.toFixed(0) : null, img: cand ? +cand.getBoundingClientRect().height.toFixed(0)+'h src…'+cand.src.slice(-34) : 'none' }; });
    console.log(`${String(W).padStart(5)}  cur ${JSON.stringify(c)}\n       ref ${JSON.stringify(r)}`);
  }
  await b.close();
})();
