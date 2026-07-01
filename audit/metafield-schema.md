# SPY Optic — Confirmed Metafield & Metaobject Schema (Phase 0)

> Cross-referenced against live PDPs (Cyrus Switch sunglass, Marauder snow goggle, Neutron MIPS helmet, Foundation moto goggle, Replacement Lens Marauder, Renley 56 eyeglasses, SS25 Tee apparel).
> This schema is the INPUT for Phase 0.7 (metafield definition creation via Admin GraphQL API).

---

## Metaobjects (create FIRST via `metaobjectDefinitionCreate`)

### 1. `technology` — Reusable tech blurb (PDPs + Tech Guide pages)

| Field Key | Type | Required | Notes |
|---|---|---|---|
| `name` | single_line_text | ✅ | Display name, e.g., "DEADBOLT™", "Happy Lens" |
| `icon` | file_reference | ✅ | SVG or PNG icon file |
| `short_blurb` | single_line_text | ✅ | 1–2 sentence teaser for modal/card |
| `long_description` | rich_text | — | Extended description for tech guide pages |
| `link` | url | — | Optional CTA link to tech guide page |
| `tech_guide_image` | file_reference | — | Feature image for full-width tech guide sections |
| `tech_guide_category` | single_line_text | — | Group label, e.g., "Lens Change Systems" |
| `tech_guide_order` | number_integer | — | Display order within category group |

**Seed entries required:**
- Happy Lens, Happy Boost, Happy Boost Snow, Anti-Fog Coating, Anti-Scratch Coating, Eco-Friendly Materials, Magnetic Lens, Mono Shield, PC Lens, Snap Hinge, MIPS Technology, Deadbolt™, Lock Steady™ 2, Quick Draw, ARC® Spherical Lens, Cylindrical Lens, Toric Lens, OTG, Passive Ventilation, Active Ventilation, Silicone On Strap, Tear-Off Compatible, Triple Layer Face Foam, Snug Life Fit System, Goggle Retention System, Microfleece Lining, Spring Hinges, Demo Lens

---

### 2. `size_chart` — Product size chart (PDP modal)

| Field Key | Type | Required | Notes |
|---|---|---|---|
| `name` | single_line_text | ✅ | e.g., "Sunglass Size Chart", "Goggle Fit Guide" |
| `image` | file_reference | — | Image of the size chart |
| `table` | rich_text | — | HTML table alternative to image |
| `category` | single_line_text | — | "sunglasses", "goggles", "helmets", "apparel" |

---

### 3. `collection_story` — Curated collection editorial (collection.story template)

| Field Key | Type | Required | Notes |
|---|---|---|---|
| `headline` | single_line_text | ✅ | Hero headline for the collection |
| `hero` | file_reference | ✅ | Desktop hero image |
| `hero_mobile` | file_reference | — | Mobile hero image (⚠️ ADD — responsive requirement) |
| `body` | rich_text | — | Editorial narrative copy |
| `featured_products` | list.product_reference | — | 2–3 hero products to highlight |

---

## Product Metafields — `spec` namespace (ALL eyewear / goggle / helmet)

> Create via `metafieldDefinitionCreate` with `ownerType: PRODUCT`.

