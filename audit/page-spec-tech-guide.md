# Page Spec: Tech Feature Guide (`page.tech-guide`)

**Representative URLs:**  
- https://www.spyoptic.com/us/SnowTech.html (Snow Goggle Tech)  
- https://www.spyoptic.com/us/SnowHelmetTech.html (Snow Helmet Tech)  
**Template:** `page.tech-guide`  
**Covers:** SnowTech, SnowHelmetTech, HappyLens, HappyBoost (4 pages total)  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Current Site Structure

Currently these are **static HTML pages** with hardcoded content and embedded product feeds. On Shopify, they must be rebuilt as **metaobject-driven templates** so content is editable without code.

---

## Section Inventory (Top → Bottom) — SnowTech Representative

| # | Section / Module | Content | Horizon Block | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|---|
| 1 | Announcement Bar | Shared | Shared | No (shared) | — |
| 2 | Navigation | Shared | Shared | No (shared) | Yes |
| 3 | Hero Banner | Headline: "FOR THE SLOPE SLAYERS AND PARK PIRATES". Subheadline + background image. CTA: "SHOP SNOW" → snow goggles PLP | CUSTOM hero block | Yes | Yes — separate desktop/mobile images |
| 4 | Technology Section — Lens Change Systems | Headline + 3 tech cards: DEADBOLT™, LOCK STEADY™ 2, QUICK DRAW. Each: name, description (1-2 sentences), visual/icon | CUSTOM tech-card-grid block | Yes | Grid → stack mobile |
| 5 | Technology Section — Lens Types | Headline + 3 tech cards: ARC® SPHERICAL LENS, CYLINDRICAL LENS, TORIC LENS. Same card structure. | CUSTOM tech-card-grid block | Yes | Grid → stack mobile |
| 6 | Technology Section — Happy Lens Tech | Full-width feature: headline + body text + image. | CUSTOM tech-feature-full block | Yes | Yes |
| 7 | Technology Section — Light Condition Coverage | 4 scenario images (light conditions) + labels | CUSTOM light-conditions block | Yes | Grid → scroll mobile |
| 8 | Technology Section — Anti-Fog Coating | Text + image block | CUSTOM tech-feature-full block | Yes | Yes |
| 9 | Technology Section — Additional Features | Icon grid: UV protection, etc. | CUSTOM icon-grid block | Yes | — |
| 10 | Product Grid — Snow Goggles | 5 featured goggle products with color variants + Quick View | CUSTOM product-grid block (collection) | Yes | 3-col → 2-col → 2-col |
| 11 | Product Grid — Replacement Lenses | 5 featured replacement lenses | CUSTOM product-grid block | Yes | — |
| 12 | Footer | Shared | Shared | No (shared) | — |

---

## SnowHelmetTech Sections

| # | Section | Content |
|---|---|---|
| 1–2 | Shared (Ann. Bar + Nav) | — |
| 3 | Hero | Headline: intergalactic shred shields; CTA "SHOP SNOW HELMETS" |
| 4 | MIPS® Section | Feature: rotational motion protection, low friction layer, diagram |
| 5 | Adjustable Fit Systems | Snug Life feature with description |
| 6 | Ventilation Systems | Active (adjustable) + Passive (fixed) — 2 sub-cards |
| 7 | Construction | ABS shell description |
| 8 | Product Grid | Helmet products (GALACTIC MIPS, LIL GALACTIC MIPS) |
| 9 | Cross-sell | "EXPLORE GOGGLES" CTA |
| 10 | Footer | Shared |

---

## Metaobject-Driven Architecture for `page.tech-guide`

The tech guide template should be **fully metaobject-driven** — the `technology` metaobject powers all content:

### Technology Metaobject Fields (already in schema)
- `name` — tech name (e.g., "DEADBOLT™")
- `icon` (file) — SVG or PNG icon
- `short_blurb` — 1–2 sentence description
- `long_description` (rich_text) — extended explanation with diagrams
- `link` (url) — optional deep-link

### Additional fields needed for tech guide pages
- `tech_guide_image` (file) — feature image for full-width sections
- `tech_guide_category` (single_line_text) — group label (e.g., "Lens Change Systems", "Lens Types")
- `tech_guide_order` (number_integer) — display order within category

### Template Section Types (all driven by `technology` metaobjects)
1. **Hero** — page-level hero image + headline + CTA (page section setting, not metaobject)
2. **Tech Category Group** — a grouped section with headline + grid of technology cards
3. **Tech Feature Full** — single technology highlighted full-width (image + long_description)
4. **Light Conditions Grid** — special grid of 4 condition scenarios (may need a separate `lens_condition` metaobject)
5. **Product Collection Grid** — embedded product grid (collection reference, Layer 2 setting)

---

## Technology Cards (per card spec)

| Element | Source | Template or Data |
|---|---|---|
| Icon | `technology.icon` (file) | DATA |
| Name/Title | `technology.name` | DATA |
| Short description | `technology.short_blurb` | DATA |
| Optional link | `technology.link` | DATA |
| Card background/style | CSS | TEMPLATE |

---

## Responsive Behavior

| Section | Desktop 1440 | Tablet 768 | Mobile 390 |
|---|---|---|---|
| Hero | Full-width, desktop image | Desktop image | Mobile image (tall) |
| Tech card grid | 3 columns | 2 columns | 1 column stacked |
| Full-width tech feature | 2-col (text + image) | 2-col or stacked | Stacked |
| Light conditions grid | 4 columns | 2×2 | 2×2 or 1 col |
| Product grid | 3–4 columns | 2–3 columns | 2 columns |

---

## Breadcrumb
- SnowTech: no breadcrumb visible on current site
- Shopify build: should add breadcrumb for navigation clarity

---

## TEMPLATE vs. DATA Split

| Element | Type | Source |
|---|---|---|
| Section group structure, card shell, grid layout | TEMPLATE | — |
| Hero image + headline + CTA | DATA | Page section settings (Layer 2) |
| Technology cards content | DATA | `technology` metaobjects |
| Product grids | DATA | Collection reference (Layer 2 setting) |
| MIPS diagram/illustration | DATA | `technology.tech_guide_image` or page section image |
