// ANSI page: footer banner + section headers vs its capture. The capture has two
// .hero-banner elements — the hero video and the footer banner — so pick by art.
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const settle = async (p, W) => {
  await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
  const h = await p.evaluate(() => { const w = document.querySelector('.page-wrapper');
    return Math.max(document.body.scrollHeight, w ? w.scrollHeight : 0); });
  await p.setViewportSize({ width: W, height: Math.min(h + 60, 30000) });
  await p.waitForTimeout(3200);
};
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of [1440, 1200, 992, 991, 768, 390]) {
    const row = {};
    for (const tag of ['cur', 'ref']) {
      const url = tag === 'cur' ? 'http://127.0.0.1:9292/pages/ansi-photochromic'
        : 'http://127.0.0.1:8899/ANSI_Photochromic/ANSI%20Photochromic%20Sunglasses.html';
      const p = await b.newPage({ viewport: { width: W, height: 1100 } });
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await p.waitForTimeout(4500);
      await settle(p, W);
      row[tag] = await p.evaluate((t) => {
        let band = null, hd = null;
        if (t === 'cur') {
          band = document.querySelector('.spy-feature-link-banner');
          hd = band && band.querySelector('h2');
        } else {
          // the footer banner is the .hero-banner whose art is the FooterBanner file
          band = [...document.querySelectorAll('.hero-banner')].find(e =>
            [...e.querySelectorAll('img,source')].some(i =>
              /Footer/i.test(i.getAttribute('srcset') || i.getAttribute('src') || '')));
          hd = band && band.querySelector('.banner-heading');
        }
        const hdrs = [...document.querySelectorAll('h2')]
          .filter(h => /PHOTOCHROMIC COLLECTION|HAPPY PHOTOCHROMIC|Z87-2\+ CERT/i.test(h.textContent))
          .map(h => getComputedStyle(h).fontSize);
        const c = hd && getComputedStyle(hd);
        return { band: band ? +band.getBoundingClientRect().height.toFixed(0) : null,
          fs: c ? c.fontSize : null, fw: c ? c.fontWeight : null, ta: c ? c.textAlign : null,
          headers: hdrs };
      }, tag);
      await p.close();
    }
    const c = row.cur, r = row.ref;
    const bandOk = c.band != null && r.band != null && Math.abs(c.band - r.band) <= 2;
    const typeOk = c.fs === r.fs && c.ta === r.ta;
    const hdrOk = JSON.stringify(c.headers) === JSON.stringify(r.headers);
    console.log(`${String(W).padStart(5)} band ${bandOk ? 'OK ' : 'DIFF'} ${String(c.band).padStart(4)}/${String(r.band).padEnd(4)}  ` +
      `bannerType ${typeOk ? 'OK ' : 'DIFF'} ${c.fs}/${c.ta} vs ${r.fs}/${r.ta}  ` +
      `headers ${hdrOk ? 'OK ' : 'DIFF'} ${JSON.stringify(c.headers)} vs ${JSON.stringify(r.headers)}`);
  }
  await b.close();
})();
