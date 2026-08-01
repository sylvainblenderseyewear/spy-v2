# Page spec — ANSI Photochromic collection landing

- **Source:** https://www.spyoptic.com/us/sunglasses/ansi-photochromic.html
- **Local copy:** `reference/ANSI_Photochromic/ANSI Photochromic Sunglasses.html`
- **Page type:** collection landing (same family as Watermen Collection)
- **Target template:** `templates/page.ansi-photochromic.json`
- **Nav position:** mega-menu level 3 under Sunglasses → `id="ansi-photochromic"`, label "ANSI Photochromic"

The live site blocks automation (Playwright times out on the host; WebFetch 403), so every
measurement below comes from the saved DOM and `global.css`, not from a live render.

## Source breakpoints

| Width | Used by |
|---|---|
| 768px | content rows (band 4) — its own inline `@media` |
| 992px | section-header side spacing, footer-banner overlay alignment, hero video swap |
| 1200px | `h2` stops scaling, locks to 1.75rem |

## The container ladder — do not assume Bootstrap defaults

The site overrides Bootstrap's container at **custom breakpoints**, and the top step is
**1440px, not 1140px**. Measured out of `global.css`:

| Media | `.container` max-width | content width (−30px padding) |
|---|---|---|
| < 544px | none (100%) | viewport − 30 |
| ≥ 544px | 540px | 510 |
| ≥ 769px | 720px | 690 |
| ≥ 992px | 1140px | 1110 |
| ≥ 1200px | **1440px** | **1410** |

`padding-inline: 15px` at every step. Confirmed twice — by parsing the media queries and by
rendering the saved page at 16 widths straddling each edge.

**Every band is therefore a `full-width` section.** Using `page-width` would layer the theme's
own page margin (16px under 750px, 40px above) on top of the source's 15px gutter and double
it, and the theme's grid also caps the content at `viewport − 80px`, which cannot reach the
1440px the source wants at a 1440px viewport.

The ladder is carried as utility classes on the band's own wrapper:

```
mx-auto w-full px-[15px]
min-[544px]:max-w-[540px] min-[769px]:max-w-[720px]
min-[992px]:max-w-[1140px] min-[1200px]:max-w-[1440px]
```

The product carousel can't take a wrapper, so the same steps live in `src/tailwind.css`
scoped to `[data-template='page.ansi-photochromic']`. That file also stretches every band to
full width, because a `custom-liquid` block renders as a bare unclassed `<div>` and the
section sets `align-items: center`, which would otherwise shrink each band to its own text.

## Typography

`h2` resolves the same everywhere on the page:

```
font-family: "DINNextLTPro", sans-serif
font-weight: 600            (700 on the footer banner — .font-weight-bold)
line-height: 1.2
font-size:   calc(1.3rem + 0.6vw)   below 1200px
             1.75rem                at 1200px and up
```

Body copy: `1.125rem` in the intro, `16px` / `20px` in the content rows (see band 4).
Text colour `#1D2A2B` in bands 2; `#fff` on the footer banner.

## Band inventory

| # | Source component | Section | Blocks | Width |
|---|---|---|---|---|
| 1 | `experience-assets-banner` | `section` | `custom-liquid` | full |
| 2 | `experience-assets-sectionHeader` | `section` | `custom-liquid` | page (1140) |
| 3 | `experience-carousel-productCarousel` | `product-list` | `_product-card` + spy-* | page (1140) |
| 4 | `experience-assets-contentAsset` | `section` | `custom-liquid` | page (1140) |
| 5 | `experience-assets-banner` | `section` | `custom-liquid` | full |

No new sections or blocks were written — the whole page reuses what already ships in the theme.

### Band 1 — hero video

The hero is a **Vimeo video, not an image**, with a separate asset per breakpoint:

| Breakpoint | Vimeo ID | Native size | Ratio |
|---|---|---|---|
| desktop | `1077414998` | 1920 × 600 | `aspect-[1920/600]` |
| mobile | `1077418501` | 400 × 600 | `aspect-[400/600]` |

Sizes confirmed against Vimeo's oEmbed API; the desktop one also matches the source's own
`padding:31.25% 0 0 0` wrapper. Player flags mirror the source's `data-vimeo-*`:
`background=1&autoplay=1&loop=1&muted=1&playsinline=1` (`background=1` covers autoplay + loop
+ muted + no controls in one flag). Overlay is empty — no text over the video.

**Assumption to confirm:** the source swaps the two videos in JS and the logic is not in the
saved copy. The banner component's own classes are `lg`-based, so the swap is set at **992px**
(`max-[991px]:hidden` / `min-[992px]:hidden`). Verify against the live site at 768–991px.

### Band 2 — intro header

```
.section-header      text-align:center; margin-bottom:3rem
                     lg: margin-inline 3rem + padding-inline 3rem
h2.header            display:table; width:100%; margin:1em 0 .5em; colour #1D2A2B
p.subheader          font-size:1.125rem; colour #1D2A2B
```

`display:table` + `border-spacing:1rem 0` only matters with `.show-design-element` (the rule
that adds `::before`/`::after` divider lines). That class is absent here, so it renders as a
plain full-width centred heading.

Copy:
> **ANSI PHOTOCHROMIC COLLECTION**
> Our ANSI-certified, photochromic eyewear is built for the bold, meeting the ultimate ANSI
> Z87-2+ standards for impact protection and light-adaptive photochromic lenses that seamlessly
> adjust to changing light conditions.

