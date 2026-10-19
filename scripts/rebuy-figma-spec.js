/*
  Figma spec check for the new mini-cart (audit/page-spec-mini-cart-figma.md).
  Every value in the spec against the open cart; positions are relative to the panel.

  It is the EVAL of the preview script, one cart state per run:
      EVAL=scripts/rebuy-figma-spec.js WIDTHS=375,390,768,1440 HEIGHT=1242 \
        HANDLES=spy-cyrus-soft-matte-black-sunglasses,spy-helm-black-soft-matte-sunglasses \
        node scripts/rebuy-figma-preview.mjs
  THEME_ID=live checks the published theme; CART_ID=live the published cart.
  HEIGHT = the Figma frame: 1242 two items · 1137 one item · 1005 goggle · 1203 empty.

  Verdicts: ok · same (looks identical) · flagged (on the 14 Oct deviation list) ·
            note (built so, not drawn in Figma) · DIFF (fix it)
*/
const root = document.querySelector('#rebuy-cart');
const fly = root.querySelector('.rebuy-cart__flyout');
const F = fly.getBoundingClientRect();
const P = Math.round(F.width); // 375 when docked, the screen width on phones
const C = P - 32; // content width
const VW = window.innerWidth;
const VH = window.innerHeight;
const rows = [];
const FLAGGED = {
  orange: 'flagged: palette color3 instead of #ED773B',
  grey: 'flagged: AA grey #767676 instead of #A2A2A2',
  get20: 'flagged: no "GET 20% OFF" (no discount exists)',
  copy: 'flagged: copy typo fixed',
  picker: 'flagged: size/lens picker kept on products with options',
};
const add = (area, what, design, live, ok, note = '') =>
  rows.push({
    area, what, design: String(design), live: String(live), note,
    v: ok ? 'ok' : note.startsWith('flagged') ? 'flagged' : note.startsWith('same') ? 'same' : note ? 'note' : 'DIFF',
  });

// Mouse users see no focus ring; Rebuy focused the close button on open
document.activeElement?.blur?.();
await new Promise((r) => setTimeout(r, 150));

const hex = (c) => {
  const m = c && c.match(/rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)/);
  if (!m) return c;
  const h = '#' + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, '0')).join('');
  return m[4] !== undefined && +m[4] < 1 ? `${h}@${+(+m[4]).toFixed(2)}` : h;
};
const box = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x - F.x, y: r.y - F.y, w: r.width, h: r.height, r: r.right - F.x, b: r.bottom - F.y };
};
const cs = (el) => getComputedStyle(el);
const visible = (el) => el && el.getBoundingClientRect().width > 0 && cs(el).visibility !== 'hidden';
const q = (sel, from = root) => [...from.querySelectorAll(sel)].filter(visible);
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const r1 = (v) => Math.round(v * 10) / 10;
const text = (el) => (el ? el.innerText.replace(/\s+/g, ' ').trim() : '');
const px = (area, what, design, live, tol = 1, note = '') =>
  add(area, what, design, r1(live), near(live, design, tol), near(live, design, tol) ? '' : note);
const eq = (area, what, design, live, note = '') =>
  add(area, what, design, live, String(design) === String(live), String(design) === String(live) ? '' : note);
const font = (area, el, size, lh, weight, color, notes = {}) => {
  if (!el) return add(area, 'element', 'present', 'missing', false);
  const c = cs(el);
  eq(area, 'font-size', size, c.fontSize);
  if (lh) eq(area, 'line-height', lh, c.lineHeight, notes.lh || '');
  eq(area, 'font-weight', weight, c.fontWeight);
  if (color) eq(area, 'colour', color, hex(c.color), notes.color || '');
};
const hasPicker = (el) => q('.rebuy-product-options select, .rebuy-product-options .rebuy-select', el).length > 0;

const items = q('.spy-mc-item');
const isEmpty = items.length === 0;

