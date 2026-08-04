# Page Spec: Snow Goggle Tech (`page.snow-tech`)

**Source URL:** https://www.spyoptic.com/us/SnowTech.html
**Reference capture:** `reference/snowtech/` (saved DOM + `global.css` + full-page PNG at 1905×13345)
**Template:** `page.snow-tech` · **Page handle:** `snow-tech` (matches reserved redirect in `redirect-urls.csv:36`)
**Constraint:** built from EXISTING sections/blocks only — no new sections or blocks.

---

## Source platform notes

SFCC Page Designer. Every module is an `experience-component`:
`assets-image` · `assets-banner` · `assets-markup` · `assets-sectionHeader` · `assets-separator`
· `layouts-1_column` / `2_column` / `4_column` · `carousel-productCarousel`.
Layout is Bootstrap 4 — `p-5` = 48px, `mb-3` = 16px, `col-lg-6` / `col-lg-8` / `col-lg-4`, `row no-gutters`.

### Container ladder (verified in `global.css`)

```
.container { width:100%; padding-inline:15px; margin-inline:auto }
@media(min-width:  544px) .container { max-width:  540px }   /*  510 content */
@media(min-width:  769px) .container { max-width:  720px }   /*  690 content */
@media(min-width:  992px) .container { max-width: 1140px }   /* 1110 content */
@media(min-width: 1200px) .container { max-width: 1440px }   /* 1410 content */
```

The `@media(max-width: 991.98px){.container{max-width:100%;padding:0}}` rules in the same file are
**not** overrides of this ladder — they are descendant rules scoped to `.navbar`,
`.site-header .main-nav` and `#chooseBonusProductModal .modal-footer`. The ladder above is what
applies to page content. Already implemented for `page.ansi-photochromic` in `src/tailwind.css:1105`
and reused here.

Confirmed by measurement: the condition panels span x 255→1665, i.e. 1410 wide and symmetric within
the 1920px layout viewport — exactly `1440 − (2 × 15)`.

**Two width regimes on this page:**

| Regime | Applies to | Geometry |
|---|---|---|
| Container | section headers, centred images, product carousels | ladder above; headers add `padding-inline: 48px` at ≥992 (`px-lg-5`) |
| Full-bleed + gutter | the 2-column lens-change and lens-type rows | no container; `padding-inline: 48px` at ≥992, 0 below |

Verified: rows span x 48→1872 (48px each side of the 1920 viewport); centred images span 255→1665.

---

## Measured design tokens

| Token | Value | Source |
|---|---|---|
| Text colour | `#1d2a2b` | `body{color:#1d2a2b}` — already the theme token |
| Font | DINNextLTPro | `body{font-family:"DINNextLTPro"}` |
| Section header `h2` | 28px / 600 / uppercase / centred · `margin: 28px 0 14px` (`1em 0 .5em`) | `h2,.h2{font-size:1.75rem}` |
| Section header block | `margin-bottom: 48px` (`3rem`), `line-height: 1.2`, `padding-inline: 48px` | `.section-header` |
| Sub-header `p` | 18px / 400 / centred / line-height 1.2 | `.section-header .subheader{font-size:1.125rem}` |
| Row title `h1` | 32px / 600 / left · `margin-bottom: 8px` | `h1,.h1{font-size:2rem}` |
| Row body `h5` | 16px / 400 / left / line-height 1.2 | `h5,.h5{font-size:1rem}` |
| Separator | full-bleed `<hr>`, 1px `rgba(0,0,0,.1)` = `#e5e5e5`, `margin: 16px 0` | Bootstrap default |
| Fluid headings | `h1` ≤1200px: `calc(1.325rem + 0.9vw)` → 28px @768, 25px @390 | |
| | `h2` ≤1200px: `calc(1.3rem + 0.6vw)` → 25px @768, 23px @390 | |

Verified against the capture: `h2` cap-height 19px (rows 945–963) → 28px; `h1` "DEADBOLT™" 22px
(rows 1437–1458) → 32px; body line pitch 19px → 16px @ 1.2.

---

## Section inventory (top → bottom)

