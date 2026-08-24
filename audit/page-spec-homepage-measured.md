# Homepage — measured source spec (pixel targets)

Measured live on `https://www.spyoptic.com/us` at 1440 / 768 / 390 with a real browser.
Source breakpoints are Bootstrap-custom: **544 / 769 / 992 / 1200**. Slick carousels use their own
`≤540 / ≤720 / ≤1140` steps. Never assume Tailwind's `md`/`lg` line up with these.

The Yotpo bands (live bands 7 + 8: picture gallery and reviews carousel) are **out of scope** — not rebuilt.

## Band ladder (live `.experience-main` children)

| # | Band | Our section | Notes |
|---|---|---|---|
| 0 | Hero video banner (Vimeo, `SHOP MX GOGGLES` only) | `spy_hero_A1` | collapsed to 0px on live — video fails to load |
| 1 | Activity tiles carousel | `spy_category_tiles_npxaN3` | ✅ matched |
| 2 | REGION XL full-bleed banner | `section_tRkEMM` | |
| 3 | `SHOP NEW ARRIVALS` link strip | *(missing)* | |
| 4 | New Arrivals product carousel | `product_list_ikCdrT` | |
| 5 | WATERMEN COLLECTION full-bleed banner | `section_QGBQym` | |
| 6 | Watermen product carousel | `product_list_PdnycH` | |
| 7 | Yotpo picture gallery | — | **excluded** |
| 8 | Yotpo reviews carousel | — | **excluded** |
| 9 | Two-up half banners (LOYALTY / SUNRX) | `section_gpMr7q` | |

---

## Band 1 — Activity tiles carousel ✅ built

Full-bleed slick carousel, 8 tiles, infinite, arrows both ends.

```
.rx-landing-container { margin: 30px 0 -50px }          /* negative pull is deliberate */
.rx-carousel-item     { width: var(--w); height: var(--h) }   /* no gap between slides */
.category-wrapper     { width: 88%; height: 90%; margin: auto }  /* auto = centred x, TOP aligned y */
.img-wrapper          { position:absolute; inset:0; overflow:hidden; z-index:8 }
.default-image/.hover-image { position:absolute; inset:0; object-fit:cover; transition: opacity 0s }
.hover-image { opacity:0 }  :hover .hover-image { opacity:1 }  :hover .default-image { opacity:0 }
.text-container { position:absolute; top:50%; left:50%; translate(-50%,-50%); width:100%; padding:0 1rem; text-align:center; z-index:9 }
.main-text      { font-weight:600; line-height:1; margin-bottom:.5rem; color:#fff }   /* no text-shadow, no scrim */
.rx-carousel-action { top: calc(50% - 40px); translateY(-50%); 40x40 }
  .rx-previous-btn { left: 1vw }   .rx-next-btn { right: 1vw }
  visual: solid #1d2a2b circle + white thin chevron (FA light angle), 40px
```

| | <769 | 769–991 | ≥992 |
|---|---|---|---|
| card width | 80.5vw | 30.242vw | 25vw |
| card height | 110vw | 42.944vw | 35.972vw |
| label size | 30px (1.875rem) | 30px | 2.083vw |

Verified: 1440 → card 360×518, art 316.8×466.2, label 29.995px, arrows at 14.4px, band 518.
768 → card 618.2×844.8, art 544×760.3, label 30px, band 845.
390 → card 313.9×429, art 276.3×386.1, label 30px, band 429.

---

## Bands 2 / 5 / 9 — hero banners

Shared component. Whole banner is one `<a>`; the CTA is a `<span class="btn">`, not a link.

```
.hero-banner { position:relative; overflow:hidden }
.hero-banner-image-wrapper { width:100% }
.banner-image { display:block; width:100%; aspect-ratio:auto; object-fit:cover; object-position:50% 50% }
     -> height comes from the asset's natural ratio, nothing is cropped
.hero-banner-overlay-wrapper { position:absolute; inset:0; width:100%; height:100% }
.hero-banner-overlay { height:100%; display:flex }   /* is a .container - see ladder below */
.hero-banner-overlay-inner { color:#fff; padding: 1rem 1rem 4rem }
h2.banner-heading { font-weight:600; line-height:1.2; padding-bottom:8px; margin-bottom:8px }
CTA span.btn.btn-outline-secondary.btn-square.btn-lg:
   font-size:14px; font-weight:400; line-height:1.5; text-transform:uppercase;
   color:#1d2a2b; background:#fff; border:1px solid #1d2a2b; border-radius:0; padding:8px 32px;
   transition: color/background/border .15s ease-in-out
   wrapper div.d-block.d-md-inline-block  -> display:block below 769, inline-block from 769
```

