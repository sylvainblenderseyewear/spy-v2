// Second reference pass: tech tiles, HBC carousel, footer banner, lens options.
const { chromium } = require('playwright-core');
const fs = require('fs');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const WIDTH = parseInt(process.argv[2] || '1440', 10);

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  await page.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const out = await page.evaluate(() => {
    const g = (el, name) => {
      if (!el) return { name, missing: true };
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return { name, w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1),
        pad: cs.padding, mar: cs.margin, disp: cs.display, pos: cs.position, maxw: cs.maxWidth, gap: cs.gap,
        fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, ta: cs.textAlign,
        color: cs.color, bg: cs.backgroundColor, bd: cs.border, br: cs.borderRadius,
        txt: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 45) };
    };
    const res = {};
    const wrap = document.querySelector('.sfcc-full-width-wrapper');
    res.tech = [
      g(wrap, 'wrapper'), g(wrap.querySelector('.container'), 'container'),
      g(wrap.querySelector('.row'), 'row'),
      g(wrap.querySelector('.row > *'), 'col1'),
      g(wrap.querySelector('.sfcc-image-card'), 'card1'),
      g(wrap.querySelector('.sfcc-image-wrapper'), 'imgwrap1'),
      g(wrap.querySelector('.sfcc-image-wrapper img'), 'img1'),
      g(wrap.querySelector('.sfcc-icon-badge'), 'iconBadge'),
      g(wrap.querySelector('.sfcc-card-content'), 'cardContent'),
      g(wrap.querySelector('.sfcc-card-title'), 'cardTitle'),
      g(wrap.querySelector('.sfcc-bullet-list'), 'bullets'),
      g(wrap.querySelector('.sfcc-bullet-list li'), 'bullet1'),
      g(wrap.querySelectorAll('.row')[1], 'row2'),
      g(wrap.querySelectorAll('.sfcc-image-card')[2], 'card3'),
    ];
    res.techRows = wrap.querySelectorAll('.row').length;
    res.techHTML = wrap.querySelector('.row').outerHTML.replace(/\s+/g, ' ').slice(0, 1200);

    const hbc = document.querySelector('.hbc-carousel-container');
    res.hbc = [
      g(hbc, 'container'), g(hbc.querySelector('.hbc-carousel-wrapper'), 'wrapper'),
      g(hbc.querySelector('.hbc-slide'), 'slide'),
      g(hbc.querySelector('.hbc-image-section'), 'imgSection'),
      g(hbc.querySelector('.hbc-image-section img'), 'img'),
      g(hbc.querySelector('.hbc-text-section'), 'textSection'),
      g(hbc.querySelector('.hbc-title'), 'title'),
      g(hbc.querySelector('.hbc-subtitle'), 'subtitle'),
      g(hbc.querySelector('.hbc-description'), 'desc'),
      g(hbc.querySelector('.hbc-prev'), 'prev'), g(hbc.querySelector('.hbc-next'), 'next'),
      g(hbc.querySelector('.hbc-dots-container'), 'dots'), g(hbc.querySelector('.hbc-dot'), 'dot'),
    ];

    const fb = [...document.querySelectorAll('.experience-layouts-1_column')].pop();
    const walk = [];
    (function rec(el, d) {
      [...el.children].forEach(c => {
        const r = c.getBoundingClientRect();
        if (r.height < 6) return;
        walk.push({ d, tag: c.tagName, cls: (c.className || '').toString().slice(0, 60), ...g(c, '') });
        if (d < 5) rec(c, d + 1);
      });
    })(fb, 0);
    res.footerBanner = walk;

    const fsw = document.querySelector('.fishing-selector-wrapper');
    res.lensOptions = [
      g(fsw, 'wrapper'), g(fsw.querySelector('.fishing-selector-container'), 'container'),
      g(fsw.querySelector('.fishing-selector-title'), 'title'),
      g(fsw.querySelector('.fishing-selector-intro'), 'intro'),
      g(fsw.querySelector('.fishing-selector-colors'), 'colors'),
      g(fsw.querySelector('.fishing-selector-color-circle'), 'circle'),
      g(fsw.querySelector('.fishing-selector-lens-name'), 'lensName'),
      g(fsw.querySelector('.fishing-selector-content'), 'content'),
      g(fsw.querySelector('.fishing-selector-comparison'), 'comparison'),
      g(fsw.querySelector('.fishing-selector-info'), 'info'),
      g(fsw.querySelector('.fishing-selector-vlt-badge'), 'vltBadge'),
      g(fsw.querySelector('.fishing-selector-subtitle'), 'subtitle'),
      g(fsw.querySelector('.fishing-selector-description'), 'desc'),
      g(fsw.querySelector('.fishing-selector-comparison-labels'), 'labels'),
    ];

    const vlt = document.querySelector('.vlt-comparison-container');
    res.vlt = [
      g(vlt, 'container'), g(vlt.querySelector('.lens-grid'), 'grid'),
      g(vlt.querySelector('.lens-circle'), 'circle'),
      g(vlt.querySelector('.condition-scale'), 'scale'),
      g(vlt.querySelector('.scale-line'), 'line'),
      g(vlt.querySelector('.sun-icon'), 'sun'),
      g(vlt.querySelector('.condition-text'), 'condText'),
      g(vlt.querySelector('.vlt-percentage'), 'pct'),
      g(vlt.querySelector('.condition-title'), 'condTitle'),
      g(vlt.querySelector('.condition-description'), 'condDesc'),
    ];
    return res;
  });
  fs.writeFileSync('C:/spy-v2/audit/watermen-diff/refspec2.json', JSON.stringify(out, null, 2));
  const fmt = a => a.map(v => v.missing ? `${v.name || v.cls}: MISSING`
    : `${(v.name || (('  '.repeat(v.d || 0)) + v.tag + '.' + v.cls)).padEnd(26)} w${v.w} h${v.h} x${v.x} y${v.y} pad[${v.pad}] mar[${v.mar}] ${v.fs}/${v.fw}/${v.lh} ls${v.ls} ${v.tt} ${v.ta} c${v.color} bg${v.bg} maxw${v.maxw} gap${v.gap} :: ${v.txt}`).join('\n');
  console.log('### TECH rows=' + out.techRows + '\n' + fmt(out.tech));
  console.log('\n### HBC\n' + fmt(out.hbc));
  console.log('\n### FOOTER BANNER\n' + fmt(out.footerBanner));
  console.log('\n### LENS OPTIONS\n' + fmt(out.lensOptions));
  console.log('\n### VLT\n' + fmt(out.vlt));
  await browser.close();
})();