| # | Source module | Content | Theme section | Blocks |
|---|---|---|---|---|
| 1 | `assets-image` | Hero 2000×900, "SNOW GOGGLE TECH" baked into the asset | `section` full-width | `spy-hero-image` |
| — | `layouts-1_column` > `assets-banner` | **Not rendered.** Intro copy + SHOP SNOW button exist in the DOM but `.hero-banner{overflow:hidden}` clips them against a zero-height image wrapper. Omitted by decision. | — | — |
| 2 | `sectionHeader` + 3× `layouts-2_column` | LENS CHANGE SYSTEMS · Deadbolt / Lock Steady 2 / Quick Draw | `section` full-width | `spy-heading` + `group` rows |
| 3 | `separator` + `sectionHeader` + `1_column` | SEE BETTER, SNOW BETTER + sub-header + Happy Lens split image | `section` full-width | `_divider`, `spy-heading`, `spy-body-text`, `spy-hero-image` |
| 4 | `separator` + `sectionHeader` + 3× `2_column` | LENS TYPES · Spherical / Cylindrical / Toric | `section` full-width | `_divider`, `spy-heading`, `group` rows |
| 5 | `separator` + `sectionHeader` + `4_column` | WE'VE GOT YOUR EYES COVERED + 4 stacked condition panels | `section` full-width | `_divider`, `spy-heading`, `spy-body-text`, 4× `spy-hero-image` |
| 6 | `separator` + `sectionHeader` + `1_column` | ANTI-FOG COATING + sub-header + split image | `section` full-width | `_divider`, `spy-heading`, `spy-body-text`, `spy-hero-image` |
| 7 | `separator` + `sectionHeader` + `1_column` | ADDITIONAL FEATURES + 3-icon strip image | `section` full-width | `_divider`, `spy-heading`, `spy-hero-image` |
| 8 | `sectionHeader` | SHOP SNOW GOGGLES | `section` full-width | `spy-heading` |
| 9 | `carousel-productCarousel` | Goggle cards, 4 visible, prev/next arrows | `product-list` | collection `snow-goggles` |
| 10 | `sectionHeader` | SHOP SNOW LENSES | `section` full-width | `spy-heading` |
| 11 | `carousel-productCarousel` | Replacement-lens cards | `product-list` | collection `snow-replacement-lenses` |

Announcement bar, header and footer/value-props come from the shared groups — not part of this template.

---

## Per-row geometry (measured at 1905px viewport)

### Lens Change Systems — `col-lg-6` / `col-lg-6`, `row no-gutters`, row `padding-inline: 48px`

| Row | Order | Copy inset | Verified text x |
|---|---|---|---|
| 1 Deadbolt | image · copy | **96px** (`mx-lg-5` + `p-lg-5`) | 1056 → measured 1053 |
| 2 Lock Steady 2 | copy · image | 48px (`p-lg-5`) | 96 → measured 97 |
| 3 Quick Draw | image · copy | 48px (`p-lg-5`) | 1008 → measured 1008 |

Images are 2000×2000, `object-fit: cover`, filling the 50% column (912px square at 1905).
Row bottom margin `mb-3` = 16px; row 2 is `mb-lg-0`.

### Lens Types — `col-lg-8` (image) / `col-lg-4` (copy), `row no-gutters`, copy padding 0

| Row | Order | Row padding-inline | Verified text x |
|---|---|---|---|
| 1 Spherical | image · copy | 48px | 1264 → measured 1262 |
| 2 Cylindrical | copy · image | 48px | 48 |
| 3 Toric | image · copy | **0** | 1270 → measured ~1280 |

Images are 800×403 upscaled to fill their column.

### Centred single images — container ladder, 1410px content at ≥1200px

Happy Lens tech (2000×1000) · 4 condition panels (2000×1000 each) · anti-fog split (2000×1000)
· additional features (1426×384).

The 4 condition panels come from a `layouts-4_column` running `flex-lg-column` with `col-lg-12`
children, so they **stack** full-container-width with `mb-3` (16px) between them — not a 4-up grid.

`.image-component img { object-fit: cover; width: 100% }` — every image fills its column, which is
why the 800×403 lens art is upscaled to the full `col-lg-8`.

---

## Images

All 14 assets uploaded to Shopify Files as `snowtech-*`. Copy baked into the condition panels and the
additional-features strip is carried in `alt` text for WCAG 2.1 AA.

