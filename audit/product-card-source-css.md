# Product card — original source CSS (spyoptic.com)

Source: Wayback archive of `…/css/global.css` (snapshot `20250804194509`, Sites-SPYOptic_AA-Site),
plus `:root` token values from the DevTools export (`main2.css`, US site). Live crawl is 403-blocked, so
this is the ground truth for the PLP `.product-tile`.

## Exact rules (de-minified)

### Image
```css
.product .image-container { position:relative; display:flex; flex-direction:column; }
.product .image-container .image-wrapper {
  display:flex; align-items:center;      /* image vertically centred */
  aspect-ratio: 1 / 1;                    /* SQUARE  (--custom-product-tile-image-ratio) */
  padding: 10%;
  min-height: 6em;                        /* (10rem on larger bp) */
  overflow: hidden;
  filter: none;                           /* default brightness(.96) overridden off */
  background: none;                       /* default rgba(0,0,0,.04) overridden off */
}
.product .image-container .tile-image { width:100%; }   /* height auto → square img fills width */
/* hover swaps to lifestyle "worn" image */
.product .image-container .worn-image { width:100%; position:absolute; opacity:0; transition:opacity .3s; }
.image-wrapper:hover .worn-image { opacity:1; }
.image-wrapper:hover ~ [data-hide-on-worn-image=true] { opacity:0; }
```

### tile-body (name + price)
```css
.product .tile-body { padding:.625em .5rem 1.5em; align-items:center; }   /* content-alignment=center */
.product .tile-body > div { margin-bottom:.5rem; }
.product .tile-body .pdp-link { display:flex; justify-content:center; line-height:1.2; width:100%; }
.product .tile-body .pdp-link .link {
  color:#1d2a2b;                          /* --custom-product-tile-name-color */
  font-family:DINNextLTPro; font-weight:900; text-transform via tile;
  font-size:1.2rem;                       /* name-size (md-down 1.2rem, sm-down 1rem) */
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;   /* single line */
}
.product .tile-body .price {
  color:#565656; font-weight:600; font-size:15px; margin-bottom:0;
}                                         /* md-down 1.0625em, sm-down 1em; .percentage hidden */
```

### "New" label — outlined pill (the one actually used; `.badges` circular set is unused here)
```css
.product .product-tile-label-container .product-tile-label {
  border:1px solid #f57d31;               /* label-border-color; "New" inline = #f57d31 */
  color:#f57d31;                          /* default var = red #df5b5b; "New" inline = #f57d31 */
  border-radius:0;                        /* square corners */
  font-size:.8125em;                      /* 13px */
  font-weight:bold; text-transform:uppercase;
  padding:0 .8rem 0; line-height:1.1rem;  /* no vertical padding */
}
```

### Color swatches area (bottom of image, above name)
```css
.product .color-swatches { position:relative; display:flex; width:100%; padding:.5rem .5rem 0; justify-content:center; }
.color-swatches .tile-labels-container { min-height:3rem; display:flex; flex-direction:column; gap:.5rem; align-items:center; justify-content:end; }
.color-swatches .tile-labels-container .swatches-label { font-size:.9rem; color:#6c757d; }   /* color NAME, gray */
.color-swatches .swatches { position:absolute; opacity:0; display:flex; gap:.5rem; transition:opacity .3s; }
.swatch-circle { max-width:3rem; max-height:3rem; background:#f8f8f8; }
/* hover: label fades OUT, swatch row fades IN (same slot) */
.image-container:hover .swatches { opacity:1; }
.image-container:hover .tile-labels-container { opacity:0; }
```

### Stickers (tech/cert pictos) — top-right of image
```css
.product .image-container .stickers { position:absolute; right:.3125rem; top:.7rem; transform:scale(.7); }
.product .image-container .sticker  { width:2.5rem; }
.product .image-container .sticker + .sticker { margin-left:.25rem; }
```

### Quick view — pulled over image bottom, revealed on tile hover
```css
.product .image-container .quickview { margin-top:-2.7rem; margin-bottom:.5rem; z-index:1; opacity:0; transition:opacity .2s; }
.product:hover .quickview { opacity:1; }   /* .btn.btn-outline-primary → orange outline */
```

### Grid
`.product-grid-desktop-4 .product-grid-mobile-1` → 4 cols desktop / 1 mobile.
Grid gap `--custom-search-product-grid-gap: 2.2rem 1rem`.

## Delta vs current Staging v2 card
| Element | Source | Current build | Action |
|---|---|---|---|
| Title weight | **900** | 700 | bump to 900 |
| Title size | 1.2rem, nowrap ellipsis | Horizon default | set 1.2rem, single line |
| Price | **#565656**, 600, 15px | ink #1d2a2b | recolor to #565656/600/15px |
| New badge size | 13px, no tracking, no y-padding | 10px, tracking-widest, py-1 | 13px, drop tracking, line-height 1.1rem |
| Color label | .9rem #6c757d normal (color NAME) | 10px semibold (count) | size to .9rem #6c757d; name blocked on data |
| Image inset | 10% | 9% | 9% → 10% |
| Stickers | scale(.7), 40px, top-right | top-right (close) | add scale(.7)/40px sizing |
| Worn-image hover | swaps to lifestyle photo | none | defer to migration (no staging asset) |
