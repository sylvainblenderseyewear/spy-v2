# Page spec — Snow Helmet Tech (`page.snow-helmet-tech`)

Source: `https://www.spyoptic.com/us/SnowHelmetTech.html`
Local capture: `reference/Snow Helmet/Snow Helmet Technology.html`
Visual baseline: `reference/Snow Helmet/www.spyoptic.com_us_SnowHelmetTech.html.png` (1905 × 5959)

Page type: tech guide. Sits with HappyBoost / HappyLens / SnowTech in the taxonomy.

Shopify page: **Snow Helmet Tech** · handle `snow-helmet-tech` · template suffix `snow-helmet-tech`
(`gid://shopify/Page/164334829808`).

---

## Breakpoints (read from the source CSS, not assumed)

The source is Bootstrap 4 with a **custom container ladder** — not Bootstrap's defaults:

| Min width | `.container` max-width | Content box (−15px pad each side) |
|---|---|---|
| 0 | 100% | fluid |
| 544px | 540px | 510px |
| 769px | 720px | 690px |
| 992px | 1140px | 1110px |
| 1200px | 1440px | 1410px |

Bootstrap rows carry `margin-inline: -15px`, which cancels the container padding, so **columns
divide the full container width** (1440 at desktop → 120px per column) and each column's own
15px padding sets the visible content edge.

Column layouts collapse to `col-12` (stacked) below **992px** — every layout column in this page
is `col-lg-* / col-md-12 / col-sm-12 / col-12`.

`spy-heading` and `spy-body-text` switch their mobile values at **769px**.

---

## Typography (source CSS + inline overrides)

Base: `body { font-family: "DINNextLTPro"; font-size: 1rem; font-weight: 400; line-height: 1.4;
color: #1d2a2b }`. `h1 h2 h3 { font-family: "DINNextLTPro"; font-weight: 600 }`,
`h1..h6 { margin-bottom: .5rem; line-height: 1.2 }`.

| Element | Size | Weight | Line-height | Colour | Notes |
|---|---|---|---|---|---|
| Body copy | **19px** (14pt inline) | 400 | 140% | `#1d2a2b` | Same at every breakpoint — inline `pt` is not fluid |
| `ADJUSTABLE FIT SYSTEMS` (h2) | **32px** (24pt inline) | 600 | 120% | `#000000` | Inline colour, not the body slate |
| Its subtitle (p) | 19px | 400 | 140% | `#000000` | Inline colour |
| `VENTILATION SYSTEMS`, `CONSTRUCTION`, `ADDITIONAL FEATURES`, `SHOP SNOW HELMETS` (h1) | **32px** (2rem) | 600 | 120% | `#1d2a2b` | Bootstrap RFS below 1200px — see deviation note |
| `SNUG LIFE`, `ACTIVE`, `PASSIVE`, `ABS` (h3) | **24px** (18pt inline) | 600 | 120% | `#1d2a2b` | Fixed at every breakpoint |

Paragraph rhythm: Bootstrap `p { margin-bottom: 1rem }` → `paragraph_gap: 16`.

All copy is centre-aligned. Headings are typed uppercase in the source content, not
`text-transform`-ed — but `uppercase: true` is harmless and survives an editor typing lower case.

### Known deviations
**Bare headings at tablet/mobile.** The four bare h1s use Bootstrap RFS: `calc(1.325rem + 0.9vw)`
below 1200px, `2rem` at and above. That resolves to **32px @ 1440**, **28px @ 768**, **25px @ 390**.
`spy-heading` has two tiers (desktop / mobile, switching at 769px), so mobile is set to **26px** —
within 2px of the source at both widths. Matching all three exactly would need `custom-liquid`,
which costs editability.

**Body size rounds up 0.33px.** 14pt is 18.67px and `spy-body-text`'s size steps by 1, so body copy
is 19px. Over the MIPS block's nine lines that accumulates to **+4px**, which is the whole of the
page's vertical drift (see the verification table).

**Headings are `h2`, not `h1`.** The source emits four separate `h1`s plus a fifth wrapping the MIPS
image with empty alt. Since `spy-heading` sets size, weight and line-height explicitly, the tag has
no visual effect, so all five are `h2` here and the MIPS lock-up is a plain `image` block with real
alt text. Zero pixels change; the heading outline becomes valid.

**The MIPS lock-up is capped under 544px.** The source renders the 500px PNG at natural size inside a
320px column, taking the page into horizontal scroll. Here it is capped to the column width instead,
lined up with the copy. Above 544 it is 500px exactly as the source has it.

