# Page Spec: PDP — Eyewear Default (`product.default`)

**Representative URL:** https://www.spyoptic.com/us/sunglasses/cyrus-switch-257654.html  
**Product:** CYRUS SWITCH ($200)  
**Template:** `product.default`  
**Covers:** Sunglasses (all subcategories), Eyeglasses (same template, note differences), Accessory/Case  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390 (⚠️ capture before Phase 1 build)

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Horizon Block | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|---|
| 1 | Announcement Bar | Same as homepage | Shared section group | No (shared) | — |
| 2 | Navigation Header | Same as homepage | Shared section group | No (shared) | Yes |
| 3 | Breadcrumb | Sunglasses › CYRUS SWITCH | Custom breadcrumb block | Yes | — |
| 4 | Product Gallery | Multi-image grid + video thumbnail. Main image large left, thumbnails right (desktop). Full-width scroll on mobile. | Horizon media gallery (restyled) | Style custom | Yes — layout flips mobile |
| 5 | Product Info Column (sticky right) | Title, price, rating, stock, variant selectors, ATC, trust, RX | CUSTOM block assembly | Yes | ATC goes sticky bottom on mobile |
| 5a | Product Title | CYRUS SWITCH | Block: product-title | Style | — |
| 5b | Price | $200. "Starting from" when variant range. | Block: product-price | Style | — |
| 5c | Star Rating | 5/5 Customer Rating (link to reviews) | CUSTOM reviews-widget block | Yes | — |
| 5d | Stock Status | "In Stock" indicator | Block: product-stock | Style/Custom | — |
| 5e | Frame Color Swatches | Swatch images + label, selected state, hover preview | CUSTOM variant-swatch-picker | Yes | — |
| 5f | Lens Selector | Dropdown or swatch (⚠️ MEASURE exact UI) | CUSTOM variant-picker | Yes | — |
| 5g | Extra Lens Selector | Dropdown — add-on lens option | CUSTOM variant-picker | Yes | — |
| 5h | Lens Info Trigger | "Read more" link → Lens Info Modal | CUSTOM trigger | Yes | — |
| 5i | Size Chart Trigger | "Size Chart" link → modal | CUSTOM trigger | Yes | — |
| 5j | Quantity Selector | 1–10 stepper | Horizon qty | Style | — |
| 5k | Add to Cart Button | "Add to Cart" (orange, full-width on mobile) | Horizon ATC | Style | Sticky on mobile |
| 5l | Buy in Prescription | Secondary button → RX modal or SportRx link | CUSTOM button block | Yes | — |
| 5m | Trust Badges (inline) | Free ship · Returns · Warranty · PayPal Pay-in-4 | CUSTOM trust-badge-row | Yes | Stack on mobile |
| 6 | Lens Info Modal | VLT %, Lens Category (Cat 0–4), Base Tint, technology icons + blurbs. Triggered by "Read more". | CUSTOM modal block | Yes | Full-screen on mobile |
| 7 | RX States Modal | States where RX is available. "Buy in Prescription" trigger. | CUSTOM modal block | Yes | — |
| 8 | Size Chart Modal | Image or table from `size_chart` metaobject | CUSTOM modal block | Yes | — |
| 9 | Description | Long-form product description (`pdp.long_description` rich text) | CUSTOM rich-text block | Yes | — |
| 10 | Technical Information | Spec table — renders only populated `spec.*` fields. Does NOT show goggle/helmet fields on eyewear. | CUSTOM spec-table block | Yes | — |
| 11 | Feature Banner | Desktop + mobile marketing image (`pdp.feature_banner_desktop` / `_mobile`). Optional CTA overlay. | CUSTOM feature-banner block | Yes | Yes — 2 image slots |
| 12 | Complete Your Selection | Product recommendations carousel — complementary products (Shopify Search & Discovery). | CUSTOM recommendations-carousel | Yes | Scroll mobile |
| 13 | Others Also Like | Product recommendations — related products. VTO indicator present ("VTO loading…"). | CUSTOM recommendations-carousel | Yes | Scroll mobile |
| 14 | Footer | Shared section group | Same as homepage | No (shared) | — |

---

## Detailed Module Specs

### Product Gallery
- **Desktop layout:** main image left (large), thumbnail strip right or below. Video thumbnail present.
- **Mobile layout:** full-width image carousel, thumbnails as dot indicators or row below
- **Image count:** typically 4–8 images per product
- **Video:** embedded product video (thumbnail click to play)
- **Zoom:** ⚠️ MEASURE — hover zoom or click-to-zoom behavior
- **RESPONSIVE:** yes — layout changes at tablet/mobile

### Variant Pickers
- **Frame Color:** swatch grid — small circular or square images. Label updates when selected. Hover preview shows image change in gallery.
- **Lens:** dropdown or swatch row — lens name (e.g., "Happy Gray Green & Happy Gray Green with Black Mirror")
- **Extra Lens:** dropdown
- **Swatch images:** per-variant metafield `variant.swatch` (file)
- **Selected state:** border/ring highlight ⚠️ MEASURE color/width

