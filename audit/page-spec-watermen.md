# Page spec — Watermen collection (`page.watermen`)

Source: `https://www.spyoptic.com/us/sunglasses/watermen-collection.html`
Offline capture: `reference/waterman/` (HTML + `Watermen Collection_files/` + full-page PNG)

Built as a **page** template, not a collection template, matching the `page.happy-boost` /
`page.happy-lens` precedent: the content is editorial and the four product rails each point at
their own collection rather than the page's own.

## Source construction

SFCC Page Designer. Every module is an `experience-assets-html` / `contentAsset` block with
**inline `<style>`**, so all measurements below are read straight off the source CSS — not
inferred from screenshots. Shared chrome comes from `global.css`.

Container model: content assets are full-bleed; the ones that need a container open their own
Bootstrap `.container`, which on this site tops out at **1440**, not 1140 — the ladder is
540 / 720 / 1140 / 1440 at 544 / 769 / 992 / 1200, always with 15px inner padding. Section
headers sit in a full-width `experience-layouts-3_column` at `col-lg-3 / col-lg-6 / col-lg-3`,
so the copy measures the middle two of four columns: **690**, or **705** inside the tech
container, whose row is 15px wider each side.

## Breakpoint

One break, at **`max-width: 768px`**. Authored as `max-[769px]:` / `min-[769px]:` pairs —
Tailwind compiles `max-[769px]` to `not all and (min-width: 769px)`, which is exactly
`max-width: 768px`. Using `max-[768px]` instead leaves a dead 1px at 768 where neither branch
applies, and plain `md:` breaks a pixel early.

## Section inventory

| # | Section | Template section | Build |
|---|---|---|---|
| 1 | Intro | `intro` | `section` + `custom-liquid` |
| 2 | Watermen frames rail (10) | `frames` | `product-list`, carousel |
| 3 | Shop-all CTA | `frames_cta` | `button` |
| 4 | OUR TECH 2×2 | `our_tech` | `section` + `group`/`image`/`custom-liquid` |
| 5 | LENS OVERVIEW | `lens_overview` | **`spy-lens-overview`** + `_spy-lens-overview-item` ×4 |
| 6 | LENS OPTIONS | `lens_options` | **`spy-lens-options`** + `_spy-lens-option` ×4 |
| 7–9 | Ice Blue (14) / Black Mirror (10) / Bronze (1) | `ice_blue`, `black_mirror`, `bronze` | `product-list`, carousel |
| 10 | LENS BENEFITS header | `lens_benefits_header` | `section` + `custom-liquid` |
| 11 | LENS BENEFITS carousel (4) | `lens_benefits` | `carousel` → `_card` → `group`/`image`/`custom-liquid` |
| 12 | Shop-all banner | `footer_banner` | `spy-feature-link-banner` |
| — | Value props · newsletter · footer | — | already global in `sections/footer-group.json` |

Only 5 and 6 are new blocks; 12 extended an existing unused section. Everything else is stock.

## Measurements

### Shared section header (`sectionHeader`)
- h2 **28px / 600 / uppercase / lh 1.2**, centred, margin `1em 0 .5em` (= 28px / 14px).
  Black `#000` on OUR TECH; the source's default ink elsewhere.
- subheader **18px / lh 1.2 (21.6px)**, `margin-bottom: 16px`, then **48px** of clear space
  before whatever the band holds
- copy measure **690** (**705** in the tech container) — not half the viewport
- Space above the h2 differs per band: 56 on OUR TECH, 52 on LENS OVERVIEW, 8 on LENS BENEFITS,
  and 48 on the three lens rails (28 on BRONZE, whose header uses `margin: 0 0 48px`)
- Built with `spy-heading` / `spy-body-text` because the stock `text` block's `font_size` select
  has no 1.75rem — an off-list value silently falls back to the fluid h2 preset.

### 1 · Intro
- container `max-width: 700px`, `padding: 40px 20px`, `margin-bottom: 50px`
- h2 **40px** (2.5em) / bold / `letter-spacing: .05em` / centred / `margin-bottom: 30px`
- p1 **19.2px** (1.2em), p2 + p3 **18.4px** (1.15em); all `line-height: 1.8`, `margin-bottom: 25px` (last 0)

### 3 · Shop-all CTA
- `#ee7624` background, white text, `padding: 15px 30px`, `border-radius: 0`, uppercase
- container `padding: 25px 0 15px`; hover `#d6661f`, active `#c05a1c`
- Note: this orange is the source's button colour and differs from brand `#f57f29`.

