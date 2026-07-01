# Page Spec: PDP — Moto Goggle (`product.moto-goggle`)

**Representative URL:** https://www.spyoptic.com/us/goggles/motocross-goggles/foundation-105963.html  
**Product:** FOUNDATION ($50, heavily discounted — 52% off from $105)  
**Template:** `product.moto-goggle`  
**Covers:** All motocross/moto goggle PDPs  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390

---

## How This Template DIFFERS from `product.snow-goggle`

| Difference | Notes |
|---|---|
| No VLT range / dual-lens focus | Moto goggles typically ship with one lens (Clear, Smoke); no "bonus lens" highlight |
| Tear-Off Compatible field | Moto-specific tech spec not present on snow goggles |
| No Deadbolt™ / lens-change system block | Foundation uses simpler lens change |
| Athlete/collab branding possible | SLAYco by Axell Hodges — artist/rider graphics |
| No Happy Boost™ tech (typically) | Moto uses standard PC lens without mood-boost tech |
| Lens Info Modal content differs | No Happy Boost, no winter-lens categories |
| Youth sizing possible | Crusher Elite JR — youth-focused variant |

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|
| 1 | Announcement Bar | Shared | No (shared) | — |
| 2 | Navigation | Shared | No (shared) | Yes |
| 3 | Breadcrumb | Goggles › Motocross Goggles › FOUNDATION | Yes | — |
| 4 | Product Gallery | Multi-image + colorway views. Foundation has multiple color variants | Style | Yes |
| 5 | Product Info Column | Title + price (with sale strike-through + %) + rating + stock | Yes | Sticky ATC mobile |
| 5a | Frame/Color Picker | Color swatches (Matte Blue, etc.) | Yes | — |
| 5b | Lens Selector | Lens type (Clear, Smoke, Tinted) | Yes | — |
| 5c | Extra Lens | Optional add-on | Yes | — |
| 5d | Qty + ATC | Standard | Style | Sticky mobile |
| 5e | Buy in Prescription | Secondary button | Yes | — |
| 5f | Trust Badges | Free ship · Returns · Warranty · PayPal | Yes | — |
| 6 | Lens Info Modal | VLT %, Lens Cat, Tint, moto-relevant tech icons | Yes | — |
| 7 | Description | Product narrative | Yes | — |
| 8 | Technical Information | `spec.*` + moto-specific fields | Yes | — |
| 9 | Goggle Fit Guide | Measurement diagram (width/height in mm) | Yes | ⚠️ mobile stack |
| 10 | Feature Banner | `pdp.feature_banner_desktop` / `_mobile` | Yes | Yes |
| 11 | Others Also Like | Related products carousel | Yes | Scroll mobile |
| 12 | Footer | Shared | No (shared) | — |

---

## Moto-Specific Technical Information Fields

| Field | Metafield | Foundation Value |
|---|---|---|
| Tear-Off Compatible | `goggle.tear_off_compatible` (bool — add to schema) | Yes |
| Triple Layer Face Foam | `goggle.removable_padding` | Yes |
| Silicone Strap | (bool — part of tech list) | Yes |
| Ventilation | `goggle.ventilation` | (standard moto venting) |
| OTG | `goggle.otg` | (verify per product) |
| Interchangeable Lenses | `goggle.interchangeable_lens` | Yes |

> ⚠️ `goggle.tear_off_compatible` needs to be added to the metafield schema (boolean).

---

## Sale Price Display
- Foundation shown at $50 (was $105) — "52% off" badge
- Strike-through original price, bold sale price
- Discount % badge on product card and PDP

---

## TEMPLATE vs. DATA Split (Moto additions)
- Tear-off compatible indicator → DATA (`goggle.tear_off_compatible`)
- Athlete collab branding block → TEMPLATE shell + DATA (section setting or metaobject)