### Band 3 — product carousel

Four products, **no heading above the carousel**: REBAR ANSI, REBAR SE ANSI, LOGAN, DIRK
(all showing 30% off on the source). Card blocks are copied verbatim from `page.watermen.json`
so the two pages stay identical: tech badge · gallery · quick view · new badge · colour count ·
swatches · title · price.

`collection` is left blank on purpose — assigned in the theme editor.

### Band 4 — tech content rows

Two rows, image and copy alternating. This band carries its own inline `<style>` in the source,
so the numbers are exact rather than inherited:

| | ≥768px | <768px |
|---|---|---|
| row | `display:flex`, `margin-bottom:20px` | `flex-direction:column`, `margin-bottom:0` |
| column | `width:50%` | `width:100%`, `padding:0 !important` |
| first col | `padding-right:10px` | — |
| last col | `padding-left:10px` | — |
| text panel | `#f5f5f5`, `height:100%`, vertically centred, `padding:20px` | `#f5f5f5`, `padding:30px` |
| paragraph | `20px` | `16px` |
| `h2` | `margin-bottom:1.5rem` (`mb-4`) | same |

**The image is first on mobile in both rows** — the source puts `mobile-order-1` on the image
column and `mobile-order-2` on the text column, so row 2 reverses below 768px. This is the
reason band 4 is a single `custom-liquid` rather than nested `group` blocks: a `group` stacks
in DOM order and gives no way to reorder its children per breakpoint.

Row 1 — image left / copy right: **HAPPY PHOTOCHROMIC**
Row 2 — copy left / image right: **ANSI Z87-2+ CERTIFICATION**

### Band 5 — shop safety banner

Full-bleed image with a linked overlay. Separate asset per breakpoint, swapped at 992px via
`<picture media="(min-width: 992px)">` so only one file downloads.

| Breakpoint | Asset | Size |
|---|---|---|
| ≥992px | `ansi-photochromic-footer-desktop.jpg` | 1920 × 440 |
| <992px | `ansi-photochromic-footer-mobile.jpg` | 800 × 640 |

Overlay alignment: desktop right + vertically centred, text-left; mobile centred + bottom,
text-center. `.hero-banner-overlay-inner` keeps `padding: 1rem 1rem 4rem 1rem` at **every**
width — the `align-items-center` override in `global.css` matches the bare class, but the
markup only carries `align-items-lg-center`, so it never applies.

Button — `.btn.btn-outline-secondary.btn-square.btn-lg` inside `.hero-banner`. Specificity
matters: `.hero-banner .btn` (0,2,0) beats `.btn-lg` (0,1,0), so the `btn-lg` size loses.

```
background:#fff · colour/border #1d2a2b · border-radius 0 (btn-square)
font-size .875rem · padding .5rem 2rem · text-transform uppercase · line-height 1.4
hover: background #1d2a2b, colour #fff
```

Link target on the source is `/us/sunglasses/safety-sunglasses/`. Left **blank** in the
template — set it in the theme editor to the real Shopify collection.

## Images

Staged and renamed in `reference/ANSI_Photochromic/upload/`, to be uploaded to Shopify Files
under exactly these names (the template resolves them with `| file_url`):

| File | Size | Notes |
|---|---|---|
| `ansi-photochromic-half-banner-1.gif` | 800 × 640 | animated, **2.5 MB** |
| `ansi-photochromic-half-banner-2.jpg` | 1000 × 800 | |
| `ansi-photochromic-footer-desktop.jpg` | 1920 × 440 | pulled from the SFCC CDN |
| `ansi-photochromic-footer-mobile.jpg` | 800 × 640 | pulled from the SFCC CDN |

The two footer banners are lazy-loaded on the source, so they were not in the saved `_files`
folder; the CDN serves them to direct requests even though it blocks page automation.

**Open performance item:** the 2.5 MB GIF is kept as-is for 1:1 parity (signed off). Converting
it to a looping muted MP4 would cut it roughly 10× with no visual change — worth doing at the
performance pass, not before sign-off.

## Verification

Measured against the saved source with a headless Chromium harness that renders the template's
markup inside the same DOM the `section` snippet emits (`scratchpad/build-harness.mjs` +
`compare.mjs`). 1134 computed-style comparisons across 18 elements at 1440 / 768 / 390.

**Result: 5 differences, both understood and intentional.**

| Difference | Why it stays |
|---|---|
| `row2.margin-bottom` 20px vs 0 | The source declares 20px on both rows, but the last one collapses out of `.content-tile`. In the theme the row sits in a flex container where it would not collapse, so the rebuild drops it on the last row only. Rendered band height matches exactly: **1132px at 1440, 1106px at 390**. |
| `.hero-banner-overlay` colour | An inherited orange on an element that paints no text — all copy lives in `-inner`, which matches `#fff` on both sides. |

Every box width matches to the pixel at all three breakpoints (`dw = 0` for both rows, both
columns, and both grey panels). Confirmed by screenshot that the mobile reorder puts the image
first in **both** rows, and that the footer banner is right-aligned/centred on desktop and
centred/bottom on mobile.

Text *widths* were deliberately excluded: the offline copy has no webfonts and falls back to
Arial, so only box geometry is trustworthy there.

### Not yet covered

- The product carousel (band 3) — needs real products and a live render.
- The hero video — Vimeo is blocked offline, so only the wrapper ratio is verified.
- A render of the actual Shopify page, which needs the images uploaded and the page created.
