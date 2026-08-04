# PLP product card — pixel-perfect against spyoptic.com (US)

Date: 2026-08-04

## Goal

Make the PLP product card match the live SPY card 1:1 at desktop 1440 / tablet 768 / mobile 390.

## Where the numbers come from

Three saved copies of live PLPs, each served locally and measured with its own `global.css`
(6875 rules) live, so every value below is a **computed style**, not a reading off a screenshot:

| Sample | Site | URL | Tiles | Grid class |
|---|---|---|---|---|
| `reference/PLP_sample/Men's Sunglasses _ The Best Men's Sunglasses.html` | **US** | `/us/mens-sunglasses/` | 24 | `desktop-4 mobile-1` |
| `reference/PLP_sample/Ski & Snowboard Goggle Sale…2.html` | **US** | `/us/sale/goggles/snow-goggles/` | 22 | `desktop-4 mobile-1` |
| `reference/PLP_sample/Men's Sunglasses … Spy Optic1.html` | Global (`AA`) | `/mens-sunglasses/` | 24 | `desktop-7 mobile-2` |
| `reference/ANSI_Photochromic/…html` | US | `/us/sunglasses/ansi-photochromic.html` | 4 (carousel) | — |

Raw measurement JSON is in the session scratchpad under `measurements/`. Font files are absent from
the saved copies, so **box geometry and computed type values are trustworthy; rendered text widths are not.**

### US vs Global — the target is US

CLAUDE.md names the US site as the source of truth, and both US samples agree with each other exactly.
The global (`AA`) site is a different card and is **out of scope**:

| | US | Global (`AA`) |
|---|---|---|
| Price | `$154` / `Starting from $170` + strikethrough | empty — the div holds a literal `&nbsp;` |
| Quick View | present | absent, 0 in the DOM |
| `.tile-body` slots | pdp-link · price · ratings · compare | pdp-link · price · compare |
| `.tile-body` height @1440 | 102.03 | 94.03 |
| Mobile columns | 1 | 2 |
| Ultrawide ceiling | 4 | 7 |

## Source constants

All values are computed; `rem`/`em` originals in brackets. Body line-height is `1.4`.

### Image
```
.image-wrapper   aspect-ratio 1/1 · padding 10% · align-items center · overflow hidden
                 min-height 160px [10rem]; 96px [6em] at ≤991.98px
                 filter none · background none   (both defaults overridden off)
.tile-image      width 100%   (height auto — source images are square)
```

### Stickers (tech / cert pictos)
```
.stickers        position absolute · right 5px [0.3125rem] · top 11.2px [0.7rem]
                 transform scale(0.7) ONLY at ≤543.98px
.sticker         width 40px [2.5rem]
.sticker + .sticker   margin-left 4px [0.25rem]
```
Seen in the wild: `pictohappyboost`, `ANSI_SVG_NEW_V4`, `spy-bonuslens-2`, `spy-deadbolt`.
The circular `.badges` set is present in the DOM but **empty on every tile** — unused.

### Quick View
```
.quickview   margin -43.2px [-2.7rem] 16px [mx-3] 8px [0.5rem]   → net −0.4px in flow
             padding 8px 12px · border 1px solid #F27E37 · background #fff · border-radius 0
             font 12px / 16.8px · weight 400 · letter-spacing normal · uppercase · centre
             z-index 1 · opacity 0 · transition opacity .2s
reveal       @media (min-width: 769px) { .product:hover .quickview { opacity: 1 } }
hover        .btn-outline-primary:hover → filled, color #fff
```
Whole-card hover, and **only from 769px up**.

### Label band
```
.color-swatches         position relative · display flex · width 100%
                        padding 8px 8px 0 [.5rem .5rem 0] · justify-content center
.tile-labels-container  min-height 48px [3rem] · flex column · gap 8px [.5rem]
                        width 100% · align-items center · justify-content END
.product-tile-label     border-radius 0 · border 1px solid · font-size 13px [.8125em]
                        font-weight 700 · padding 3.2px 12.8px 0 [.2rem .8rem 0]
                        line-height 17.6px [1.1rem] · uppercase · height 22.78
.swatches-label         flex 0 0 auto · display flex · font-size 14.4px [.9rem]
                        color #6c757d [--custom-color-gray-600] · line-height 20.16 · height 20.16
```
Badge colour arrives as a **per-label inline style** (`color:#f57d31;border-color:#f57d31`), not a token.
Labels are arbitrary CMS copy: `New`, `On Sale 30% Off`, `$200+ Value, Now Only $70`. They never wrap.

`justify-content: end` on a `min-height: 48px` box is what keeps the band bottom-aligned, so:

| | Content | Band height | `.color-swatches` |
|---|---|---|---|
| Badged | 22.78 + 8 + 20.16 = 50.94 | 50.94 (overflows the 48 min) | **58.94** |
| Unbadged | 20.16 | 48 (min wins, label at the bottom) | **56** |

