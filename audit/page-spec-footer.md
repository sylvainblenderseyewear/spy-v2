# Footer — pixel spec (source of truth)

Measured from the saved source page `reference/Snow Helmet/Snow Helmet Technology.html`
(served over localhost so the real `global.css` + DINNextLTPro apply). Viewport 1440 →
document width 1425 (15px scrollbar), 768 → 753, 390 → 375. All numbers are CSS px.

## Global

| Token | Value |
|---|---|
| Body type | DINNextLTPro 16px / 1.4 / #1d2a2b |
| Dark band bg | `#272727` (`.site-footer__inner-container`) |
| Light band bg | `#f2f2f2` |
| Hairline | `1px solid #1d2a2b` |
| Grid breakpoints | sm 544 · **md 769** · lg 992 · xl 1200 |
| `.container` | max-width 540 / 720 / 1140 / **1440** + 15px side padding |
| `col-10` row | 83.333% of (viewport + 30), centered, 15px padding → content 1182.5 @1440 |

Two different content widths are in play:
* value-props + menus → `col-10` (83.33% fluid) = **121.25 → 1303.75** @1440
* payment + copyright → `.container` (max 1440) = **15 → 1410** @1440

## Band stack (heights)

| Band | 1440 | 768 | 390 |
|---|---|---|---|
| Value props (`#f2f2f2`) | 284.17 | 544.95 | 634.52 |
| Sign-up (`#272727`) | 233 | 233 | 233 |
| Menus (`#272727` + bg image) | 254.39 | 386.95 | 386.95 |
| Payment (`#f2f2f2`) | 78 (77 + 1 line) | 94.8 | 94.8 |
| Copyright (`#f2f2f2`) | 48.8 | 65.59 | 82.39 |
| **Footer total** | **898.36** | 1325.3 | 1431.66 |

## 1. Value props — `.site-footer_reinsurance`

* Band: bg `#f2f2f2`, **border-bottom only** `1px #1d2a2b` (no top line), full bleed.
* Content: `col-10`; 4 × `col-md-3` = 303.13 wide each, item content 273.13 (15px gutters).
  Column x @1440: 121.25 / 424.38 / 727.5 / 1030.63.
* Column padding-block **48px** (`py-5`), items equal height (`h-100`).
* Icon: `<img height="72">` on a 1500×1300 canvas → box **83.06 × 72**, artwork ≈ 82 × 46
  centred (13.1px transparent top/bottom). `<p>` margin-bottom **16px**.
* Text: one `<p>` — `<b>Title</b><br>subtitle`, both **16px / 22.4px / #1d2a2b**, centred;
  title `font-weight 700`. `<p>` margin-bottom 16px.
* Whole item is a link: shipping · return policy · warranty · contactus.
* Responsive: `row-cols-2 row-cols-md-4` → **2 up below 769px** (not 1 up).

## 2. Sign-up — first `.site-footer_content` (Klaviyo)

* Row: full bleed on `#272727`, padding **16px 0**, border-bottom `1px #1d2a2b`.
* Form: **450px** max-width, centred, `min-height 200px`, content vertically centred
  (36px above heading @1440).
* Heading: **24px / weight 600 / line-height normal (32px per line) / letter-spacing 0**,
  `#fff`, centred, wrap box 438px → 2 lines @1440, 3 lines @390.
* Gap heading → field row: **10px**.
* Field row: input **358.23 × 54**, bg `#fff`, `1px solid #949596`, radius **4px**,
  padding-left 16px, text **20px #000**, placeholder `EMAIL`.
* Gap input → button **16px**. Button **69.77 × 54**, bg `#fff`, radius **6px**, no border,
  padding 0 10px, text `LET'S GO` **13px / 700 / #111**.
* @390: form 307.5 wide, input 215.73, button unchanged.

## 3. Menus — `.footer-background-container` › second `.site-footer_content`

* `.footer-background-container` wraps menus **+ payment + copyright** rows and carries
  `url(images/footer-background.jpg)` center / cover / no-repeat; only visible behind the
  menu row (the two bottom rows paint `#f2f2f2` over it).
* Row: full bleed, padding **16px 0**, border-bottom `1px #1d2a2b`.
* Inner row is `flex-wrap-reverse flex-lg-row justify-content-between` →
  **below 992px the menu nav renders ABOVE the brand column**.
* Brand column `col-12 col-lg-2` = **202.08 wide** (content 172), everything **centred**:
  * locale: h 33.59, `margin-bottom 16`, 12px / 400 / uppercase / `#fff`,
    US flag icon 16 × 12 + 4px, then caret; **hidden below 769px** (`d-none d-md-inline-block`).
  * logo: `footer-logo.svg` (viewBox 61.56 × 56.35, orange mark = top 49.2%) at
    `height:70` → box **76.47 × 70**, visible mark **76.47 × 34.4**, `margin-bottom 16`.
  * social: `<ul>` 94.02 wide centred; glyphs 18.67 × 27 at font-size 24px, pitch **37.67**;
    block height 50.39 (hidden label line), `margin-bottom 16`. Order **Facebook · Twitter · Instagram**.
* Nav `col-12 col-lg-10` = 1010.41 wide (content 323.34 → 1303.75), `justify-content: space-between`,
  4 content-width columns each with `margin-left 24px`, `margin-bottom 16px`.
  Column x / width @1440: 347.34/96.59 · 568.95/96.63 · 790.61/194.06 · 1109.69/194.06
  (last column flush with the `col-10` right edge).