### 4 · OUR TECH
- band `#f5f5f5`, full-bleed, starting **48px** below the CTA (the row's own top margin);
  `.sfcc-custom-container` is the 1440 container with `padding: 40px 15px`
  → each tile **690px**, gutter **30px**, first tile at x=15 in a 1440 viewport (verified),
  and every card carries a **30px** tail
- tile art 1000×800 (**1.25**), full tile width
- `.sfcc-card-content` `padding: 30px 20px`
- title **18px / 700 / uppercase**, `letter-spacing: .5px`, `margin-bottom: 20px`
  (card 2 has `HAPPY BOOST™` inline in `#ee7624`)
- bullets **14px / lh 1.6**, `li margin-bottom: 8px`, `padding-left: 20px`, `•` marker
- stacks at `col-md-6` → below 768px

### 2 / 7–9 · Product carousels — the collection-list card

Source `.product-tile`, five up in a 1378 track:

```
.container   1440 max-width, padding 0 15   -> 1410 @ x15
.row         margin 0 16                    -> 1378 @ x31
slick slide  1378 / 5 = 275.6, padding-right 16 (the gutter)
tile                                        -> 259.6
```

| part | source |
|---|---|
| gallery | 260 × 260, padding 26 (10%), image 208 — `image_ratio: square` |
| tech stickers | 40 × 40, top 11.2, right 5, 4px apart |
| Quick View | 228 × 34.8, margin `-43.2 16 8`, 12/400 uppercase, 1px `#f27e37` on white, hover only from 769 |
| label band | padding `8 8 0`, badge + colourway stacked and centred |
| badge | 13 / 700 uppercase `#f57d31`, 1px border, padding `3.2 12.8 0` |
| colourway | 14.4 / 400 / 20.16, `#6c757d` — the **name**, not a colour count |
| swatches | 48 × 48 on `#f8f8f8`, absolute over the labels, swapped in on hover |
| text band | padding `10 8 24` — **24**, not the PLP's 40: these tiles carry no rating or Compare row |
| title | 19.2 / 900 / 23.04 `#1d2a2b`, one line — the **model** name (`title_source: group`) |
| price | 15 / **700** / 21 `#565656`; compare-at `#ababab` at 600 |

Slick's responsive steps, reproduced in CSS: **5 up above 1140, 3 to 1140, 2 to 720, 1 to 540.**
Below 769 the row keeps Bootstrap's `-15px` margin, so the track runs the full container width
instead of pulling in 16px.

Arrows are 35px circles, orange glyph on white, pulled 14px past the page edge — the source
leaves them half off-screen, and `overflow-x: clip` on the section stops that opening a scrollbar.

### Band rhythm (1440) — matched to within 0.5px

| band | height |
|---|---|
| intro | 527.3 |
| frames carousel | 404.6 |
| shop-all CTA | 155.3 (107.3 + the 48 of white above the grey) |
| OUR TECH | 1971.5 (header 196.4 + grid 1775.1) |
| LENS OVERVIEW | 751.6 (header 240.4 + scale 511.2) |
| LENS OPTIONS | 713.5 |
| ICE BLUE / BLACK MIRROR | 534.2 each |
| BRONZE | 514.2 |
| LENS BENEFITS header | 196.4 |
| LENS BENEFITS carousel | 525 (20 + 480 + 25) |
| shop-all banner | 394 (48 + 16 + 330) |

### 5 · LENS OVERVIEW
- container `max-width: 1200px`, `padding: 40px 20px`, white
- **desktop**: 4 columns, gap 20px. Ring circle **200×200** `border-radius: 50%`,
  `box-shadow: 0 4px 6px rgba(0,0,0,.1)`; photo inset **20px** → 160×160 circle.
  Arrow scale: 2px line, inset 80px each side, 8×16px triangle caps, sun/cloud **50×50**
  pulled up 25px over the line. Copy row: VLT **24px/600** `mb 30px`, condition **18px/600**
  `mb 8px`, description **16px / lh 1.4 / #666**.
  Vertical rhythm: 15px under the circle + the grid's 40px = **55px** to the scale, **30px** below it.
- **mobile**: scale and copy row drop out. Circles **120×120** (photo inset 15px → 90×90) sit
  beside their own copy, threaded on a 2px vertical line at `left: 60px` (the circle centre),
  sun 40×40 at top, cloud 40×40 at bottom, items `margin-bottom: 40px`.
  Copy: VLT **20px** `mb 8px`, condition **16px** `mb 4px`, description **14px**.
- Ring tints (colour + the gradient laid over it):
  | VLT | Ring | Gradient |
  |---|---|---|
  | 12% | `#87CEEB` | `linear-gradient(0deg, rgba(70,130,180,.2), rgba(70,130,180,.3) 50%, rgba(70,130,180,.2))` |
  | 15% | `#6b8e7f` | `linear-gradient(135deg, rgba(107,142,127,.7), rgba(90,120,105,.8) 50%, rgba(107,142,127,.7))` |
  | 18% | `#4a4a4a` | `radial-gradient(ellipse at center, rgba(60,60,60,.8), rgba(40,40,40,.9))` |
  | 20% | `#a89b85` | `radial-gradient(circle at center, rgba(168,155,133,.6), rgba(140,130,110,.8))` |

### 6 · LENS OPTIONS
- band `#f5f5f5` full-bleed; container **1000px**, `padding: 30px 20px`
- h2 **26px / 700**, `letter-spacing: 2px`, `mb 15px` (mobile 22px)
- intro **18px / lh 1.5 / #333**, `max-width: 700px`, `mb 30px` (mobile 14px, mb 20px)
- swatches **36×36** circles, gap 20px, active `scale(1.1)` + white ✓; row clears 30px
  (15px margin + 15px padding). Mobile 32×32, gap 12px, wraps.
- lens name **14px / 600**, `letter-spacing: .5px`, `mb 25px` (mobile 13px / mb 20px)
- content row `gap: 40px`; slider column `flex 1, max 500px`, `border-radius: 4px`,
  `box-shadow: 0 2px 8px rgba(0,0,0,.1)`; handle line 3px white, knob **36×36** round
- comparison labels **11px / 600 / #666 / uppercase**, `letter-spacing: 1px`
- info column `flex 1, max 400px`: VLT pill black/white `padding 6px 16px`,
  `border-radius: 20px`, **13px/600**, `mb 20px`; subtitle **15px/700** (mobile 16px);
  body + usage **13px / lh 1.7 / #333** (mobile 14px)
- stacks below 768px, `gap: 25px`
- Swatch order and payload (left image = overlay, right = base — the pairing is **reversed on
  Black Mirror** in the source):
  | # | Swatch | Name | VLT | Left / Right |
  |---|---|---|---|---|
  | 1 | `linear-gradient(135deg,#4B9BFF,#87CEEB)` | Polar Ice Blue Mirror | 12% | BlueLens-Before / -After |
  | 2 | `#013220` | Polar Green Mirror (Coming Soon) | 15% | COMING-SOON / COMING-SOON2 |
  | 3 | `#2c2c2c` | Polar Black Mirror | 18% | BlackLens-After / -Before |
  | 4 | `#A37A22` | Polar Bronze | 20% | BronzeLens-Before / -After |

### 11 · LENS BENEFITS carousel
- container **1200px**, `margin: 20px auto 25px`, background `#f8f9fa`, height **480px**
- 50/50 split; text column `padding: 40px 60px`
- title **40px / 700 / #1a1a1a** lh 1.2 `mb 15px`; subtitle **22px / 500 / #444** `mb 20px`;
  body **18px / lh 1.7 / #666**
- arrows 50×50 `rgba(255,255,255,.9)` inset 20px; dots 10px squares, active `scale(1.2)`
- mobile: stacks, image 300px tall, text `padding: 30px 20px 40px`, title **28px** centred,
  subtitle **18px** centred, body **16px**, dots below
- Slides: Color Enhancement → *Happy Boost™ Lens*; White Balance → *Happy™ Polar Lens*;
  Polarization → *ANSI Z87-2+ Certification* (no subtitle); Contrast → *Prescription Ready* (no subtitle)

### 12 · Shop-all banner
- separate desktop (1920×440) and mobile (800×640) art — per-breakpoint setting, no shared value
- **no scrim**: the desktop art already carries a black panel for the copy
- copy centre-right on desktop, bottom-centre on mobile. The copy box is shrink-to-fit against
  the **15px container edge** with its own `padding: 16px 16px 64px`, so heading and button share
  one left edge and the block sits 24px above centre
- h2 **28px / 700 / white / uppercase**, two lines (`SHOP ALL` / `FISHING SUNGLASSES`)
- CTA `.btn-outline-secondary.btn-square.btn-lg` → **white fill, `#1d2a2b` text and 1px border,
  radius 0, 14px, padding 8px 32px**; hover inverts

## Verification (dev server, Chromium 1440 / 768 / 390)

| Check | Result |
|---|---|
| Section header h2 | 28px / 600 at every breakpoint |
| Intro h2 | 40px / 700 |
| LENS OPTIONS h2 | 26px desktop, 22px mobile |
| Benefit slide title | 40px desktop, 28px mobile |
| OUR TECH tiles | 690px at x=15 / x=735, 30px gutter — source-exact |
| Grey band | 1440 full-bleed; header copy 705 wide at x=367.5 |
| Lens overview | 1200 wide; circles 200px desktop / 120px mobile; scale 1160×27 desktop, hidden ≤768 |
| Lens picker | 1000 wide; 4 swatches; panel swap, drag (`--cs` 18 → 77) and ArrowLeft (→72) all work |
| Benefits carousel | capped 1200 |
| Console / page errors | none from theme code |
| Horizontal overflow | none at 1440 / 390 |

**Known issue, pre-existing and not from this page:** at **768px** the document scrolls to
1182px. The culprits are `nav.spy-mega-menu` and `.spy-utility-nav` — the desktop nav turns on
at Tailwind's `md` (768px) but does not fit. Reproduced with the identical 1182px value on
`/`, `/pages/happy-boost` and `/pages/happy-lens`, so it is a header bug to fix once, globally.

## Editability

No `custom-liquid` anywhere: every string, size, weight, colour and margin is a block setting,
so the whole page is editable in the theme editor with zero code edits. Three reusable blocks
carry the type, each with a `presets` entry so they can be added to any section:

| Block | Used | Covers |
|---|---|---|
| `spy-heading` | 18× | Every heading. Per-breakpoint size + margins, weight, line-height, tracking, case, colour, alignment, semantic level, and a `highlight` setting that colours one run of words (the orange `HAPPY BOOST™`). |
| `spy-body-text` | 10× | All copy. Rich text plus per-breakpoint size and alignment, line-height, colour, max-width, paragraph gap, same `highlight`. |
| `spy-bullet-list` | 4× | Tile bullets — one item per line in a textarea, with marker glyph, indent, gap and type. |

`spy-lens-overview` and `spy-lens-options` also carry presets (with four child blocks each), so an
editor can drop a fresh VLT scale or lens picker into any section and fill it in.

These exist because the stock `text` block's `font_size` is a fixed select with no 1.75rem (28px)
or 1.625rem (26px), and its `line_height` is only tight/normal/loose — an off-list value is
dropped and Horizon's fluid preset takes over at ~36.9px.

## Done on the store

- **22 images uploaded** to Files with the exact filenames the template references, correct
  dimensions and alt text. Sourced by `fileCreate` from external URLs: 14 straight from the
  SFCC CDN, and the 8 whose CDN hashes the page save didn't preserve were routed via temporary
  theme assets (since removed).
- **Page created** — "Watermen Collection", handle `watermen`, `templateSuffix: watermen`,
  published. `/pages/watermen` renders 200 with all 22 images and zero placeholders.
- **Rail 1 wired** to the existing `watermen` collection.

## Outstanding before sign-off

Layout is source-exact at 1440 / 768 / 390 (see the band table above). What is left is data:

1. **No tech badges.** `spec.technologies`, `spec.ansi_rating` and `spec.certifications` are empty
   on all 40 products in the `watermen` collection, so the HB / ANSI Z87 stickers cannot render.
   The block is wired and fills in from the migration.
2. **No "New" or sale badges.** No product carries a `new` tag, `pdp.badge_new`, or a compare-at
   price. Each card is therefore **3.4px shorter** than the source's badged tile — that is the
   whole remaining height delta on the four rails.
3. **No colour swatches.** One product per colourway and no variant media, so the hover swatch row
   stays empty. Same blocker as the PLP.
4. **Body text colour.** The source's global body ink is `#1d2a2b`; the theme token is `#2c393e`.
   Left alone on purpose — it is a Layer 1 brand token and changing it moves every signed-off
   page. Needs a decision.
5. **The source carousel autoplays and loops** (`infinite: true`, `autoplaySpeed: 3000`).
   Not reproduced: Horizon's resource list does not autoplay, and an auto-advancing carousel is an
   accessibility regression. The visible consequence is that the previous arrow hides on the first
   slide instead of being drawn half off-screen.
6. **Set the two link targets**: the CTA button and the banner both point at the fishing
   sunglasses collection (source: `/us/sunglasses/fishing-sunglasses/`), which does not exist yet.

### A note on comparing against the capture

`document.fonts` reports `DINNextLTPro … error` on `reference/waterman/` — the saved page has no
font files, so it renders in Arial. Trust its **box geometry**, never its text widths or line
breaks. Our page loads the real DIN, so a long paragraph legitimately breaks a word differently.