The 2.94px difference is **real source behaviour** — badged cards sit ~3px lower. Do not "fix" it.

### Label slot has two modes
- **Colour name** (`Creamsicle`) when the tile is one colourway — the sale PLP
- **`N colors available`** when the tile stands for a model — the men's sunglasses PLP

Same class, same band, same hover swap.

### Swatch row
```
.swatches            position absolute · top 8px · display flex · gap 8px [.5rem]
                     opacity 0 · transition opacity .3s
.swatches a/span.cbo padding 0 · margin 0 · background #fff · border none
                     display flex · align-items center · 48×48
img.swatch-circle    max-width / max-height 48px [3rem] · background-color #f8f8f8
.view-pdp-link svg   width 32px [2rem] · height 10px
reveal               .image-container:hover .swatches        { opacity: 1 }
                     .image-container:hover .tile-labels-container { opacity: 0 }
```
- **max 4 thumbs**; the arrow renders **only when colourways > 4**
  (BOWERY / 4 colours → 4 thumbs, no arrow, row 216 = 4·48 + 3·8;
  OVERHAUL XL / 5 → 4 thumbs + arrow, row 256 = 4·48 + 32 + 4·8;
  COOPER / 2 → 2 thumbs, row 104)
- thumbs 3 and 4 carry `d-none d-md-block` → **only 2 thumbs below 769px** (row 144)
- a single-colourway tile still fades badge + colour name out and one lone thumb in
- the reveal is scoped to `.image-container` (image + band), **not** the whole card, so hovering
  the title or price leaves the band at rest

### Text band
```
.tile-body        padding 10px 8px 24px [.625em .5rem 1.5em] · flex column
                  align-items center · justify-content space-between
.tile-body > div  margin-bottom 8px [.5rem]
.pdp-link         line-height 1.2 · display flex · justify-content center · width 100% · mb 8
.pdp-link .link   color #1D2A2B · font-weight 900 · font-size 19.2px [1.2rem]
                  white-space nowrap · overflow hidden · text-overflow ellipsis
.price            color #565656 · font-weight 600 · font-size 15px · margin-bottom 0
.price .sales     font-weight 700 · text-align center
.price .strike-through   color #ababab · line-through · margin-right 4px [.25rem]
                         weight 600 alone, 700 inside a .range ancestor
.price .percentage       display none on the card (styled but suppressed)
.price .price-range-separator, .price-range-high   display none
```

Children, in order — the last two are **empty slots that still contribute their 8px**:

| Child | Height | `margin-bottom` |
|---|---|---|
| `.pdp-link` | 23.03 | 8 |
| `.price` | 21 | 0 |
| `.ratings` | 0 | 8 |
| `.compare d-none d-md-block` | 0 | 8 — **display:none below 769px** |

### Price forms
- `price_min == price_max` → `$200`
- otherwise → `Starting from $170` (via `.price-range-label` inside `.sales`)
- on sale → `$154` + `$220` strikethrough; no percentage chip

### Grid
```
.product-grid   display grid · gap 2.2rem 1rem  → row 35.2px / column 16px
@≤768.98        mobile-1 → grid-template-columns 100%
@≥769           mobile-1 → repeat(2, 1fr)
@≥992           desktop-3..7 → repeat(3, 1fr)
@≥1459.2 [91.2rem]  desktop-4..7 → repeat(4, 1fr)
@≤991.98        .product-grid .product { width auto; margin-inline inherit }
```
`desktop-N` is a **ceiling**, not a column count. At 1440 the US PLP is **3-up with 425.83px cards.**

## Target: one card spec

Card width `W`; everything else derives from it.

```
image           W × W · padding 10% · align-items center · overflow hidden
quickview       margin -43.2px 16px 8px · h 34.8      → net −0.4 in flow · ≥769px only
label band      padding 8px 8px 0 · position relative · justify-content center
  labels        min-height 48px · column · gap 8px · align-items center · justify-content END
    badge       13/17.6 · w700 · padding 3.2px 12.8px 0 · radius 0 · 1px solid orange · uppercase
    label       14.4/20.16 · w400 · #6c757d           ← count, or colour name
  swatches      absolute · top 8px · gap 8px · opacity 0 → 1 on band hover
    thumb       48×48 · background #f8f8f8            ← max 4; 2 below 769px
    arrow       svg 32×10                             ← only when colourways > 4
text band       padding 10px 8px 24px · column · align-items center
  title         mb 8 · 19.2/23.04 · w900 · #1d2a2b · uppercase · nowrap ellipsis
  price         mb 0 · 15/21 · w600 · #565656
                sale span w700 · compare-at #ababab w600 mr 4px · % chip hidden
  reserved      16px — the source's empty ratings (8) + compare (8) slots
```

