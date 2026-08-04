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

| # | Source component | Section | Blocks | Editable in theme editor |
|---|---|---|---|---|
| 1 | `experience-assets-banner` | `section` | `video` | yes |
| 2 | `experience-assets-sectionHeader` | `section` | `spy-heading` + `spy-body-text` | yes |
| 3 | `experience-carousel-productCarousel` | `product-list` | `_product-card` + spy-* | yes (collection) |
| 4 | `experience-assets-contentAsset` | `section` | `group` × 2 → `image` + `group` → `spy-heading` + `spy-body-text` | yes |
| 5 | `experience-assets-banner` | `spy-feature-link-banner` | — (section settings) | yes |

No new sections or blocks were written. Every band is a real block, so all copy, art and
video are editable with no code edit.

Band 1 was `custom-liquid` at first, because the stock `video` block could not render it: its
aspect-ratio setting offers only auto / 9:16 / 1:1 / 16:9 (the source needs **1920/600** and
**400/600**), it has one media slot rather than one per breakpoint, and `snippets/video.liquid`
never passed `disable_controls` and had no `background=1`, so Vimeo chrome would appear.

That block was **extended** rather than replaced, so the page keeps the same block vocabulary as
happy-lens / happy-boost. The additions are all opt-in and default to the previous output:

| Setting | Purpose |
|---|---|
| `ratio_w` / `ratio_h` | Exact ratio the select cannot express. Empty → old behaviour. |
| `mobile_enabled` + `source_mobile` / `video_mobile` / `video_url_mobile` | Second asset for narrow screens. |
| `ratio_w_mobile` / `ratio_h_mobile` | Phone ratio; falls back to the desktop one. |
| `swap_at` | 768 / 992 / 1200. Emitted as fixed Tailwind class pairs so the scanner sees them. |
| `background` | Vimeo `background=1` / the YouTube equivalent. Forces autoplay + loop + mute. |

With two slots the block renders two `deferred-media` wrappers, each carrying its own inline
`--size-style-aspect-ratio`. `deferred-media iframe` already reads that variable
(`assets/base.css:1730`), so **no new CSS** was needed for the ratio or the swap.

`snippets/video-slot.liquid` was added as the block's own helper — it picks the uploaded or the
URL path so the block does not repeat that branch per slot.

**Fixed along the way:** `blocks/video.liquid` never passed `video_autoplay` to the snippet, and
`block` is not in scope inside a `{% render %}`, so the snippet's `block_settings.video_autoplay`
fallback always resolved to nil — that setting had been dead. It is now passed explicitly. Both
existing users have it `false`, so their output is unchanged.

### How each band gets the container ladder

The ladder is opt-in by **class**, typed into the section's new "CSS class" setting
(`custom_class`, added to `sections/section.liquid` and applied in `snippets/section.liquid`):

| Band | Class |
|---|---|
| 1 hero | `ansi-band ansi-band--bleed` |
| 2 intro | `ansi-band ansi-band--intro` |
| 4 rows | `ansi-band ansi-band--rows` |

It used to key off section IDs (`[id$='__intro']`). That breaks the moment an editor duplicates
or re-adds a band, because the key changes and the styling silently disappears. A class travels
with the band instead.

Band 3 is the exception — `product-list` has no class setting, so it stays template-scoped.

### Cost of making it editable

`spy-heading` and `spy-body-text` express type as fixed px per breakpoint, switching at 769px.
The source scales its `h2` fluidly with `calc(1.3rem + 0.6vw)` below 1200px. The rebuild is
exact at ≥1200 (28px) and within 0.1px at 390 (23 vs 23.1), but runs up to ~2.6px large between
769 and 1199. The content-row paragraph switches at 769 rather than the source's 768 — a
one-pixel-wide window at exactly 768.

`spy-feature-link-banner` switches placement at 768px where the source switches at 992px, sets
its heading `font-bold` (700) where the source computes 600, and uses its own overlay padding
rather than the source's `1rem 1rem 4rem 1rem`. Its `solid` CTA, however, already computes to
the source button exactly.

These were accepted deliberately in exchange for editor-editable copy, under the constraint of
using only blocks and sections that already exist.

The hero no longer costs anything: with `ratio_w`/`ratio_h` and `swap_at` it hits 1920/600 and
400/600 exactly, and swaps at the source's 992px.

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

Staged in `reference/ANSI_Photochromic/upload/` and now **uploaded to Shopify Files** under
exactly these names, all `READY` and confirmed resolving in the render:

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

Every box width matched to the pixel at all three breakpoints (`dw = 0` for both rows, both
columns, and both grey panels). Confirmed by screenshot that the mobile reorder puts the image
first in **both** rows, and that the footer banner is right-aligned/centred on desktop and
centred/bottom on mobile.

Text *widths* were deliberately excluded: the offline copy has no webfonts and falls back to
Arial, so only box geometry is trustworthy there.

> **Scope of that result.** Those measurements were taken against the earlier all-`custom-liquid`
> build, which rendered as static HTML. The block-based build has since been re-measured live —
> see below.

