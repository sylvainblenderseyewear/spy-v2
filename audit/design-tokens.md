# SPY Optic — Design Tokens (Phase 0)

> Extracted from live site (computed styles, brand identity). Items marked `⚠️ MEASURE` require browser DevTools inspection at desktop 1440px before building. All tokens map to **Layer 1 (Theme Settings / settings_schema.json)**.

---

## 1. Color Palette

### Brand Core Colors

| Token Name | Hex | Usage |
|---|---|---|
| `color-brand-orange` | `#f57f29` | Primary accent — CTAs, badges, hover states, ATC button, sale indicators |
| `color-brand-slate` | `#2c393e` | Dark text, dark surfaces, nav backgrounds, footer background |
| `color-white` | `#ffffff` | Light surface backgrounds, card backgrounds, text on dark |
| `color-black` | `#000000` | Body text, headings (verify — may be near-black) |
| `color-sale-red` | `⚠️ MEASURE` | Sale price, strike-through color (likely a red variant) |
| `color-grey-light` | `⚠️ MEASURE` | Borders, dividers, input backgrounds |
| `color-grey-mid` | `⚠️ MEASURE` | Captions, secondary text, inactive swatches |

### Color Schemes (Horizon color-scheme architecture)

| Scheme Name | Background | Text | Accent | Usage |
|---|---|---|---|---|
| `scheme-default` | `#ffffff` | `#000000` (or near-black) | `#f57f29` | Main page content, product cards, body |
| `scheme-dark` | `#2c393e` | `#ffffff` | `#f57f29` | Footer, dark sections |
| `scheme-announcement` | `#2c393e` or `#000` | `#ffffff` | `#f57f29` | Announcement bar |
| `scheme-accent` | `#f57f29` | `#ffffff` | `#2c393e` | Sale badges, promo banners (verify exact bg) |
| `scheme-overlay` | `rgba(0,0,0,0.5–0.7)` | `#ffffff` | `#f57f29` | Hero image overlays, modal backdrops |

> **All hex values must be entered as named palette colors in Horizon's color-palette settings, NEVER hardcoded in Liquid or CSS.**

---

## 2. Typography

> ⚠️ CRITICAL: Exact font families require live browser DevTools inspection (`@font-face` in computed styles). The site uses SFCC which loads external CSS not accessible via HTML fetch. Inspect at `spyoptic.com` before setting up Layer 1 typography tokens.

### Observed Characteristics

- **Headings:** All-caps or uppercase transformation, condensed/tight tracking, sans-serif, heavy weight. Category tiles (SNOW, SAFETY, FISHING) render in bold all-caps. Product names (CYRUS SWITCH, MARAUDER) in heavy uppercase sans-serif.
- **Body:** Readable weight sans-serif, mixed case, standard tracking.
- **Price:** Bold, slightly larger than body.
- **Nav:** Medium weight sans-serif, mixed or all-caps.
- **Buttons:** All-caps or uppercase, medium-heavy weight.

### Typography Token Map (to confirm exact values with DevTools)

| Style | Role | Font Family | Size (px) | Weight | Line-Height | Letter-Spacing | Transform |
|---|---|---|---|---|---|---|---|
| `font-heading-1` | H1 product title, page title | ⚠️ TBD | ⚠️ TBD | 700–900 | ⚠️ TBD | tight | uppercase |
| `font-heading-2` | Section headlines | ⚠️ TBD | ⚠️ TBD | 700–800 | ⚠️ TBD | tight | uppercase |
| `font-heading-3` | Sub-section labels | ⚠️ TBD | ⚠️ TBD | 600–700 | ⚠️ TBD | normal | uppercase |
| `font-eyebrow` | Category labels (SNOW, SAFETY), overlines | ⚠️ TBD | 10–12px | 600–700 | 1.2 | wide | uppercase |
| `font-body` | Product descriptions, body copy | ⚠️ TBD | 14–16px | 400 | 1.5–1.6 | normal | none |
| `font-caption` | Filter labels, secondary info | ⚠️ TBD | 12–13px | 400 | 1.4 | normal | none |
| `font-price` | Product price display | ⚠️ TBD | ⚠️ TBD | 700 | 1.2 | normal | none |
| `font-button` | ATC, CTA button labels | ⚠️ TBD | 13–14px | 600–700 | 1 | wide | uppercase |
| `font-nav` | Primary navigation items | ⚠️ TBD | 13–14px | 500–600 | 1 | normal | mixed/none |
| `font-badge` | "New", "Sale", badge text | ⚠️ TBD | 10–11px | 700 | 1 | wide | uppercase |

