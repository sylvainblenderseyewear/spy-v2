# Design Spec — Rebuild `product.default` PDP to the Cyrus Switch layout

**Date:** 2026-07-22
**Template:** `product.default` (`templates/product.json`) — eyewear default PDP
**Source of truth (visual):** `reference/design-PDP-sample/CYRUS SWITCH …html` + its `_files/detail.css` & `global.css`
**Source of truth (data patterns):** `reference/blenderseyewear/` PDP
**Approved decisions:** sticky-gallery flip = yes · DIN wired **globally** (Layer 1) · ATC keeps Layer 1 orange `#f57f29` · lifestyle carousel = stock slideshow section styled to match

---

## 1. Goal & guiding constraints

Rework the existing default eyewear PDP so it matches the SPY Cyrus Switch page 1:1 in structure, layout, type, color and spacing — **without** discarding the Horizon engine.

Non-negotiable constraints (from `CLAUDE.md` + user steer):
- **Stock-first.** Use a Horizon basic block wherever one exists; keep a custom `spy-*` block only where there is no stock equivalent (lens-info grid, spec-table renderer, size-chart modal, trust box, breadcrumbs).
- **Data = metafields.** Keep this project's schema (`spec.*`, `goggle.*`, `helmet.*`, `pdp.*` — Appendix A). Borrow blenderseyewear *patterns* (swatch build, price/review render, combined-listing color switch) — **never** its tag-based (`swatch::`, `collection::`) model.
- **Layout = template.** A new product must fill the PDP with zero template edits.
- **Tailwind-only styling.** No `{% stylesheet %}` in custom blocks; utilities + inline SVG. Scoped CSS overrides for stock blocks live in `src/tailwind.css`. Run `npm run build:css` after any style change.
- **Layer 1 tokens.** No hardcoded hex/font in Liquid; brand tokens are theme settings / `@theme` CSS vars.
- Settled: RX → SportRx link (only when `spec.available_rx`); VTO dropped; Yotpo reserved (renders empty until installed); multi-locale (use `t` filter, no hardcoded strings).

---

## 2. Target layout (measured from source CSS)

- **Container:** fluid (no fixed max-width). Page side padding: `1rem` → `2rem` (≥769) → `3.5rem` (≥1200) → `4.5rem` (≥1800).
- **Grid:** `.ds-main-grid` = 6 cols mobile → **12 cols at ≥769px**. Gallery = `col 1 / span 7`; info = `col 8 / span 5` → **~58% / 42%**. Column gap ~`1rem` (`0.75rem` mobile → `1.25rem` ≥1800).
- **Two-column starts at 769px.** Below 769: both columns full width, stack **gallery above info**.
- **Sticky = gallery** (the shorter column pins; the taller info column scrolls). This flips Horizon's default (sticky details). One scoped `position: sticky` on the media column; disable `sticky_details_desktop`.
- Breakpoints used by source: 544 / **769** / 992 / 1200 / 1800 (mins); 543.98 / 991.98 (maxes). Feature banner uses its own `min-width: 768px`.

---

## 3. Info column — module order & block mapping

Order top→bottom (matches source `.pdp-primary-info`):

| # | Module | Block (stock unless noted) | Styling target |
|---|---|---|---|
| 1 | Breadcrumb | `spy-breadcrumbs` *(custom, exists)* | `13px`, muted; Home / Collection / Title |
| 2 | Product name | **`product-title`** | h3 token: DIN **700**, `1.5rem`→`2rem` (≥769), lh `2rem`→`2.5rem`, uppercase, letter-spacing `0.5%`, `#242424`, mb `.25rem` |
| 3 | Price | **`price`** | "lead": DIN 400 (source 500; no 500 face), `1.125rem`, lh `1.75rem`, `#242424` |
| 4 | ★ Rating | **`review`** (reserved) | Yotpo bottomline near price; empty until `reviews.rating` metafield present |
| 5 | "In Stock" | **`product-inventory`** | body-m (DIN 400 `.875rem`); mt `1.5rem`, mb `.75rem` |
| 6 | Frame color swatches | **`variant-picker`** (`show_swatches`) | swatch `3.5rem`², radius `2px`, border `1px #E6E6E6`, **selected `2px #242424`**, gap `.5rem`; sold-out `opacity .5` + diagonal strike; swatch bg = `variant.swatch` image, `background-size:90%` |
| 7 | Frame / Ref / Lens summary | **`text`** w/ metafield Liquid (fallback: tiny `spy-frame-summary`) | label `label-s` (DIN 700 `.75rem` uppercase, +1%, `#242424`); value `#393939`. Reads `spec.frame_color`, `spec.reference`, `spec.lens_name` |
| 8 | Size Chart trigger + modal | `spy-size-chart` *(custom, exists)* | flex, gap `.5rem`, mt `.75rem`, body-m, underlined label + `1.5rem` icon |
| 9 | Lens info (VLT / Cat / Tint + Cat 0–4 scale) | `spy-lens-info` *(custom, exists)* | heading "Lens information" body-l; "Read more" underline link → modal; values "lead"; active scale segment `#242424` |
| 10 | ATC + quantity | **`buy-buttons`** (`add-to-cart` + `quantity`) | button **square (radius 0)**, uppercase, orange `#f57f29`, DIN; qty hidden by default (source hides it) |
| 11 | Buy in Prescription | small conditional (`text` link or `spy-rx-button`) | shown only if `spec.available_rx`; `btn-outline` style, links to SportRx; full-width |
| 12 | Trust badges | `spy-trust-badges` *(custom, exists — restyle)* | bordered box `1px #E6E6E6`, pad `.75rem`, mt `2rem`, `#393939`, rows split by `hr`; 5 rows w/ inline SVG |