`.container` ladder (padding is always `0 15px`):
`<544 none · ≥544 540px · ≥769 720px · ≥992 1140px · ≥1200 1440px`

Overlay alignment:

| | <992 | ≥992 |
|---|---|---|
| justify-content | center | flex-start |
| align-items | flex-end | center |
| text-align | center | left |

### Band 2 — REGION XL
* images: `…Region-Mobile-800x1200px.jpg` below 992 · `…Region-Desktop-1920x600px.jpg` from 992
* heading `REGION XL` — **26px** below 992, **62px** from 992
* row margin-top: **48px** below 992, **8px** from 992; margin-bottom 0
* CTA `SHOP NOW`
* 1440 → banner 1425×445.3, band 453.3 · 768 → 753×1129.5, band 1177.5 · 390 → 375×562.5, band 611

### Band 5 — WATERMEN COLLECTION
* images: `…Watermens-Mobile-800x1200.jpg` / `…Watermens-Desktop-1920x600.jpg`
* heading `WATERMEN COLLECTION` — **26px** below 992, **48px** from 992
* row margin: **16px top and bottom** at every breakpoint
* CTA `SHOP NOW`
* 1440 → banner 1425×445.3, band 477.3 · 768 → 753×1129.5, band 1161.5

### Band 9 — two-up half banners
* `col-lg-6` side by side from 992, `col-12` stacked below; row margin 0, gutter 15px each side
* both assets 1000×800 → at 1440 each banner is 697.5×558
* **no heading** — the headline is baked into the artwork; CTA only
* left: `…HalfBanners-LOYALTY.jpg`, CTA `LEARN MORE` · right: `…HalfBanners-SUNRX.jpg`, CTA `SHOP HAPPY BOOST`
* overlay on both: justify center, align flex-end, inner text-align center (all breakpoints)

---

## Band 3 — `SHOP NEW ARRIVALS` link strip

Literally one centred link, identical at every breakpoint:

```html
<div style="margin-top:25px; margin-bottom:40px">
  <div style="text-align:center">
    <a href="/us/sunglasses/"><span style="font-size:35px">SHOP NEW ARRIVALS</span></a>
  </div>
</div>
```
* colour `#f27e37`, weight 400, line-height 49px, no underline, full width (no container)
* band height 49px

---

## Bands 4 / 6 — product carousels

Slick config read straight off `data-slick` (breakpoint = **max-width**):

| window | slidesToShow | slidesToScroll | infinite | centerMode | arrows | dots |
|---|---|---|---|---|---|---|
| >1140 | 5 | 1 | yes | no | yes | no |
| 721–1140 | 3 | 3 | no | no | band 4 **no** / band 6 yes | no |
| 541–720 | 2 | 2 | no | no | band 4 **no** / band 6 yes | no |
| ≤540 | 1 | 1 | yes | **yes** (50px peek) | yes | **yes** |

Track: `.row { margin: 0 16px }` at ≥992, `margin: 0 -15px` below. 5 products per carousel.

Tile geometry (slide = list ÷ slidesToShow, `.product-tile` = slide − 16px):

```
.image-wrapper { aspect-ratio:1/1; padding:10% ; display:flex }   /* art is inset 10% all round */
.quickview     { margin:-43.2px 16px 8px; padding:8px 12px; font-size:12px; uppercase;
                 background:#fff; color:#f27e37; border:1px solid currentColor; text-align:center }
.color-swatches{ padding:8px 8px 0; display:flex; height:58.9px }
.tile-body     { padding:10px 8px 24px; display:flex; flex-direction:column; justify-content:space-between }
.pdp-link a    { font-size:16px; line-height:19.2px; colour #1d2a2b; margin-bottom:8px; CENTRED }
.price         { font-weight:600; colour #565656; centred; 16px below 1200, 15px at 1440 }
```

Measured: 1440 → slide 279, tile 263, art 210.4², band 407.6 · 768 → slide 261, tile 245, band 387
390 → slide 275, tile 259, band 401, arrows 35×35 + dots

---

---

## Build status

Homepage sections after the rebuild (`templates/index.json`):

| Live band | Our section | Type |
|---|---|---|
| 0 | `spy_hero_video` | `spy-feature-link-banner` in video mode |
| 1 | `spy_category_tiles_npxaN3` | `spy-category-tiles` (rewritten) |
| 2 | `spy_region_banner` | `spy-feature-link-banner` (extended) |
| 3 | `spy_new_arrivals_link` | `spy-link-strip` (new) |
| 4 | `spy_new_arrivals_carousel` | `spy-product-carousel` (new) |
| 5 | `spy_watermen_banner` | `spy-feature-link-banner` |
| 6 | `spy_watermen_carousel` | `spy-product-carousel` |
| 9 | `spy_half_banners` | `spy-half-banners` (new) |

