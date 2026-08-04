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
| Body copy | **14pt** = 18.667px | 400 | 140% | `#1d2a2b` | Same at every breakpoint — inline `pt` is not fluid. Set as real `pt`; see below |
| `ADJUSTABLE FIT SYSTEMS` (h2) | **32px** (24pt inline) | 600 | 120% | `#000000` | Inline colour, not the body slate |
| Its subtitle (p) | 14pt = 18.667px | 400 | 140% | `#000000` | Inline colour |
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

**Body size is forced to real `pt`.** 14pt is 18.667px and `spy-body-text`'s size slider steps by 1.
Rounding to 19px runs every line ~1.8% long — an intro line measured 929px against the source's
913px — which moved wrap points and put a different word on the last line. `spy-body-text` emits its
size as an inline `--sb-size` custom property, so the band CSS overrides that property to `14pt`
rather than fighting the `font-size` utility:

```css
.sht-band .spy-body-text { --sb-size: 14pt !important; --sb-size-mobile: 14pt !important; }
```

`!important` is what beats the inline style. Every heading size on this page (24pt, 18pt) is already
a whole number of px, so only body copy needs this.

**Headings are `h2`, not `h1`.** The source emits four separate `h1`s plus a fifth wrapping the MIPS
image with empty alt. Since `spy-heading` sets size, weight and line-height explicitly, the tag has
no visual effect, so all five are `h2` here and the MIPS lock-up is a plain `image` block with real
alt text. Zero pixels change; the heading outline becomes valid.

**The MIPS lock-up is capped under 544px.** The source renders the 500px PNG at natural size inside a
320px column, taking the page into horizontal scroll. Here it is capped to the column width instead,
lined up with the copy. Above 544 it is 500px exactly as the source has it.

**The MIPS lock-up is nudged 4px left, on purpose.** The source's `h1` is
`<picture><img></picture>&nbsp;` — the trailing non-breaking space is part of the centred line, so it
carries the artwork half a space left of true centre. Reproduced with `translateX(-4px)`, scoped to
≥992px: below that the columns stack and the artwork is scaled to fit its column, where a fixed 4px
would read as bad centring rather than a match.

**The video embed must not loop.** `video_loop: true` appends `&playlist=<id>&loop=1`, which makes
YouTube serve a looping playlist player. The source embeds a bare `/embed/<id>`, so the setting is
off and the built URL is `https://www.youtube.com/embed/VG9OrN4YsWA?`.

**The ABS row's grid is 1417px wide, not 1440.** Its `ml-lg-2` utility replaces the row's −15px left
margin with +8px, so the row no longer spans the full container and its twelfths become 118.083px.
The 8-column span therefore starts 259.2/1440 in and runs 944.7/1440 wide — hence the odd
percentages in the CSS. Applied to the row only; the CONSTRUCTION heading above stays page-centred.

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

## Verification (2026-08-04)

Rendered on `Staging v2` via `shopify theme dev`, screenshotted at a **1935 viewport** so the layout
width matches the baseline's 1920 and both centre the same 1440 container — the render is a uniform
+7.5px right of the baseline, which is normalised out below. Ink bands were detected
programmatically in both images, then compared band by band on width and on the gap to the band
above. Gap comparison is immune to the header height differing between the two platforms.

**27 of 27 bands matched. Worst deviation: 1px on width, 1px on vertical gap.**

| Element | Source w | Render w | Δw | Source gap | Render gap | Δgap |
|---|---|---|---|---|---|---|
| Intro line 1 | 913 | 913 | 0 | — | — | — |
| Intro line 2 | 916 | 915 | −1 | 10 | 10 | **0** |
| Intro line 3 | 564 | 563 | −1 | 10 | 10 | **0** |
| MIPS lock-up | 500 | 500 | 0 | 102 | 102 | **0** |
| MIPS ¶1 line 1 | 861 | 861 | 0 | 12 | 12 | **0** |
| MIPS ¶1 line 2 | 910 | 909 | −1 | 11 | 11 | **0** |
| MIPS ¶1 line 3 | 610 | 610 | 0 | 10 | 10 | **0** |
| MIPS ¶2 line 1 | 907 | 908 | +1 | 26 | 26 | **0** |
| MIPS ¶2 line 2 | 905 | 906 | +1 | 10 | 10 | **0** |
| MIPS ¶2 line 3 | 887 | 887 | 0 | 10 | 10 | **0** |
| MIPS ¶2 line 4 | 239 | 239 | 0 | 10 | 10 | **0** |
| Video | 800 | 800 | 0 | 70 | 70 | **0** |
| Hero photo | 930 | 930 | 0 | 48 | 48 | **0** |
| ADJUSTABLE FIT SYSTEMS | 381 | 381 | 0 | 101 | 101 | **0** |
| Fit subtitle | 486 | 486 | 0 | 24 | 24 | **0** |
| Snug Life row | 926 | 927 | +1 | 134 | 134 | **0** |
| VENTILATION SYSTEMS | 330 | 330 | 0 | 77 | 77 | **0** |
| Active row | 927 | 926 | −1 | 92 | 92 | **0** |
| Passive row | 927 | 928 | +1 | 16 | 16 | **0** |
| CONSTRUCTION | 220 | 221 | +1 | 101 | 101 | **0** |
| ABS row | 767 | 768 | +1 | 42 | 42 | **0** |
| ABS last line | 200 | 199 | −1 | 10 | 10 | **0** |
| ADDITIONAL FEATURES | 333 | 333 | 0 | 89 | 89 | **0** |
| Icon circles | 965 | 965 | 0 | 144 | 144 | **0** |
| Icon label line 1 | 1080 | 1080 | 0 | 37 | 37 | **0** |
| Icon label line 2 | 1039 | 1039 | 0 | 4 | 3 | −1 |
| SHOP SNOW HELMETS | 318 | 317 | −1 | 120 | 119 | −1 |