**Copy for trust rows** (from source; free-shipping threshold pending Open-Decision #9 — kept as editable settings):
1. Free Shipping for any order over **$100** 2. Easy Returns for 30 days 3. Discount calculated on the original price 4. Pay in 4 installments with no fees (PayPal) 5. Lifetime warranty on all sunglasses

---

## 4. Below the two-column area (full-width, in order)

| # | Section | Block/section | Data | Notes |
|---|---|---|---|---|
| 1 | Description + Technical Information | **`accordion` + `_accordion-row`** (stock) | row 1 = `pdp.long_description` (rich_text) via `text`/description; row 2 = `spy-spec-table` | header restyle: `product-panel-btn` = flex space-between, pad `1.25rem .75rem`, label-l (DIN 700 `1rem` uppercase), chevron rotates 180° on open |
| 2 | Lifestyle image carousel | **stock slideshow/media section**, styled | `pdp.feature_carousel` (list.file) | slides `1.5` mobile → `3` (≥769) → `4` (≥992), centerMode-ish; square images |
| 3 | Feature banner (full-bleed) | `spy-feature-banner` *(custom, exists)* | `pdp.feature_banner_desktop` / `_mobile` | `100vw`, my `2rem`; desktop img ≥768, mobile img <768 |
| 4 | Recommendations | **`product-recommendations`** (stock, exists) | Shopify related | "Others Also Like"; VTO dropped |

> Technical Information renders **only populated `spec.*` fields**, null-hiding, in this row order: Reference, Fit, Dimensions, Weight, Product Material, Frame Colour, Lens Material, Lens Name, Additional Lenses, Lens Category, Additional Lens Category, VLT, VLT Additional Lens, Lens Shape, Photochromy, Polarization, High Contrast, Base Tint, Mirror Tint, Lens Coating, Technologies, Available with RX, Interchangeable Lenses, Included Accessories, Certifications. `goggle.*`/`helmet.*` rows **not** rendered on `product.default`. (`spy-spec-table` already does this — restyle only.)

---

## 5. Gallery

- Desktop ≥992: **vertical thumbnail rail left** + large main stage. Keep current media-gallery `thumbnail_position: left`.
- Image ratio **1:1 square**; stage bg `#fff` + `filter: brightness(.96)`.
- Thumbnail: transparent bg, `border 2px transparent`, radius `.125rem`, active border `#242424`, current slide `brightness(.9)`; `.5rem` inner padding.
- **Video** thumb supported among the image thumbs.
- <769: single-image swipe carousel with dots; thumbnails hidden.

---

## 6. Typography wiring (Layer 1 — global)

- Copy `reference/fonts2/DINNextLTPro-{Light,Regular,Bold}.woff` → `assets/`.
- Add `@font-face` for family **`DINNextLTPro`** weights **300 / 400 / 700** (`font-display: swap`) in `src/tailwind.css` (`@theme` already references `"DINNextLTPro","D-DIN"`).
- Point Horizon font vars **globally**: `--font-heading--family` / `--font-body--family` (and weight vars) → the DIN stack. This re-fonts the whole site (intended per design tokens). Remove reliance on Barlow / old `D-DIN` files.
- Weight map: headings + bold labels (h1–h4, `label-l/m/s`) → **700**; body / `body-m` / price ("lead" 500 in source) → **400**; light captions → **300**. No true 500/600 face — map to nearest; visually faithful.
- Preload the two most-used weights (`400`, `700`) in `snippets/stylesheets.liquid`.
- `.woff` only (no `.woff2`) — acceptable; slightly larger payload.

---

## 7. Color tokens (extend `@theme` / confirm existing)

| Role | Value | Note |
|---|---|---|
| Accent / ATC | `#f57f29` | **keep Layer 1** (source computes `#F27E37`; not matching per decision) |
| Text primary | `#242424` | headings, price, active/selected |
| Text secondary | `#393939` | SKU, lens values, trust copy |
| Text muted | `#a6a6a6` | manufacturer line |
| Border / divider | `#E6E6E6` | swatch, trust box, `hr` |
| Sold-out strike | `#f2f2f2` | swatch `::after` |
| Surface tint | image bg `#fff` + `brightness(.96)` | gallery stage |
| Sale / danger | `#DF372B` (existing `spy-sale #e53935`) | reconcile to one |

Buttons: **square**, **uppercase** throughout. Existing `--color-spy-*` tokens cover orange/slate/gray/border/sale.

---

## 8. Data logic (metafield-driven; borrowed patterns)

- **Product resolution:** `closest.product` in every block.
- **Swatches:** Horizon `variant-picker` over the **Frame Color** option; swatch image = `variant.swatch` (file metafield). Combined-listing colors switch via Horizon's native combined-listing support (navigates to sibling product) — no custom JS needed. (blenderseyewear's fetch-`?sections=`-and-swap is the fallback pattern only if native switching is insufficient.) **Staging products lack variant media today (see memory), so the swatch row is dormant until the migration — build to spec regardless.**
- **Rating:** `product.metafields.reviews.rating.value.rating` / `rating_count` — reserved; renders when present.
- **RX:** `spec.available_rx` gates the SportRx link button.
- **Description:** `pdp.long_description` (rich_text); fall back to `product.description`.
- **Spec table:** `spec.*` (+ `goggle.*`/`helmet.*` only on their own templates) — already implemented in `spy-spec-table`.
- **Feature banner / carousel / size chart:** `pdp.feature_banner_desktop`/`_mobile`, `pdp.feature_carousel`, `pdp.size_chart` → `size_chart` metaobject.