```
H = W − 0.4 + [ 8 + max(48, badged ? 50.94 : 20.16) ] + textBand
```

### Per breakpoint

| | ≥992 | 769–991 | ≤768 |
|---|---|---|---|
| Title | 19.2 / 23.04 | 19.2 / 23.04 | **16 / 19.2** |
| Price | 15 / 21 | **17 / 23.8** | **16 / 22.4** |
| Image min-height | 160 | 96 | 96 |
| Stickers | 40 | 40 | 40; ×0.7 ≤543.98 |
| Thumbs | 4 | 4 | **2** |
| Quick View | yes | yes | **no** |
| Reserved | 16 | 16 | **8** (compare hidden) |
| Text band | **102.03** | 104.84 | **91.58** |
| Columns | 3 · 4 @≥1459.2 | 2 | 1 |

### Verification targets

| Viewport | `W` | Card height |
|---|---|---|
| 1440 | 425.83 | **586.42** badged / **583.48** plain |
| 768 | 723 | **873.13** |
| 390 | 345 | **495.13** |

## Decisions taken

1. **Target market: US.** Global is a different card; out of scope.
2. **Label: count on the grouped card**, since it does stand for a model. The existing
   `spy-variant-name` block covers the colour-name mode on the non-grouped path.
3. **Adopt the source column ladder**, including `row-gap: 35.2px`. This widens cards at 1440
   from 292.5 to 425.83 and is what makes the height numbers land.
4. **Scope: grouped PLP markup + shared `.product-card` CSS**, so search, homepage carousels and
   PDP recommendations inherit the same look.
5. **One orange.** `--color-spy-orange #f57f29` stays the single brand token per CLAUDE.md 3b.
   The source's `#F27E37` (primary) and `#f57d31` (badge, inline per label) differ by at most
   14/255 on one channel — not perceptible, and three oranges would violate the token rule.
6. **The two empty slots become 16px of reserved padding**, not dead `<div>`s. A reviews app and
   Compare are both still open decisions; when either lands it replaces the padding and the
   geometry holds.

## Change list

### Shared CSS — `src/tailwind.css`, the `.product-card` block

1. `--product-card-gap` → 0. The source spaces with margins; the stray 4px currently distorts the
   Quick View pull and every slot beneath it.
2. Title line-height 26.88 → 23.04; add the `≤768.98px → 16/19.2` step; drop `pt-1`.
3. Label band → one 48px `justify-content: end` box.
4. Badge pill → 13/17.6, `padding: 3.2px 12.8px 0`, radius 0, no tracking (was 10px + `tracking-widest` + `py-1`).
5. Swatch row → `gap: 8px` (was 3), thumbs 48×48 on `#f8f8f8`, arrow 32×10 (was 20×7),
   thumbs 3–4 hidden `≤768.98px`.
6. Quick View → weight 400, no tracking; reveal wrapped in `@media (min-width: 769px)`, hidden below.
7. Text band → `10px 8px 24px`, title `mb 8`, price `mb 0`, +16px reserved.
8. Price → `15/21 w600 #565656`, sale span 700, compare-at `#ababab` `mr 4px`, % chip suppressed,
   per-breakpoint sizes.
9. Stickers → `right 5px · top 11.2px · 40×40 · gap 4px`, `scale(.7)` only `≤543.98px`
   (was `right 10 · top 10 · gap 6`).
10. Drop the `:has(.text-block:hover)` opt-out hack — scoping the swatch reveal to the image + band
    the way the source does removes the need for it.
11. Kill the `-8px` mobile gallery bleed.
12. Grid → source ladder with `row-gap: 35.2px`, replacing the pinned 4-up. The
    `data-trim-partial-row` rule assumes 4 columns and needs to follow the ladder.

### Grouped card — `snippets/spy-grouped-product-card.liquid`, `templates/collection.grouped-plp.json`

13. `show_price: true`, rendering the two source forms plus the compare-at strikethrough.
14. Wrap badge + label + swatches in a `.color-swatches` / `.tile-labels-container` pair, so the band
    is genuinely one box and the swatch row can be truly `absolute` rather than pulled up by a
    magic negative margin.
15. Wrap title + price so the `10/8/24` padding lands on the pair.

## Definition of done

- `npm run build:css` run
- Card height within 1px of the table above at 1440 / 768 / 390
- Hover matches `measurements/src-us-tile-hover-1440.png`: orange-outline Quick View, 4 thumbs +
  arrow, badge and label both faded out
- Badged and unbadged cards differ by 2.94px, as the source does
- No console errors
- Accessible: the reveal-on-hover controls stay keyboard reachable

## Known consequence

Item 12 visibly reshapes every PLP at 1440 — cards go from 292.5 to 425.83 wide and rows get
taller. Pages already signed off will look different. This is intended: it is what the source does.