| Key | Type | Display Name | Pinned | Example (Cyrus Switch) |
|---|---|---|---|---|
| `spec.reference` | single_line_text | Reference | ✅ | YS143003 |
| `spec.fit` | single_line_text | Fit | ✅ | Medium large |
| `spec.dimensions` | single_line_text | Dimensions | — | — |
| `spec.weight_g` | number_integer | Weight (g) | ✅ | 43 |
| `spec.frame_material` | single_line_text | Product Material | ✅ | Grilamid (TR90) |
| `spec.frame_color` | single_line_text | Frame Colour | ✅ | Matte Black |
| `spec.lens_material` | single_line_text | Lens Material | ✅ | Polycarbonate |
| `spec.lens_name` | single_line_text | Lens Name | ✅ | Happy Gray Green & Black Mirror |
| `spec.additional_lens_name` | single_line_text | Additional Lenses | — | — |
| `spec.lens_category` | single_line_text | Lens Category | ✅ | Cat. 3 |
| `spec.additional_lens_category` | single_line_text | Additional Lens Category | — | — |
| `spec.vlt_percent` | number_integer | VLT (%) | ✅ | 15 |
| `spec.additional_lens_vlt` | number_integer | VLT Additional Lens (%) | — | — |
| `spec.base_tint` | single_line_text | Base Tint | ✅ | Gray Green |
| `spec.mirror_tint` | single_line_text | Mirror Tint | — | — |
| `spec.lens_shape` | single_line_text | Lens Shape | — | Cylindrical |
| `spec.photochromic` | boolean | Photochromy | ✅ | false |
| `spec.polarized` | boolean | Polarization | ✅ | false |
| `spec.high_contrast` | boolean | High Contrast | ✅ | true |
| `spec.lens_coating` | single_line_text | Lens Coating | ✅ | Anti-Fog / Anti-Scratch |
| `spec.available_rx` | boolean | Available with RX | ✅ | false |
| `spec.interchangeable_lens` | boolean | Interchangeable Lenses | — | true |
| `spec.included_accessories` | list.single_line_text | Included Accessories | — | Case, Cloth |
| `spec.certifications` | list.single_line_text | Certifications | — | ANSI Z87.1 |
| `spec.technologies` | list.metaobject_reference | Technologies | ✅ | [Happy Lens, Magnetic Lens, ...] |

---

## Product Metafields — `goggle` namespace (snow-goggle + moto-goggle + lens templates)

| Key | Type | Display Name | Pinned | Example (Marauder) |
|---|---|---|---|---|
| `goggle.base` | single_line_text | Base | — | — |
| `goggle.fit_system` | single_line_text | Fit System | — | — |
| `goggle.ventilation` | single_line_text | Ventilation | ✅ | Passive Ventilation |
| `goggle.removable_padding` | single_line_text | Removable Paddings | ✅ | Triple Layer Face Foam |
| `goggle.otg` | boolean | OTG (Over The Glasses) | ✅ | true |
| `goggle.interchangeable_lens` | boolean | Interchangeable Lenses | ✅ | true |
| `goggle.extra_lens_included` | boolean | Extra Lens Included | ✅ | true |
| `goggle.extra_lens_name` | single_line_text | Extra Lens Name | ✅ | Happy Boost LL Coral |
| `goggle.extra_lens_vlt_percent` | number_integer | Extra Lens VLT (%) | ✅ | 48 |
| `goggle.extra_lens_category` | single_line_text | Extra Lens Category | ✅ | Cat. 1 |
| `goggle.lens_width_a` | single_line_text | Lens Width A (mm) | — | 174mm |
| `goggle.lens_height_b` | single_line_text | Lens Height B (mm) | — | 97mm |
| `goggle.frame_width_c` | single_line_text | Frame Width C (mm) | — | 174mm |
| `goggle.frame_height_d` | single_line_text | Frame Height D (mm) | — | 97mm |
| `goggle.tear_off_compatible` | boolean | Tear-Off Compatible | — | true (moto only) |

> ⚠️ `goggle.lens_width_a/b` and `goggle.frame_width_c/d` are ADDITIONS to Appendix A — confirmed from Marauder PDP measurement diagram.
> ⚠️ `goggle.tear_off_compatible` is an ADDITION — confirmed from Foundation moto goggle PDP.

---

## Product Metafields — `helmet` namespace (helmet template only)

| Key | Type | Display Name | Pinned | Example (Neutron MIPS) |
|---|---|---|---|---|
| `helmet.mips` | boolean | MIPS | ✅ | true |
| `helmet.certifications` | list.single_line_text | Certifications | — | — |
| `helmet.sizes` | list.single_line_text | Sizes | ✅ | S-M, M-L, L-XL |
| `helmet.fit_system` | single_line_text | Fit System | ✅ | Snug Life (360° dial) |
| `helmet.ventilation` | single_line_text | Ventilation | ✅ | Passive / Active Adjustable |
| `helmet.goggle_retention` | boolean | Goggle Retention | — | true |
| `helmet.ear_pads_removable` | boolean | Removable Ear Pads | — | true |

