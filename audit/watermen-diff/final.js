// Final numeric diff: matched elements on the theme page vs the saved reference.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const W = parseInt(process.argv[2] || '1440', 10);

const PROBE = `(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const top = r.top + (document.querySelector('.page-wrapper')?.scrollTop || window.scrollY);
  return { w:+r.width.toFixed(1), h:+r.height.toFixed(1), x:+r.left.toFixed(1),
    fs:cs.fontSize, fw:cs.fontWeight, lh:cs.lineHeight, ls:cs.letterSpacing, tt:cs.textTransform,
    ta:cs.textAlign, color:cs.color, bg:cs.backgroundColor, pad:cs.padding, mar:cs.margin };
}`;

const PAIRS = [
  ['intro h2',       '[id$="__intro"] h2',                    '.experience-main > .experience-component:nth-child(1) h2'],
  ['intro p1',       '[id$="__intro"] .spy-body-text p',      '.experience-main > .experience-component:nth-child(1) p'],
  ['cta button',     '[id$="__frames_cta"] a',                '.experience-main > .experience-component:nth-child(3) a'],
  ['tech h2',        '[id$="__our_tech"] h2',                 '.experience-main > .experience-component:nth-child(4) h2'],
  ['tech sub',       '[id$="__our_tech"] .spy-body-text p',   '.experience-main > .experience-component:nth-child(4) p'],
  ['tech img1',      '[id$="__our_tech"] .image-block img',   '.sfcc-image-wrapper img'],
  ['tech title1',    '[id$="__our_tech"] h3',                 '.sfcc-card-title'],
  ['tech bullet1',   '[id$="__our_tech"] .spy-bullet-list li','.sfcc-bullet-list li'],
  ['card',           '[id$="__frames"] .product-card',        '.slick-slide:not(.slick-cloned) .product-tile'],
  ['card gallery',   '[id$="__frames"] .card-gallery',        '.slick-slide:not(.slick-cloned) .image-wrapper'],
  ['card colourway', '[id$="__frames"] .spy-variant-name',    '.slick-slide:not(.slick-cloned) .swatches-label'],
  ['card title',     '[id$="__frames"] .text-block p',        '.slick-slide:not(.slick-cloned) .pdp-link .link'],
  ['card price',     '[id$="__frames"] .price',               '.slick-slide:not(.slick-cloned) .price .sales'],
  ['vlt circle',     '[id$="__lens_overview"] .spy-lens-overview__item > div', '.lens-circle'],
  ['vlt pct',        '[id$="__lens_overview"] .spy-lens-overview__item > div:nth-child(2) > div', '.vlt-percentage'],
  ['lensopt title',  '[id$="__lens_options"] h2',             '.fishing-selector-title'],
  ['lensopt intro',  '[id$="__lens_options"] .spy-body-text p','.fishing-selector-intro'],
  ['lensopt name',   '[id$="__lens_options"] [data-lens-stage] > div > div:first-child', '.fishing-selector-lens-name'],
  ['lensopt badge',  '[id$="__lens_options"] .bg-black',      '.fishing-selector-vlt-badge'],
  ['lensopt sub',    '[id$="__lens_options"] h3',             '.fishing-selector-subtitle'],
  ['hbc title',      '[id$="__lens_benefits"] h2',            '.hbc-title'],
  ['hbc sub',        '[id$="__lens_benefits"] h3',            '.hbc-subtitle'],
  ['hbc desc',       '[id$="__lens_benefits"] .spy-body-text p', '.hbc-description'],
  ['hbc arrow prev', '[id$="__lens_benefits"] .slideshow-control--previous', '.hbc-prev'],
  ['hbc dots',       '[id$="__lens_benefits"] .slideshow-controls__dots', '.hbc-dots-container'],
  ['banner h2',      '[id$="__footer_banner"] h2',            '.banner-heading'],
  ['banner cta',     '[id$="__footer_banner"] span.inline-block', '.hero-banner-overlay-inner .btn'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const cur = await browser.newPage({ viewport: { width: W, height: 1000 } });
  await cur.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'load', timeout: 60000 });
  await cur.waitForTimeout(3500);
  const ref = await browser.newPage({ viewport: { width: W, height: 1000 } });
  await ref.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await ref.waitForTimeout(3500);

  const rows = [];
  for (const [label, cSel, rSel] of PAIRS) {
    const c = await cur.evaluate(([s, f]) => eval('(' + f + ')')(s), [cSel, PROBE]);
    const r = await ref.evaluate(([s, f]) => eval('(' + f + ')')(s), [rSel, PROBE]);
    rows.push({ label, cur: c, ref: r });
  }
  fs.writeFileSync(`C:/spy-v2/audit/watermen-diff/final-${W}.json`, JSON.stringify(rows, null, 2));
  const f = v => v ? `w${v.w} h${v.h} ${v.fs}/${v.fw}/${v.lh} ls${v.ls} ${v.tt} ${v.color}` : 'MISSING';
  for (const row of rows) {
    const same = f(row.cur) === f(row.ref);
    console.log(`${same ? 'OK  ' : 'DIFF'} ${row.label.padEnd(16)} ref: ${f(row.ref)}`);
    if (!same) console.log(`${' '.repeat(21)}cur: ${f(row.cur)}`);
  }
  await browser.close();
})();
