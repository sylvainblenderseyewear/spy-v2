# Page Spec: Collection — Curated / Story (`collection.story`)

**Representative URLs:**  
- https://www.spyoptic.com/us/collections/sunglasses/happy-boost-sun-collection/  
- https://www.spyoptic.com/us/collections/goggles-ski-snowboard/happy-boost-snow-collection/  
**Template:** `collection.story`  
**Covers:** Happy Boost Sun/Snow, Discord Series, Helm Series, Trail, Classics, Lifestyle, Flag, SLAYco, Spy+ Merch  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Observed Characteristics

The current "curated" collection pages are closer to **enhanced PLPs** than full editorial pages. They have:
- Collection title (no hero banner found on Happy Boost pages crawled)
- Standard product grid with filtering + sorting
- Compare functionality (more prominent than standard PLPs)
- "New" badges on products
- Breadcrumb: Home › Collections › [Sub] › [Collection]

The `collection.story` template in Shopify can add editorial content on top of the standard grid. However, based on recon, some "curated" collections may just need styling differences rather than fully unique layouts.

---

## Section Inventory (Top → Bottom) — Best Estimate

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Collection Hero | Hero image + collection headline (from `collection_story.hero` + `collection_story.headline` metaobject) | CUSTOM collection-story-hero | Yes | Yes |
| 4 | Editorial Narrative | Rich text story copy (from `collection_story.body`) | CUSTOM editorial-copy block | Yes | — |
| 5 | Filter + Sort Bar | Same as `collection.default` | CUSTOM filter-bar | Yes | Drawer mobile |
| 6 | Product Grid | Product cards — same card as `collection.default` | CUSTOM product-grid | Yes | 4→2-col |
| 7 | Featured Products Call-out | Highlighted 2–3 hero products (from `collection_story.featured_products`) | CUSTOM featured-products block | Yes | Stack mobile |
| 8 | Footer | Shared | No (shared) | — |

---

## `collection_story` Metaobject Fields (from schema)

| Field | Type | Usage |
|---|---|---|
| `headline` | single_line_text | H1 or hero headline |
| `hero` | file | Hero image (separate desktop/mobile needed — ⚠️ extend schema) |
| `body` | rich_text | Editorial narrative copy |
| `featured_products` | list.product_reference | 2–3 featured/hero products |

> ⚠️ Schema extension: Add `hero_mobile` (file) to `collection_story` metaobject for responsive hero images.

---

## Compare Feature (more prominent on curated collections)

- "Hide Compare / Show Compare / Clear All" interface
- Select 2+ products → bottom comparison bar → Compare overlay/page
- **Open Decision:** keep or drop for launch? (See Open Decisions)

---

## When to Use `collection.story` vs `collection.default`

| Condition | Template |
|---|---|
| Standard category with functional navigation (Sunglasses, Goggles, etc.) | `collection.default` |
| Named curated collection with brand story / lifestyle editorial | `collection.story` |
| Happy Boost, Discord, SLAYco, Helm, Trail, Classics, Flag, Lifestyle, Crypto Merch | `collection.story` |

---

## TEMPLATE vs. DATA Split

| Element | Type | Source |
|---|---|---|
| Hero section layout | TEMPLATE | — |
| Hero image + headline | DATA | `collection_story.hero` + `collection_story.headline` |
| Editorial copy | DATA | `collection_story.body` |
| Featured products | DATA | `collection_story.featured_products` |
| Product grid (standard) | TEMPLATE + DATA | Shopify collection products |
| Filter facets | DATA | Search & Discovery configuration |
