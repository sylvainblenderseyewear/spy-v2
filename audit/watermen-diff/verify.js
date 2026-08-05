// Side-by-side full-page slices of the theme page and the saved reference.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'C:/spy-v2/audit/watermen-diff';
const WIDTH = parseInt(process.argv[2] || '1440', 10);
const TAG = process.argv[3] || 'd';
const SLICE = 1000;

async function slices(page, prefix, scrollerSel) {
  const h = await page.evaluate((sel) => {
    const w = sel ? document.querySelector(sel) : null;
    return (w || document.documentElement).scrollHeight;
  }, scrollerSel);
  const n = Math.ceil(h / SLICE);
  for (let i = 0; i < n; i++) {
    await page.evaluate(([sel, y]) => {
      const w = sel ? document.querySelector(sel) : null;
      if (w) w.scrollTop = y;
      window.scrollTo(0, y);
      document.documentElement.scrollTop = y;
      document.body.scrollTop = y;
    }, [scrollerSel, i * SLICE]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${prefix}-${TAG}-s${String(i).padStart(2, '0')}.png`), scale: 'css' });
  }
  return { h, n };
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });

  const p1 = await browser.newPage({ viewport: { width: WIDTH, height: SLICE } });
  const errors = [];
  p1.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  p1.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 200)));
  await p1.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'load', timeout: 60000 });
  await p1.waitForTimeout(3000);
  await p1.evaluate(async () => {
    const w = document.querySelector('.page-wrapper');
    for (let y = 0; y < w.scrollHeight; y += 400) { w.scrollTop = y; await new Promise(r => setTimeout(r, 70)); }
    w.scrollTop = 0;
  });
  await p1.waitForTimeout(1500);
  const cur = await slices(p1, 'V-cur', '.page-wrapper');
  await p1.close();

  const p2 = await browser.newPage({ viewport: { width: WIDTH, height: SLICE } });
  await p2.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p2.waitForTimeout(3000);
  await p2.evaluate(async () => {
    document.querySelectorAll('img.lazyload[data-src]').forEach(img => {
      const ds = img.getAttribute('data-src');
      img.setAttribute('src', './Watermen Collection_files/' + decodeURIComponent(ds.split('/').pop().split('?')[0]));
      img.classList.remove('lazyload'); img.classList.add('lazyloaded');
    });
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
    window.scrollTo(0, 0);
  });
  await p2.waitForTimeout(1500);
  const ref = await slices(p2, 'V-ref', null);
  await p2.close();

  await browser.close();
  fs.writeFileSync(path.join(OUT, `verify-${TAG}.json`), JSON.stringify({ cur, ref, errors }, null, 2));
  console.log(JSON.stringify({ cur, ref, errorCount: errors.length, errors: errors.slice(0, 15) }, null, 2));
})();
