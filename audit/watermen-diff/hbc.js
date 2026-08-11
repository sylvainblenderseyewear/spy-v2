const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 768, height: 6000 } });
  await p.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(6000);
  const out = await p.evaluate(() => {
    const s = document.querySelector('[id$="__lens_benefits"]');
    const card = s.querySelector('.card');
    const walk = (el, d, max, acc) => { if (d > max) return acc;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      acc.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}.${(el.className||'').toString().split(' ').filter(Boolean).slice(0,3).join('.')} [${r.width.toFixed(0)}x${r.height.toFixed(0)}] ${cs.display}/${cs.flexDirection} ar:${cs.aspectRatio} of:${cs.objectFit}`);
      [...el.children].forEach(c => walk(c, d+1, max, acc)); return acc; };
    return walk(card, 0, 5, []).join('\n');
  });
  console.log(out);
  await b.close();
})();
