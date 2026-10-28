# PDP Lens information: technology images and display logic

Measured on the live source (spyoptic.com, SFCC) on 28 Oct 2026, plus the live Shopify store on the same day.
Scan: 320 masters from the sunglasses, goggles, eyeglasses and collections grids (helmets, gear and merch left out).
SFCC lists one style under several master IDs (one per category), so the master counts below overlap.

## 1. The images

### "Technology" tile logos (5 files, 4 different looks)

All are 100×20 PNGs from the shared library:
`https://www.spyoptic.com/on/demandware.static/-/Library-Sites-SPYOpticEUSharedLibrary/default/<dw-version>/pdp/lenstech/<file>`

| Variant `lensTechnology` | Slug = content asset `pdp-lens-technology-<slug>` | Tile image | What it shows | Masters | Variants |
|---|---|---|---|---|---|
| Happy | `happy` | `dw5a5d77e9/…/Happy.png` (486 B) | light-blue HAPPY wordmark | 147 | 630 |
| Happy Polarized | `happy-polarized` | `dw313ed561/…/Happy_Polar.png` (490 B) | HAPPY + POLARIZED under it | 126 | 278 |
| Happy Boost | `happy-boost` | `dw71f9a73b/…/HappyBoost.png` (1,722 B) | rainbow HAPPY + purple BOOST | 95 | 170 |
| Happy Boost Snow | `happy-boost-snow` | `dw0599c00a/…/HappyBoostSnow.png` (1,722 B) | **same pixels as HappyBoost.png** | 13 | 46 |
| Happy Snow | `happy-snow` | `dw5e8abb45/…/Happy_LensSnow.png` (493 B) | HAPPY + LENS TECH under it | 12 | 124 |
| Happy Polar | `happy-polar` | asset exists, **empty** | grey tile, label only (source bug) | 6 | 6 |
| Clear | `clear` | asset exists, **empty** | grey tile, label only (source bug) | 8 | 8 |
| *(no value)* | grouped as `classic` | asset exists, empty | never shown | 182 | 641 |

`Happy Photochromic` (one variant in our store, Logan ANSI RX) is not on the live catalog, and `pdp-lens-technology-happy-photochromic` does not exist (the include returns 500).

Our `Happy Lens™` metaobject icon (`spy-tech-happy-lens.png`) is the same 100×20 wordmark as `Happy.png`.
Our `Happy Boost™` icon (`spy-tech-happy-boost.png`, 153×153) is the round "HB" card sticker (`pictohappyboost.png`), **not** the tile wordmark.

### "Read more" drawer logos (3 files, one per family)

Hotlinked from the SFCC **staging** host, so they must be re-hosted:
`https://sfcc-staging.bollebrands.com/on/demandware.static/-/Library-Sites-SPYOpticEUSharedLibrary/default/v7c646a9857dae5ca42633c6f893e6c75bf941f54/pdp/lenstech/<file>`

| Drawer (content asset comment, CSS prefix) | Logo file | Size | Benefit headings | Used for values |
|---|---|---|---|---|
| HAPPY LENS™, `.spy-hl-*` | `happy-lens-update-logo.jpg` (HAPPY / LENS TECH) | 359×154 | Mood-Boosting Light Science · 100% UV Protection · Enhanced Color & Contrast | Happy, Happy Snow |
| HAPPY POLARIZED™, `.spy-hp-*` | `happy-polar-lens-update-logo.jpg` (HAPPY / POLARIZED) | 353×154 | Eliminates Surface Glare · See Below the Surface · Full Happy Lens Benefits | Happy Polarized, Happy Polar |
| HAPPY BOOST™, `.spy-hb-*` | `HAPPYBOOSTV4.jpg` (HAPPY BOOST / SUPER-VIVID COLOR + HAPPY™ LENS TECH) | 623×154 | Supercharged Contrast · Sharp Edge Definition · Reduced Eye Fatigue | Happy Boost, Happy Boost Snow |
| *(none)* | modal body is empty | — | — | Clear, no value |

The drawer shows the logo at `max-height: 48px` (56px below 769).

## 2. Display logic on the source

1. **Gate: the product's SFCC template.** Only masters with `template = "product/productDetailsGlasses"`
   (`.product-detail.product-sunglasses-context`) render the Lens information section. Every other product
   uses the default PDP and has no section at all.
   - 163 of the 167 masters with a Happy lens use it (sunglasses and most snow goggles).
   - The 4 that don't: Marshall 2.0 (145219, 225903), Marauder Elite Eco (185519), Replacement Lens Marauder (43902).
   - All 31 sampled no-tech masters use the default template (eyeglasses, moto goggles, cases, screen/gaming glasses, replacement lenses).
2. **Data: one text value per variant.** The variant attribute `lensTechnology` ("Happy", "Happy Boost Snow"…).
   The master groups its variants by that value in `lensTechnologyMapping` (lowercase keys; variants with no
   value fall under `classic`).
3. **Server render.** For each key in the mapping the page prints one "Technology" tile:
   `.variant-lens-attribute-wrapper.js-variant-technology-asset.js-variant-technology-asset-<slug>` with the label
   "Technology" and `<iscontentasset aid="pdp-lens-technology-<slug>">` as the value. The asset body is
   `<div class="py-2 px-4"><div class="d-flex justify-content-center"><img alt="" src="…/pdp/lenstech/<file>" title=""></div></div>`
   (logo at its natural 100×20, empty alt). Only the tile that matches the selected variant is visible; the others get `d-none`.