### Add to Cart
- **Color:** orange `#f57f29`
- **Width:** full-width on mobile; contained width on desktop
- **Sticky mobile:** fixed bottom bar on scroll — ATC + price visible at all times
- **State:** disabled/out-of-stock style ⚠️ MEASURE

### Lens Info Modal
- **Trigger:** "Read more" link near lens selector
- **Content:**
  - VLT % (from `spec.vlt_percent`)
  - Lens Category: Cat 0–4 visual scale indicator
  - Base Tint (from `spec.base_tint`)
  - Technology icons grid: icon + name + short_blurb from `technology` metaobjects
- **Layout:** modal overlay, scrollable content
- **Custom:** yes — reads metafields, not a stock Horizon modal

### Technical Information Table
- **Renders only populated fields** — if `spec.polarized` is null, row is hidden
- **Fields (eyewear default — `spec.*` namespace only):**
  - Reference, Fit, Dimensions, Weight, Product Material, Frame Colour, Lens Material, Lens Name, Additional Lenses, Lens Category, Additional Lens Category, VLT, VLT Additional Lens, Lens Shape, Photochromy, Polarization, High Contrast, Base Tint, Mirror Tint, Lens Coating, Technologies, Available with RX, Interchangeable Lenses, Included Accessories, Certifications
- **`goggle.*` fields NOT rendered on `product.default` template**
- **`helmet.*` fields NOT rendered on `product.default` template**

### Feature Banner
- **Position:** below tech info table, above carousels
- **Assets:** `pdp.feature_banner_desktop` (file) + `pdp.feature_banner_mobile` (file)
- **RESPONSIVE:** yes — separate images, separate settings

---

## TEMPLATE vs. DATA Split

| Element | Type | Source |
|---|---|---|
| Gallery layout, media count | TEMPLATE | — |
| Variant picker UI, ATC button, sticky behavior | TEMPLATE | — |
| Modal shells (lens info, size chart, RX) | TEMPLATE | — |
| Spec table renderer (which fields, order, null-hide logic) | TEMPLATE | — |
| Recommendations carousel shells | TEMPLATE | — |
| Product title, price | TEMPLATE (reads Shopify product) | Shopify product data |
| Frame color swatches | DATA | `variant.swatch` (file metafield) |
| VLT, lens category, base tint | DATA | `spec.vlt_percent`, `spec.lens_category`, `spec.base_tint` |
| Technology icon + blurb | DATA | `technology` metaobjects (via `spec.technologies`) |
| Long description | DATA | `pdp.long_description` (rich_text) |
| Feature banner images | DATA | `pdp.feature_banner_desktop`, `pdp.feature_banner_mobile` |
| Size chart | DATA | `pdp.size_chart` → `size_chart` metaobject |
| Spec table all rows | DATA | `spec.*` metafields |

---

## Responsive Behavior Summary

| Section | Desktop 1440 | Tablet 768 | Mobile 390 |
|---|---|---|---|
| Gallery | 2-col (main + thumbs) | 2-col or stacked | Full-width carousel |
| Info column | Right column, sticky | Stacked below gallery | Stacked below gallery |
| ATC button | Inline in info column | Inline | Sticky fixed bottom bar |
| Trust badges | Horizontal row | Horizontal row | 2×2 or stacked |
| Feature banner | Desktop image | Desktop or tablet image | Mobile image |
| Carousels | 3–4 cards visible | 2 cards visible | 1.5 cards visible (scroll) |

---

## Interactions / Animations

| Interaction | Behavior | Duration / Easing |
|---|---|---|
| Swatch hover | Gallery image swap to swatch color | ⚠️ MEASURE (est. immediate or 100–200ms) |
| Gallery image click / zoom | ⚠️ MEASURE | ⚠️ MEASURE |
| Lens Info Modal open | Fade + scale in | ⚠️ MEASURE |
| ATC sticky appear | ⚠️ MEASURE scroll threshold | ⚠️ MEASURE |
| ATC hover | Background darken | est. 200ms |

---

## Measurements to Capture (DevTools, at 1440px)

- Max content width of product grid (2-col layout total width + each column width)
- Gallery main image height/aspect ratio
- Info column max-width
- Variant swatch size (px)
- Trust badge icon size + label font size
- Spec table row height, label font weight/size, value font weight/size
- Feature banner height at each breakpoint
- Carousel card width + gap

---

## Notes / Flags

- "Buy in Prescription" button behavior TBD (see Open Decisions §9 in CLAUDE.md)
- VTO ("VTO loading…") present in "Others Also Like" area — scope TBD
- Trust badge copy has inconsistency between PDP ("Free Shipping for any order over $100") and homepage ("over $50") — confirm canonical threshold
- "2-year warranty on all products" and "Lifetime warranty" both appear — confirm correct copy