### Verified against the source

Ours renders at a 1430px content width where the source gets 1425px (different scrollbar), so
banner heights read ~0.35% larger. Everything below is measured, not assumed.

| Element | 1440 | 768 | 390 |
|---|---|---|---|
| hero band | 1430×446.9 | 758×1137 | 380×570 |
| tile card | 360×518 ✓ | 618.2×844.8 ✓ | 313.9×429 ✓ |
| tile artwork | 316.8×466.2 ✓ | 544×760.3 ✓ | 276.3×386.1 ✓ |
| tile label | 29.995px ✓ | 30px ✓ | 30px ✓ |
| link strip | 49px + 25/40 margins ✓ | ✓ | ✓ |
| banner heading | 62 / 48px ✓ | 26px ✓ | 26px ✓ |
| banner copy box | 16/16/64, container ladder ✓ | 540px cap ✓ | no cap ✓ |
| banner CTA | 133×39, 14px, 8/32, 1px #1d2a2b ✓ | ✓ | ✓ |
| rail slide / card | 279.6 / 263.6 ✓ | 252.7 / 236.7 † | 280 / 264 ✓ |
| rail arrows | none ✓ | rail 2 only ✓ | both, 35×35 ✓ |
| rail dots | none ✓ | none ✓ | 5 × 10px ✓ |
| half banners | 2 up, 700 each, 30px gap ✓ | stacked ✓ | stacked ✓ |

No horizontal overflow at 390 / 768 / 1440. No console errors from these sections.

† **Deliberate deviation.** Below 992 the source's `.row` carries `margin: 0 -15px`, so its track hangs
15px past the viewport on both sides and the outer cards are clipped by `.slick-list`. That is a source
bug, not a design: reproducing it would clip our cards and open a horizontal scrollbar. `track_inset_mobile`
is a setting — set it to `-15` if an exact reproduction is ever wanted.

---

### Hero (band 0) — rebuilt to the saved reference

Replaced the old image hero (`GEAR UP & ROLL OUT` + two buttons, fixed 880px) with the saved page's
hero: a Vimeo background video, **no heading**, and one outline `SHOP MX GOGGLES` CTA bottom-centre.
`spy-feature-link-banner` gained a video mode for this, so one component now covers all four banner
bands. The CTA-only link is the new `link_scope` setting — the source hero links the button, not the
whole banner, unlike the promo bands.

* desktop `https://vimeo.com/1218129261` · mobile `https://vimeo.com/1218129262`, swapping at 992
* ⚠️ **The two ratio pairs are a considered guess, not a measurement.** vimeo.com is unreachable from
  this machine, and the band is 0px on live, so the videos' native ratios could not be read. Defaults
  are 32:10 desktop and 2:3 mobile — the same proportions as SPY's own homepage banner art
  (1920×600 / 800×1200). Check them against the real videos and adjust
  `ratio_w`/`ratio_h`/`ratio_w_mobile`/`ratio_h_mobile` in the section settings.
* the Vimeo player does not load in local preview (it is network-blocked here) — the iframe is
  correct and sized, but it renders as a grey box until viewed on a real connection

## Blocked on store data

These are the only things standing between the page and a 1:1 match. All of them are content, not code —
every setting is already wired and waiting.

1. **Mobile banner crops are missing.** The source swaps art at 992: `800×1200` portrait below,
   `1920×600` landscape above. The store only has the landscape files, so below 992 our banners fall back
   to the wide crop and come out ~237px tall at 768 where the source is 1129.5px, and ~119px at 390 where
   the source is 562.5px. Upload the mobile crops and set them in each banner's **Mobile image** slot:
   - Region XL → `26-SPY-Digital-Homepage-Banner-Week25-Region-Mobile-800x1200px.jpg`
   - Watermen → `26-SPY-Digital-Homepage-Banner-Week21-Watermens-Mobile-800x1200.jpg`
   - both half banners (source uses 1000×800 at every width, so these may not need one)
2. **`new-arrivals` collection is empty.** Both carousels currently point at `sunglasses` so the rail is
   verifiable. Point the first back at `new-arrivals` once it has products.
3. **No Watermen collection exists.** The second carousel needs one.
4. **All 8 activity tile links are empty.** Source targets: Snow → snow goggles, Safety → safety
   sunglasses, Blue Light → blue light glasses, and so on. Left blank rather than guessed, because an
   invented handle 404s.
