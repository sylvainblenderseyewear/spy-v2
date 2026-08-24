# Page spec — 404 (Page not found)

Source: `https://www.spyoptic.com/us/<any-missing-url>` (HTTP 404, title "404 Error page").
Measured live with Playwright at 1440 / 768 / 390 on 2026-08-24 (computed styles, not the saved copy —
`reference/404page/404 Error page.html` has no error-page CSS in its saved `global.css`).

The source renders 404 through SFCC's **checkout chrome**: no nav, no search, no cart, no announcement bar,
no footer menus, no email signup, no value props. Logo-only header + dark logo band + the two utility rows.

---

## 1. Layout skeleton

| Band | Source markup | Notes |
|---|---|---|
| Header | `header.site-header.site-header_slim > .main-menu > .navbar > .d-flex.justify-content-center.p-3 > .navbar-brand > a > img.logo-not-found` | logo only, centred |
| Content | `section.main-content.mt-5.pt-5` → `.hero.error-hero > h1.page-title` + `.container > h2.error-message` + `.row > .col-sm-6.offset-sm-3 > a.btn.btn-primary.btn-block` | |
| Footer | `footer.site-footer > .site-footer__inner-container` → brand band + reinsurance/payments row + notice row | |

Footer is pushed to the bottom of the viewport when the page is short (source uses a JS margin-top on
`footer.site-footer`; measured 261px @900 tall, 561px @1200 tall — i.e. always flush to the viewport bottom).

---

## 2. Header (slim)

| Property | Value |
|---|---|
| `min-height` | **56px** below 769px · **110px** at ≥769px |
| Background | white (page background, no fill of its own) |
| Border | none (`.site-header_slim .main-menu { border-bottom: 0 }`) |
| Inner | `display:flex; align-items:center; justify-content:center; width:100%; padding:16px` |
| Brand box | `padding: 5.2px 0` → inner box 50.4px tall, so header inner = 82.4px at every width |
| Logo | `img` 80 × 40 (`max-width: 80px`), source `logo.svg` = orange box + white SPY+ |
| Logo top | y = **21.2px** at 1440 **and** 390 (16px padding + 5.2px brand padding) |
| Link | `https://www.spyoptic.com/us/` (home) |

At ≥769px the 110px `min-height` leaves ~28px of empty space **below** the logo — the logo is NOT centred
in the 110px box, it stays at y=21.2.

---

## 3. Content

Container ladder (site-wide): `100% / 540 / 720 / 1140 / 1440` at `544 / 769 / 992 / 1200`, padding `0 15px`.

| Element | Value |
|---|---|
| `.main-content` | `margin-top: 48px` (mt-5) + `padding: 48px 0` (pt-5 + `.main-content` pb 3rem) → **96px above the h1 box**, 48px below the button |
| h1 "Sorry!" | full-bleed (outside the container), `text-align:center`, `margin: 16px 0 8px` |
| h1 type | `font-size: min(32px, calc(21.2px + 0.9vw))` · `line-height: 1.2` · `weight 600` · color `#1d2a2b` · no uppercase |
| h2 "We cannot find the page you are looking for!" | inside the container, centred, `margin: 0 0 8px` |
| h2 type | `font-size: min(28px, calc(20.8px + 0.6vw))` · `line-height: 1.2` · `weight 600` · color `#1d2a2b` |
| Button row | `.row` `margin: 0 -15px` · `.col-sm-6.offset-sm-3` `padding: 0 15px`, `width:100%` below 544px, `50%` centred at ≥544px |
| Button | `display:block; width:100%` · bg `#f27e37` · border `1px solid #f27e37` · color `#fff` · radius **0** |
| Button type | `12px / 16.8px`, weight 400, **uppercase**, letter-spacing normal |
| Button padding | `8px 12px` → height **34.8px** |
| Button hover | bg + border `#272727`, color `#fff` (`.btn.btn-primary:hover` beats Bootstrap's `#f06713`) |
| Transition | `color/background-color/border-color/box-shadow .15s ease-in-out` |
| Button link | home |

### Measured type + widths

| Viewport | h1 | h2 | container | button |
|---|---|---|---|---|
| 390 | 24.71 / 29.65 | 23.14 / 27.77 | 100% (360 inner) | 360 |
| 768 | 28.11 / 33.73 | 25.41 / 30.49 | 540 | 240 |
| 1440 | 32 / 38.4 | 28 / 33.6 | 1440 | 690 |

Vertical rhythm at 1440 (from page top): header 110 · gap 48 · pad 48 · h1 mt 16 → h1 @222 (38.4 tall) ·
8 · h2 @268.4 (33.6) · 8 · button @310 (34.8) · pad 48 → content ends 392.8.

---

## 4. Footer (slim)

`.site-footer__inner-container` background **#272727**.

| Row | Value |
|---|---|
| Brand band | container + `text-center`, `padding: 16px 0` below 769px, **24px** at ≥769px |
| Brand logo | `footer-logo.svg` (viewBox 61.56 × 56.35) rendered **76.5 × 70** at every breakpoint, links home |
| Wrapper | `.footer-section-border-top/bottom` → `1px solid #1d2a2b` above and below the payments row |
| Payments row | bg **#f2f2f2**, `padding: 16px 0`, `12px / 16.8px`, color `#1d2a2b` |
| Payments content | left: 🔒 "We guarantee every transaction is 100% secure." · right: visa · mastercard · paypal · amex · apple pay · google pay. Stacks and centres below 769px |
| Notice row | bg **#f2f2f2**, `padding: 16px 0`, same type |
| Notice content | left: "Copyright © 2025 SPY Optic. All rights Reserved." · right: Terms & Conditions · Privacy Policy · Privacy Preferences · Legal Notices |

Content of both rows is byte-identical to the main site footer (same SFCC content assets
`footer-reinsurance-payment` / `footer-legal`), so the theme reuses `spy-footer-utilities` as-is.

---

## 5. Theme implementation

| Source part | Theme |
|---|---|
| Slim header | `sections/spy-slim-header.liquid` in `sections/header-404-group.json` |
| Content | `sections/spy-404.liquid` in `templates/404.json` |
| Dark logo band | `sections/spy-slim-footer.liquid` in `sections/footer-404-group.json` |
| Payments + notice rows | existing `sections/spy-footer-utilities.liquid` (config copied from `footer-group.json`) |
| Chrome swap | `layout/theme.liquid` picks the 404 groups on `request.page_type == '404'` |
| Sticky footer | `<main>` gets `grow` on 404 — `.page-wrapper` is already `flex column; min-height:100dvh` |

Everything is Layer 2 (section settings): title, message, button label/link, colours, type sizes and padding.
No product grid — the source has none.
