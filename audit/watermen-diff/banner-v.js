const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of [1440, 1200, 992, 991, 768, 390]) {
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
      await p.waitForTimeout(3200);
      row[tag] = await p.evaluate((s) => {
        const els = [...document.querySelectorAll(s)];
        const e = els.find(x => x.getBoundingClientRect().height > 50) || els[0];
        if (!e) return 'none';
        const hd = e.querySelector('h2');
        return { band: +e.getBoundingClientRect().height.toFixed(0),
          ta: hd ? getComputedStyle(hd).textAlign : null,
          fs: hd ? getComputedStyle(hd).fontSize : null };
      }, sel);
      await p.close();
    }
    const ok = row.cur && row.ref && Math.abs(row.cur.band - row.ref.band) <= 2 && row.cur.ta === row.ref.ta;
    console.log(`${String(W).padStart(5)} ${ok ? 'OK  ' : 'DIFF'} cur ${JSON.stringify(row.cur)}  ref ${JSON.stringify(row.ref)}`);
  }
  await b.close();
})();