### Font Asset Action Items (Phase 0 → Phase 1 gate)
1. Open DevTools → Network tab → filter "font" → record all font file URLs + families loaded on spyoptic.com
2. Identify if fonts are: (a) Google Fonts (free), (b) Adobe Fonts/Typekit (licensed), (c) custom/purchased (requires re-licensing for Shopify)
3. Download or re-host all @font-face files in the Shopify theme's `/assets/` folder
4. Verify licensing allows web use on new domain

---

## 3. Spacing Scale

> ⚠️ All values require DevTools measurement. Estimates based on visual observation.

| Token | Value (px) | Usage |
|---|---|---|
| `space-xs` | 4px | Micro gaps, inline badge padding |
| `space-sm` | 8px | Card inner padding, label gaps |
| `space-md` | 16px | Standard element spacing |
| `space-lg` | 24px | Section sub-element gap |
| `space-xl` | 32–40px | Section padding (mobile) |
| `space-2xl` | 48–64px | Section padding (desktop) |
| `space-3xl` | 80–96px | Major section separation |

---

## 4. Layout

| Token | Value | Notes |
|---|---|---|
| `page-width` | ⚠️ MEASURE | Max content container width (likely 1280–1440px) |
| `grid-columns-desktop` | 4 (PLP) | 4-column product grid on desktop |
| `grid-columns-tablet` | 2–3 | 2–3 column grid on tablet |
| `grid-columns-mobile` | 2 | 2-column grid on mobile |
| `grid-gutter` | ⚠️ MEASURE | Gap between product cards |
| `section-padding-desktop` | ⚠️ MEASURE | Vertical padding on content sections |
| `section-padding-mobile` | ⚠️ MEASURE | Mobile vertical padding |

---

## 5. Border Radii

| Token | Value | Usage |
|---|---|---|
| `radius-button` | ⚠️ MEASURE | ATC button, CTA buttons (appears minimal/sharp — 2–4px or 0) |
| `radius-card` | ⚠️ MEASURE | Product cards (likely 0 or 4px) |
| `radius-badge` | ⚠️ MEASURE | "New", sale badges |
| `radius-modal` | ⚠️ MEASURE | Modals (lens info, size chart) |
| `radius-input` | ⚠️ MEASURE | Form inputs |
| `radius-swatch` | circle or ⚠️ MEASURE | Color swatches (circular) |

---

## 6. Buttons

| Token | Primary | Secondary | Tertiary |
|---|---|---|---|
| Background | `#f57f29` (orange) | `#2c393e` (slate) or transparent | transparent |
| Text | `#ffffff` | `#ffffff` or `#2c393e` | `#2c393e` or current |
| Border | none | 1–2px solid | 1px solid |
| Border Color | — | — | `#2c393e` |
| Radius | ⚠️ MEASURE | ⚠️ MEASURE | ⚠️ MEASURE |
| Padding | ⚠️ MEASURE | ⚠️ MEASURE | ⚠️ MEASURE |
| Font Weight | 600–700 | 600–700 | 600 |
| Text Transform | uppercase | uppercase | uppercase |
| Hover State | darken / opacity | darken | fill/underline |

> Confirmed buttons: "Add to Cart" (primary = orange), "Buy in Prescription" (secondary), "Shop Now" CTAs (varies by context).

---

## 7. Badges & Labels

| Badge | Background | Text Color | Text | Notes |
|---|---|---|---|---|
| "New" badge | ⚠️ MEASURE (likely orange `#f57f29`) | `#ffffff` | NEW | Product card top-left |
| Sale/Discount | ⚠️ MEASURE (red or orange) | `#ffffff` | "30%" or "Price reduced" | Percentage off |
| Price strike-through | — | ⚠️ MEASURE | — | Original price crossed out |
| "N colors available" | — | ⚠️ MEASURE | "3 colors available" | Below swatch row |
| "Starting from" | — | ⚠️ MEASURE | "Starting from $200" | PLP price label |
| MIPS badge | white/brand | ⚠️ MEASURE | MIPS® | Helmet product cards |
| Happy Boost badge | ⚠️ MEASURE | ⚠️ MEASURE | Happy Boost™ | Tech indicator on cards |

