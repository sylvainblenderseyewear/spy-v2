# Page Spec: PLP — Collection Default (`collection.default`)

**Representative URL:** https://www.spyoptic.com/us/goggles/snow-goggles/  
**Template:** `collection.default`  
**Covers:** All standard category pages (Sunglasses, Snow Goggles, Moto Goggles, Snow Helmets, Eyeglasses, Gear, Sale sub-pages)  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Collection Hero | H1 headline ("Ski and Snowboard Goggles") over the art at its own ratio; title only when a category has no art. Measured — see Collection Hero below. | CUSTOM `spy-collection-hero` | Yes | Yes — desktop/mobile images, switch at 769px |
| 4 | Intro Copy | Expandable "read more/less" text block — `collection.intro_copy` rich text metafield | CUSTOM expandable-text block | Yes | — |
| 5 | Filter + Sort Bar | Sticky filter bar on desktop. Facets: Category, Color, Price Range, Lens Tech (Cat 1/2/3). Sort: Most Popular / Price ↑ / ↓. | CUSTOM filter-bar (Shopify Search & Discovery integration) | Yes | Drawer on mobile |
| 6 | Product Grid | Multi-column grid of product cards | CUSTOM product-grid | Yes | 1 col to 768, 2 from 769, 3 from 992, 4 from 1459.2px; 24 per page + "More results" (+24) |
| 7 | Bottom SEO Content | Expandable content blocks: "WHAT ARE POLARIZED SKI GOGGLES?", "WHAT ARE OTG SKI GOGGLES?" — `collection.seo_content` rich text | CUSTOM seo-content block | Yes | — |
| 8 | Category Cross-Links | Related category links (Snow Goggles ↔ Moto Goggles) | CUSTOM category-links block | Yes | — |
| 9 | Trust Row | Shipping, Returns, Warranty, Contact | Custom trust-badge-row | Yes | — |
| 10 | Footer | Shared | No (shared) | — |

---

## Product Card (PLP Card)

| Element | Notes |
|---|---|
| Product image | Main colorway image. Changes on swatch hover (⚠️ MEASURE) |
| Color swatch row | Small circular swatches below image. On hover: image changes, color label updates. |
| "N colors available" | Text label below swatches ("3 colors available") |
| Product name | Linked, uppercase or mixed case |
| Price | "Starting from $280" or flat "$200". Sale: strikethrough original + bold sale price + badge |
| "New" badge | Top-left corner of image (orange background, white "NEW") |
| Discount % badge | "30%" or "Price reduced" badge on sale items |
| Quick View button | Appears on hover (desktop). Shows product modal or mini-PDP. |
| Compare checkbox | Visible on hover or always-shown (⚠️ MEASURE). "Compare" bottom bar appears when 2+ selected. |
| MIPS / Happy Boost badges | Technology indicator badges on applicable products |

---

## Filter Facets

| Facet | Options | Implementation |
|---|---|---|
| Category | Snow Goggles, Motocross Goggles | Product type or collection |
| Color | Black, Blue, Green, Grey, Pink, Beige, Brown | Product option or tag |
| Price Range | Slider: $25–$340 | Price filter |
| Lens Tech | Cat. 1, Cat. 1 to 3, Cat. 2, Cat. 3 | `spec.lens_category` metafield filter |

> Shopify Search & Discovery app must be configured with metafield-based filters for Lens Tech Category.

**Sunglasses PLP has additional facets:**
- Color: Black, Blue, Green, Grey, Orange, Red, Pink, Beige, Brown
- Price: $5–$260

---

## Sort Options
- Most Popular (default)
- Price Low to High
- Price High to Low

---

## Collection Hero
Measured live 28 Oct 2026 (`.category-banner`, search.css) and matched on the preview theme to 0.01px.

- **Image:** `<picture>`, desktop crop from **769px**, mobile crop below. No tablet crop. `width:100%; height:auto`, so the
  band is as tall as the art: 1920×300 → 225px at 1440, 1920×400 → 300px, 800×400 → 384px at 768 and 195px at 390.
- **H1:** DIN 400, uppercase, `line-height:1.2`, no letter spacing, white. Size **1.8vw** from 769 (25.92px at 1440),
  **3vw** 544–768 (23.04px at 768), **4vw** below 544 (15.6px at 390).
