// Capture watermen bands from the live theme and the saved reference, side by side.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

const OUT = 'C:/spy-v2/audit/watermen-diff';
const WIDTH = parseInt(process.argv[2] || '1440', 10);
const TAG = process.argv[3] || 'd';
const ONLY = process.argv[4] || '';

const CUR_IDS = ['intro','frames','frames_cta','our_tech','lens_overview','lens_options',
  'ice_blue','black_mirror','bronze','lens_benefits_header','lens_benefits','footer_banner'];

async function settle(page) {
  await page.evaluate(async () => {
    const w = document.querySelector('.page-wrapper') || document.documentElement;
    for (let y = 0; y < w.scrollHeight; y += 400) { w.scrollTop = y; window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    w.scrollTop = 0; window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
}

async function shotCurrent(browser) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  await page.goto('http://127.0.0.1:9292/pages/watermen', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  await settle(page);
  const h = await page.evaluate(() => (document.querySelector('.page-wrapper') || document.documentElement).scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(h + 200, 12000) });
  // kill sticky positioning so nothing floats over a band
  await page.addStyleTag({ content: '.spy-header-section,.spy-header-section *{position:static !important}' });
  await settle(page);
  const meta = [];
  for (const id of CUR_IDS) {
    if (ONLY && !ONLY.split(',').includes(id)) continue;
    const loc = page.locator(`[id$="__${id}"]`).first();
    const box = await loc.boundingBox();
    meta.push({ id, h: box ? Math.round(box.height) : 0, w: box ? Math.round(box.width) : 0 });
    await loc.screenshot({ path: path.join(OUT, `cur-${TAG}-${id}.png`), scale: 'css' }).catch(e => console.log('cur', id, e.message));
  }
  fs.writeFileSync(path.join(OUT, `cur-${TAG}-meta.json`), JSON.stringify(meta, null, 2));
  await page.close();
  return meta;
}

const REF_BANDS = [
  ['intro',        '.experience-main > .experience-component:nth-child(1)'],
  ['frames',       '.experience-main > .experience-component:nth-child(2)'],
  ['frames_cta',   '.experience-main > .experience-component:nth-child(3)'],
  ['tech_header',  '.experience-main > .experience-component:nth-child(4)'],
  ['tech_tiles',   '.sfcc-full-width-wrapper'],
  ['vlt',          '.vlt-comparison-container'],
  ['lens_options', '.fishing-selector-wrapper'],
  ['hbc',          '.hbc-carousel-container'],
];

async function shotRef(browser) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  await page.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    document.querySelectorAll('img.lazyload[data-src]').forEach(img => {
      const ds = img.getAttribute('data-src');
      const file = decodeURIComponent(ds.split('/').pop().split('?')[0]);
      img.setAttribute('src', './Watermen Collection_files/' + file);
      img.classList.remove('lazyload'); img.classList.add('lazyloaded');
    });
  });
  await settle(page);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(h + 200, 12000) });
  await page.addStyleTag({ content: 'header,.header-nav,.sticky-header{position:static !important}' });
  await settle(page);
  const meta = [];
  for (const [name, sel] of REF_BANDS) {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) { meta.push({ name, missing: true }); continue; }
    const box = await loc.boundingBox();
    meta.push({ name, h: box ? Math.round(box.height) : 0, w: box ? Math.round(box.width) : 0 });
    await loc.screenshot({ path: path.join(OUT, `ref-${TAG}-${name}.png`), scale: 'css' }).catch(e => console.log('ref', name, e.message));
  }
  const cars = page.locator('.experience-carousel-productCarousel');
  for (let i = 0, n = await cars.count(); i < n; i++) {
    await cars.nth(i).screenshot({ path: path.join(OUT, `ref-${TAG}-carousel${i}.png`), scale: 'css' }).catch(() => {});
  }
  const heads = page.locator('.experience-assets-sectionHeader');
  for (let i = 0, n = await heads.count(); i < n; i++) {
    await heads.nth(i).screenshot({ path: path.join(OUT, `ref-${TAG}-secheader${i}.png`), scale: 'css' }).catch(() => {});
  }
  const cols3 = page.locator('.experience-layouts-3_column');
  for (let i = 0, n = await cols3.count(); i < n; i++) {
    await cols3.nth(i).screenshot({ path: path.join(OUT, `ref-${TAG}-col3-${i}.png`), scale: 'css' }).catch(() => {});
  }
  const banner = page.locator('.experience-component.experience-layouts-1_column').last();
  if (await banner.count()) await banner.screenshot({ path: path.join(OUT, `ref-${TAG}-footer_banner.png`), scale: 'css' }).catch(() => {});
  fs.writeFileSync(path.join(OUT, `ref-${TAG}-meta.json`), JSON.stringify(meta, null, 2));
  await page.close();
  return meta;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE });
  const cur = await shotCurrent(browser);
  const ref = process.env.SKIP_REF ? [] : await shotRef(browser);
  await browser.close();
  console.log(JSON.stringify({ cur, ref }, null, 2));
})();
