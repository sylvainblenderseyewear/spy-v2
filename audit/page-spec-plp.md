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
| 3 | Collection Hero | H1 headline ("Ski and Snowboard Goggles"), hero image. Background image with text overlay or text below image (⚠️ MEASURE exact layout). | CUSTOM collection-hero block | Yes | Yes — separate images |
| 4 | Intro Copy | Expandable "read more/less" text block — `collection.intro_copy` rich text metafield | CUSTOM expandable-text block | Yes | — |
| 5 | Filter + Sort Bar | Sticky filter bar on desktop. Facets: Category, Color, Price Range, Lens Tech (Cat 1/2/3). Sort: Most Popular / Price ↑ / ↓. | CUSTOM filter-bar (Shopify Search & Discovery integration) | Yes | Drawer on mobile |
| 6 | Product Grid | Multi-column grid of product cards | CUSTOM product-grid | Yes | 4-col desktop, 2-col tablet+mobile |
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
- **H1:** Collection name ("Ski and Snowboard Goggles")
- **Image:** `collection.hero_image` file metafield — **RESPONSIVE: separate desktop/mobile settings**
- **Intro text:** paragraph below or overlaid on hero
- **Breadcrumb:** Home › Goggles › Snow Goggles

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
| Product grid | 4 columns | 2–3 columns | 2 columns |
| Hero image | Desktop image | ⚠️ tablet image or desktop | Mobile image |
| Intro copy | Show ~3 lines → read more | Same | Same |
| Compare bar | Bottom fixed bar | Bottom fixed bar | Bottom fixed bar |

---

## Breakpoint-Specific Settings Required

1. **Collection hero image:** separate desktop (`collection.hero_image_desktop`) + mobile (`collection.hero_image_mobile`) image settings
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
