# Page Spec: PDP — Snow Helmet (`product.helmet`)

**Representative URL:** https://www.spyoptic.com/us/snow-helmets/neutron-mips-234847.html  
**Product:** NEUTRON MIPS ($205)  
**Template:** `product.helmet`  
**Covers:** All snow helmet PDPs  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## How This Template DIFFERS from `product.default`

| Addition vs. `product.default` | Notes |
|---|---|
| MIPS logo/badge on product image | Branded MIPS certification badge |
| Helmet Tech Features module | 6 dedicated feature cards with images (goggle integration, fit system, strap, ventilation, comfort, MIPS protection) |
| Fit Guide Table | Size chart in cm + inches (S/M, M/L, L/XL) — different from goggle measurement diagram |
| `helmet.*` metafields in spec table | MIPS, certifications, sizes, fit system |
| Size options as primary variant | S-M / M-L / L-XL replaces lens/color picker structure |
| No lens selector | Helmets have no lens option |
| Goggle Retention section | Highlight of goggle strap compatibility |
| No lens-info modal | No VLT/lens-category; tech modal shows helmet technologies instead |

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Breadcrumb | Snow Helmets › Adults Ski Helmets › NEUTRON MIPS | Yes | — |
| 4 | Product Gallery | Images of helmet from multiple angles, colorway views | Style | Yes |
| 5 | Product Info Column | Title, $205, 4.7/5 rating, stock | Yes | — |
| 5a | Color Picker | Color swatches (Grey, Matte Black, Tan, etc.) | Yes | — |
| 5b | Size Picker | S-M / M-L / L-XL selector (not a lens picker) | CUSTOM size-picker | Yes | — |
| 5c | Qty + ATC | Standard orange ATC | Style | Sticky mobile |
| 5d | MIPS logo badge | Displayed near price / product image | CUSTOM mips-badge block | Yes | — |
| 5e | Trust Badges inline | Free ship · Returns · Warranty · Contact | Yes | — |
| 6 | Description | "Injected mold masterpiece..." short blurb + marketing copy | Yes | — |
| 7 | Helmet Tech Features | 6 feature cards: Goggle Integration, Snug Life Fit System, Goggle Retention Strap, Passive Ventilation, Premium Comfort, MIPS Brain Protection. Each: image + title + description | CUSTOM helmet-features block | Yes | Grid→ stack mobile |
| 8 | Technical Information | `spec.*` + `helmet.*` fields. No lens/goggle fields. | CUSTOM spec-table | Yes | — |
| 9 | Fit Guide Table | Size chart: S/M 51-54cm, M/L 55-58cm, L/XL 59-62cm | CUSTOM fit-guide-table block | Yes | Scrollable mobile |
| 10 | Feature Banner | `pdp.feature_banner_desktop` / `_mobile` | Yes | Yes |
| 11 | Others Also Like | Related products carousel | Yes | Scroll mobile |
| 12 | Footer | Shared | No (shared) | — |

---

## Helmet-Specific Technical Information Fields

These render IN ADDITION to (or in place of) `spec.*` on `product.helmet`:

| Field | Metafield Key | Example (Neutron MIPS) |
|---|---|---|
| Base / MIPS | `helmet.mips` (bool) | true |
| Fit System | `helmet.fit_system` | Snug Life (360° dial) |
| Ventilation | `goggle.ventilation` (reuse) or `helmet.ventilation` | Passive / Active |
| Removable Pads | (bool/text) | Yes — microfleece lining |
| Certifications | `helmet.certifications` (list) | ⚠️ TBD |
| Sizes | `helmet.sizes` (list) | S-M, M-L, L-XL |
| Weight | `spec.weight_g` | 577g |
| Material | `spec.frame_material` | ABS |

> Lens-related `spec.*` fields (lens_material, vlt_percent, lens_category, etc.) are NOT rendered on `product.helmet`.

---

## Helmet Tech Features Module

6-card grid. Each card:
- Feature image (photo of specific helmet detail)
- Feature title (uppercase, e.g., "SNUG LIFE FIT SYSTEM")
- Short description text

Sourced from: `technology` metaobjects (new entries needed for helmet-specific techs) OR hardcoded per product via `pdp.*` section settings.

**Recommendation:** use the `technology` metaobject for helmet tech features (Snug Life, Goggle Retention System, MIPS Technology, Microfleece Lining, etc.) — same engine as goggle tech icons, different entries.

---

## Size Picker vs. Lens Picker

The size picker replaces the lens picker on helmets:
- Options: S-M, M-L, L-XL
- Each option shows cm range in sublabel: "51–54 cm"
- No swatch images (size-only variant)

---

## TEMPLATE vs. DATA Split

| Element | Type | Source |
|---|---|---|
| Size picker UI (not lens) | TEMPLATE | — |
| MIPS badge display logic | TEMPLATE + DATA | `helmet.mips` (bool) — show/hide block |
| 6-tech features grid | TEMPLATE | — |
| Tech feature content | DATA | `technology` metaobjects |
| Fit guide table shell | TEMPLATE | — |
| Size rows | DATA | `helmet.sizes` (list) |
| Helmet spec fields | DATA | `helmet.*` metafields |