- **Name box:** overlay `position:absolute; inset:0`, flex, vertically centred, 15px side padding. The box is
  `calc(66% - 2rem)` wide from 769px and `calc(50% - 1rem)` below, text centred in it (898.59 / 353 / 164px).
- **Two-line titles:** five categories (both Replacement Lenses, Sunglass Cases, Youth Motocross Goggles, Motocross
  Goggle Accessories) wrap the name in `<span style="font-size:22px">…<br>…</span>`. The H1 keeps its vw line box.
- **No image** (Discord Series, Helm Series): `.search-banner-empty`, no band. The name is in flow, `#1d2a2b`,
  `margin-top:16px`, same sizes and box.
- **Breadcrumb** (`.breadcrumb`, measured 28 Oct): 8px under the banner, min 32px tall, crumbs centred; below
  992px a 16px bottom pad pins them to the top (row 38.4px). Each `li` is 16px / 22.4px holding a 12px/16px
  inline-block link, so the text starts **17.8px** under the banner from 992 and **13px** below; the intro text
  then starts at 41 / 47.4px. Separator `/` 16px regular, 8px each side. Colour stays `--color-spy-muted`
  (#767676): the source's #a6a6a6 fails AA. Built in `snippets/spy-breadcrumbs.liquid`; matched to the pixel.
- **Still differs (not part of the breadcrumb):** page margin 45.7px at 1024 and 15px from 769 to 991 on the
  source vs 32px on ours (grid included); the source intro always collapses to one line + "Read more ▾"
  (ours shows short copy in full, and the Sunglasses copy differs); at 768 the source shows the mobile
  Filter + Sort bar (two half-width controls) where ours shows the desktop one.
- **Data:** every category's heading and art is in `audit/plp-hero-source.csv` (`collection.hero_*` metafields).

---

## Intro Copy (Read More/Less)
- Collapsed by default — shows ~2–3 lines then "Read more" expands
- Full text from `collection.intro_copy` (rich_text metafield)
- Animates expand/collapse (⚠️ MEASURE duration)

---

## SEO Bottom Content
- Multiple expandable FAQ/content blocks (accordion or read-more per block)
- From `collection.seo_content` rich_text metafield
- Example blocks: "What are polarized ski goggles?", "What are OTG ski goggles?"
- Positioned below product grid for SEO value without disrupting UX

---

## Responsive Behavior

| Element | Desktop 1440 | Tablet 768 | Mobile 390 |
|---|---|---|---|
| Filter bar | Horizontal, sticky sidebar or top-bar | Horizontal compressed | "Filter" button → slide-up drawer |
| Product grid | 3 columns (4 from 1459.2px) | 1 column (2 from 769px) | 1 column |
| Hero image | Desktop image (from 769px) | Mobile image (2:1, 384px tall) | Mobile image |
| Intro copy | Show ~3 lines → read more | Same | Same |
| Compare bar | Bottom fixed bar | Bottom fixed bar | Bottom fixed bar |

---

## Breakpoint-Specific Settings Required

1. **Collection hero image:** separate desktop (`collection.hero_image`) + mobile (`collection.hero_image_mobile`) metafields, switching at 769px
2. **Filter:** mobile = drawer trigger; desktop = inline bar

---

## TEMPLATE vs. DATA Split

| Element | Type | Source |
|---|---|---|
| Grid layout, card shell, filter bar integration | TEMPLATE | — |
| Product cards (images, price, name, swatches) | DATA | Shopify product + variant data |
| "N colors" count | DATA | Variant count logic |
| "New" badge | DATA | `pdp.badge_new` (bool) or product tag `new` |
| Sale badge + strikethrough | DATA | Shopify compare_at_price |
| Lens Tech filter values | DATA | `spec.lens_category` metafield |
| Hero image | DATA | `collection.hero_image` metafield |
| Intro copy | DATA | `collection.intro_copy` metafield |
| SEO bottom content | DATA | `collection.seo_content` metafield |

---

## Quick View Behavior (⚠️ Decision Needed)

Current site: Quick View → modal with product selector, ATC. Options for Shopify rebuild:
- Horizon's native quick-add drawer (simplified)
- Custom modal replicating full variant selector + ATC (preferred for 1:1 fidelity)
- Remove / send to PDP (simplest)

See Open Decisions.
