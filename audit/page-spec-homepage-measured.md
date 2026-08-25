# Homepage — measured source spec (pixel targets)

## Reference screenshots

`audit/homepage/source-{1440,768,390}.png` — the live page
`audit/homepage/theme-{1440,768,390}.png` — our build

These did not exist before; the homepage was the only page rebuilt without the
`source-*` / `theme-*` baseline that `audit/404/`, `audit/offers-and-conditions/` and
`audit/watermen-diff/` all have. Everything above was measured from computed styles, CSS
rules and the source's own slick configs rather than diffed visually.

Two things to know before diffing them:

1. **The source captures have no hero band.** Vimeo is unreachable from this machine, so the
   live hero collapses to 0px and our hero shows a blocked iframe as a grey box. That one band
   cannot be compared from here, in either direction.
2. The source capture is taken with its promo modal and consent layers stripped, otherwise a
   backdrop dims the whole page and hides part of the Watermen row.

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
* the Vimeo player does not load in local preview (it is network-blocked here) — the iframe is
  correct and sized, but it renders as a grey box until viewed on a real connection

#### Desktop ratio — measured off a real screenshot: **12:5 (1920×800)**

A desktop screenshot of the live hero settled this. Scanning its rows for the white band edges:

| band | rows | height |
|---|---|---|
| header | 0–48 | 49 |
| **hero video** | 49–842 | **794** |
| white gap | 843–872 | **30** |
| tiles | 873+ | — |

Viewport 1919 with a visible scrollbar → content 1904. `1904 / 794 = 2.400`, so the video is
**1920×800**. Ours now renders 795 at content 1909 (`1909 / 2.4 = 795.4`) — the 1px is the scrollbar
difference. The 30px gap independently confirms the tiles' `margin-top: 30px` and that the hero
carries no bottom margin.

**This overturned an earlier assumption.** The hero was set to 32:10 (3.2) on the reasoning that hero
videos follow the banner-image convention (1920×600). They do not: the banner *images* are 3.2, the
homepage hero *video* is 2.4. It was rendering ~199px short at 1904 and cropping the video.

Consequence for mobile: the 2:3 mobile ratio was inferred from that same banner convention, so it is
now **suspect for the same reason**. It needs a mobile screenshot to settle — the row-scan method above
gives an exact answer from one image.

