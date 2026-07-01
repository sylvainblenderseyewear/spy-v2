# Page Spec: PDP — Apparel / Gear (`product.apparel`)

**Representative URL:** https://www.spyoptic.com/us/gear/apparel/shirts/ss25-spy-palms-ss-tee-269473.html  
**Product:** SS25 SPY PALMS SS TEE ($30)  
**Template:** `product.apparel`  
**Covers:** Shirts, Hoodies, Hats/Beanies, other Gear  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## Key Characteristics

Extremely simplified compared to eyewear PDPs:

| Present | Absent |
|---|---|
| Product gallery | Lens selector |
| Size variant picker (S/M/L/XL/XXL) | Lens info modal |
| Color picker (if multiple colors) | VLT / lens category / tech spec |
| Price ($30) | Goggle/helmet specific sections |
| ATC button | Buy in Prescription button (but still shown — verify) |
| Basic trust badges | Technology icons / metaobjects |
| Technical Information (minimal) | Feature banner (⚠️ verify presence) |
| — | Size chart (⚠️ verify — none found on tee) |

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Custom? |
|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) |
| 2 | Navigation | Shared | No (shared) |
| 3 | Breadcrumb | Gear › Apparel › Shirts › SS25 SPY PALMS SS TEE | Yes |
| 4 | Product Gallery | 2–4 images of the garment | Style |
| 5 | Product Info Column | Title, $30, stock | Yes |
| 5a | Size Picker | S / M / L / XL / XXL selector | CUSTOM size-picker | 
| 5b | Color Picker | (if multiple colors — swatches or radio) | Yes |
| 5c | Qty + ATC | Orange ATC button | Style |
| 5d | Trust Badges | Shipping, Returns, Warranty | Yes |
| 6 | Description | Short product description | Yes |
| 7 | Technical Information | Reference, Material (Cotton), Weight | Yes |
| 8 | Others Also Like | Related products carousel (optional) | Yes |
| 9 | Footer | Shared | No (shared) |

---

## Spec Table Fields for Apparel

Very minimal:

| Field | Metafield | Example |
|---|---|---|
| Reference | `spec.reference` | YMCLO097001 |
| Material | `spec.frame_material` (reuse for fabric) | Cotton |
| Weight | `spec.weight_g` | 154g |
| Available with RX | `spec.available_rx` | No |

> No lens fields, no goggle fields, no helmet fields rendered.

---

## Size Picker
- Options: Small, Medium, Large, Extra Large, Extra Extra Large
- No swatch images (size text only)
- No linked size chart found on representative page — may be template without size chart, or size chart via `pdp.size_chart` metaobject (check other apparel)

---

## TEMPLATE vs. DATA Split
- Template: size picker, simplified info column, no lens/tech blocks
- Data: `spec.frame_material`, `spec.weight_g`, `spec.reference`, basic product data
