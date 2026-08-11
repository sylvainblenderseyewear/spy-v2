// Full re-audit: watermen bands + rail h2 box, and the ANSI banner I changed.
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

const settle = async (p, W) => {
  await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
  const h = await p.evaluate(() => { const w = document.querySelector('.page-wrapper');
    return Math.max(document.body.scrollHeight, w ? w.scrollHeight : 0); });
  await p.setViewportSize({ width: W, height: Math.min(h + 60, 30000) });
  await p.waitForTimeout(3000);
};

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  console.log('===== WATERMEN rail h2 box + overflow + console =====');
  for (const W of [1440, 768, 390]) {
    const p = await b.newPage({ viewport: { width: W, height: 1100 } });
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 90)); });
    p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 90)));
    await p.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(5000);
    await settle(p, W);
    const out = await p.evaluate(() => {
      const h = document.querySelector('[id$="__ice_blue"] .section-resource-list__header h2');
      const cs = h && getComputedStyle(h);
      const r = h && h.getBoundingClientRect();
      const sc = document.querySelector('.page-wrapper') || document.documentElement;
      return { h2: h ? { fs: cs.fontSize, fw: cs.fontWeight, ta: cs.textAlign, tt: cs.textTransform,
          mt: cs.marginTop, mb: cs.marginBottom, lh: cs.lineHeight, ls: cs.letterSpacing,
          w: +r.width.toFixed(0), x: +r.left.toFixed(0) } : 'MISSING',
        overflow: sc.scrollWidth + '/' + sc.clientWidth };
    });
    const themeErrs = [...new Set(errs)].filter(e => !/shop\.app|origin_trials|customer-account-main-menu|net::ERR_FAILED|status of 40[03]/.test(e));
    console.log(`  ${W}px  ${JSON.stringify(out.h2)}`);
    console.log(`         overflow ${out.overflow}${out.overflow.split('/')[0] > +out.overflow.split('/')[1] + 1 ? '  <-- OVERFLOW' : ''}  themeErrors ${themeErrs.length ? themeErrs.join(' | ') : 'none'}`);
    await p.close();
  }

  console.log('\n===== ANSI banner: ours vs its capture =====');
  for (const W of [1440, 1200, 992, 991, 768, 390]) {
    const row = {};
    for (const [tag, url, sel] of [
      ['cur', 'http://127.0.0.1:9292/pages/ansi-photochromic', '.spy-feature-link-banner'],
      ['ref', 'http://127.0.0.1:8899/ANSI_Photochromic/ANSI%20Photochromic%20Sunglasses.html', '.hero-banner']]) {
      const p = await b.newPage({ viewport: { width: W, height: 1100 } });
      try {
        await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await p.waitForTimeout(4500);
        await settle(p, W);
        row[tag] = await p.evaluate((s) => {
          const els = [...document.querySelectorAll(s)];
          const e = els.find(x => x.getBoundingClientRect().height > 50) || els[0];
          if (!e) return 'none';
          const hd = e.querySelector('h2, .banner-heading');
          const c = hd && getComputedStyle(hd);
          return { band: +e.getBoundingClientRect().height.toFixed(0),
            fs: c ? c.fontSize : null, fw: c ? c.fontWeight : null, ta: c ? c.textAlign : null };
        }, sel);
      } catch (e) { row[tag] = 'ERR ' + String(e).slice(0, 50); }
      await p.close();
    }
    const c = row.cur, r = row.ref;
    const ok = c && r && c.band !== undefined && r.band !== undefined
      && Math.abs(c.band - r.band) <= 2 && c.fs === r.fs && c.ta === r.ta;
    console.log(`  ${String(W).padStart(5)} ${ok ? 'OK  ' : 'DIFF'} cur ${JSON.stringify(c)}  ref ${JSON.stringify(r)}`);
  }
  await b.close();
})();