---

## 8. Component Tokens

### Announcement Bar
- Height: ⚠️ MEASURE (est. 40px)
- Background: dark (slate `#2c393e` or black)
- Text: white + orange emoji
- Font: uppercase, small (11–13px), medium weight

### Navigation Header
- Height: ⚠️ MEASURE (est. 60–80px desktop, less on mobile)
- Background: white (default), may go dark on scroll
- Logo position: left (or center on mobile)
- Nav item style: medium weight, mixed-case or uppercase
- Sticky: yes (verify behavior)
- Mega-menu: dropdown overlay, multi-column grid

### Footer
- Background: `#2c393e` (slate dark)
- Text: white / light grey
- Columns: 4 link groups + social + payment icons
- Payment icons: Visa, Mastercard, PayPal, Amex, Apple Pay, Google Pay
- B Corp badge: present
- Copyright: "© 2025"

### Product Card (PLP)
- Aspect ratio: ⚠️ MEASURE (likely 3:4 or 1:1 for product images)
- Swatch size: ⚠️ MEASURE (small circles, ~16–20px)
- Price display: bold, below title
- Quick View: appears on hover (overlay button)
- Compare checkbox: visible on hover or always-on (verify)

### Modals (Lens Info, Size Chart, RX States)
- Overlay: dark semi-transparent backdrop
- Panel: white, centered
- Close button: top-right X
- Width: ⚠️ MEASURE

---

## 9. Breakpoints

> ⚠️ Exact breakpoints require CSS media query inspection. Standard Horizon breakpoints below — confirm against SFCC source to ensure pixel-perfect parity.

| Name | Min-Width | Context |
|---|---|---|
| `mobile` | 0 (390px reference) | Single column, stacked layout |
| `tablet` | ~768px | 2–3 col grid, smaller nav |
| `desktop` | ~990px or 1024px | Full mega-menu, 4-col grid |
| `desktop-xl` | ~1280px or 1440px | Max content width |

> The source mega-menu collapses to hamburger on mobile. Verify exact collapse breakpoint.

---

## 10. Imagery & Media

| Element | Format | Aspect Ratio | Notes |
|---|---|---|---|
| Product photos | JPG/WebP | ⚠️ MEASURE | Hosted on SFCC CDN (`demandware.static`), must be re-uploaded to Shopify |
| Category tiles (homepage) | JPG/WebP | ⚠️ MEASURE | Separate desktop + mobile assets (RESPONSIVE: separate settings) |
| Hero banner | JPG/WebP | ⚠️ MEASURE | Separate mobile/tablet/desktop images required |
| Feature banner (PDP) | JPG/WebP | ⚠️ MEASURE | desktop + mobile variants via `pdp.feature_banner_*` metafields |
| Technology icons | SVG or PNG | Square/icon | Used in lens-tech modal + tech guide pages |
| Swatch images | JPG/PNG | Square, small | Per-variant swatch images |
| Logo | SVG | ⚠️ MEASURE | White inverse version needed for dark surfaces |
| B Corp badge | SVG/PNG | Square | Footer |

---

## Layer 1 Theme Settings Checklist

These must all be wired to `config/settings_schema.json` before any code is reviewed:

- [ ] Color palette: all brand colors as named palette entries
- [ ] Color schemes: default, dark, announcement, accent
- [ ] Typography: font-family selection for heading + body independently
- [ ] Typography: size/weight/line-height/letter-spacing per style (H1–H3, eyebrow, body, caption, price, button, nav, badge)
- [ ] Button styles: primary/secondary/tertiary (bg, text, border, radius, padding)
- [ ] Border radii: button, card, badge, modal, input
- [ ] Page width max
- [ ] Section spacing (desktop + mobile)
- [ ] Grid gutter
- [ ] Logo (+ inverse for dark backgrounds)
- [ ] Favicon
- [ ] Badge colors + labels ("New", sale %)
- [ ] Announcement bar: bg color, text color
- [ ] Footer: bg color scheme assignment

**Acceptance test:** change `#f57f29` → any other color in ONE theme setting → orange disappears everywhere on the site with zero code edits.