// ---- panel + the page behind
// A classic (Windows) scrollbar on the page stays to the right of a fixed panel, so dock against what is visible
const SEEN = document.documentElement.clientWidth;
add('panel', 'width', VW <= 480 ? `${SEEN} (full screen)` : '375', P, VW <= 480 ? near(P, SEEN) : near(P, 375), VW <= 480 && near(P, VW) && SEEN < VW ? 'note: 100vw counts the page scrollbar, so the panel is wider than the window' : '');
add('panel', 'docked right, full height', `x ${SEEN - P} · h ${VH}`, `x ${r1(F.x)} · h ${r1(F.height)}`, near(F.x, SEEN - P) && near(F.height, VH) && near(F.y, 0));
const bg = root.querySelector('.rebuy-cart__background');
if (bg) {
  eq('page behind', 'overlay colour', '#000000@0.2', hex(cs(bg).backgroundColor));
  eq('page behind', 'blur (Figma 44 = CSS 22px)', 'blur(22px)', cs(bg).backdropFilter || cs(bg).webkitBackdropFilter);
}
eq('panel', 'background', '#ffffff', hex(cs(fly).backgroundColor));
add('panel', 'font family', 'DIN Next LT Pro', cs(fly).fontFamily.split(',')[0], /DIN/i.test(cs(fly).fontFamily));
// A Windows scrollbar took 15px off every row (run with SCROLLBARS=1 to see one)
const scrollArea = root.querySelector('[data-rebuy-cart-scroll-area]');
if (scrollArea) add('cart body', 'scrollbar takes no room', '0px', `${scrollArea.offsetWidth - scrollArea.clientWidth}px`, scrollArea.offsetWidth === scrollArea.clientWidth);
const oneLine = (row) => new Set(q('.spy-mc-trust__item', row).map((n) => Math.round(box(n).y))).size === 1;

// ---- header
const header = root.querySelector('[data-rebuy-cart-anchor="header"]');
if (header) {
  px('header', 'height', 48, box(header).h);
  eq('header', 'background', '#ffffff', hex(cs(header).backgroundColor));
  eq('header', 'shadow', 'rgba(0, 0, 0, 0.05) 0px 4px 10px 0px', cs(header).boxShadow);
}
const title = root.querySelector('.rebuy-cart__title');
if (title) {
  add('header', 'title copy', isEmpty ? 'Shopping Cart (0)' : 'Shopping Cart (N)', text(title), isEmpty ? text(title) === 'Shopping Cart (0)' : /^Shopping Cart \(\d+\)$/.test(text(title)));
  font('header title', title, '16px', '16px', '700', '#30333d');
  px('header title', 'left', 16, box(title).x);
  px('header title', 'top', 14, box(title).y, 1.5);
}
const close = root.querySelector('.rebuy-cart__flyout-close');
if (close) {
  const b = box(close);
  add('header close', 'hit box', '24x24', `${r1(b.w)}x${r1(b.h)}`, near(b.w, 24) && near(b.h, 24));
  px('header close', 'right gap', 13, P - b.r);
  px('header close', 'top', 12, b.y);
  eq('header close', 'colour', '#000000', hex(cs(close).color));
}