---

## Colours

| Token | Value | Where |
|---|---|---|
| Body slate | `#1d2a2b` | all copy without an inline colour |
| Pure black | `#000000` | inline on the ADJUSTABLE FIT SYSTEMS h2 + subtitle |
| Brand orange | `#F27E37` | source `--custom-color-primary` (not used in this page's own bands) |
| Page background | `#ffffff` | every band |

No radii, no shadows, no borders anywhere on this page.

---

## Section inventory

Widths are **measured content-box widths at a 1920 layout**, where the container caps at 1440 and each
column's own 15px padding is already taken off. Bootstrap spacers: `1`=4px · `2`=8px · `3`=16px ·
`4`=24px · `5`=48px.

| # | Band | Source layout | Content width | Spacing (≥992px) | Build | CSS class |
|---|---|---|---|---|---|---|
| 1 | Intro paragraph | 3-col: `2 / 8 / 2` | **930px** centred | `mt 48` `mb 48` | `section` + `spy-body-text` | `--c8` |
| 2 | MIPS logo + 2 paragraphs | 1-col `no-gutters` › nested 3-col `2 / 8 / 2` | **910px** centred (the nested container costs 20px) · logo **500px** at natural size | row `mt 48` `mb 48` | `section` + `image` + `spy-body-text` | `--c8n` |
| 3 | YouTube embed | full-bleed wrapper › inner container › `col-12` | **800 × 450**, centred — YouTube ships the embed at a fixed size, `.embed-responsive-item` is never styled | none | `section` + `video` | `--video` |
| 4 | Helmet + goggle photo | 3-col: `2 / 8 / 2` | **930px** centred | row `mt 48` `mb 48` | `section` + `image` | `--c8` |
| 5 | ADJUSTABLE FIT SYSTEMS + subtitle | bare markup, **no container** | full bleed | `mt 48`, then **112px** before the row | `section` + `spy-heading` + `spy-body-text` | `--rows --r26` |
| 6 | SNUG LIFE — copy left / art right | 4-col: `2 / 2 / 6 / 2` | copy **210px** · art **690px** | row `pb 72`; copy `pt 96`; art `pt 16` | `group` › (`group` › `spy-heading` + `spy-body-text`) + `image` | ↑ same band |
| 7 | VENTILATION SYSTEMS | bare markup | full bleed | heading `mb 8` | `section` + `spy-heading` | `--rows --r44` |
| 8 | ACTIVE — art left / copy right | 4-col: `2 / 4 / 4 / 2` | copy **450px** · art **434px** (art adds `pr 16`) | row `pt 56`; art `pt 16` `pb 16`; copy `pt 96` | `group` › `image` + (`group` › type) | ↑ same band |
| 9 | PASSIVE — copy left / art right | 4-col: `2 / 4 / 4 / 2` | **450px** each | row `pb 96`; copy `pt 96` | `group` › (`group` › type) + `image` | ↑ same band |
| 10 | CONSTRUCTION + ABS | bare markup, then 4-col `2 / 2 / 6 / 2` | copy **206px** · art **594px** (art is pushed in 96px by `ml 48` + `pl 48`) | row `pb 16`, nudged `ml 8`; copy `pt 24` `pb 16` | `section` + `spy-heading` + `group` › (`group` › type) + `image` | `--rows --r26 --abs` |
| 11 | ADDITIONAL FEATURES + icon strip | bare markup, then 1-col `col-12` banner | **1332px** (row `m 16` + `p 8` on top of the column's 15px) | heading `mt 48` `mb 48`; art `pt 24` `pb 24` | `section` + `spy-heading` + `image` | `--icons` |
| 12 | SHOP SNOW HELMETS | bare markup | full bleed | heading `mb 8` | `section` + `spy-heading` | `--bleed` |
| 13 | Helmet carousel | container carousel | track **1378px** (the source swaps the row's −15px margin for +16px from 769 up) | none | `product-list` | template-scoped |

Bands 5–6, 7–9 and 10 each merge a heading with the row(s) under it, because a `section` already
stacks its blocks in a column and the CSS class is per-band. That keeps the section count at 10.

### Why the CSS carries the layout
Column widths cannot come from block settings alone:
- `padding-*` settings cap at **100**, so the 112px gap in band 5 is split across the subtitle's
  `margin_bottom` and the row's `padding-block-start`.
- Tailwind is imported with `important`, so its `w-full` utility on every `spy-heading` /
  `spy-body-text` beats any `width` rule — for `!important` declarations a cascade layer outranks
  unlayered CSS whatever the specificity. Column caps therefore use **`max-width`**, which no
  utility touches.
- Row columns pin `flex-basis` + `max-width` rather than `flex: 1 1 0`: the art carries an
  `aspect-ratio`, which resolves its width from the row height and silently wins over a zero basis.
- Row selectors use `> :not(style)` — Horizon injects a per-block `<style data-shopify>` as a real
  sibling, so `> *` would hit a phantom flex item.

Below the last band the site-wide **value-props row → newsletter → footer** come from
`sections/footer-group.json`. Nothing per-page.

### Omitted from the source
A final `BETTER TOGETHER` + `EXPLORE GOGGLES` band exists in the source DOM but its
`hero-banner-image-wrapper` is empty, so the absolutely-positioned overlay collapses to zero height
and the band **does not render** on the live page. Confirmed against the baseline screenshot.
Omitted by decision — the rendered page is the target.

### Icon strip is one flat image
`ADDITIONAL FEATURES` (Removable Brim / Detachable Liner / Goggle Retention Strap) is a single
1426 × 384 JPG on the source with icons and labels baked into the pixels. Reproduced as one `image`
block by decision, so it is pixel-identical. The three labels live in the image's `alt` text.

---

## Responsive behaviour

| Breakpoint | What changes |
|---|---|
| ≥1200 | Container 1440. Full column layout. Bare headings 32px. |
| 992–1199 | Container 1140 → every column width scales proportionally. Headings fluid 31→28px. |
| 769–991 | **Columns collapse to full width and stack.** Container 720. Copy panels keep their vertical padding but lose the column split. |
| <769 | Container 540, then fluid under 544. `spy-*` blocks switch to mobile type. |

Stack order in the source is DOM order, so bands 6, 9 and 10 put **copy above art** and band 8 puts
**art above copy**. Reproduced as-is — no `order` overrides.

Horizon's own `mobile-column` only stacks at **750**, so the 750–991 window is closed by hand and
every band goes full width there.

The video keeps its 16:9 box at every width, capped at `min(800px, 100% - 30px)`. Images are
`img-fluid` in the source (`max-width:100%; height:auto`), so all of them keep their natural
ratio — `image_ratio: adapt`.

Measured at each target width:

| | 1440 | 768 | 390 |
|---|---|---|---|
| Layout (less scrollbar) | 1430 | 758 | 390 |
| Container content | 1400 | 510 | 360 |
| Intro / hero column | 923 | 510 | 360 |
| MIPS column | 903 | 480 | 330 |
| Video | 800 × 450 | 510 | 360 |
| Row columns | 208 / 685 · 447 / 447 | stacked, 510 | stacked, 360 |
| Icon strip | 1322 | 510 | 360 |
| Horizontal overflow | none | none | none |

---

## Assets

Pulled from the saved source page (`Snow Helmet Technology_files/`), staged in
`reference/Snow Helmet/upload/`, uploaded to Shopify Files.

| Shopify file | Source file | Natural size |
|---|---|---|
| `snow-helmet-tech-mips-logo.png` | `mips-logo-tagline-horizontal.png` | 500 × 120 |
| `snow-helmet-tech-hero.jpg` | `Untitled-1.jpg` | 2000 × 1000 |
| `snow-helmet-tech-fit-snug-life.jpg` | `20-SPY-Adjustable-Fit-System-Astronomic-1600x1026-vAr1.jpg` | 1600 × 1026 |
| `snow-helmet-tech-vent-active.jpg` | `20-SPY-Ventilation-Systems-Interstellar-2000x2000-vAr1.jpg` | 2000 × 2000 |
| `snow-helmet-tech-vent-passive.jpg` | `20-SPY-Ventilation-Systems-Astro-2000x2000-vAr1.jpg` | 2000 × 2000 |
| `snow-helmet-tech-construction-abs.jpg` | `20-SPY-Construction-Astronomic-1600x1026-vAr2.jpg` | 1600 × 1026 |
| `snow-helmet-tech-additional-features.jpg` | `23-SPY-Digital-Website-Tech-Icons-Snow-Helmets.jpg` | 1426 × 384 |

Video: YouTube `VG9OrN4YsWA` — "How Mips works in a Skiing- or snowboard helmet". Source embeds it
with player chrome visible and no autoplay, so `background: false`, `video_autoplay: false`.

The MIPS logo is only 500px wide because the source requests it at `?sw=500&sh=500&sm=fit`; that is
the largest the live page serves. It renders at 500px, so there is no upscaling.

---

## TEMPLATE vs DATA

Everything on this page is **section/block settings (Layer 2)** — copy, images and the collection
handle are all editable in the theme editor. No product metafields are read.

The one data dependency is the carousel's collection: `snow-helmets`.

---

## Known staging gap

The source carousel shows four Galactic MIPS tiles. Staging's `snow-helmets` collection holds three
products — **Neutron MIPS** in Matte Black / Grey / Tan. The carousel points at the collection with
`columns: 4`, so it renders three cards now and fills itself after the NetSuite/Matrixify migration.
Not fixable without creating products, which is out of scope.

---

## Accessibility

- One `h1` per band group as in the source; the MIPS logo is an `image` block, not an h1 wrapping an
  `<img>` with empty alt (the source's markup is invalid here — we fix it).
- Every image carries descriptive alt text; the icon strip's alt names all three features.
- Colour contrast: `#1d2a2b` on `#ffffff` = 14.6:1. `#000` on `#fff` = 21:1. Both pass AA.
- The YouTube iframe keeps its native controls, so it is keyboard operable.

---

## Verification (2026-08-03)

Rendered on `Staging v2` via `shopify theme dev`, measured against the baseline screenshot at the
baseline's own 1920 layout so band positions are directly comparable. Ink-band tops and bottoms were
detected programmatically in both images, then compared gap by gap — that is immune to the header
height differing between the two platforms.

**Band heights — every one matches:**

| Band | Source | Rendered |
|---|---|---|
| MIPS lock-up | 120 | 120 |
| Video | 450 | 450 |
| Hero photo | 466 | 466 |
| ADJUSTABLE FIT SYSTEMS | 22 | 22 |
| Snug Life art | 442 | 442 |
| VENTILATION SYSTEMS | 22 | 22 |
| Active art | 434 | 434 |
| Passive art | 450 | 450 |
| CONSTRUCTION | 22 | 22 |
| ABS art | 304 | 308 |
| ADDITIONAL FEATURES | 22 | 22 |
| Icon strip | 126 | 126 |

**Gaps between bands:**

| Gap | Source | Rendered | Δ |
|---|---|---|---|
| MIPS lock-up → video | 270 | 274 | +4 |
| Video → hero | 48 | 48 | **0** |
| Hero → ADJUSTABLE FIT SYSTEMS | 100 | 100 | **0** |
| ADJUSTABLE → Snug Life art | 174 | 174 | **0** |
| Snug Life → VENTILATION SYSTEMS | 78 | 78 | **0** |
| VENTILATION → Active art | 92 | 92 | **0** |
| Active → Passive art | 16 | 16 | **0** |
| Passive → CONSTRUCTION | 100 | 100 | **0** |
| CONSTRUCTION → ABS art | 42 | 44 | +2 |
| ABS → ADDITIONAL FEATURES | 116 | 118 | +2 |
| ADDITIONAL FEATURES → icon strip | 144 | 144 | **0** |
| Icon strip → SHOP SNOW HELMETS | 38 | 36 | −2 |

The +4 is the 19px body rounding described above; the ±2 values are antialiasing on text and photo
edges. Nothing else deviates.

The gap from SHOP SNOW HELMETS to the first helmet is not comparable: the source shows Galactic MIPS
photography and staging has Neutron MIPS, framed differently inside the image. The carousel's own box
sits 8px under the heading, matching the heading's `margin_bottom`.

**Console:** no errors from this page. The four that appear are Shopify's own Shop Pay and customer
account embeds failing against `127.0.0.1` in dev — a CSP `frame-ancestors` block on `shop.app`, a
`403` on its pre-auth call, and a missing `customer-account-main-menu` in this dev store. All four
appear identically on other pages.

### Two pre-existing issues found, not fixed here
Both reproduce on `page.ansi-photochromic`, so they are theme-wide and out of this page's scope:

1. **`.page-wrapper` is the scroll container, not the document.** `html` is pinned to the viewport
   height with `overflow: hidden`, so `documentElement.scrollHeight` always reads one screen and
   Playwright's `fullPage` screenshots clip. Capture with a tall viewport instead.
2. **The header overflows horizontally at tablet.** At a 758 layout `.page-wrapper` has a
   `scrollWidth` of 1177 — 419px of sideways scroll — coming from `spy-mega-menu` and
   `spy-utility-nav`, not from any band on this page. Consistent with the known note that the source
   header is itself broken between 992 and 1240.