## Live verification of the block build

Measured against `shopify theme dev` at 1440 / 768 / 390, reading computed geometry out of the
real DOM rather than the offline harness.

| Check | 1440 | 768 | 390 |
|---|---|---|---|
| Hero desktop slot | 1430 × 447, ratio **3.200** = 1920/600 | hidden | hidden |
| Hero mobile slot | hidden | visible, ratio **0.667** = 400/600 | visible, ratio **0.667** |
| Container max-width | 1440 | 540 (clientWidth 758 < 769) | none (< 544) |
| Band inline padding | 15px | 15px | 15px |
| Intro extra padding ≥992 | 111px = 15 + 48 + 48 | n/a | n/a |
| Carousel content width | 1400, first card at left 15 | — | — |
| Row halves | **690 / 690**, 20px gap | stacked | stacked |
| Row order | 1 = IMAGE·COPY, 2 = COPY·IMAGE | image first, both rows | image first, both rows |
| Copy panel | 20px pad, `#f5f5f5` | 30px pad | 30px pad |

Two defects were found and fixed during this pass:

1. **The carousel was never being capped.** In carousel layout `product-list` hides
   `.section-resource-list__content` (`display:none`) and renders through
   `.resource-list.force-full-width.resource-list__carousel`, which the ladder did not target —
   so the cards sat at left 0 and ran 1430 wide instead of 1400 inset by 15px. The carousel track
   is now in all five ladder steps. (`force-full-width` is only `grid-column: 1 / -1`, so capping
   it is safe.)
2. **The row halves were 670 / 710, not equal.** Both images are 1.25 ratio, and `aspect-ratio`
   resolves their width from the row height, which beats `flex-basis: 0`. The columns are now
   pinned to `flex: 0 0 calc(50% - 10px)` with a matching `max-width` — the source's `width: 50%`
   plus its 10px per-column padding. Row height follows at 552 = 690 / 1.25.

### Regression check on the shared block

| Page | Before → after |
|---|---|
| happy-lens | One slot, 16/9, `youtube.com/embed/u4raGVJikx0?` with no extra params, no swap wrappers — unchanged |
| happy-boost | Renders `.video-placeholder-wrapper` because its `video` setting was never populated — pre-existing, unchanged |

### Console

Clean of anything caused by this page. What remains is environmental or pre-existing:
`arclight.vimeo.com` analytics beacons (530) and `player.css` connection-closed in the sandbox,
`shop.app` CSP/403 for Shop Pay on localhost, a `customer-account-main-menu` Storefront lookup,
and an `overflow-list.css` preload warning. The Vimeo **video itself does play** — the 530s are
only its stats endpoint.

### Not yet covered

- **The 992px hero swap between 768 and 991px is still an assumption.** The source's own swap
  logic is in JS that is not in the saved copy, and the live site blocks automation. At 768 the
  rebuild shows the 400×600 portrait clip full-bleed, which is 1137px tall — if the live site
  actually swaps at 768 rather than 992, `swap_at` needs changing to `768`. One setting, no code.
- The carousel shows one product per **colourway**, not one per model as the live page does.
  Staging has no combined listings yet, so this waits on the migration.
- No ANSI Dirk exists in staging; `Dirk Matte Black` stands in for the live DIRK tile.

### Pre-existing defect found, not fixed here

Between roughly 758 and 991px the **header** overflows: `.spy-utility-nav` / `header-actions`
extend to x=1172 against a 758px viewport, giving the document a 419px horizontal scroll. This is
not specific to this page — `/pages/watermen` shows the identical 419px overflow from the same
element. It belongs to the header workstream.

## Theme state

Pushed to **Staging v2** (`165560156400`) and confirmed by pulling back: the template, plus
`blocks/spy-heading.liquid`, `blocks/spy-body-text.liquid`, `blocks/spy-bullet-list.liquid`
and `sections/spy-feature-link-banner.liquid`, which were in the repo but had never been pushed
to that theme.

Both previously-blank settings are now filled, and the store data behind them exists:

| Setting | Value | Backing data |
|---|---|---|
| `frames.collection` | `ansi-photochromic` | **Manual** collection, sort order MANUAL, 4 products in the live page's order: Rebar ANSI Matte Black · Rebar SE ANSI Matte Black · Logan Matte Black ANSI RX · Dirk Matte Black |
| `footer_banner.link` | `shopify://collections/safety-sunglasses` | **Smart** collection, rule `TITLE CONTAINS "ANSI"`, 25 products |

Manual — not a smart tag rule — because the source carousel is a hand-picked list of four model
tiles; a disjunctive tag rule pulls all 18 colourways and `max_products: 4` would then show four
arbitrary best-sellers instead of one tile per model. Both collections are published to Online
Store and Shop.

The page itself now exists: **ANSI Photochromic**, handle `ansi-photochromic`, template suffix
`ansi-photochromic`, published — matching how watermen / happy-lens / happy-boost are set up. The
template could not be opened in the theme editor before this.
