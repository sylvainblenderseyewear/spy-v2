# PLP product card — exhaustive property & state spec (spyoptic.com US)

Date: 2026-08-04. Supersedes the delta table in `product-card-source-css.md`.

Source: `reference/PLP_sample/Men's Sunglasses _ The Best Men's Sunglasses.html`
(`Sites-SPYOptic_US-Site`, `/us/mens-sunglasses/`, 24 tiles), served locally with its own
`global.css` (6875 rules) + `search.css` live. Tile sampled: index 5, **OVERHAUL XL** —
badged (`New`), 5 colourways, 2 stickers, range price.

Every value below is a **computed style** or a **matched CSS rule**, not a screenshot reading.
Cross-checked against the sale PLP (`/us/sale/goggles/snow-goggles/`) and the global `AA` PLP.

> **Font caveat.** The saved copies never load DINNextLTPro — the title measures 152.13px,
> exactly Arial's width (DIN would be 142.42). Box geometry and computed type values are
> trustworthy; **rendered text widths and letterforms are not.**

## Element tree — 49 nodes

```
.product                                    flex, bg #fff, position relative
└ .product-tile
  ├ .image-container                         flex column, position relative
  │ ├ a.image-wrapper                        the image link
  │ │ └ img.tile-image
  │ ├ .badges.d-flex                         absolute, EMPTY on every tile (unused)
  │ ├ a[data-hide-on-worn-image]             wraps the stickers
  │ │ └ .stickers.d-flex                     absolute top-right
  │ │   ├ .sticker.product-sticker1 > img.sticker-image
  │ │   ├ .sticker.product-sticker2 > img.sticker-image
  │ │   └ .sticker.product-sticker3.d-none   third slot, hidden
  │ ├ a.quickview.btn.btn-outline-primary.mx-3
  │ └ .color-swatches
  │   ├ .tile-labels-container
  │   │ ├ .product-tile-label-container > .product-tile-label     the badge pill
  │   │ └ .swatches-label                    colour NAME or "N colors available"
  │   └ .swatches                            absolute, over the labels
  │     ├ span.cbo.btn-swatch × 2            > span > img.swatch.swatch-circle
  │     ├ span.cbo.btn-swatch.d-none.d-md-block × 2    thumbs 3–4, desktop only
  │     └ span.cbo.view-pdp-link > svg       the arrow, only when colourways > 4
  └ .tile-body.d-flex.flex-column.justify-content-between
    ├ .pdp-link > a.link                     title
    ├ .price > .range > span > .sales > [.price-range-label, .value, .formatted-price]
    ├ .ratings                               EMPTY, 0 tall, still contributes 8px
    └ .compare.d-none.d-md-block.p-0         EMPTY, 0 tall, 8px only ≥769px
```

## Resting properties — desktop (1440, card W = 425.84)

Only non-default values. `—` = property not set / browser default.

