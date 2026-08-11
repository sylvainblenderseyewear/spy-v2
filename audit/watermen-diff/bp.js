// Does our page switch to the source's mobile layout at exactly 768?
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const M = (sel) => sel;
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await p.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(6000);
  const q = await b.newPage({ viewport: { width: 900, height: 1200 } });
  await q.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await q.waitForTimeout(4000);

  const probeCur = `() => {
    const g = (s) => { const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e); return { w:+r.width.toFixed(0), h:+r.height.toFixed(0), fd: cs.flexDirection, disp: cs.display }; };
    return {
      lens_options: g('[id$="__lens_options"]'),
      lo_row: g('[id$="__lens_options"] [data-lens-stage]'),
      lens_benefits: g('[id$="__lens_benefits"]'),
      lb_slide: g('[id$="__lens_benefits"] .slideshow-slide, [id$="__lens_benefits"] slideshow-slide'),
      lb_img: g('[id$="__lens_benefits"] .image-block'),
      overview: g('[id$="__lens_overview"]'),
      ov_scale: g('[id$="__lens_overview"] [class*="scale"]'),
      tech_tile: g('[id$="__our_tech"] .image-block'),
    };
  }`;
  const probeRef = `() => {
    const g = (s) => { const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e); return { w:+r.width.toFixed(0), h:+r.height.toFixed(0), fd: cs.flexDirection, disp: cs.display }; };
    return {
      lens_options: g('.fishing-lens-selector, .fishing-selector-container'),
      lo_row: g('.fishing-selector-content'),
      lens_benefits: g('.hbc-carousel-container, .hbc-container'),
      lb_slide: g('.hbc-slide'),
      lb_img: g('.hbc-image, .hbc-image-container'),
      overview: g('.lens-overview-container, .vlt-scale-container'),
      ov_scale: g('.vlt-scale, .lens-scale'),
      tech_tile: g('.sfcc-image-wrapper'),
    };
  }`;

  for (const W of [1440, 769, 768, 767, 750, 749, 390]) {
    await p.setViewportSize({ width: W, height: 1200 }); await q.setViewportSize({ width: W, height: 1200 });
    await p.waitForTimeout(700); await q.waitForTimeout(700);
    const c = await p.evaluate(f => eval('(' + f + ')')(), probeCur);
    const r = await q.evaluate(f => eval('(' + f + ')')(), probeRef);
    console.log(`\n-- ${W}px`);
    for (const k of Object.keys(c)) {
      const cs = c[k] ? `${c[k].w}x${c[k].h} ${c[k].disp}/${c[k].fd}` : 'null';
      const rs = r[k] ? `${r[k].w}x${r[k].h} ${r[k].disp}/${r[k].fd}` : 'null';
      console.log(`   ${k.padEnd(14)} cur ${cs.padEnd(28)} ref ${rs}`);
    }
  }
  await b.close();
})();