> ⚠️ `helmet.ventilation`, `helmet.goggle_retention`, `helmet.ear_pads_removable` are ADDITIONS — confirmed from Neutron MIPS PDP tech features.

---

## Product Metafields — `pdp` namespace (content/marketing, all PDPs)

| Key | Type | Display Name | Pinned | Notes |
|---|---|---|---|---|
| `pdp.long_description` | rich_text | Long Description | ✅ | Expanded product narrative |
| `pdp.feature_banner_desktop` | file_reference | Feature Banner (Desktop) | ✅ | Desktop marketing image |
| `pdp.feature_banner_mobile` | file_reference | Feature Banner (Mobile) | ✅ | Mobile marketing image |
| `pdp.feature_carousel` | list.file_reference | Feature Carousel | — | Multiple feature images |
| `pdp.video` | url | Product Video URL | — | Or file_reference |
| `pdp.size_chart` | metaobject_reference | Size Chart | ✅ | → `size_chart` metaobject |
| `pdp.badge_new` | boolean | New Badge | ✅ | Show "New" badge on card + PDP |

---

## Variant Metafields

| Key | Type | Owner | Display Name | Notes |
|---|---|---|---|---|
| `variant.swatch` | file_reference | VARIANT | Swatch Image | Per-variant color swatch photo |
| `variant.sku_ref` | single_line_text | VARIANT | SKU Reference | Internal SKU / reference code |

---

## Collection Metafields (ownerType: COLLECTION)

| Key | Type | Display Name | Notes |
|---|---|---|---|
| `collection.intro_copy` | rich_text | Intro Copy | Shown top of PLP, read-more/less |
| `collection.seo_content` | rich_text | SEO Content | Bottom of PLP, accordion |
| `collection.hero_image` | file_reference | Hero Image (Desktop) | PLP hero background |
| `collection.hero_image_mobile` | file_reference | Hero Image (Mobile) | ⚠️ ADD — responsive requirement |
| `collection.story` | metaobject_reference | Collection Story | → `collection_story` metaobject (for curated collections) |

> ⚠️ `collection.hero_image_mobile` is an ADDITION — confirmed from responsive parity requirement.

---

## Schema Changes vs. Appendix A

| Change | Reason |
|---|---|
| ADD `goggle.lens_width_a`, `goggle.lens_height_b`, `goggle.frame_width_c`, `goggle.frame_height_d` | Visible measurement diagram on Marauder PDP |
| ADD `goggle.tear_off_compatible` (boolean) | Confirmed on Foundation moto goggle PDP |
| ADD `helmet.ventilation`, `helmet.goggle_retention`, `helmet.ear_pads_removable` | Confirmed from Neutron MIPS tech features |
| ADD `collection_story.hero_mobile` (file) | Responsive parity requirement |
| ADD `collection.hero_image_mobile` (file) | Responsive parity requirement |
| ADD `technology.tech_guide_image`, `.tech_guide_category`, `.tech_guide_order` | Metaobject-driven tech guide template |
| RENAME `spec.interchangeable_lens` | Redundant with `goggle.interchangeable_lens` — keep `spec` version for eyewear (no lens-change), `goggle` version for goggles |
| SPLIT `spec.additional_lens_name` and `spec.additional_lens_category` | Separate fields confirmed on PDP |

---

## Phase 0.7 Implementation Order

1. `metaobjectDefinitionCreate`: `technology`, `size_chart`, `collection_story`
2. `metafieldDefinitionCreate` for `spec.*` (all 24 fields)
3. `metafieldDefinitionCreate` for `goggle.*` (14 fields)
4. `metafieldDefinitionCreate` for `helmet.*` (7 fields)
5. `metafieldDefinitionCreate` for `pdp.*` (7 fields)
6. `metafieldDefinitionCreate` for variant fields (2 fields)
7. `metafieldDefinitionCreate` for collection fields (5 fields)
8. Validate all definitions pinned in product admin
9. Flag any existing staging products that have data gaps

Total: 3 metaobject types + ~59 metafield definitions