| Element | Box | Layout | Spacing | Type | Colour | Other |
|---|---|---|---|---|---|---|
| `.product` | 425.84 × 586.42 | `flex`, `position: relative` | — | 16 / 22.4 / 400 | `#1d2a2b` on `#fff` | `transition: box-shadow .2s`, `box-shadow: none` |
| `.product-tile` | 425.84 × 586.42 | `block` | — | inherit | inherit | `width: 100%` |
| `.image-container` | 425.84 × 484.39 | `flex column`, `position: relative` | — | — | — | — |
| `a.image-wrapper` | 425.84 × 425.84 | `flex`, `align-items: center`, `aspect-ratio: 1/1` | `padding: 42.58` (=10%) | — | `color: #F27E37` | `min-height: 160px`, `overflow: hidden`, `transition: opacity .2s ease-out`, `cursor: pointer` |
| `img.tile-image` | 340.69 × 340.69 | — | — | — | — | `width: 100%`, `max-width: 100%`, `overflow: clip` |
| `.badges` | 0 × 0 | `flex`, `absolute` | `top: 5px; left: 5px` | — | — | **empty on every tile** |
| `.stickers` | 84 × *intrinsic* | `flex`, `absolute` | `top: 11.2px; right: 5px` | — | — | height follows the art |
| `.sticker` | 40 × **auto** | `block` | `+ .sticker { margin-left: 4px }` | — | — | **width only — height is intrinsic** |
| `a.quickview` | 393.84 × 34.8 | `block`, `z-index: 1` | `margin: -43.2 16 8`, `padding: 8 12` | 12 / 16.8 / **400**, uppercase, centre | `#F27E37` on `#fff` | `border: 1px solid #F27E37`, `radius: 0`, `opacity: 0`, `transition: opacity .2s`, `cursor: pointer` |
| `.color-swatches` | 425.84 × 58.94 | `flex`, `justify-content: center`, `position: relative` | `padding: 8 8 0` | — | — | `width: 100%` |
| `.tile-labels-container` | 409.84 × 50.94 | `flex column`, `justify-content: end`, `align-items: center`, `gap: 8` | — | — | — | **`min-height: 48px`**, `transition-duration: 0s` |
| `.product-tile-label-container` | 57.94 × 22.78 | `flex column`, `align-items: flex-start` | `padding: 0` | — | — | shrinks to the pill |
| `.product-tile-label` | 57.94 × 22.78 | `block` | `padding: 3.2 12.8 0` | 13 / **17.6** / **700**, uppercase, **left** | `#f57d31` | `border: 1px solid #f57d31`, `radius: 0`, no wrap |
| `.swatches-label` | 111.27 × 20.16 | `flex`, `flex-shrink: 0` | — | **14.4 / 20.16 / 400** | **`#6c757d`** | — |
| `.swatches` | 256 × 48 | `flex`, `absolute`, `gap: 8` | `top: 8px`, `left/right: 84.92` | — | — | `opacity: 0`, `transition: opacity .3s` |
| `span.cbo.btn-swatch` | 48 × 48 | `flex`, `align-items: center` | `padding: 0; margin: 0` | — | on `#fff` | `border: none`, `cursor: pointer` |
| `img.swatch-circle` | 48 × 48 | `inline` | — | — | on **`#f8f8f8`** | `max-width/height: 48px`, `text-indent: 100%`, `white-space: nowrap`, `overflow: hidden`, `object-fit: fill` |
| `span.cbo.view-pdp-link` | 32 × 48 | `flex`, `align-items: center` | — | — | on `#fff` | — |
| `.view-pdp-link svg` | **32 × 10** | — | — | — | `currentColor` | `overflow: hidden` |
| `.tile-body` | 425.84 × 102.03 | `flex column`, `justify-content: space-between`, `align-items: center` | **`padding: 10 8 24`** | — | — | `> div { margin-bottom: 8 }` |
| `.pdp-link` | 409.84 × 23.03 | `flex`, `justify-content: center` | `margin-bottom: 8` | lh **19.2** (1.2 × 16) | — | `width: 100%` |
| `a.link` (title) | 152.13 × 23.03 | `block` | — | **19.2 / 23.04 / 900** | **`#1d2a2b`** | `nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, `text-decoration: none`, `transition: opacity .2s ease-out` |
| `.price` | 131.72 × 21 | `block` | **`margin-bottom: 0`** | **15 / 21 / 600** | **`#565656`** | — |
| `.range` / inner `span` | 131.72 × 21 | `flex` / `block` | — | 15 / 21 / **700** | `#565656` | bold comes from `.range` |
| `.sales` | — | `inline` | — | 15 / 21 / 700, **centre** | `#565656` | — |
| `.price-range-label` | 94.17 × 17 | `inline` | — | 15 / 21 / 700 | `#565656` | the words "Starting from" |
| `.formatted-price` | 33.38 × 17 | `inline` | — | 15 / 21 / 700 | `#565656` | the amount |
| `.strike-through` (sale tiles) | — | `inline` | `margin-right: 4` | 15 / 21 / 600¹ | **`#ababab`** | `line-through` |
| `.percentage` | 0 | **`display: none`** | `padding: 0 10` | — | `#fff` on `#F27E37` | styled but **never shown on the card** |
| `.ratings` | 0 × 0 | `block` | `margin-bottom: 8` | **11 / 15.4** | **`#F27E37`** | empty; reserves 8px |
| `.compare` | 0 × 0 | `block` (`none` ≤768) | `margin-bottom: 8`, `padding: 0` | — | — | empty; reserves 8px ≥769 only |