// ---- free-shipping line (text only)
if (!isEmpty) {
  const prompt = q('.rebuy-cart__progress-bar-prompt')[0];
  if (prompt) {
    const reached = /unlocked/i.test(text(prompt));
    if (reached) eq('free shipping', 'copy', 'You unlocked Free Shipping!', text(prompt));
    else add('free shipping', 'copy', "You're $25 away from get Free Shipping!", text(prompt), false, /^You're \$[\d.,]+ away from Free Shipping!$/.test(text(prompt)) ? FLAGGED.copy : '');
    font('free shipping', prompt, '14px', '14px', reached ? '500' : '400', '#000000');
    const bold = prompt.querySelector('b, strong');
    if (!reached) eq('free shipping', '"$X away" weight', '700', bold ? cs(bold).fontWeight : 'no bold part');
    px('free shipping', 'left', 16, box(prompt).x);
    px('free shipping', 'top (header 48 + gap 24)', 72, box(prompt).y, 2);
    const bar = q('.rebuy-cart__progress-bar, .rebuy-cart__progress-step, .rebuy-progress-bar').filter((n) => box(n).h > 2);
    add('free shipping', 'no progress bar', 'none', bar.length ? `${bar.length} bar element(s)` : 'none', !bar.length);
  } else add('free shipping', 'line', 'present', 'missing', false);
}

// ---- line items
items.slice(0, 2).forEach((item, i) => {
  const A = `line item ${i + 1}`;
  const b = box(item);
  const variant = q('.rebuy-cart__flyout-item-variant-title', item)[0];
  add(A, 'box', `x16 · ${C}x97`, `x${r1(b.x)} · ${r1(b.w)}x${r1(b.h)}`, near(b.x, 16) && near(b.w, C) && near(b.h, 97, 1.5), variant ? 'note: taller when the fit/lens line wraps' : '');
  add(A, 'fit/lens line', 'not drawn', variant ? text(variant) : 'none', !variant, variant ? 'note: shown when the product has options, so the shopper sees the lens' : '');
  const priceText = text(item.querySelector('.rebuy-cart__flyout-item-price')).replace(/^Price /, '');
  add(A, 'price format', '$200', priceText, /^\$\d+$/.test(priceText), /\.\d\d$/.test(priceText) ? 'note: the store money format prints cents' : '');
  if (i === 0) px(A, 'top (prompt 72 + 14 + gap 8)', 94, b.y, 2);
  const last = i === items.length - 1;
  const bb = [item.closest('li') || item, item].map((n) => cs(n)).find((c) => parseFloat(c.borderBottomWidth) > 0 && c.borderBottomStyle !== 'none');
  add(A, 'divider under', last ? 'none (last item)' : '1px #dee2e9', bb ? `${bb.borderBottomWidth} ${hex(bb.borderBottomColor)}` : 'none', last ? !bb : Boolean(bb) && bb.borderBottomWidth === '1px' && hex(bb.borderBottomColor) === '#dee2e9');
  const img = item.querySelector('.rebuy-cart__flyout-item-media img');
  if (img) {
    add(A, 'image', '121x97', `${r1(box(img).w)}x${r1(box(img).h)}`, near(box(img).w, 121) && near(box(img).h, 97));
    const media = item.querySelector('.rebuy-cart__flyout-item-media');
    eq(A, 'image radius', '4px', [img, media].map((n) => cs(n).borderTopLeftRadius).find((v) => v !== '0px') || '0px');
    eq(A, 'image fit', 'cover', cs(img).objectFit);
  }
  const info = item.querySelector('.rebuy-cart__flyout-item-info');
  if (info) add(A, 'text column (15 after the image)', `x152 · w${C - 136}`, `x${r1(box(info).x)} · w${r1(box(info).w)}`, near(box(info).x, 152) && near(box(info).w, C - 136, 1.5));
  const model = item.querySelector('.spy-mc-item__model');
  font(`${A} model`, model, '12px', '12px', '500', '#a2a2a2', { color: FLAGGED.grey });
  if (model) eq(`${A} model`, 'case', 'uppercase', cs(model).textTransform);
  const colour = item.querySelector('.rebuy-cart__flyout-item-product-title');
  font(`${A} colour`, colour, '14px', '14px', '500', '#000000');
  if (model && colour) px(`${A} colour`, 'gap under the model', 4, box(colour).y - box(model).b);
  font(`${A} price`, item.querySelector('.rebuy-cart__flyout-item-price'), '14px', '14px', '400', '#30333d');
  const step = item.querySelector('.rebuy-cart__flyout-item-quantity-widget');
  if (step) {
    const sb = box(step);
    add(`${A} stepper`, 'box', '64x30', `${r1(sb.w)}x${r1(sb.h)}`, near(sb.w, 64) && near(sb.h, 30));
    px(`${A} stepper`, 'right edge', 16 + C, sb.r);
    eq(`${A} stepper`, 'radius', '2px', cs(step).borderTopLeftRadius);
    eq(`${A} stepper`, 'border', '1.2px #dee2e9', `${cs(step).borderTopWidth} ${hex(cs(step).borderTopColor)}`, 'same: CSS says 1.2px, Chrome paints borders in whole pixels');
    font(`${A} stepper value`, step.querySelector('.rebuy-cart__flyout-item-quantity-widget-label'), '14px', '12px', '500', '#232b38');
    q('.rebuy-cart__flyout-item-quantity-widget-button', step).forEach((btn, k) => {
      const svg = btn.querySelector('svg');
      add(`${A} stepper`, `${k ? 'plus' : 'minus'} icon box`, '16x16', svg ? `${r1(box(svg).w)}x${r1(box(svg).h)}` : 'no svg', Boolean(svg) && near(box(svg).w, 16) && near(box(svg).h, 16));
      eq(`${A} stepper`, `${k ? 'plus' : 'minus'} colour`, '#000000', hex(cs(btn).color));
    });
  }
  const remove = q('.rebuy-cart__flyout-item-remove', item);
  add(A, 'no remove (x) button', 'none', remove.length ? `${remove.length} visible` : 'none', !remove.length);
});
if (items[1]) px('line item 2', 'top', 199, box(items[1]).y, 2, q('.rebuy-cart__flyout-item-variant-title', items[0]).length ? 'note: pushed down by the fit/lens line above' : '');

// ---- bundle box
const widgets = q("[data-rebuy-component='cross-sell-widget']");
const bundle = widgets.find((n) => n.querySelector('.large-style-line'));
if (!isEmpty) {
  if (bundle) {
    const b = box(bundle);
    add('bundle box', 'box', `x16 · w${C}`, `x${r1(b.x)} · w${r1(b.w)}`, near(b.x, 16) && near(b.w, C));
    eq('bundle box', 'border', '1px #dee2e9', `${cs(bundle).borderTopWidth} ${hex(cs(bundle).borderTopColor)}`);
    eq('bundle box', 'radius', '4px', cs(bundle).borderTopLeftRadius);
    eq('bundle box', 'background', '#ffffff', hex(cs(bundle).backgroundColor));
    const t = bundle.querySelector('.primary-title');
    if (t) {
      add('bundle title', 'copy', 'Bundle with Accessories. GET 20% OFF', text(t), false, text(t) === 'Bundle with Accessories' ? FLAGGED.get20 : '');
      font('bundle title', t, '14px', '14px', '400', '#000000');
      px('bundle title', 'inset from the outer edge', 16, box(t).x - b.x);
      px('bundle title', 'top inset', 16, box(t).y - b.y);
    }
    const brows = q('.large-style-line .rebuy-product-block', bundle);
    brows.slice(0, 1).forEach((row) => {
      add('bundle row', 'box', `${C - 32}x56`, `${r1(box(row).w)}x${r1(box(row).h)}`, near(box(row).w, C - 32) && near(box(row).h, 56, 1.5));
      const img = row.querySelector('.rebuy-product-media img');
      if (img) add('bundle row', 'thumbnail', '56x56', `${r1(box(img).w)}x${r1(box(img).h)}`, near(box(img).w, 56) && near(box(img).h, 56));
      const name = row.querySelector('.rebuy-product-title');
      font('bundle row name', name, '14px', null, '700', '#000000');
      if (name) add('bundle row name', 'line-height', '14px (16px when it wraps)', cs(name).lineHeight, cs(name).lineHeight === '14px', cs(name).lineHeight === '16px' ? 'note: always 16px; Figma uses 16 only on wrapped names' : '');
      font('bundle row price', row.querySelector('.rebuy-product-price .rebuy-money'), '14px', '14px', '400', '#000000');
      const pr = text(row.querySelector('.rebuy-product-price')).replace(/^Price /, '');
      add('bundle row price', 'format', '$8 $12 (struck)', pr, /^\$\d+( \$\d+)?$/.test(pr), /\.\d\d/.test(pr) ? 'note: cents, and no struck price without a discount' : '');
      const btn = row.querySelector('.rebuy-button');
      if (btn) {
        add('bundle row button', 'box', '62x30', `${r1(box(btn).w)}x${r1(box(btn).h)}`, near(box(btn).w, 62) && near(box(btn).h, 30));
        eq('bundle row button', 'radius', '2px', cs(btn).borderTopLeftRadius);
        eq('bundle row button', 'border', '1px #dee2e9', `${cs(btn).borderTopWidth} ${hex(cs(btn).borderTopColor)}`);
        eq('bundle row button', 'label', '+ ADD', text(btn));
        font('bundle row button', btn, '13px', '12px', '700', '#ed773b', { color: FLAGGED.orange });
        eq('bundle row button', 'case', 'uppercase', cs(btn).textTransform);
      }
    });
    if (brows.length > 1) px('bundle rows', 'gap between rows', 10, box(brows[1]).y - box(brows[0]).b, 1.5);
    if (brows.length === 3) px('bundle box', 'height, 3 rows', 247, b.h, 2, 'note: Figma draws the 14px title in a 17px box');
  } else add('bundle box', 'shown', 'yes (frame)', 'not for this cart', false, 'note: no accessory rule matches these products');
}

// ---- You Might Also Like band
const band = widgets.find((n) => n.querySelector('.large-style-grid'));
if (!isEmpty) {
  if (band) {
    const b = box(band);
    add('YMAL band', 'full panel width', `x0 · w${P}`, `x${r1(b.x)} · w${r1(b.w)}`, near(b.x, 0) && near(b.w, P));
    eq('YMAL band', 'background', '#f2f4f7', hex(cs(band).backgroundColor));
    eq('YMAL band', 'padding', '24px 20px', `${cs(band).paddingTop} ${cs(band).paddingRight}`);
    const t = band.querySelector('.primary-title');
    if (t) {
      eq('YMAL title', 'copy', 'You Might Also Like', text(t));
      font('YMAL title', t, '16px', '19.2px', '700', '#000000');
    }
    const cards = q('.large-style-grid .rebuy-product-block', band);
    const cw = (P - 40 - 7) / 2;
    add('YMAL grid', 'cards', '4 (2x2)', cards.length, cards.length === 4);
    if (t && cards[0]) px('YMAL grid', 'gap under the title', 14, box(cards[0]).y - box(t).b, 1.5);
    if (cards[0]) {
      const c0 = box(cards[0]);
      px('YMAL card', 'width', r1(cw), c0.w);
      add('YMAL card', 'height', '208-218', r1(c0.h), c0.h >= 207 && c0.h <= 219, cards.slice(0, 2).some(hasPicker) ? FLAGGED.picker : '');
      eq('YMAL card', 'background', '#ffffff', hex(cs(cards[0]).backgroundColor));
      eq('YMAL card', 'padding top/bottom', '10px 10px', `${cs(cards[0]).paddingTop} ${cs(cards[0]).paddingBottom}`);
      if (cards[1]) px('YMAL grid', 'column gap', 7, box(cards[1]).x - c0.r);
      if (cards[2]) px('YMAL grid', 'row gap', 4, box(cards[2]).y - c0.b);
      const img = cards[0].querySelector('.rebuy-product-media img');
      if (img) add('YMAL card', 'image', '~104x70', `${r1(box(img).w)}x${r1(box(img).h)}`, Math.abs(box(img).w - 104) <= 16 && Math.abs(box(img).h - 70) <= 11);
      const colour = cards[0].querySelector('.spy-mc-card__colour');
      font('YMAL card colour', colour, '12px', '12px', '400', '#a2a2a2', { color: FLAGGED.grey });
      if (colour) eq('YMAL card colour', 'align', 'center', cs(colour).textAlign);
      const model = cards[0].querySelector('.spy-mc-card__model') || cards[0].querySelector('.rebuy-product-title');
      font('YMAL card model', model, '14px', '14px', '700', '#000000');
      if (model) eq('YMAL card model', 'case', 'uppercase', cs(model).textTransform);
      font('YMAL card price', cards[0].querySelector('.rebuy-product-price .rebuy-money') || cards[0].querySelector('.rebuy-product-price'), '14px', '14px', '400', '#30333d');
      const btn = cards[0].querySelector('.rebuy-button');
      if (btn) {
        add('YMAL card button', 'box', `${r1(cw - 20)}x32`, `${r1(box(btn).w)}x${r1(box(btn).h)}`, near(box(btn).w, cw - 20) && near(box(btn).h, 32));
        eq('YMAL card button', 'border', '1px #ed773b', `${cs(btn).borderTopWidth} ${hex(cs(btn).borderTopColor)}`, FLAGGED.orange);
        eq('YMAL card button', 'radius', '0px', cs(btn).borderTopLeftRadius);
        const fill = hex(cs(btn).backgroundColor);
        eq('YMAL card button', 'fill', 'none', ['#000000@0', 'transparent'].includes(fill) ? 'none' : fill, fill === hex(cs(cards[0]).backgroundColor) ? 'same: filled with the card colour' : '');
        eq('YMAL card button', 'label', '+ ADD', text(btn));
        font('YMAL card button', btn, '12px', '12px', '700', '#ed773b', { color: FLAGGED.orange });
      }
    }
  } else add('YMAL band', 'shown', 'yes', 'not shown', false);
}

// ---- footer
const footer = root.querySelector('[data-rebuy-cart-anchor="footer"]');
if (isEmpty) {
  const shown = visible(footer) && box(footer).h > 2;
  add('footer', 'empty cart has none', 'no footer, no checkout', shown ? `shown (${r1(box(footer).h)}px)` : 'hidden', !shown);
} else if (footer) {
  const fb = box(footer);
  px('footer', 'pinned to the panel bottom', r1(F.height), fb.b);
  px('footer', 'height', 151, fb.h, 2);
  eq('footer', 'background', '#ffffff', hex(cs(footer).backgroundColor));
  const shadow = cs(footer).boxShadow.match(/^(rgba?\([^)]+\)) 0px 1px 0px 0px inset$/);
  const line = cs(footer).borderTopStyle !== 'none' && parseFloat(cs(footer).borderTopWidth) > 0
    ? `${cs(footer).borderTopWidth} ${hex(cs(footer).borderTopColor)}`
    : shadow ? `1px ${hex(shadow[1])} (inset shadow)` : 'none';
  add('footer', 'top line', '1px #edeff3@0.6', line, line.startsWith('1px #edeff3@0.6'));
  eq('footer', 'padding', '19px 16px 16px 16px', `${cs(footer).paddingTop} ${cs(footer).paddingRight} ${cs(footer).paddingBottom} ${cs(footer).paddingLeft}`);
  const row = footer.querySelector('.rebuy-cart__flyout-subtotal');
  if (row) add('total row', 'box', `${C}x24`, `${r1(box(row).w)}x${r1(box(row).h)}`, near(box(row).w, C) && near(box(row).h, 24));
  const label = footer.querySelector('.rebuy-cart__flyout-subtotal-label');
  if (label) {
    eq('total label', 'copy', 'Total :', text(label));
    font('total label', label, '14px', '14px', '400', '#000000');
  }
  const amount = footer.querySelector('.rebuy-cart__flyout-subtotal-amount');
  font('total amount', amount, '16px', '16px', '500', '#000000');
  if (amount) px('total amount', 'right edge', 16 + C, box(amount).r);
  const saving = q('.spy-mc-saving', footer)[0];
  add('savings badge', 'shown', 'only with savings', saving ? `shown: ${text(saving)}` : 'hidden (no compare-at prices today)', true);
  if (saving) {
    add('savings badge', 'box', '118x24', `${r1(box(saving).w)}x${r1(box(saving).h)}`, near(box(saving).h, 24));
    eq('savings badge', 'background', '#f2f4f7', hex(cs(saving).backgroundColor));
    font('savings badge', saving, '11px', '14px', '400', '#000000');
  }
  const cta = footer.querySelector('.rebuy-cart__checkout-button');
  if (cta) {
    add('checkout button', 'box', `${C}x48`, `${r1(box(cta).w)}x${r1(box(cta).h)}`, near(box(cta).w, C) && near(box(cta).h, 48));
    eq('checkout button', 'fill', '#ed773b', hex(cs(cta).backgroundColor), FLAGGED.orange);
    eq('checkout button', 'radius', '0px', cs(cta).borderTopLeftRadius);
    add('checkout button', 'label', 'CHECKOUT SECURELY', `${text(cta)} (${cs(cta).textTransform})`, /^checkout securely$/i.test(text(cta)) && cs(cta).textTransform === 'uppercase');
    font('checkout button', cta, '14px', '14px', '700', '#ffffff');
    eq('checkout button', 'letter-spacing 4%', '0.56px', cs(cta).letterSpacing);
    const lock = cta.querySelector('svg');
    const before = getComputedStyle(cta, '::before');
    const icon = lock ? `${r1(box(lock).w)}x${r1(box(lock).h)}` : before.content !== 'none' ? `${parseFloat(before.width)}x${parseFloat(before.height)}` : 'none';
    eq('checkout button', 'lock icon', '16x16', icon);
    if (row) px('checkout button', 'gap under the total row', 12, box(cta).y - box(row).b, 1.5);
  }
  const trust = footer.querySelector('.spy-mc-trust');
  if (trust) {
    const ti = q('.spy-mc-trust__item', trust);
    add('trust row', 'items', 3, ti.length, ti.length === 3);
    add('trust row', 'one line', 'yes', oneLine(trust) ? 'yes' : 'wraps', oneLine(trust));
    px('trust row', 'height', 20, box(trust).h, 1.5);
    const span = ti[0]?.querySelector('span');
    font('trust label', span, '12px', '18px', '500', null);
    const op = [span, ti[0], trust].map((n) => n && cs(n).opacity).find((o) => o && o !== '1') || (span ? hex(cs(span).color) : '');
    add('trust label', 'colour', '#000000@0.8', op, op === '0.8' || op === '#000000@0.8');
    if (ti[1]) px('trust row', 'gap between items', 12, box(ti[1]).x - box(ti[0]).r, 1.5);
    eq('trust row', 'copy', 'Lifetime warranty · Pay in installment · Easy return', ti.map(text).join(' · '), FLAGGED.copy);
    if (cta) px('trust row', 'gap under the button', 12, box(trust).y - box(cta).b, 1.5);
  }
}

