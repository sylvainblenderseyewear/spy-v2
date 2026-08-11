// Same landmark diff, but every lazy image is forced to load first.
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const KEYS = ["WATERMEN", 'OUR TECH', 'LENS OVERVIEW', 'LENS OPTIONS',
  'ICE BLUE MIRROR', 'BLACK MIRROR', 'HAPPY BOOST BRONZE', 'LENS BENEFITS', 'SHOP ALL'];

const PROBE = `(keys) => {
  const sc = document.querySelector('.page-wrapper');
  const off = (sc && sc.scrollTop) || window.scrollY || 0;
  const all = [...document.querySelectorAll('h1,h2,h3')];
  return keys.map(k => {
    const el = all.find(e => (e.textContent||'').trim().toUpperCase().replace(/\s+/g,' ').includes(k));
    if (!el) return { k, y: null };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { k, y: +(r.top + off).toFixed(0), fs: cs.fontSize, fw: cs.fontWeight };
  });
}`;

const settle = async (p) => {
  await p.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'); });
  const h = await p.evaluate(() => { const w = document.querySelector('.page-wrapper');
    return Math.max(document.body.scrollHeight, w ? w.scrollHeight : 0); });
  await p.setViewportSize({ width: p.viewportSize().width, height: Math.min(h + 60, 30000) });
  await p.waitForTimeout(2500);
  await p.evaluate(async () => { await Promise.all([...document.images].filter(i => !i.complete)
    .map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))); });
  await p.waitForTimeout(1500);
  const h2 = await p.evaluate(() => { const w = document.querySelector('.page-wrapper');
    return Math.max(document.body.scrollHeight, w ? w.scrollHeight : 0); });
  if (Math.abs(h2 - h) > 5) { await p.setViewportSize({ width: p.viewportSize().width, height: Math.min(h2 + 60, 30000) }); await p.waitForTimeout(1500); }
  return h2;
};

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  for (const W of [1440, 768, 390]) {
    const rows = {};
    for (const [tag, url] of [['cur','http://127.0.0.1:9292/pages/watermen'],
                              ['ref','http://127.0.0.1:8899/waterman/Watermen%20Collection.html']]) {
      const p = await b.newPage({ viewport: { width: W, height: 1000 } });
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await p.waitForTimeout(5000);
      rows[tag + 'H'] = await settle(p);
      rows[tag] = await p.evaluate(([k, f]) => eval('(' + f + ')')(k), [KEYS, PROBE]);
      await p.close();
    }
    console.log(`\n===== ${W}px   cur total ${rows.curH} / ref total ${rows.refH}  (Δ ${rows.curH - rows.refH})`);
    console.log('  landmark              cur Y    ref Y     Δy    curBand  refBand   Δband   type');
    for (let i = 0; i < KEYS.length; i++) {
      const c = rows.cur[i], r = rows.ref[i], cN = rows.cur[i+1], rN = rows.ref[i+1];
      const cBand = (cN && c && cN.y != null && c.y != null) ? cN.y - c.y : (c && c.y != null ? rows.curH - c.y : null);
      const rBand = (rN && r && rN.y != null && r.y != null) ? rN.y - r.y : (r && r.y != null ? rows.refH - r.y : null);
      const d = (c && r && c.y != null && r.y != null) ? c.y - r.y : null;
      const db = (cBand != null && rBand != null) ? cBand - rBand : null;
      const ty = (c && r && c.fs) ? `${c.fs}/${c.fw} vs ${r.fs}/${r.fw}${c.fs !== r.fs || c.fw !== r.fw ? '  <-- TYPE' : ''}` : '';
      console.log(`  ${KEYS[i].padEnd(20)} ${String(c && c.y).padStart(6)} ${String(r && r.y).padStart(8)} ${String(d).padStart(7)}  ${String(cBand).padStart(7)} ${String(rBand).padStart(8)} ${String(db).padStart(7)}   ${ty}`);
    }
  }
  await b.close();
})();
