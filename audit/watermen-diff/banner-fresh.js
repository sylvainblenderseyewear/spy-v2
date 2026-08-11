// Fresh load per width — no resize, so each page picks its own art from scratch.
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of [1440, 769, 768, 390]) {
    const row = {};
    for (const [tag, url, sel] of [
      ['cur', 'http://127.0.0.1:9292/pages/watermen', '.spy-feature-link-banner'],
      ['ref', 'http://127.0.0.1:8899/waterman/Watermen%20Collection.html', '.hero-banner,.banner-container,.experience-assets-banner']]) {
      const p = await b.newPage({ viewport: { width: W, height: 1200 } });
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await p.waitForTimeout(5000);
      await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
      const h = await p.evaluate(() => { const w = document.querySelector('.page-wrapper');
        return Math.max(document.body.scrollHeight, w ? w.scrollHeight : 0); });
      await p.setViewportSize({ width: W, height: Math.min(h + 60, 30000) });
      await p.waitForTimeout(3500);
      row[tag] = await p.evaluate((s) => {
        const els = [...document.querySelectorAll(s)];
        const e = els.find(x => x.getBoundingClientRect().height > 50) || els[0];
        if (!e) return 'none';
        const imgs = [...e.querySelectorAll('img')].map(i => ({
          shown: getComputedStyle(i).display !== 'none',
          h: +i.getBoundingClientRect().height.toFixed(0),
          f: (i.currentSrc || i.src).split('/').pop().slice(0, 30) })).filter(i => i.shown);
        return { band: +e.getBoundingClientRect().height.toFixed(0), imgs };
      }, sel);
      await p.close();
    }
    console.log(`${String(W).padStart(5)}  cur ${JSON.stringify(row.cur)}\n       ref ${JSON.stringify(row.ref)}`);
  }
  await b.close();
})();