Line counts and wrap points match everywhere: intro 3 lines, MIPS 3 + 4, Snug Life 5, Active 1,
Passive 4, ABS 7. Each narrow copy column was also checked line by line — the ABS column reads
195/184/144/184/169/193/82 against the source's 194/185/143/183/169/193/82.

**Fonts.** `DINNextLTPro` 400 and 700 both load. The theme declares no 600 face, but CSS weight
matching sends the headings' 600 request up to the 700 file — which is the same Bold face the source
maps its own 600 to, so glyphs are identical. Confirmed by ink width, not by inspection: every
heading measures within 1px of the source (381/381, 330/330, 333/333, 220/221, 318/317).

**Responsive.** Re-measured after the type fix. Body copy is 18.667px at all three widths; zero
elements inside any band overflow the viewport.

| | 1440 | 768 | 390 |
|---|---|---|---|
| Layout (less scrollbar) | 1430 | 758 | 390 |
| Intro / hero column | 923 | 510 | 360 |
| MIPS column | 903 | 480 | 330 |
| Video | 800 × 450 | 510 | 360 |
| Row columns | 208 / 685 · 447 / 447 | stacked 510 | stacked 360 |
| ABS copy / art | 202 / 583 | stacked 510 | stacked 360 |
| Icon strip | 1322 | 510 | 360 |
| Band overflow | 0 | 0 | 0 |

**Console:** no errors from this page. The four that appear are Shopify's own Shop Pay and customer
account embeds failing against `127.0.0.1` in dev — a CSP `frame-ancestors` block on `shop.app`, a
403 on its pre-auth call, and a missing `customer-account-main-menu` in this dev store. All four
appear identically on other pages.

### Not comparable
- **The carousel.** The source shows four Galactic MIPS tiles at $120/$140; staging holds three
  Neutron MIPS at $102.50, photographed with different framing, and with no colourway label because
  the variants carry no colour data yet. The carousel box itself sits 8px under its heading, matching
  the heading's `margin_bottom`.
- **The Axeptio cookie badge** in the source's left margin, which has no counterpart here.

### Two pre-existing issues found, not fixed here
Both reproduce on `page.ansi-photochromic`, so they are theme-wide and out of this page's scope:

1. **`.page-wrapper` is the scroll container, not the document.** `html` is pinned to the viewport
   height with `overflow: hidden`, so `documentElement.scrollHeight` always reads one screen and
   Playwright's `fullPage` screenshots clip. Capture with a tall viewport instead.
2. **The header overflows horizontally at tablet.** At a 758 layout `.page-wrapper` has a
   `scrollWidth` of 1177 — 419px of sideways scroll — coming from `spy-mega-menu` and
   `spy-utility-nav`, not from any band on this page. Consistent with the known note that the source
   header is itself broken between 992 and 1240.

---

## Pixel diff (2026-08-04)

Band extents can match while the pixels inside them do not, so the page was also compared
**per pixel**. Rendered at a **1920 viewport**, which puts the layout width, the container box
(x 240, w 1440) and the hero (x 495) on exactly the baseline's coordinates — the two images then
differ by a single pixel vertically, which is normalised out. The 1440 × 4510 content area is
6,494,400 pixels.

| Pixels differing by more than | Count | Share |
|---|---|---|
| 8/255 | 37,813 | 0.582% |
| 16/255 | 7,490 | 0.115% |
| 32/255 | 1,609 | 0.025% |
| 64/255 | 479 | 0.007% |
| **128/255** | **0** | **0.000%** |

Not one pixel differs by more than half a channel. An 8×8 tile sweep flagged 186 tiles of 101,340
(0.18%), and every one falls into three causes, none of them layout, type or colour:

1. **Antialiasing phase on text.** The glyphs land on different sub-pixel offsets between the two
   platforms. Measured on three separate text regions, the ink is identical: darkest pixel exactly
   `rgb(29,42,43)` in both, mean luminance within **0.05%**, ink-pixel count within **0.4%**. Nothing
   is available to fix here — it is not weight, colour, size or position.
2. **Shopify CDN JPEG re-encoding** of the photographs. Same source files, same display boxes,
   different compression. Confirmed by fetching the CDN URLs directly: full resolution is served and
   nothing is upscaled. The Mips PNG is **byte-identical** to the uploaded original (difference
   bounding box: none).
3. **YouTube's own player chrome**, whose play button differs by a uniform 12/255 from a capture
   taken years earlier.

### What the pixel diff caught that the extent measurements missed
- **The video was looping.** `video_loop: true` appended `&playlist=<id>&loop=1`; the source embeds a
  bare `/embed/<id>`. Fixed.
- **The Mips lock-up was 4px right of the source**, from the trailing `&nbsp;` in the source's `h1`.
  Fixed and scoped to ≥992px.

### A trap worth recording
`img.naturalWidth` on an image with a `srcset` returns the **density-corrected** intrinsic size, not
the decoded pixel size. It therefore tracks the CSS box and looks like upscaling when there is none —
the icon strip read as "1187 natural vs 1332 displayed" while the CDN was in fact serving 1426. Fetch
the URL and measure the file when checking image resolution.
