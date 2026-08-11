// Side-by-side full-page captures + console log, current vs reference.
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'C:/spy-v2/audit/watermen-diff/';
const WIDTHS = (process.argv[2] ? [parseInt(process.argv[2],10)] : [1440, 768, 390]);

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of WIDTHS) {
    for (const [tag, url] of [['cur', 'http://127.0.0.1:9292/pages/watermen'],
                              ['ref', 'http://127.0.0.1:8899/waterman/Watermen%20Collection.html']]) {
      const p = await b.newPage({ viewport: { width: W, height: 1000 } });
      const errs = [];
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
      p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 160)));
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await p.waitForTimeout(6000);
      const h = await p.evaluate(() => {
        const w = document.querySelector('.page-wrapper');
        return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, w ? w.scrollHeight : 0);
      });
      await p.setViewportSize({ width: W, height: Math.min(h + 40, 30000) });
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `${OUT}cmp-${tag}-${W}.png`, timeout: 180000, animations: 'disabled' });
      const overflow = await p.evaluate(() => {
        const w = document.querySelector('.page-wrapper') || document.documentElement;
        return { scrollW: w.scrollWidth, clientW: w.clientWidth };
      });
      console.log(`${tag} @${W}: height=${h} scrollW=${overflow.scrollW}/${overflow.clientW}${overflow.scrollW > overflow.clientW + 1 ? '  <-- H-OVERFLOW' : ''}`);
      if (tag === 'cur' && errs.length) console.log('   console errors:\n     ' + [...new Set(errs)].join('\n     '));
      await p.close();
    }
  }
  await b.close();
})();
