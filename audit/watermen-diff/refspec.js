// Dump a full geometry/type spec of the saved Watermen reference page.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const WIDTH = parseInt(process.argv[2] || '1440', 10);
const TAG = process.argv[3] || 'd';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  await page.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const spec = await page.evaluate(() => {
    const g = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1),
        pad: cs.padding, mar: cs.margin, disp: cs.display, pos: cs.position, maxw: cs.maxWidth, gap: cs.gap,
        fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, ta: cs.textAlign,
        color: cs.color, bg: cs.backgroundColor, bd: cs.border, br: cs.borderRadius, of: cs.objectFit,
        txt: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60)
      };
    };
    const q = (s, root) => g((root || document).querySelector(s));
    const out = {};

    // ---- header bands (3-column layouts) ----
    out.headers = [...document.querySelectorAll('.experience-layouts-3_column')].map((el, i) => ({
      i, box: g(el), row: g(el.querySelector('.layout-row')),
      col: g(el.querySelector('.layout-row > *')),
      h2: g(el.querySelector('h2')), p: g(el.querySelector('p'))
    }));

    // ---- product section headers ----
    out.secHeaders = [...document.querySelectorAll('.experience-assets-sectionHeader')].map((el, i) => ({
      i, box: g(el), inner: g(el.querySelector('.section-header')), h2: g(el.querySelector('h2'))
    }));

    // ---- carousels ----
    out.carousels = [...document.querySelectorAll('.experience-carousel-productCarousel')].map((el, i) => ({
      i, box: g(el), container: g(el.querySelector('.container')), row: g(el.querySelector('.row')),
      list: g(el.querySelector('.slick-list')), track: g(el.querySelector('.slick-track')),
      slide: g(el.querySelector('.slick-slide:not(.slick-cloned)')),
      slideInner: g(el.querySelector('.slick-slide:not(.slick-cloned) > div')),
      prev: g(el.querySelector('.slick-prev')), next: g(el.querySelector('.slick-next'))
    }));

    // ---- one product tile in detail ----
    const tile = document.querySelector('.slick-slide:not(.slick-cloned) .product-tile');
    out.tile = tile ? {
      root: g(tile),
      imageContainer: q('.image-container', tile),
      imageWrapper: q('.image-wrapper', tile),
      tileImage: q('.tile-image', tile),
      stickers: q('.stickers', tile),
      sticker: q('.stickers .sticker:not(.d-none)', tile),
      stickerImg: q('.stickers .sticker:not(.d-none) .sticker-image', tile),
      quickview: q('.quickview', tile),
      colorSwatches: q('.color-swatches', tile),
      tileLabelsContainer: q('.tile-labels-container', tile),
      labelContainer: q('.product-tile-label-container', tile),
      label: q('.product-tile-label', tile),
      swatchesLabel: q('.swatches-label', tile),
      swatches: q('.swatches', tile),
      swatchBtn: q('.swatches .btn-swatch', tile),
      swatchImg: q('.swatches .swatch', tile),
      tileBody: q('.tile-body', tile),
      pdpLink: q('.pdp-link', tile),
      pdpLinkA: q('.pdp-link .link', tile),
      price: q('.price', tile),
      sales: q('.price .sales', tile),
      strike: q('.price .strike-through', tile)
    } : null;

    // sale tile (has strike-through) for the sale card spec
    const saleTile = [...document.querySelectorAll('.slick-slide:not(.slick-cloned) .product-tile')]
      .find(t => t.querySelector('.strike-through, .price del, .price .list'));
    out.saleTile = saleTile ? {
      price: q('.price', saleTile), html: saleTile.querySelector('.price').innerHTML.replace(/\s+/g, ' ').slice(0, 600),
      label: q('.product-tile-label', saleTile), labelText: saleTile.querySelector('.product-tile-label')?.innerText.trim()
    } : null;

    // ---- lens overview / VLT ----
    const vlt = document.querySelector('.vlt-comparison-container');
    out.vlt = vlt ? {
      box: g(vlt),
      grid: g(vlt.querySelector(':scope > div')),
      item: g(vlt.querySelectorAll('[class*=vlt-item], [class*=lens-circle], :scope > div > div')[0]),
      circle: g(vlt.querySelector('[class*=circle]')),
      html: vlt.outerHTML.replace(/\s+/g, ' ').slice(0, 2500)
    } : null;

    // ---- lens options ----
    const fs2 = document.querySelector('.fishing-selector-wrapper');
    out.lensOptions = fs2 ? {
      box: g(fs2), inner: g(fs2.querySelector(':scope > div')),
      h2: g(fs2.querySelector('h2')), p: g(fs2.querySelector('p')),
      swatchRow: g(fs2.querySelector('[class*=swatch]')),
      name: g(fs2.querySelector('[class*=lens-name],[class*=name]')),
      html: fs2.outerHTML.replace(/\s+/g, ' ').slice(0, 3000)
    } : null;

    // ---- happy boost comparison carousel ----
    const hbc = document.querySelector('.hbc-carousel-container');
    out.hbc = hbc ? {
      box: g(hbc),
      slide: g(hbc.querySelector('[class*=slide]')),
      imgHalf: g(hbc.querySelector('[class*=image],[class*=compare]')),
      html: hbc.outerHTML.replace(/\s+/g, ' ').slice(0, 3000)
    } : null;

    // ---- footer banner ----
    const fb = [...document.querySelectorAll('.experience-layouts-1_column')].pop();
    out.footerBanner = fb ? {
      box: g(fb), row: g(fb.querySelector('.layout-row')),
      html: fb.outerHTML.replace(/\s+/g, ' ').slice(0, 3000)
    } : null;

    // ---- global body ----
    out.body = g(document.body);
    return out;
  });
  fs.writeFileSync(`C:/spy-v2/audit/watermen-diff/refspec-${TAG}.json`, JSON.stringify(spec, null, 2));
  console.log('written');
  await browser.close();
})();
