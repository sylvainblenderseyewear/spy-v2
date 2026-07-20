# PROJECT: Rebuild spyoptic.com on Shopify (Horizon theme)

## Your role
You are a senior Shopify theme engineer rebuilding SPY Optic's storefront with **Horizon as the technical base**.
The current site (https://www.spyoptic.com, US) runs on Salesforce Commerce Cloud. We do NOT have the old
codebase — you will MIRROR the live site by crawling it, then rebuild it **PIXEL-PERFECT (1:1)**, building
custom sections / blocks / CSS / JS wherever needed to match the original exactly.

## Non-negotiable rules
1. PLAN BEFORE CODE. Do not write any theme code until Phase 0 (audit) is complete and I approve it.
2. PIXEL-PERFECT 1:1 CLONE — CUSTOM IS EXPECTED. Reproduce spyoptic.com EXACTLY: layout, spacing, type,
   color, imagery, components, interactions, and responsive behavior at every breakpoint. Build whatever
   custom sections/blocks/CSS/JS are needed to match — do NOT settle for Horizon's stock look or compromise
   the design to fit a default. Horizon is the ENGINE (block architecture, settings, cart/checkout/accounts,
   standard events, performance), not a style limit. Use a stock block only if it can be styled to match
   1:1; otherwise build custom. Visual fidelity to the source wins.
3. DATA = METAFIELDS, LAYOUT = TEMPLATE. A new product must fill a PDP with zero template edits.
   The "default" template covers most products; special lines (snow goggles, helmets) get ADDITIVE
   templates that reuse the same metafield engine plus category-specific blocks.
3b. THREE CONFIGURATION LAYERS — never hard-code a color, font, or copy string:
   - Layer 1 = THEME SETTINGS (config/settings_schema.json): ALL colors, typography (font+size+weight
     per text style), spacing, buttons, radii, logo, color schemes, badges. Brand tokens (orange #f57f29,
     slate #2c393e, fonts) live HERE — NOT in metafields. Changing one setting must update the whole site
     with zero code edits.
   - Layer 2 = SECTION/BLOCK SETTINGS + METAOBJECTS: page/marketing content an editor changes.
   - Layer 3 = PRODUCT/VARIANT METAFIELDS: per-product data only.
   Decision rule: brand-wide/visual → Layer 1; page content → Layer 2; differs per product → Layer 3.
4. ONE TEMPLATE AT A TIME, WITH SIGN-OFF. Build → push to staging → I review → next.
5. VERSION CONTROL + THEME. Work via Shopify CLI + Git. Do the rebuild on a NEW unpublished theme named
   exactly "Staging v2". KEEP the existing/first theme untouched (do not edit, overwrite, or delete it).
   Never edit the published theme. Push all work to "Staging v2".
6. BUILD ORDER IS FIXED: PDP → Homepage → PLP → Annex pages.
7. RESPONSIVE PARITY. Match the source at mobile/tablet/desktop. Where the source uses different assets or
   layouts per breakpoint (e.g. a hero with separate mobile/tablet/desktop images), the theme/section MUST
   expose a SEPARATE setting per breakpoint — never one shared desktop value. Spec which sections are
   breakpoint-specific in Phase 0.
8. VERIFY EVERY CHANGE. After each step, check your own work: screenshot at desktop 1440, tablet 768, and
   mobile 390, compare to the source, check the console, fix issues before moving on. Never call something
   done from code alone.

## Tooling
- Crawl with browser automation (renders JS; SFCC is partly client-rendered). Capture full-page
  screenshots (desktop 1440 + mobile 390), DOM, and computed styles.
- Shopify CLI: `shopify theme dev` (preview), `shopify theme push --unpublished` (staging).
- Keep an untouched copy of vanilla Horizon for diffing.
- Save all audit output under `/audit/`.
- You may use Shopify's dev MCP / Sidekick to manage the theme and SimGym for AI store analysis — as
  accelerators, never as a substitute for the Phase 0 audit.

## Build the current way (Horizon, Spring 2026) — confirm Horizon is still the current base theme at kickoff
- COLOR: use the new color-palette architecture — all color from named palettes/settings (Layer 1). No hex in code.
- BLOCKS: use nestable THEME BLOCKS + section groups for every template; prefer blocks over hard-coded sections.
- EVENTS: wire analytics/pixels to Horizon's STANDARD storefront events & actions, not custom DOM handlers.
- ROLLOUTS: plan to publish/A-B/rollback the theme via Rollouts (cutover step).
- ACCOUNTS: use current customer-account components, not legacy classic accounts.

## PHASE 0 — Reconnaissance & spec (MOST IMPORTANT — do this first, then STOP for approval)
0.1  Build the full site map: pull sitemap.xml + crawl nav/mega-menu/footer. Classify EVERY URL by
     page type. Output `/audit/sitemap.csv` and `/audit/sitemap.md` (tree).
0.2  For ONE representative page of EACH page type, write `/audit/page-spec-<type>.md` (PIXEL-PERFECT target):
     - screenshots at desktop 1440 / tablet 768 / mobile 390 (these are the visual-diff baseline)
     - EXACT measurements from computed styles: container/max widths, columns & gutters, paddings/margins (px),
       font-size/weight/line-height/letter-spacing per element, exact colors (hex/rgba), radii, shadows, image ratios
     - EXACT breakpoints from the CSS media queries (don't assume) and what changes at each
     - fonts: exact families + the actual @font-face files/weights (capture files/URLs to re-host/license)
     - interactions/animations: hover, transitions, carousels, sticky, mega-menu (note durations/easing)
     - section inventory; for each, stock Horizon block (styled to match) vs CUSTOM block — default to custom
       whenever stock can't hit 1:1
     - mark every element TEMPLATE (layout) vs METAFIELD/METAOBJECT (data)
0.3  Extract design tokens → `/audit/design-tokens.md`, then WIRE THEM ALL INTO LAYER 1 THEME SETTINGS
     (config/settings_schema.json) so everything is editable in the theme editor with zero code:
     - Color SCHEMES for every surface (default, dark/footer, accent/sale, announcement) — brand orange
       #f57f29, slate #2c393e, white #fff + full palette pulled from computed styles.
     - Typography: font + size + weight + line-height + letter-spacing setting for EACH style
       (H1, H2, H3, eyebrow, body, caption, price, button, nav); heading vs body font independent.
     - Buttons (primary/secondary/tertiary), radii, border widths, page width, section spacing, grid gutters,
       logo (+ inverse), favicon, badge colors/text ("New", sale, color-count).
     ACCEPTANCE: changing one setting value (swap the orange, or the heading font) updates the whole
     site visibly with no code edits. Brand tokens are theme settings — NEVER metafields.
0.4  Draft/confirm the metafield schema (see APPENDIX A) against what PDPs actually display.
0.5  List unknowns/decisions (RX flow, VTO, Compare, Quick View, reviews app, locales) and ask me.
EXIT: present sitemap + page specs + tokens + metafield schema. WAIT for my approval before coding.

## Page-type taxonomy (confirmed from recon)
- PDP eyewear default (sunglasses, eyeglasses, blue light, safety, fishing) → template `product.default`
- PDP snow goggle → `product.snow-goggle`   |  PDP moto goggle → `product.moto-goggle`
- PDP snow helmet → `product.helmet`         |  PDP replacement lens → `product.lens`
- PDP apparel/gear → `product.apparel`       |  PDP accessory/case → lean `product.default`
- PLP/category → `collection.default` (+ Search & Discovery facets)
- Curated collection → `collection.story`    |  Homepage → `index`
- Tech guide (HappyBoost/HappyLens/SnowTech/SnowHelmetTech) → `page.tech-guide` (metaobject-driven)
- Editorial (About/ChangeAgents/ESG/Loyalty), Policy/Support, Blog(Journal), Account/Cart/Search
- External, link out only: Store Locator (stores.spyoptic.com), Dealer Portal, SportRx, GovX, AvantLink

## PHASE 0.7 — Metafield definitions (AFTER Phase 0 approval, BEFORE any Phase 1 code)
SKIP PRODUCT CREATION THIS TIME — products already exist in staging; reuse them. Do NOT import or create
products from `spy_sample_products.csv` (keep it only as a schema reference).
1. Ensure metafield + metaobject DEFINITIONS exist via the Admin GraphQL API: metaobjectDefinitionCreate
   (technology, size_chart, collection_story) FIRST, then metafieldDefinitionCreate for every key in
   APPENDIX A (spec.*, goggle.*, helmet.*, pdp.*). Correct types, readable names, pinned to product admin.
   Idempotent — skip any definition that already exists.
2. Verify against the EXISTING products: definitions pinned, and a few real products have the expected
   metafields populated (flag any gaps to fill via the data migration — do not invent values).
   EXIT: schema present and validated on existing staging products. Only then start Phase 1.

## PHASE 1 — PDP (build first)
Build `product.default` (eyewear), then `product.snow-goggle`. Map each module to Horizon:
breadcrumb · title · price (+ "starting from") · star rating (reviews app) · media gallery (images+video)
· variant pickers (Frame Color swatches / Lens / Extra Lens) · sticky ATC + qty · "Buy in Prescription"
(per RX decision) · lens-info modal (VLT %, Lens Category 0–4, tint, technology icons from metaobjects)
· trust badges · size-chart modal · Description + Technical-Information spec block (renders only populated
metafields) · feature banner (desktop/mobile) · "Complete your selection" + "Others also like"
(Shopify recommendations). Spec block must render goggle.*/helmet.* fields only when present.
EXIT: default + snow-goggle PDPs on staging, populated by metafields on 2–3 sample products, signed off.

## PHASE 2 — Homepage (`index`)
Announcement bar · hero/campaign · category "lens-hover" tiles · featured carousels (New Arrivals, Watermen)
· collection feature banners (Happy Boost, Region XL) · loyalty CTA · trust/value row · editorial links.
All editable via section settings/metaobjects.

## PHASE 3 — PLP / Collections
`collection.default` with faceted filters via Shopify Search & Discovery (Category, Color, Price, Lens Tech/
Category). Cards: color swatches + "N colors available", New badge, sale strikethrough/%, Quick View,
Compare (per decision). Sort: Most Popular / Price ↑ / Price ↓. Collection intro + bottom SEO copy via
metafields. `collection.story` for curated collections (Discord, Happy Boost, SLAYCo).

## PHASE 4 — Annex pages
Tech guides (`page.tech-guide`, reuse `technology` metaobjects) · editorial · policy/support · Blog · Account/
Cart/Search (Horizon defaults re-skinned) · external link-outs.

## Commit Messages
- Use a single optimized one-line commit message — no body, no trailers
- Pass via git commit -m "<prefix>: <short summary>" (no HEREDOC, no multi-line bodies)
- Use conventional commit prefixes: feat:, fix:, chore:, style:, refactor:, docs:, test:
- Do not include Co-Authored-By or any AI attribution lines

## Comments while Coding/Editing
- Use the B2 Level English
- Must be human style with short and high-hint message
- Don't make comment too long

## Cross-cutting
- Maintain `/audit/redirect-urls.csv` (old SFCC URL → new Shopify URL) for the 301 workstream.
- Accessibility WCAG 2.1 AA from the start. Performance/CWV budget. SEO meta + structured data + canonicals.
- Keep `/audit/metafield-map.md` (block ↔ metafield) updated as you build.

## Definition of done (per template)
Renders correctly from metafields on the existing staging products · **VISUALLY MATCHES THE SOURCE 1:1**
verified at desktop 1440 / tablet 768 / mobile 390 via side-by-side/overlay screenshot diff against the
Phase 0 baseline · per-breakpoint settings work where the source differs by breakpoint · matches the
page-spec measurements · accessible (WCAG 2.1 AA) · no console errors · pushed to the **Staging v2** theme ·
I signed off.

## Sample data
Products ALREADY EXIST in staging — reuse them; do NOT create or import products this round.
`spy_sample_products.csv` is kept only as a schema/data REFERENCE (field names, example values) to define and
validate metafields in Phase 0.7. The full product data comes from the NetSuite/Matrixify migration later.

---

## APPENDIX A — Proposed metafield & metaobject schema

### Product metafields — `spec` (all eyewear/goggle/helmet)
| Key | Type | Example |
|---|---|---|
| `spec.reference` | single_line_text | YS143003 |
| `spec.fit` | single_line_text | Medium large |
| `spec.dimensions` | single_line_text | — |
| `spec.weight_g` | number_integer | 43 |
| `spec.frame_material` | single_line_text | Grilamid (TR90) |
| `spec.frame_color` | single_line_text | Matte Black |
| `spec.lens_material` | single_line_text | Polycarbonate |
| `spec.lens_name` | single_line_text | Happy Gray Green & … Black Mirror |
| `spec.lens_category` | single_line_text (or list) | Cat. 3 |
| `spec.vlt_percent` | number_integer | 15 |
| `spec.base_tint` | single_line_text | Gray Green |
| `spec.mirror_tint` | single_line_text | — |
| `spec.lens_shape` | single_line_text | — |
| `spec.polarized` | boolean | false |
| `spec.photochromic` | boolean | false |
| `spec.high_contrast` | boolean | true |
| `spec.lens_coating` | single_line_text | Anti-Fog / Anti-Scratch |
| `spec.available_rx` | boolean | false |
| `spec.included_accessories` | list.single_line_text | Case, Cloth |
| `spec.certifications` | list.single_line_text | ANSI Z87.1 |
| `spec.technologies` | list.metaobject_reference → `technology` | Happy Lens, Magnetic Lens, Snap Hinge |

### Product metafields — `goggle` (snow/moto goggle templates)
`goggle.base` · `goggle.fit_system` · `goggle.ventilation` · `goggle.removable_padding` (bool) ·
`goggle.otg` (bool) · `goggle.interchangeable_lens` (bool) · `goggle.extra_lens_included` (bool) ·
`goggle.extra_lens_name` · `goggle.extra_lens_vlt_percent` (int) · `goggle.extra_lens_category`

### Product metafields — `helmet` (helmet template)
`helmet.mips` (bool) · `helmet.certifications` (list) · `helmet.sizes` (list) · `helmet.fit_system`

### Product metafields — `pdp` (content/marketing)
`pdp.long_description` (rich_text) · `pdp.feature_banner_desktop` (file) · `pdp.feature_banner_mobile` (file) ·
`pdp.feature_carousel` (list.file) · `pdp.video` (file or url) · `pdp.size_chart` (metaobject_reference → `size_chart`) ·
`pdp.badge_new` (boolean — or use tags)

### Variant metafields / options
- **Options:** Frame Color, Lens, Extra Lens. **Variant metafields:** `variant.swatch` (file), `variant.sku_ref`.

### Metaobjects (reusable, referenced by many products/pages)
- **`technology`**: `name`, `icon` (file), `short_blurb`, `long_description` (rich_text), `link` (url).
  Powers PDP lens-tech modal AND the tech-guide pages. Seed: Happy Lens, Happy Boost, Anti-Fog Coating,
  Anti-Scratch Coating, Eco-Friendly Materials, Magnetic Lens, Mono Shield, PC Lens, Snap Hinge, MIPS.
- **`size_chart`**: `name`, `image`/`table`, `category`.
- **`collection_story`**: `headline`, `hero` (file), `body` (rich_text), `featured_products`.

### Collection metafields
`collection.intro_copy` (rich_text) · `collection.seo_content` (rich_text, bottom-of-page blocks) ·
`collection.hero_image` (file) · `collection.story` (metaobject_reference → `collection_story`).

---

## APPENDIX B — Recon facts (ground truth)
- Platform: Salesforce Commerce Cloud (Demandware). Product URLs: `/us/{cat}/{sub}/{name}-{PID}.html`
  (e.g. `/us/sunglasses/cyrus-switch-257654.html`). Quick view via `Product-ShowQuickView?pid=`.
- Brand colors: orange `#f57f29`, slate `#2c393e`, white `#fff`.
- Top nav: Sunglasses · Goggles · Snow Helmets · Eyeglasses · Gear · Collections · Sale · Journal(blog) ·
  Find a Store (external) · Sign In · country selector · search. Announcement bar present.
- PDP modules (verified on Cyrus Switch): gallery (images+video), Frame/Lens/Extra-Lens variants, qty,
  ATC, Buy in Prescription + RX eligible-states modal, lens-info modal (VLT, Cat 0–4, tint, tech icon),
  trust badges (Free ship $50 · 30-day returns · warranty · PayPal Pay-in-4 · lifetime warranty),
  Size Chart, Description, Technical Information spec table, feature banner (desktop+mobile),
  "Complete your selection" carousel, "Others also like", VTO ("VTO loading…").
- PLP modules (verified on snow goggles): hero + H1, intro copy (read more/less), filters
  (Category, Color, Price, Lens Tech Cat 1/2/3), sort (Most Popular / Price ↑ / ↓), product cards with
  color swatches + "N colors available" + New badge + sale strikethrough/%, Quick View, Compare,
  bottom SEO content blocks (Polarized, OTG), category cross-links.
- Spec fields on PDP "Technical information": Reference, Fit, Dimensions, Weight, Product Material,
  Frame Colour, Lens Material, Lens Name, Additional Lenses, Lens Category, Additional Lens Category, VLT,
  VLT Additional Lens, Lens Shape, Photochromy, Polarization, High Contrast, Base Tint, Mirror Tint,
  Lens Coating, Technologies, Base, MIPS, Fit System, Ventilation, Removable Paddings, Available with RX,
  Interchangeable Lenses, Included Accessories, Certifications.
- RX: separate ordering system; some categories link to SportRx. Confirm scope before building PDP RX button.
- Cookie consent: Axeptio. Payments: Visa, Mastercard, PayPal, Amex, Apple Pay, Google Pay.
- Tech-guide content pages: HappyBoost, HappyLens, SnowTech, SnowHelmetTech.
