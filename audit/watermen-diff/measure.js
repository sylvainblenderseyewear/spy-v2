// Dump geometry + type for matched watermen elements on both the theme and the saved reference.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = 'C:/spy-v2/audit/watermen-diff';
const WIDTH = parseInt(process.argv[2] || '1440', 10);
const TAG = process.argv[3] || 'd';

const PROBE = `(sel, root) => {
  const el = (root||document).querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    w: +r.width.toFixed(1), h: +r.height.toFixed(1),
    x: +r.left.toFixed(1), y: +(r.top + (document.querySelector('.page-wrapper')?.scrollTop || window.scrollY)).toFixed(1),
    pad: cs.padding, mar: cs.margin, disp: cs.display, pos: cs.position,
    fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing,
    tt: cs.textTransform, ta: cs.textAlign, color: cs.color, bg: cs.backgroundColor,
    maxw: cs.maxWidth, gap: cs.gap, ff: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
    txt: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 70)
  };
}`;

async function run(page, sels) {
  const out = {};
  for (const [k, sel] of Object.entries(sels)) {
    out[k] = await page.evaluate(([s, fn]) => eval('(' + fn + ')')(s), [sel, PROBE]);
  }
  return out;
}

const CUR = {
  intro_section: '[id$="__intro"]',
  intro_h2: '[id$="__intro"] h1,[id$="__intro"] h2',
  intro_p1: '[id$="__intro"] .spy-body-text p',
  frames_section: '[id$="__frames"]',
  frames_list: '[id$="__frames"] .resource-list',
  frames_card1: '[id$="__frames"] .product-card',
  cta_section: '[id$="__frames_cta"]',
  cta_btn: '[id$="__frames_cta"] a',
  tech_section: '[id$="__our_tech"]',
  tech_h2: '[id$="__our_tech"] h2',
  tech_sub: '[id$="__our_tech"] .spy-body-text p',
  tech_row1: '[id$="__our_tech"] .section-content-wrapper > .group-block:nth-child(2)',
  tech_tile1: '[id$="__our_tech"] .section-content-wrapper > .group-block:nth-child(2) > * > .group-block:nth-child(1)',
  lensov_section: '[id$="__lens_overview"]',
  lensov_h2: '[id$="__lens_overview"] h2',
  lensopt_section: '[id$="__lens_options"]',
  lensopt_h2: '[id$="__lens_options"] h2',
  iceblue_section: '[id$="__ice_blue"]',
  iceblue_h2: '[id$="__ice_blue"] h2',
  iceblue_card: '[id$="__ice_blue"] .product-card',
  benefits_section: '[id$="__lens_benefits_header"]',
  benefits_h2: '[id$="__lens_benefits_header"] h2',
  benefits_carousel: '[id$="__lens_benefits"]',
  footer_banner: '[id$="__footer_banner"]',
};

const REF = {
  intro_section: '.experience-main > .experience-component:nth-child(1)',
  intro_h2: '.experience-main > .experience-component:nth-child(1) h2',
  intro_p1: '.experience-main > .experience-component:nth-child(1) p',
  frames_section: '.experience-main > .experience-component:nth-child(2)',
  frames_list: '.experience-main > .experience-component:nth-child(2) .slick-list',
  frames_card1: '.experience-main > .experience-component:nth-child(2) .slick-slide:not(.slick-cloned) .product-tile',
  cta_section: '.experience-main > .experience-component:nth-child(3)',
  cta_btn: '.experience-main > .experience-component:nth-child(3) a',
  tech_section: '.experience-main > .experience-component:nth-child(4)',
  tech_h2: '.experience-main > .experience-component:nth-child(4) h2',
  tech_sub: '.experience-main > .experience-component:nth-child(4) p',
  tech_tiles: '.sfcc-full-width-wrapper',
  tech_container: '.sfcc-full-width-wrapper .container',
  lensov_h2: '.vlt-comparison-container',
  lensopt_section: '.fishing-selector-wrapper',
  hbc: '.hbc-carousel-container',
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const p1 = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  await p1.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'load', timeout: 60000 });
  await p1.waitForTimeout(3000);
  const cur = await run(p1, CUR);

  const p2 = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  await p2.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p2.waitForTimeout(3000);
  const ref = await run(p2, REF);

  fs.writeFileSync(`${OUT}/measure-${TAG}.json`, JSON.stringify({ cur, ref }, null, 2));
  console.log(JSON.stringify({ cur, ref }, null, 2));
  await browser.close();
})();
