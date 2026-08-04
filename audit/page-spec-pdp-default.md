# Page spec — PDP default (eyewear)

Source: `reference/PDP_sample/` (Cyrus Switch, saved 4 Aug 2026). All numbers are computed
styles read at **1440×1200** unless noted.

## Measuring harness

The saved page has no font files, so opened directly it falls back to Arial and every text
width is ~10% too wide. To measure text reliably:

1. `node <job>/tmp/make-measure-copy.js` — strips scripts/iframes/remote media, keeps the 7
   local stylesheets and 95 local images, and injects `@font-face` rules pointing at the
   theme's own DIN files.
2. `node <job>/tmp/serve.js` — serves the repo root on `http://127.0.0.1:8123`. **Required**:
   font fetches from a `file://` origin are blocked, which silently reverts text to Arial.
3. Open `http://127.0.0.1:8123/reference/PDP_sample/_static-for-measure.html`.

Proof the fonts are live: `.cat-label` ("Cat. 1") renders **38.5px** — identical to our
storefront. Under the Arial fallback it measures 42.7px.

Carousels are slick-driven and their JS is stripped, so **slide widths and arrow boxes in
the copy are the un-initialised layout**; those were taken from the saved (post-init) DOM
attributes instead. Everything else — grid tracks, padding, borders, type — is trustworthy.

## Page structure (source, `.product-detail`, total 6232 tall)

| # | Section | dy | height | x / width | Ours |
|---|---|---|---|---|---|
| 1 | `.product-breadcrumb-container` | 0 | 40 | 41 / 1343 | ✅ built |
| 2 | `.product-carousel-container` (gallery + info column) | 40 | 1390 | 41 / 1343 | ✅ built (1360) |
| 3 | `.description-and-detail` | 1430 | 1254 | 41 / 1343 | ❌ **missing** |
| 4 | `.recommendations` | 2684 | 753 | 41 / 1343 | ⚠️ exists, 571 — needs work |
| 5 | Reviews (Yotpo widget) | 3438 | 2795 | 56 / 1313 | ❌ missing — needs an app decision |

## Section 3 — `.description-and-detail`

Container: `padding: 48px 0`, `margin: 0 -15px`, flex. Two children.

### 3a — Lifestyle carousel (`.product-images-horizontal-gallery`)

- container 1343 wide, **414.4** tall, `margin: 0 -15px`
- 8 real slides (21 nodes incl. slick clones for the infinite loop)
- slide cell **423** wide, image **399×399** → 24px gutter (12px each side)
- ~3.17 cells visible at 1440
- images: `26-SPY-Digital-PDP-CyrusSwitch-Carousel-1…8.png`, natural 1200×1200
- arrows are **full-height side buttons**, not the round ones from the main gallery:
  `51 × 414.4`, `background: rgba(255,255,255,0.75)`, colour `#f27e37`, `padding: 0 8px`,
  FontAwesome angle glyph at **48px**
- maps to `pdp.feature_carousel` (list.file) in Appendix A

### 3b — Feature banner (`.pdp-content-asset-wrapper`)

A single full-bleed image per breakpoint — no text, no overlay.

- full-bleed technique: `.full-width-container` gets `left: 50%; margin-inline: -50vw;
  width: 100vw; max-width: 100vw; overflow: hidden` at **≥768px**; `margin: 2rem 0`
- `.pdp-feature-image { width: 100%; height: auto; display: block }`
- **desktop** `CYRUS-SWITCH-FEATURES-PDP-Desktop.jpg` — natural **1920×801** (ratio 2.397),
  renders 1440×601 at this viewport
- **mobile** `CYRUS-SWITCH-FEATURES-PDP-Mobile.jpg` — natural **800×1200** (ratio 0.667)
- the two swap by `display` on a media query, so the theme needs a **separate setting per
  breakpoint** (CLAUDE.md rule 7)
- maps to `pdp.feature_banner_desktop` / `pdp.feature_banner_mobile`
- on mobile only, the section gains a `Cyrus Switch Features` heading: `.title.mb-3.d-lg-none`,
  uppercase, `margin-bottom: 16px`, and the body becomes a Bootstrap collapse. On desktop the
  heading is `display: none` and the content is always open.

## Type scale (source `--ds-*` tokens, verified against computed styles)

| Token | size / line-height / weight / tracking | Used by |
|---|---|---|
| `label-l` | 16 / 24 / bold / 0% | accordion headers |
| `lead` | 18 / 28 / 500 / −1% | price, lens tile values |
| `body-m` | 14 / 20 / 500 / +1% | stock line, spec labels |
| `body-mr` | 14 / 20 / 400 / +1% | spec values |
| `body-sr` | 12 / 16 / 400 / +1.5% | lens tile labels |
| `label-s` | 12 / 16 / bold / +1% | breadcrumb crumbs |
| `h1` | 32 / 40 / bold / +1.5% | product title |
| `button-l` | 14 / 20 / bold / +0.5% | ATC |

Colour tokens: `content-primary #242424`, `content-secondary #393939`, `content-muted #a6a6a6`,
`surface-primary #f9f9f9`, `border-neutral #E6E6E6`, `sentiment-positive #4BB151`,
`sentiment-negative #D7403A`, `interactive-primary #242424`, brand orange `#f27e37`.

Note the info-column body text is `#1d2a2b`, **not** `#242424` — only the h1, the scale
bar/tick, "Read more" and the chevrons use content-primary.

## Section 2 — verified this round

| Element | Source | Status |
|---|---|---|
| media column | 759.3 wide, stage padding 48 (`.slick-slide > span`) | ✅ 762.2 / 48 |
| displayed stage image | ~560 | ✅ 566 |
| zoom | 1340px layer painted 1:1 → factor = 1340 ÷ displayed, no transition, `cursor: crosshair` | ✅ matches |
| thumbnails | 85 cell / 65 image / 2px radius / 2px `#242424` when active | ✅ matches |
| gallery arrows | 40×40, radius 18, `#fff`, shadow `0 0 9px rgba(119,119,119,.1)`, FA `\f104`/`\f105` at 20px, opacity .75 | ✅ chevrons |
| breadcrumb | category only, `label-s`, 40 tall (8px above a 32px row) | ✅ matches |
| price | `lead` | ✅ matches |
| stock | `body-m`, `#4BB151`, 24 above / 12 below | ✅ matches |
| lens panel | heading row 24, tiles 2×2 @ 76 min, 8px gutters, Cat scale `0 repeat(4,1fr)` 68.8 tall | ✅ matches |
| accordion | header 66 (`20px 12px`), rule **under** the header, rows 52 (`16px` pad), 50/50 split, single-open via `data-parent` | ✅ matches (native `name=`) |

## Open items

- **Reviews** (section 5, 2795 tall) is a Yotpo widget. Needs a Shopify reviews app decision
  before it can be built; the star row in section 2 is the same dependency.
- Spec-table row set differs from the sample: the source shows Weight and Available with RX,
  ours shows Lens Material, VLT and Polarized — a metafield-population gap, not layout.
  Source labels are "Product Material" and "Frame Colour", and the category value reads "Cat. 3".
- `pdp.*` metafield namespace has **no definitions** yet, so the new blocks below read the
  metafield first and fall back to a block setting so they render today.
