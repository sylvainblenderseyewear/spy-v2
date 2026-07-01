# Page Spec: PDP — Snow Goggle (`product.snow-goggle`)

**Representative URL:** https://www.spyoptic.com/us/goggles/snow-goggles/marauder-36615.html  
**Product:** MARAUDER ($280, "Starting from" with variant range)  
**Template:** `product.snow-goggle`  
**Covers:** All snow goggle PDPs  
**Screenshots needed:** desktop 1440 / tablet 768 / mobile 390 (⚠️ capture before Phase 1 build)

---

## How This Template DIFFERS from `product.default`

This is an **additive template** — same metafield engine + variant/ATC/gallery/spec structure, PLUS goggle-specific blocks:

| Addition vs. `product.default` | Notes |
|---|---|
| Goggle Fit Guide with measurement diagram | Shows lens width A/B, frame width C/D in mm |
| Lens Change System block | Deadbolt™ / Lock Steady™ explanation with image |
| Lens Type block | Cylindrical / Spherical / Toric with impact description |
| Extra Lens / Bonus Lens treatment | "Included bonus lens" highlight |
| OTG indicator | Over-the-glasses compatibility call-out |
| Ventilation information | Passive/Active ventilation in spec table + feature call-out |
| `goggle.*` metafields rendered in spec table | Base, Fit System, Ventilation, Removable Paddings, OTG, Interchangeable Lens, extra-lens fields |
| "Buy in Prescription" → directs to RX goggle flow | May differ from sunglasses RX |

---

## Section Inventory (Top → Bottom)

| # | Section / Module | Content | Horizon Block | Custom? | Breakpoint-Specific? |
|---|---|---|---|---|---|
| 1 | Announcement Bar | Shared | Shared | — | — |
| 2 | Navigation | Shared | Shared | — | Yes |
| 3 | Breadcrumb | Goggles › Snow Goggles › MARAUDER | Custom breadcrumb | Yes | — |
| 4 | Product Gallery | Multi-image + video. Same gallery layout as default. | Horizon gallery (restyled) | Style | Yes |
| 5 | Product Info Column | Title ($280, "Starting from"), rating, stock, variants, ATC | CUSTOM block assembly | Yes | ATC sticky mobile |
| 5a | Frame Selector | Swatch grid — colorway names (EVERBLACK, etc.) | CUSTOM swatch-picker | Yes | — |
| 5b | Lens Selector | Lens option — includes VLT % + category in label | CUSTOM picker | Yes | — |
| 5c | Extra Lens Selector | Optional add-on lens dropdown | CUSTOM picker | Yes | — |
| 5d | Lens Info trigger | "Read more" → Lens Info Modal with goggle tech icons | CUSTOM trigger | Yes | — |
| 5e | Qty + ATC | Same as default | — | Style | Sticky mobile |
| 5f | Buy in Prescription | Secondary button | CUSTOM | Yes | — |
| 5g | Trust Badges inline | Free ship · Returns · Warranty · PayPal | CUSTOM row | Yes | — |
| 6 | Lens Info Modal | VLT %, Lens Category, Tint, technology icons (Happy Boost Snow, Deadbolt, Anti-Fog, etc.) | CUSTOM modal | Yes | — |
| 7 | Description | Product narrative (`pdp.long_description`) | CUSTOM rich-text block | Yes | — |
| 8 | Technical Information | `spec.*` + `goggle.*` fields — all populated values | CUSTOM spec-table block | Yes | — |
| 9 | Goggle Fit Guide | Goggle measurement diagram with A/B/C/D dimensions in mm | CUSTOM goggle-fit-guide block | Yes | ⚠️ stacks on mobile |
| 10 | Lens Change System | Deadbolt™/Lock Steady™/Quick Draw explanation + image | CUSTOM lens-change block | Yes | Yes |
| 11 | Lens Type | Cylindrical / Spherical / Toric description + image | CUSTOM lens-type block | Yes | Yes |
| 12 | Technology Module | Happy Boost™ explainer with logo, benefits bullets | CUSTOM technology-feature block | Yes | — |
| 13 | Feature Banner | `pdp.feature_banner_desktop` / `_mobile` | CUSTOM feature-banner | Yes | Yes |
| 14 | Others Also Like | Related products carousel | CUSTOM recommendations-carousel | Yes | Scroll mobile |
| 15 | Footer | Shared | Shared | — | — |

---

## Goggle-Specific Technical Information Fields

These render IN ADDITION to `spec.*` fields on `product.snow-goggle`:

| Field | Metafield Key | Example (Marauder) |
|---|---|---|
| Lens Width (A) | `goggle.lens_width_a` | 174mm |
| Lens Height (B) | `goggle.lens_height_b` | 97mm |
| Frame Width (C) | `goggle.frame_width_c` | 174mm |
| Frame Height (D) | `goggle.frame_height_d` | 97mm |
| Base | `goggle.base` | (varies) |
| Fit System | `goggle.fit_system` | (varies) |
| Ventilation | `goggle.ventilation` | Passive Ventilation |
| Removable Paddings | `goggle.removable_padding` | Triple Layer Face Foam |
| OTG | `goggle.otg` | Yes |
| Interchangeable Lenses | `goggle.interchangeable_lens` | Yes (Deadbolt) |
| Extra Lens Included | `goggle.extra_lens_included` | (bool) |
| Extra Lens Name | `goggle.extra_lens_name` | Happy Boost LL Coral |
| Extra Lens VLT | `goggle.extra_lens_vlt_percent` | 48% |
| Extra Lens Category | `goggle.extra_lens_category` | Cat. 1 |

> ⚠️ Lens width/height (A/B/C/D) fields not in Appendix A schema — add `goggle.lens_width_a`, `goggle.lens_height_b`, `goggle.frame_width_c`, `goggle.frame_height_d` (all `single_line_text` with mm unit) to metafield schema.

---

## Technology Icons in Lens Info Modal (Snow Goggle)

From Marauder PDP — technology metaobjects used:
- Happy Lens
- Happy Boost Snow
- Deadbolt™ (magnetic lens change)
- Anti-Fog Coating
- Anti-Scratch Coating
- Cylindrical Lens
- Double Lens
- Interchangeable Lenses
- Magnetic Lens
- OTG (Over The Glasses)
- Passive Ventilation
- Silicone On Strap

---

## TEMPLATE vs. DATA Split

| Element | Type | Source |
|---|---|---|
| All `product.default` template elements | TEMPLATE | (inherited) |
| Goggle fit diagram shell | TEMPLATE | — |
| Lens change system block shell | TEMPLATE | — |
| Goggle spec fields in table | DATA | `goggle.*` metafields |
| Fit diagram dimension values | DATA | `goggle.lens_width_a` etc. |
| Technology content in modal | DATA | `technology` metaobjects (via `spec.technologies`) |

---

## Responsive Behavior

Same as `product.default` for shared sections. Goggle-specific:
- **Fit Guide diagram:** scales down on mobile, may stack dimensions below image
- **Lens Change / Lens Type blocks:** image + text stack on mobile (text below image)
- **Technology Module:** icon grid to single column on mobile

---

## Measurements to Capture (in addition to eyewear PDP)

- Goggle fit guide diagram dimensions and layout
- Lens Change System block image:text ratio
- Lens Type block layout at each breakpoint