| File | Source asset | Size |
|---|---|---|
| `snowtech-hero` | `23-SPY-010-...-Header-Snow-Goggle-Tech-2000x900` | 2000×900 |
| `snowtech-deadbolt` | `20-SPY-Web-Snow-Tech-Deadbolt-vAr1` | 2000×2000 |
| `snowtech-lock-steady-2` | `19-SPY-199-...-LockSteady2` | 2000×2000 |
| `snowtech-quick-draw` | `19-SPY-199-...-QuickDraw` | 2000×2000 |
| `snowtech-happy-lens-tech` | `20-SPY-Web-Happy-Lens-Tech-2000x1000-vAr1` | 2000×1000 |
| `snowtech-lens-spherical` | `...-Snow-Goggle-Tech-Spherical-Lens` | 800×403 |
| `snowtech-lens-cylindrical` | `...-Snow-Goggle-Tech-Cylindrical-Lens` | 800×403 |
| `snowtech-lens-toric` | `...-Snow-Goggle-Tech-Toric-Lens` | 800×403 |
| `snowtech-conditions-sunny` | `20-SPY-Lens-Overviews-...-Sunny-vAr1` | 2000×1000 |
| `snowtech-conditions-mixed` | `...-Mixed-vAr1` | 2000×1000 |
| `snowtech-conditions-flat` | `...-Flat-vAr1` | 2000×1000 |
| `snowtech-conditions-night` | `...-Night-vAr1` | 2000×1000 |
| `snowtech-anti-fog` | `19-SPY-Snow-ClearLens-AntiFogSplit-2000x1000-vBr1` | 2000×1000 |
| `snowtech-additional-features` | `23-SPY-Digital-Website-Tech-Icons-Snow-Goggles` | 1426×384 |

---

## Copy

**LENS CHANGE SYSTEMS**
- DEADBOLT™ — Deadbolt's magnets securely guide the lens into place while the locking levers bolt it down. It's a ride so secure you can plunder pow in peace.
- LOCK STEADY™ 2 — The quickest fingerprint-free lens change system on the market, Lock Steady 2 allows you to adapt to changing light and weather conditions at the touch of a button.
- QUICK DRAW — Utilizing a sliding lever to swiftly release the lens, Quick Draw gives you the upper hand to duel with ever-changing weather conditions on the fly.

**SEE BETTER, SNOW BETTER** — Dull landscapes vanish with Happy™ Lens Tech, providing increased clarity, sharper focus and accentuated changes in terrain while reducing eye strain and boosting your alertness.

**LENS TYPES**
- ARC® SPHERICAL LENS — Spherical lenses are built on a base curve in both the X and Y axis. SPY's ARC lens is decentered—thicker in the middle and tapered towards the edges—providing distortion-free viewing with clarity at all viewing angles.
- CYLINDRICAL LENS — Cylindrical lenses are built on a base curve only in the X axis. SPY's Superior Injected Curve lenses create a curved shape that provides better impact protection and higher quality optics.
- TORIC LENS — Toric lenses combine the shape of both a cylindrical and spherical lens. This combination provides superior optical clarity by mimicking the curvature of the eye with a less pronounced y-axis than a traditional spherical lens. The lens curve also has fewer surface points for UV rays to penetrate and provides an excellent distortion-free field of view. All while offering optimal volume between the lens and the user's face, which is ideal for fog-free vision on the slopes.

**WE'VE GOT YOUR EYES COVERED** — Light conditions can change at a moment's notice, and our color range of lens and lens change options allow you to quickly adapt, letting you focus on your run instead of the sun.

**ANTI-FOG COATING** — An extra-strength coating on the inside of the lens absorbs moisture immediately so you can enjoy clear lenses all day.

**ADDITIONAL FEATURES** · **SHOP SNOW GOGGLES** · **SHOP SNOW LENSES**

---

## Source quirks — reproduced as-is

Mirrored per rule 2, listed so they can be normalised on request:

1. **Lens-change copy inset varies** — row 1 sits 96px in, rows 2–3 sit 48px in (`mx-lg-5` only on row 1).
2. **Lens-types row 3 has no side padding** — the Toric image runs 48px wider than Spherical/Cylindrical.
3. **Hidden hero copy** — intro + SHOP SNOW button clipped to zero height; omitted.

## Source quirk — corrected

