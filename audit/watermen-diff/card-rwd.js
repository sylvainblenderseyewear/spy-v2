const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 1440, height: 4000 } });
  await p.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(6000);
  const q = await b.newPage({ viewport: { width: 1440, height: 4000 } });
  await q.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await q.waitForTimeout(4000);
  const F = `(sel, parts) => { const t = document.querySelector(sel); if(!t) return {err:'no '+sel};
    const g = (q) => { const e = t.querySelector(q); if(!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return +r.width.toFixed(1)+'x'+r.height.toFixed(1)+' pad:'+cs.padding+' '+cs.fontSize+'/'+cs.fontWeight+' "'+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,26)+'"'; };
    const r = t.getBoundingClientRect(); const o = { CARD: +r.width.toFixed(1)+'x'+r.height.toFixed(1) };
    for (const [k,q] of Object.entries(parts)) o[k] = g(q); return o; }`;
  const CP = { gallery:'.card-gallery', qv:'.spy-quick-view-btn', labels:'.spy-color-swatches', colour:'.spy-color-count,.spy-variant-name', body:'.spy-tile-body', title:'.text-block p', price:'.spy-card-price' };
  const RP = { gallery:'.image-wrapper', qv:'.quickview', labels:'.color-swatches', colour:'.swatches-label', body:'.tile-body', title:'.pdp-link', price:'.price' };
  for (const W of [1440, 768, 390]) {
    await p.setViewportSize({width:W,height:4000}); await q.setViewportSize({width:W,height:4000});
    await p.waitForTimeout(1200); await q.waitForTimeout(1200);
    const c = await p.evaluate(([f,s,x]) => eval('('+f+')')(s,x), [F, '[id$="__ice_blue"] .product-card', CP]);
    const r = await q.evaluate(([f,s,x]) => eval('('+f+')')(s,x), [F, '.slick-slide:not(.slick-cloned) .product-tile', RP]);
    const nCur = await p.evaluate(() => { const s = document.querySelector('[id$="__ice_blue"]');
      const cards=[...s.querySelectorAll('.product-card')]; const vis=cards.filter(c=>{const r=c.getBoundingClientRect(); return r.left>-5 && r.right<=s.getBoundingClientRect().width+5;}); return vis.length+'/'+cards.length; });
    const nRef = await q.evaluate(() => { const sl=[...document.querySelectorAll('.slick-slide:not(.slick-cloned)')];
      const vis=sl.filter(c=>{const r=c.getBoundingClientRect(); return r.left>-5 && r.right<=window.innerWidth+5;}); return vis.length+'/'+sl.length; });
    console.log(`\n== ${W}px   visible-up cur ${nCur}   ref ${nRef}`);
    for (const k of Object.keys(c)) console.log(`   ${k.padEnd(8)} cur ${String(c[k]).padEnd(52)} ref ${r[k]}`);
  }
  await b.close();
})();