4. **Slug rule** (productDetail.js): `lensTechnology.toLowerCase().replace(/[^\w-]/g, "-")`, so "Happy Boost Snow" → `happy-boost-snow`.
5. **Variant change** (Product-Variation AJAX, same code in main.js for Quick View):
   - VLT / Lens category / Tint base are replaced from `product.lensTechnologyHTML`.
   - That HTML has the tech tiles too, but with empty assets, so the script throws them away and puts back the tiles from page load.
   - All tech tiles are hidden, then `.js-variant-technology-asset-<slug of the new variant>` is shown. No value → no tile.
   - If the tile area is now 0px tall, the section gets `.no-content`: heading and "Read more" hidden, margin 0.
6. **"Read more" drawer** (`#readmoreLensModal`) is chosen on the server from the variant selected at page load
   (table above). No script updates it, so after a swatch switch it can describe the wrong lens
   (Flynn opens on Happy Boost; pick a Happy colourway and the drawer still says Happy Boost).
7. **Empty assets.** Clear and Happy Polar show a grey "Technology" tile with no logo, and Clear's "Read more" opens
   an empty drawer. Landing on a no-value variant by URL shows the heading with nothing under it
   (`.no-content` is only set by the variant-change script).

Tile box: `background: var(--custom-color-surface-primary); padding: 1rem .75rem; display: flex`,
column-reverse from 992 (same as the other three tiles).

## 3. Our theme (rebuilt 28 Oct 2026, `blocks/spy-lens-info.liquid`)

**Logic**
- The lens type is variant `spec.lens_technology` (product value as fallback). It is matched to a `technology`
  entry by `name` or `aliases`. Product `spec.technologies` is only used when there is no lens type at all.
- Tile: the entry's `icon` (100×20 wordmark) at 20px tall. Entry without an icon: its name. No matching entry: no tile
  (we don't copy the source's empty grey box).
- Panel: the entry's `drawer_logo`, `short_blurb` (intro), `drawer_benefits` and `drawer_note`. An entry can borrow
  another entry's panel with `drawer_source` (Happy Lens™ Snow → Happy Lens™). When an entry matches, the panel uses
  only that entry's copy, so Happy Lens text can't leak into another panel.
- A lens type with no entry (e.g. Clear) gets no panel. A variant with no lens type keeps the block-setting
  default panel (Happy Lens copy), as before.
- `spy-variant-sync.js` re-renders tiles and panel on a variant pick, so our panel always matches the variant
  (better than the source; keep it).
- The block shows on any product with lens data. It has no template gate, so Marauder Elite Eco and Marshall 2.0 get the section and the source doesn't.

**`technology` entries** (entered in the admin on 28 Oct; fields `drawer_logo`, `drawer_benefits`, `drawer_note`,
`drawer_source` added to the definition)

| Entry | Aliases | Icon (tile) | Panel |
|---|---|---|---|
| Happy Lens™ | Happy, Happy Photochromic | `spy-tech-happy-lens.png` | own: `spy-lens-tech-panel-happy-lens.jpg` |
| Happy Lens™ Snow | Happy Snow | `spy-lens-tech-happy-snow.png` | `drawer_source` → Happy Lens™ |
| Happy Polarized™ | Happy Polarized, Happy Polar | `spy-lens-tech-happy-polarized.png` | own: `spy-lens-tech-panel-happy-polarized.jpg` |
| Happy Boost™ | Happy Boost, Happy Boost Snow | `spy-lens-tech-happy-boost.png` (was the round HB sticker) | own: `spy-lens-tech-panel-happy-boost.jpg` |

Panel copy is the source's text, word for word.

**Checked on a preview theme with real data (28 Oct):**
- All 7 lens types in our data (Happy, Happy Polarized, Happy Boost, Happy Boost Snow, Happy Snow, Happy Polar,
  Happy Photochromic) give the tile and panel above.
- Screenshots at 1440/768/390 with the panel open.
- Flynn switching Polarized → Boost → Happy updates both the tile and the panel.
- No Liquid or theme console errors.

**Data gap:** `spec.lens_technology` is on only 158 of 1,425 variants (Happy 92, Happy Polarized 33, Happy Boost 22,
Happy Boost Snow 8, Happy Photochromic 1, Happy Snow 1, Happy Polar 1). Every other variant shows no Technology tile
until the product data migration fills it.

## 4. How it was measured (to repeat it)

Same-origin `fetch` from a `www.spyoptic.com/robots.txt` tab in the Chrome extension, base
`/on/demandware.store/Sites-SPYOptic_US-Site/en_US/`:
- `Search-UpdateGrid?cgid=<sunglasses|goggles|eyeglasses|collections…>&start=0&sz=600` lists the masters.
- `Product-Variation?pid=<master or variant>&quantity=1` (XHR headers) returns JSON with `lensTechnology`,
  `lensTechnologyMapping`, `lensTechnologyHTML`, `template`, `specificTechnology`, `lensTransmission`, `lensCategory`.
- `Page-Include?cid=pdp-lens-technology-<slug>` returns the asset: 200 with an `<img>`, 200 with only `\n` (empty), or 500 (no asset).
- Drawers: fetch the PDP with the variant's `dwvar_<pid>_color` value and read `#readmoreLensModal .modal-body`.
- DataDome answered 403 after about 600 requests in 35 minutes, so plan the requests before you start.