4. **Lens Types image/caption mismatch.** The source pairs the Toric render with "CYLINDRICAL LENS"
   and the Cylindrical render with "TORIC LENS". This is a factual content error in a technical diagram,
   not styling, so the rebuild pairs each render with its correct caption.

## Known deviations

5. **Row stacking breakpoint.** Source columns stack below **992px**; the theme's `group` block stacks
   below **750px** (`.mobile-column` in `assets/base.css:2539`). Closed here in CSS on the band class
   (`.snowtech-band--rows`), which forces a column below 992px rather than relying on
   `vertical_on_mobile` — so no block change is needed and 768 matches the source.

---

## Responsive behaviour

| Section | 1440 | 768 | 390 |
|---|---|---|---|
| Hero | full-bleed 20:9 | full-bleed | full-bleed |
| Lens-change / lens-types rows | 2-col | 2-col (see deviation 5) | stacked |
| Centred images | 1420 max | full-bleed | full-bleed |
| Product carousels | 4 cards | 2–3 cards | 1–2 cards |

## Collections

| Handle | Rules | Count | Used by |
|---|---|---|---|
| `snow-goggle-frames` | `type = Snow Goggles` AND `title NOT_CONTAINS "Replacement Lens"` | 24 | Shop snow goggles |
| `snow-replacement-lenses` | `type = Snow Goggles` AND `title CONTAINS "Replacement Lens"` | 7 | Shop snow lenses |

Both must be **published to the Online Store publication** — a newly created collection is not, and
`product-list` silently renders placeholder cards instead of failing. The pre-existing `snow-goggles`
collection was not reused for the goggles carousel because it is typed on `Snow Goggles` and therefore
contains the replacement lenses too, which led the carousel with lens art.

Only 4 of the 7 replacement lenses reach the storefront (Marauder Elite, Raider, Crusher Elite,
Marauder) — the other three are not available on the Online Store. Staging data, not a template issue.

---

## Verification (2026-08-03, `shopify theme dev` on :9293)

Measured with `getBoundingClientRect`, plus text-run positions via `Range` — computed `flex` values read
as `1 1 0` even when rendered widths differ, so they are not trusted here.

**Desktop 1440 — 6/6 source-geometry checks pass**

| Check | Expected | Measured |
|---|---|---|
| Lens-change row halves | 672 / 672 | 672 / 672 |
| Lens-types row split (8/4) | 896 / 448 | 896 / 448 |
| Row 1 copy text left (96px inset) | 816 | 816 |
| Row 2 copy text left (48px inset) | 96 | 96 |
| Row 3 copy text left (48px inset) | 768 | 768 |
| Centred art content width | 1410 | 1410 |

Row titles initially inherited the header's container padding (text pushed 63px right) because the
ladder selector matched every `.spy-heading` in the band; it is now scoped to
`.section-content-wrapper > .spy-heading`, so titles nested in copy panels are untouched.

**Tablet 768** — centred art 540px (the 544 ladder tier), full-page render 9457px tall, 0 broken images.
**Mobile 390** — all bands full-bleed, tech rows stacked (both children 390px), 8284px tall, 0 broken images.
Row stacking at 768 comes from the same `max-width: 991px` rule confirmed stacking at 390.

**Not verified visually:** there is no source capture at 768 or 390 — `reference/snowtech/` holds only the
1905px desktop render. Tablet and mobile follow the source's CSS media queries, not a screenshot diff.

**Pre-existing issues found, reproduced on `page.ansi-photochromic`, not caused by this page:**
- 414px of horizontal overflow at 768: the header's desktop nav (`nav.spy-mega-menu` + `.spy-utility-nav`)
  stays laid out at that width. Matches the known 992px nav-collapse gap.
- 7 console errors, all environmental: `shop.app` frame-ancestors CSP, two 403/400 asset fetches, and a
  missing `customer-account-main-menu`. None originate in this template.
- `chrome-headless-shell` reports `html`/`body` at 900px with `overflow: hidden` on desktop, which clips a
  `fullPage` capture. No CSS rule causes it. Desktop captures are stitched from 13 slices by offsetting
  `main.content-for-layout`; off-screen carousel slides keep their lazy images unloaded in those stitches.

## Definition of done

Renders from Files-hosted images and the two collections · desktop geometry matches the measurements
above · accessible alt text on every baked-text image · pushed to **Staging v2** · signed off.