¹ `600` inside a plain `.price`; `700` when nested in `.range` (inherited bold).

## Per-breakpoint deltas

Everything not listed is breakpoint-invariant.

| Element / property | ≥992 | 769–991 | ≤768 | ≤543 |
|---|---|---|---|---|
| `a.link` font-size / line-height | **19.2 / 23.04** | 19.2 / 23.04 | **16 / 19.2** | 16 / 19.2 |
| `.price` font-size / line-height | **15 / 21** | **17 / 23.8** | **16 / 22.4** | 16 / 22.4 |
| `.image-wrapper` min-height | **160** | 96 | 96 | 96 |
| `.stickers` transform | `none` | `none` | `none` | **`scale(0.7)`** |
| `.badges` flex-direction / transform | `row` | `row` | `row` | `column` + `scale(0.7)` |
| Thumbs 3–4 (`d-md-block`) | shown | shown | **`display: none`** | none |
| `.compare` | `block` (8px) | `block` (8px) | **`display: none`** (0px) | none |
| `.tile-body` height | **102.03** | 104.84 | **91.58** | 91.58 |
| `.product` min-height | `auto` | 375² | **315** | **215** |
| `.price .sales` text-align | centre | centre | centre | **left** |
| Grid columns | 3 (**4** ≥1459.2) | 2 | 1 | 1 |
| Grid gap | `35.2 / 16` | same | same | same |

² `23.4375em` at ≤991.98. All `min-height` values sit below the natural card height, so
none of them ever bind — recorded for completeness.

Measured card heights: **586.42** @1440 (W 425.84) · **873.13** @768 (W 723) · **495.13** @390 (W 345).

## States — every rule that matches the tile

Extracted by stripping pseudo-classes from every selector in every stylesheet and testing
`element.matches()` against all 49 nodes. **13 rules total.**

### `.product` — card hover
```css
@media (min-width: 769px) { .product:hover { z-index: 2 } }
```
That is the whole effect. Two traps:
- `.product { transition: box-shadow .2s }` exists but **no rule ever sets a hover shadow** —
  only `.slick-slider .product:hover { box-shadow: none }`. The transition is vestigial.
- `.product:hover .image-container::before { opacity: .3 }` exists, but `::before` has
  **no `content`**, so nothing renders. There is no dim overlay.

### `a.quickview` — the only element with real states
```css
@media (min-width: 769px) { .product:hover .quickview { opacity: 1 } }   /* whole-card hover */
.btn:hover                                  { color: #1d2a2b; text-decoration: none }
.btn-outline-primary:hover                  { color: #1d2a2b; background: #F27E37; border-color: #F27E37 }
.btn-outline-primary:hover:not(:disabled),
.btn-outline-primary:active:not(:disabled)  { color: #fff !important }   /* wins */
.btn:focus                                  { outline: 0; box-shadow: 0 0 0 .2rem rgba(242,126,55,.25) }
.btn-outline-primary:focus                  { box-shadow: 0 0 0 .2rem rgba(242,126,55,.5) }   /* wins */
.btn-outline-primary:disabled               { color: #F27E37; background: transparent }
.btn:disabled                               { opacity: .65 }
```
Verified live:

| State | color | background | border | box-shadow | transform |
|---|---|---|---|---|---|
| rest | `#F27E37` | `#fff` | `#F27E37` | none | none |
| **hover** | **`#fff`** | **`#F27E37`** | `#F27E37` | none | none |
| **focus** | `#F27E37` | `#fff` | `#F27E37` | **`0 0 0 3.2px rgba(242,126,55,.5)`** | none |
| **active** | `#fff` | `#F27E37` | `#F27E37` | `0 0 0 3.2px rgba(242,126,55,.5)` | **none** |
| disabled | `#F27E37` | transparent | `#F27E37` | none | `opacity: .65` |

`:active` is `:hover` plus the focus ring. **No press displacement.**

