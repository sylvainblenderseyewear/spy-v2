# Page Spec: PDP — Replacement Lens (`product.lens`)

**Representative URL:** https://www.spyoptic.com/us/goggles/snow-goggles/replacement-lenses/replacement-lens-marauder-43902.html  
**Product:** REPLACEMENT LENS MARAUDER ($100)  
**Template:** `product.lens`  
**Covers:** All goggle replacement lens PDPs  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Key Characteristics

This is a STRIPPED-DOWN template — much simpler than the full goggle PDP:

| Present | Absent |
|---|---|
| Product gallery (fewer images) | Frame/color picker (no frame on replacement lens) |
| Lens type selector | Goggle-specific feature blocks (fit guide, lens-change system) |
| VLT / Lens category in spec | Full goggle spec table |
| Price ($100) | Bonus lens treatment |
| ATC button | Technology feature module (reduced) |
| Basic trust badges | Description (minimal or none) |
| Size selector (e.g., Medium-Large One size) | RX prescription button |

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Custom? |
|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) |
| 2 | Navigation | Shared | No (shared) |
| 3 | Breadcrumb | Goggles › Snow Goggles › Replacement Lenses › REPLACEMENT LENS MARAUDER | Yes |
| 4 | Product Gallery | 2–4 images of the lens itself | Style |
| 5 | Product Info Column | Title, $100, stock | Yes |
| 5a | Lens Type Selector | Lens option (Happy Boost Bronze with Happy Blue Mirror, etc.) | Yes |
| 5b | Size indicator | "Medium-Large One size" | Yes |
| 5c | Qty + ATC | Orange ATC button | Style |
| 5d | Trust Badges | Minimal — Shipping, Returns, Warranty | Yes |
| 6 | Lens Info | VLT %, Lens Category, Base Tint (via `spec.*`) | Yes |
| 7 | Technical Information | Reduced spec table: Reference, Fit, Weight, Material, Lens Name, VLT, Lens Category, Base Tint, Lens Coating | Yes |
| 8 | Compatible Goggle note | Which goggle model this lens fits (cross-sell) | CUSTOM compatibility block |
| 9 | Footer | Shared | No (shared) |

---

## Spec Table Fields for Replacement Lens

Only relevant fields render — goggle frame fields are absent:

| Field | Metafield | Example |
|---|---|---|
| Reference | `spec.reference` | 43902 |
| Fit | `spec.fit` | Medium-Large One size |
| Weight | `spec.weight_g` | 34g |
| Material | `spec.lens_material` | Polycarbonate |
| Lens Name | `spec.lens_name` | Happy Boost Bronze with Happy Blue Mirror |
| Lens Category | `spec.lens_category` | Cat. 3 |
| VLT | `spec.vlt_percent` | (varies) |
| Base Tint | `spec.base_tint` | Grey |
| Lens Coating | `spec.lens_coating` | Anti-Fog / Anti-Scratch |
| Technologies | `spec.technologies` | (relevant tech objects) |

---

## TEMPLATE vs. DATA Split
- Template: simplified gallery, lens-only picker, reduced trust row, no goggle-specific blocks
- Data: same `spec.*` metafields as goggle, but only lens-relevant fields populated