* Header: **16px / 600 / uppercase / #fff**, height 22.39, `margin-right 16px`.
* Links: **12px / #fff**, item line-height **20px**, **no gap between header and first link**.
* Responsive < 769px: headers become **accordion toggles** (chevron `.toggle`, 10 × 10,
  rotates 180°→0°, transition .3s), panels `display:none` until opened; header/item padding
  `.25rem 0`; columns stack full width, 30.39 tall each, 16px apart; `ml-md-4` drops off.

## 4. Payment — `.footer-section-border-bottom` › `.site-footer_reinsurance-payment`

* bg `#f2f2f2`, 12px / 16.8px / #1d2a2b, row padding **16px 0**, wrapper
  **border-bottom `1px #1d2a2b` full bleed (0 → 1425)**.
* `.container` (max 1440) → left cell at x 15, right cell flush to 1410.
* Left: FA solid lock (`<i class="fas fa-lock">`, glyph box **9.34 × 14**) + space +
  "We guarantee every transaction is 100% secure."
  Build: `assets/spy-icon-lock.svg` — the FontAwesome 4 `fa-lock` path cropped to its tight
  bbox (`viewBox="320 128 1152 1408"`) at 9 × 11, `fill: currentColor`, inlined via a
  `custom-liquid` block so it takes the band's text colour.
* Right: `<ul>` right-aligned, `li { width:45px; margin:0 }`;
  visa/mastercard/paypal/amex = 40 × 24 centred in the 45 slot; apple-pay & google-pay = **45 × 45**
  (they set the 45px row height).
* < 769px: cells stack and centre; rows get 16px side padding; `.container` = 540 (768) / 100% (390).

## 5. Copyright — `.notice`

* bg `#f2f2f2`, 12px / 16.8px / #1d2a2b, padding **16px 0**, no border.
* Left: `Copyright © 2025 SPY Optic. All rights Reserved.` (`.copyright { text-align:center }`,
  only visible on mobile).
* Right: `list-inline`, `li margin-right 8px`, links inherit colour, **underline on hover**:
  Terms & Conditions · Privacy Policy · Privacy Preferences · Legal Notices.
* < 769px: both cells centre and stack (2 lines @768, legal wraps to 2 lines @390).

## Font caveat — do NOT trust text widths from the saved copy

The saved page has no font files, so DINNextLTPro falls back to Arial: every measurement
above that depends on *text* width (menu column widths 96.59 / 194.06, the 125.02 spread
between columns, the locale label wrapping to two lines, legal-link widths) is Arial-derived
and **wider than the real site**. Box geometry, paddings, line-heights, font sizes/weights
and colours ARE reliable. The build reproduces the source's *layout algorithm*
(content-width columns spread with equal gaps), so with the real DIN the positions follow.

## Build (implemented 2026-08-04)

| Band | Section | Notes |
|---|---|---|
| Value props | `spy-value-props` | col-10 grid, 4/2 columns, 48/80 column padding, whole column linked |
| Sign-up | `spy-email-signup` (new) | 450px form box, 200px min-height, side-by-side field at every width |
| Menus | `spy-footer` | brand `calc((100% + 30px) * 0.1666667 - 30px)` + 54px, link columns spread with `ml-auto` |
| Link column | `spy-footer-menu` (new block) | heading + `link_list`, `<details>` accordion below 769px, forced open above |
| Payment + copyright | `spy-footer-utilities` | one row per block, stepped container, full-bleed hairline between rows |

Menus come from Shopify menus `footer-company` · `footer-services` · `footer-policy` ·
`footer-programs` (created with the previously hard-coded links).

### Measured parity (source → build)

| Viewport | Source total | Build total |
|---|---|---|
| 1440 | 898.36 | 897.35 |
| 768 | 1325.3 | 1323.34 |
| 390 | 1431.66 | 1429.71 |

Every band height matches to <1px except the two deltas below.

### Known deviations

1. **Two invisible hairlines skipped** (−2px total): the source puts
   `border-bottom: 1px #1d2a2b` on the sign-up and menu rows — on a `#272727` band it is
   invisible, so it was left out rather than hard-coding a line colour.
2. **Empty menu items not reproduced**: the source's Policy and Programs columns end with a
   `&nbsp;` item, so its desktop band is ~20px taller. Matched with
   `padding_bottom_desktop: 36` on `spy-footer` instead of faking an empty link.
3. **Twitter mark**: the theme ships the current X glyph; the source still shows the old bird.
   Same box, same position, same order (Facebook · Twitter · Instagram).
4. **Locale flag**: only `US` has a flag asset (`spy-flag-us.svg`). Add more when other
   markets go live.

## Assets to re-host

| Source file | Use |
|---|---|
| `picto_livraison_gratuite.png` · `picto_retour_gratui.png` · `picto_garanti_bolle.png` · `picto_SAV.png` | value-prop icons (1500 × 1300 padded canvas) |
| `footer-logo.svg` | footer brand mark (61.56 × 56.35, mark in top half) |
| `footer-background.jpg` | menu band background (already in theme as `footer-background.webp`) |
| `footer_visa/_mastercard/_paypal/amex/apple-pay/google-pay.svg` | payment row |