### `.image-container` — the swatch swap
```css
.product .image-container:hover .color-swatches .swatches            { opacity: 1 }
.product .image-container:hover .color-swatches .tile-labels-container { opacity: 0 }
```
Scoped to `.image-container`, which holds the image, stickers, Quick View and the label band —
**not** `.tile-body`. Confirmed live: hovering the title reveals Quick View but leaves the
labels alone. Timing is asymmetric: `.swatches` fades over **0.3s**; `.tile-labels-container`
has `transition-duration: 0s` and **snaps off instantly**.

### `a.image-wrapper` — the worn-image swap (not exercised on this tile)
```css
.product .image-container .image-wrapper:hover .worn-image                       { opacity: 1 }
.product .image-container .image-wrapper:hover ~ [data-hide-on-worn-image=true]  { opacity: 0 }
.product .image-container .worn-image { width: 100%; position: absolute; z-index: 1;
                                        opacity: 0; transition: opacity .3s ease; left: 0 }
```
No `.worn-image` exists on these tiles and the sticker link carries
`data-hide-on-worn-image="false"`, so neither fires. Needs a lifestyle asset per colourway.

### Global `a:hover` — a near no-op
```css
a:hover { color: #cf570d; text-decoration: underline }
```
Matches `a.image-wrapper` (colour shifts `#F27E37 → #cf570d`, invisible — the link holds only
an image) but **loses to `.product .tile-body .pdp-link .link`** on both colour and
text-decoration. Verified live: **hovering the title changes nothing about the title.**

### Swatch thumbs — no CSS state at all
`.cbo { cursor: pointer }` is the only rule. Hover behaviour is **pure JS**: it rewrites
`.tile-image[src]` and swaps the sticker set from the thumb's `data-sticker1/2/3`
attributes. Confirmed live — hovering thumb 2 changed the main image to
`Overhaul XL_Matte Gray-Happy Boost Polar Ice Blue Mirror-01.jpg` and the stickers to
`pictohappyboost.png` + `ANSI_SVG_Z87_V1.svg`. No border, ring or scale on the thumb.

### Nothing else has a state
No hover/focus/active on the badge pill, the labels, the price, the title, the arrow, or the
card body. There are **no `:visited` rules** and no `prefers-reduced-motion` handling.

## Reconciliation with our build

| # | Property | Source | Ours (before this pass) | Action |
|---|---|---|---|---|
| 1 | `.sticker` height | **intrinsic** (`width: 2.5rem` only) | forced `40px` | **fix — squashes tall badge art** |
| 2 | `.tile-labels-container` transition | **`0s`** (snaps off) | `opacity .2s` | **fix** |
| 3 | Quick View `:focus` | `box-shadow: 0 0 0 3.2px rgba(…,.5)`, `outline: 0` | Tailwind default | **fix** |
| 4 | `.product` background | `#fff` | transparent | **fix** |
| 5 | `.ratings` slot type | `11 / 15.4`, `#F27E37`, `mb 8` | reserved as padding | note for the reviews app |
| 6 | Everything else in the tables above | — | matches | none |

### Deliberate deviations

- **Quick View is revealed on `:focus-visible`.** The source reveals only on hover, so a
  keyboard user focuses an `opacity: 0` button. CLAUDE.md requires WCAG 2.1 AA, so we reveal it.
- **One orange.** `#f57f29` stands in for the source's `#F27E37` (primary) and `#f57d31`
  (badge, inline per label) — ≤14/255 on one channel, per CLAUDE.md rule 3b.
- **The two empty slots are 16px of reserved padding**, not empty `<div>`s.
- **`.tile-image` uses `object-fit: contain`** where the source relies on square source art
  and `width: 100%`; identical for square images, safer for non-square.
- **Stock-card path**: hovering the title also reveals the thumbs, because Horizon's
  full-card `.product-card__link` overlay makes a region test impossible there. The grouped
  path scopes it correctly.

## Not reproducible from data we hold

- **Worn/lifestyle hover image** — needs a per-colourway asset.
- **`.badges` circular set** — empty on every sampled tile; no reference for its populated look.
- **Third sticker slot** — `product-sticker3` is `d-none` everywhere sampled.