// ---- empty cart
if (isEmpty) {
  const copy = q('.spy-mc-empty__copy')[0];
  const h = copy?.querySelector('h4, h3, h2, strong') || copy?.firstElementChild;
  const p = copy ? [...copy.querySelectorAll('p')].find((n) => text(n)) : null;
  if (h) {
    eq('empty heading', 'copy', 'Your bag is currently empty.', text(h));
    font('empty heading', h, '16px', '16px', '700', '#000000');
    eq('empty heading', 'align', 'center', cs(h).textAlign);
  }
  if (p) {
    eq('empty sub-line', 'copy', 'Start shop our best sellers', text(p), FLAGGED.copy);
    font('empty sub-line', p, '14px', '16.8px', '300', '#000000');
    if (h) px('empty sub-line', 'gap under the heading', 4, box(p).y - box(h).b, 1.5);
  }
  const trust = q('.spy-mc-empty .spy-mc-trust')[0];
  if (trust) {
    const span = trust.querySelector('.spy-mc-trust__item span');
    eq('empty trust row', 'weight', '400', span ? cs(span).fontWeight : 'no label');
    add('empty trust row', 'one line', 'yes', oneLine(trust) ? 'yes' : 'wraps', oneLine(trust));
    if (p) px('empty trust row', 'gap under the text', 10, box(trust).y - box(p).b, 1.5);
  }
  const tabs = q('.rebuy-tabbed-widget__tab');
  add('empty tabs', 'count', 4, tabs.length, tabs.length === 4);
  if (tabs[0]) {
    const tw = (C - 24) / 4; // the four tabs fill the row: 80 at 375
    add('empty tabs', 'tab box', `${r1(tw)}x32`, tabs.map((t) => `${r1(box(t).w)}x${r1(box(t).h)}`).join(' '), tabs.every((t) => near(box(t).w, tw) && near(box(t).h, 32)));
    if (tabs[1]) px('empty tabs', 'gap', 8, box(tabs[1]).x - box(tabs[0]).r);
    if (trust) px('empty tabs', 'gap under the trust row', 16, box(tabs[0]).y - box(trust).b, 1.5);
    const active = tabs.find((t) => t.classList.contains('active')) || tabs[0];
    const idle = tabs.find((t) => t !== active);
    eq('active tab', 'fill', '#ed773b', hex(cs(active).backgroundColor), FLAGGED.orange);
    font('active tab', active, '12px', '14px', '700', '#ffffff');
    eq('active tab', 'label', 'MEN', text(active).toUpperCase());
    if (idle) {
      eq('idle tab', 'border', '1px #dee2e9', `${cs(idle).borderTopWidth} ${hex(cs(idle).borderTopColor)}`);
      font('idle tab', idle, '12px', '12px', '700', '#000000', { lh: 'same: one line centred in a 32px tab' });
    }
    eq('empty tabs', 'labels', 'MEN WOMEN GOGGLE EYEGLASSES', tabs.map((t) => text(t).toUpperCase()).join(' '), FLAGGED.copy);
  }
  const trows = q('.rebuy-tabbed-widget .rebuy-product-block');
  add('empty list', 'rows', 11, trows.length, trows.length === 11);
  if (trows[0]) {
    const rb = box(trows[0]);
    add('empty row', 'box', `${C}x88`, `${r1(rb.w)}x${r1(rb.h)}`, near(rb.w, C) && near(rb.h, 88, 1.5), hasPicker(trows[0]) ? FLAGGED.picker : '');
    if (tabs[0]) px('empty list', 'gap under the tabs', 8, rb.y - box(tabs[0]).b, 1.5);
    eq('empty row', 'divider', '1px #dee2e9', `${cs(trows[0]).borderBottomWidth} ${hex(cs(trows[0]).borderBottomColor)}`);
    const last = trows[trows.length - 1];
    eq('empty row', 'last row divider', 'none', cs(last).borderBottomStyle === 'none' || cs(last).borderBottomWidth === '0px' ? 'none' : cs(last).borderBottomWidth);
    const img = trows[0].querySelector('.rebuy-product-media img');
    if (img) add('empty row', 'image', '81x64', `${r1(box(img).w)}x${r1(box(img).h)}`, near(box(img).w, 81, 1.5) && near(box(img).h, 64, 1.5));
    font('empty row colour', trows[0].querySelector('.spy-mc-card__colour'), '12px', null, '500', '#a2a2a2', { color: FLAGGED.grey });
    const model = trows[0].querySelector('.spy-mc-card__model') || trows[0].querySelector('.rebuy-product-title');
    if (model) eq('empty row model', 'font', '14px 700 #000000 uppercase', `${cs(model).fontSize} ${cs(model).fontWeight} ${hex(cs(model).color)} ${cs(model).textTransform}`);
    const price = trows[0].querySelector('.rebuy-product-price .rebuy-money') || trows[0].querySelector('.rebuy-product-price');
    if (price) eq('empty row price', 'font', '14px 400 #30333d', `${cs(price).fontSize} ${cs(price).fontWeight} ${hex(cs(price).color)}`);
    const btn = trows[0].querySelector('.rebuy-button');
    if (btn) add('empty row button', 'box', '62x30', `${r1(box(btn).w)}x${r1(box(btn).h)}`, near(box(btn).w, 62) && near(box(btn).h, 30));
    const names = trows.map((n) => text(n.querySelector('.spy-mc-card__model') || n.querySelector('.rebuy-product-title')));
    const repeats = names.length - new Set(names).size;
    add('empty list', 'one row per model', '11 different models', repeats ? `${repeats} repeat(s): ${names.join(', ')}` : names.join(', '), !repeats, repeats ? 'note: the tab lists the collection in its order, colourways included' : '');
  }
}

// ---- report
const n = { ok: 0, same: 0, flagged: 0, note: 0, DIFF: 0 };
rows.forEach((r) => n[r.v]++);
const content = isEmpty ? 'empty cart' : `items: ${items.map((i) => text(i.querySelector('.spy-mc-item__model'))).join(', ')} · bundle: ${bundle ? q('.rebuy-product-title', bundle).map(text).join(', ') : '-'} · total ${text(root.querySelector('.rebuy-cart__flyout-subtotal-amount')).replace(/^Cart total /, '')}`;
const lines = rows
  .filter((r) => r.v !== 'ok')
  .map((r) => `  ${r.v.padEnd(7)} ${`${r.area} · ${r.what}`.padEnd(46)} design ${r.design.padEnd(22)} live ${r.live}${r.note ? `   [${r.note.replace(/^\w+: /, '')}]` : ''}`);
return [`SPEC ${VW}x${VH} · panel ${P} · ok ${n.ok} · same ${n.same} · flagged ${n.flagged} · note ${n.note} · DIFF ${n.DIFF}`, `  ${content}`, ...lines].join('\n');
