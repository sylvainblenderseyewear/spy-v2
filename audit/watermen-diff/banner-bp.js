// Where does the source banner swap its art, and where does its copy reflow?
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of [1200, 1199, 992, 991, 900]) {
    const p = await b.newPage({ viewport: { width: W, height: 1200 } });
    await p.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(4500);
    await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
    const h = await p.evaluate(() => document.body.scrollHeight);
    await p.setViewportSize({ width: W, height: Math.min(h + 60, 30000) });
    await p.waitForTimeout(3000);
    const out = await p.evaluate(() => {
      const els = [...document.querySelectorAll('.hero-banner,.banner-container,.experience-assets-banner')];
      const e = els.find(x => x.getBoundingClientRect().height > 50) || els[0];
      const hd = document.querySelector('.banner-heading');
      const hr = hd && hd.getBoundingClientRect();
      return { band: e ? +e.getBoundingClientRect().height.toFixed(0) : null,
        heading: hr ? { x: +hr.left.toFixed(0), y: +hr.top.toFixed(0), fs: getComputedStyle(hd).fontSize,
          ta: getComputedStyle(hd).textAlign } : null };
    });
    console.log(`${String(W).padStart(5)}  ${JSON.stringify(out)}`);
    await p.close();
  }
  await b.close();
})();