#### Height profile — verified against the sibling banners
*(measured while the desktop ratio was still set to 3.2; the ratios and the 992 swap point are the
point of this table, not the hero's absolute numbers)*

The 992 swap and both ratios are **not** guesses. Measured on the live Region XL and Watermen
banners, which share this band's breakpoint and art convention, then compared with our hero:

| viewport | live banner | our hero | source file → ratio |
|---|---|---|---|
| 768 | 1130 | 1137 | `…Mobile-800x1200` → 0.667 |
| 991 | 1464 | 1472 | `…Mobile-800x1200` → 0.667 |
| 992 | 305 | 307 | `…Desktop-1920x600` → 3.200 |
| 1200 | 370 | 372 | `…Desktop-1920x600` → 3.200 |
| 1440 | 445 | 447 | `…Desktop-1920x600` → 3.200 |

Ours tracks the source within ~7px everywhere; the gap is the 10px scrollbar (our content box is
981–982px where the live one is 976–977px).

**The 4.8× cliff at 992 is the source's own behaviour, not a defect.** SPY serves a 2:3 portrait crop
up to 991 and a 3.2 landscape crop from 992, so at 991 their banner is 1464px tall — 1.6 screens on a
900px viewport — and at 992 it drops to 305px. Don't "fix" this; it is what the live site does.

What is still inferred: that the hero's **mobile** video (`1218129262`) is 2:3 rather than some other
portrait shape. The desktop side is well supported — 32:10 is exactly 1920/600, and the one SPY hero
video whose dimensions are recoverable (the ANSI capture's initialized embed, titled
`ANSI PHOTOCHROMIC_HP_1920x600_NO_SOUND`) is precisely that. Adjust
`ratio_w_mobile`/`ratio_h_mobile` if the real mobile video differs.

#### Property-by-property parity

| Node / property | Source | Ours | |
|---|---|---|---|
| `.hero-banner` | `position:relative; overflow:hidden`, full-bleed | same | ✓ |
| image wrapper | `width:100%`, `align-self:flex-start` | `block w-full` | ✓ |
| box height | Vimeo responsive `padding-top:(h/w)%` | `aspect-ratio` per breakpoint | ✓ equivalent |
| ground behind player | none | none *(was `bg-black`)* | ✓ fixed |
| overlay wrapper | `position:absolute; inset:0; 100%×100%` | `absolute inset-0` | ✓ |
| overlay container | `.container` ladder + `0 15px`, `height:100%` | same ladder + `px-[15px] h-full` | ✓ |
| overlay alignment | `justify-content:center; align-items:flex-end` at every width | centre + bottom, both breakpoints | ✓ |
| copy box padding | `1rem 1rem 4rem` | `px-4 pt-4 pb-16` | ✓ |
| copy box colour | `color:#fff` | `text-white` *(was slate)* | ✓ fixed |
| text alignment | `text-center` at every width | centre, both breakpoints | ✓ |
| heading | none | none | ✓ |
| scrim | none | `show_overlay:false` | ✓ |
| CTA element | `<a>` — the button is the link, not the banner | `<a>` via `link_scope:cta` | ✓ |
| CTA font | 14px / 400 / 21px / normal / uppercase | identical | ✓ |
| CTA colour | `#1d2a2b` on `#fff`, `1px solid #1d2a2b`, radius 0 | identical | ✓ |
| CTA padding | `8px 32px` | `px-8 py-2` | ✓ |
| CTA transition | `color, background-color, border-color, box-shadow` `.15s ease-in-out` | identical *(was `transition-colors`, and Tailwind's `ease-in-out` is a different curve)* | ✓ fixed |
| video params | `autoplay, loop, muted, playsinline, controls:false` | `autoplay=1&muted=1&loop=1&controls=0&playsinline=1` *(was `background=1`)* | ✓ fixed |
| iframe `allow` | `autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share` | identical | ✓ fixed |
| iframe name | video title | `video_title` setting, `aria-hidden`, `tabindex="-1"` | ✓ better |
| art swap point | 992 | 992 | ✓ |
| row margin | 0 top and bottom | 0 | ✓ |

Two deliberate non-ports:

* The source CTA also carries `mt-2 mt-md-0 ml-0 ml-md-2` — leftovers from a two-button hero. On a
  single centred button they only add stray space above it below 769 and shove it ~4px off centre from
  769 up. Not reproduced.
* Our CTA computes `display:block` where the source is `inline-block`. That is CSS blockification of a
  flex item, not a bug — the rendered box is content-sized and 39px tall either way.

---

## Second pass — self-audit of the build

Behaviour was read off the source's own carousel configs, not inferred.

**Activity tiles** — `slick({infinite:true, speed:200, slidesToShow:1, variableWidth:true, dots:false})`,
one tile per click, always-on arrows, draggable, hover swap with `transition: opacity` at **0s** (instant).

**Product rails** — `slidesToScroll` **1 / 3 / 2 / 1** across >1140 / 721–1140 / 541–720 / ≤540;
`infinite` true above 1140 and at ≤540 only; arrows per band (rail 1 hides them 541–1140, rail 2 shows
them); dots ≤540 only; `draggable`; `speed` 300ms; autoplay **off** on both.

### Defects found and fixed

| # | Defect | Cause | Fix |
|---|---|---|---|
| 1 | Rails stepped 1 card at every width | slick's `slidesToScroll` never ported | paged 1/3/2/1, settable per breakpoint |
| 2 | Rails never wrapped | `infinite` never ported | wraps at ≤540, where the source does |
| 3 | Rails had no mouse drag | only arrows + native scroll were wired | pointer drag, with the post-drag click swallowed |
| 4 | Both carousels glided at the browser's default speed | native `scrollTo({behavior:'smooth'})` is untimed | rAF tween: 200ms tiles, 300ms rails |
| 5 | Quick view snapped in instead of fading | the button's Tailwind `transition-colors` compiles `!important` and omits `opacity`, overriding the hand-written `transition: opacity .2s` | `transition-[opacity,color,background-color,border-color] duration-200` |
| 6 | **Every banner downloaded both crops** | two `<img>` toggled by classes — a `display:none` image still fetches | one `<picture>` with `media` sources, via `snippets/spy-banner-picture.liquid` |
| 7 | **Hero loaded two Vimeo videos**, one always hidden | same class-toggle mistake, applied to iframes | one `spy-bg-video` player that swaps its own `src` at the breakpoint, like the source's `data-desktop-video-url` / `data-mobile-video-url` |
| 8 | Hero iframe had `title=""` | Horizon's video slot left it empty | titled from a new `video_title` setting, `aria-hidden` + `tabindex="-1"` since it is decorative |
| 9 | 16 dead `<a href="#">` | tiles rendered an anchor even with no link | a tile with no link renders a `div`, not a focusable anchor to nowhere |
| 10 | Dot buttons unreachable to screen readers | container was `aria-hidden="true"` around real buttons | `role="group"` + label |

Verified after: 0 dead anchors, 0 duplicate ids, no `aria-hidden` container holding focusable controls,
one `<picture>` per banner fetching one file, one hero iframe carrying the correct video per breakpoint,
and no console errors from these sections. Geometry unchanged (hero 447 / 570, tiles and rails as above).

### Third pass — mobile banners and button hover

**Mobile crops were missing, now sourced and wired.** Both real files were sitting in
`reference/Homepage/…_files/`, so Shopify pulled them straight from the source CDN into Files:

* `26-SPY-Digital-Homepage-Banner-Week25-Region-Mobile-800x1200px.jpg` → 800×1200 ✓
* `26-SPY-Digital-Homepage-Banner-Week21-Watermens-Mobile-800x1200.jpg` → 800×1200 ✓

Below 992 both banners now render on the portrait crop at ratio 0.667:

| viewport | source | ours |
|---|---|---|
| 390 | 562.5 (content 375) | 570 (content 380) |
| 768 | 1130 (content 753) | 1137 (content 758) |

Identical ratio; the delta is only the scrollbar. Half banners were already right — the source uses one
1000×800 file at every width, so 304px @390 and 606px @768 match.

**Button hover — the full source spec**, read off the stylesheet rather than a flaky mouse simulation:

```
.btn-outline-secondary:hover        { color:#fff; background:#1d2a2b; border-color:#1d2a2b }
.btn-outline-secondary:active       { …same… }
.btn-outline-secondary:active:focus { box-shadow: 0 0 0 .2rem rgba(29,42,43,.5) }
.btn:hover                          { text-decoration: none }
transition: color, background-color, border-color, box-shadow  .15s ease-in-out
```

Crucially there is **no `.hero-banner:hover .btn` rule anywhere** — the button fills only on its own
hover. Ours had `group-hover:` variants on the CTA next to a `group` wrapper, so hovering anywhere on
the banner filled the button. Removed from both `spy-feature-link-banner` and `spy-half-banners`, and
the `:active` and focus-ring states added to match.

Verified by driving a real pointer: idle `#1d2a2b`/white → banner-wide hover **no change** → button
hover white/`#1d2a2b`, with no image transform or opacity shift either way.

### Broken nav links discovered

The mega-menu points at **five collections that 404** on the storefront: `fishing-sunglasses`,
`lifestyle`, `classics`, `trail-collection`, `blue-light-glasses`. This is pre-existing and affects the
header, not just the homepage. Only verified 200s are wired on this page, so those five tiles
(Fishing, Lifestyle, Classics, Trail, Blue Light) render unlinked rather than sending people to a 404.
Wire them the moment the collections are published.

Every link on the homepage now resolves: hero → `moto-goggles`, tiles → `snow-goggles` /
`safety-sunglasses` / `moto-goggles`, Region → `sunglasses`, strip → `sunglasses`, Watermen →
`pages/watermen`, half banners → `pages/rewards-program` and `collections/happy-boost`.

### Known, deliberate non-ports

* The source also loops the rails above 1140, where all five cards fit and it renders no arrows — not
  observable, and cloning cards there would duplicate quick-view ids.
* Below 992 the source's rail row carries `margin: 0 -15px`, hanging 15px off-screen and clipping its
  outer cards. `track_inset_mobile` exposes it; left at 0.

---

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