---

## 9. Files touched

**New / copied**
- `assets/DINNextLTPro-Light.woff`, `-Regular.woff`, `-Bold.woff`
- `blocks/spy-frame-summary.liquid` *(only if the `text`-block metafield approach is too awkward)*
- `blocks/spy-rx-button.liquid` *(only if a `text` link can't be gated cleanly)*
- new stock slideshow section instance for the lifestyle carousel (config in `product.json`)

**Edited**
- `templates/product.json` — full block reorder + settings (grid ratio, gap, disable sticky details)
- `src/tailwind.css` → `assets/tailwind.css` (via build) — `@font-face`, global font-var override, scoped PDP overrides: 7/5 grid @769, sticky gallery, gallery square bg, variant-picker swatch size/selected, accordion header + chevron, square button radius, trust-box border
- `blocks/spy-trust-badges.liquid` — bordered-box restyle
- `blocks/spy-spec-table.liquid` — header → chevron + label-l (drop `+/−`); sit inside accordion row
- `blocks/spy-lens-info.liquid` — minor token restyle
- `snippets/stylesheets.liquid` — DIN preload

---

## 10. Build order (each step verified before the next)

1. **Fonts (Layer 1):** add `@font-face` + global font-var override + preload; `npm run build:css`. Verify the site renders in DIN, no FOUT/console errors.
2. **Layout shell:** `product-information` settings + scoped CSS (7/5 @769, gallery sticky, square gallery bg). Verify columns/sticky/breakpoints.
3. **Info column:** reorder to §3 using stock blocks; add stock `product-inventory`, `review` mount, frame/ref/lens summary; restyle title/price/variant-picker/buy-buttons/trust to tokens; wire RX gate. Verify order + styling.
4. **Accordions:** wrap Description + `spy-spec-table` in stock `accordion`; restyle header/chevron. Verify open/close + null-hiding.
5. **Below-fold:** lifestyle slideshow section (`pdp.feature_carousel`) + confirm feature banner + recommendations. Verify.
6. **Full verification:** desktop 1440 / tablet 768 / mobile 390 side-by-side vs sample; console clean; measurements match; WCAG AA; then sign-off.

---

## 11. Open flags / risks

- **Font weights:** only 300/400/700 provided; source uses 500 (price/body-m) & 600 (labels). Mapped to nearest — faithful but not exact. A DIN Next Medium `.woff` would close it.
- **Global font swap** changes header/footer/all pages (Layer 1, intended) — not PDP-only.
- **Free-shipping threshold** inconsistent on source ($50 vs $100) — Open-Decision #9; kept as editable trust-badge setting, not hardcoded.
- **Sticky-gallery** override is the one place we override Horizon's default sticky behavior.
- **Swatch data dormant** until product migration provides `variant.swatch` images.
- **Orange mismatch** (`#f57f29` token vs `#F27E37` source) — intentional per decision.

---

## 12. Definition of done

Renders from metafields on staging products · visually matches the source 1:1 at 1440 / 768 / 390 (side-by-side vs the Phase 0 baseline) · per-breakpoint behavior correct · matches page-spec measurements · WCAG 2.1 AA · no console errors · Tailwind-only, `npm run build:css` run · pushed to **Staging v2** (by the user) · signed off.
