# SPY Optic → Shopify (Horizon) — Front-End Build Plan

**Source site:** https://www.spyoptic.com (US) · **Current platform:** Salesforce Commerce Cloud (Demandware)
**Target:** Shopify Plus on **Horizon as the technical base**, with a **pixel-perfect 1:1 custom rebuild** of spyoptic.com's design (custom sections/blocks/CSS as needed) + metafield-driven data.
**Build order:** **PDP → Homepage → PLP → Annex pages.**
**Golden rule:** *Audit and spec the entire site before writing a single line of theme code. Plan, then build, one template at a time, with sign-off between each.*

> This document is the human-readable plan. The companion file **`SPY_Build_Kickoff_Prompt.md`** is the exact prompt/`CLAUDE.md` to paste into the new Claude Code session, with the proposed metafield schema appendix.

---

## 0. Operating principles (read first)

1. **Pixel-perfect 1:1 clone — custom is expected.** Reproduce spyoptic.com **exactly**: same layout, spacing, type, color, imagery, components, interactions, and responsive behavior at every breakpoint. **Build whatever custom sections/blocks/CSS/JS are required to match** — do **not** settle for Horizon's stock look or compromise the design to fit default components. Horizon is the **engine** (theme-block architecture, settings, cart/checkout/accounts, standard events, performance), not a style constraint. When a stock Horizon block can be styled to match 1:1, use it; otherwise build custom. Visual fidelity to the source wins.
2. **Three configuration layers — put every setting in the right one (see §1.5).** Global design (colors, fonts, spacing, buttons) → **theme settings**. Page/marketing content → **section/block settings + metaobjects**. Per-product data → **metafields**. Brand tokens are **theme settings, never metafields**.
3. **Data lives in metafields; layout lives in the template.** The template decides *where* and *how* something renders; metafields hold *what* renders (specs, tech, copy). A new product should populate a PDP correctly with zero template edits.
4. **Audit-first.** No theme code until the site map + page-type spec + design tokens + metafield schema are written and approved.
5. **One template at a time, with a gate.** Build → review on staging → sign off → next. Never batch-build templates blind.
6. **Everything in version control; build on "Staging v2".** Theme in a GitHub repo via Shopify CLI. Do the rebuild on a **new unpublished theme named exactly "Staging v2"** and **keep the first/existing theme untouched** (don't edit, overwrite, or delete it). Never edit the published theme.
7. **Responsive parity.** Match the current site's behavior at **mobile / tablet / desktop**. Where the source uses different assets or layouts per breakpoint (e.g. a hero with distinct mobile/tablet/desktop images), the theme must expose a **separate setting for each breakpoint** — not one shared value.
8. **Verify every change against the source — pixel diff.** After each build step, screenshot your build at **desktop 1440 / tablet 768 / mobile 390** and put it **side-by-side (ideally overlaid) with the matching source screenshot from Phase 0**. Hunt for spacing, type, color, and alignment deltas; fix until it matches. Watch the console. Nothing is "done" from code alone or from a single viewport.

---

## 1. Environment & tooling setup (Phase -1, half a day)

- Shopify Plus dev/staging store provisioned; **Horizon** installed as the base theme (unmodified copy kept as `horizon-vanilla` for diffing).
- **Shopify CLI** + Git repo; `shopify theme dev` for local preview, `shopify theme push --unpublished` for staging.
- **Browser automation for the crawl** (Chrome/Playwright via MCP): renders JS, captures full-page screenshots (desktop 1440 + mobile 390), DOM HTML, and computed styles. SFCC pages are partly JS-rendered, so static fetch alone is insufficient.
- A scratch repo/folder for audit artifacts: `/audit/` (sitemap, page specs, tokens, screenshots, component inventory).
- Confirm whether product/metafield **data** will arrive via the parallel Matrixify/NetSuite migration (it should). The theme is built against the **metafield schema**, not hand-entered data.

---

## 1.5 Configuration hierarchy — where every setting lives

The whole store must be **non-developer editable long-term**. Every value goes in exactly one of three layers; never hard-code a color, font, or piece of copy in Liquid/CSS.

| Layer | What goes here | Where it's edited | SPY examples |
|---|---|---|---|
| **1 · Theme settings** (global design system) | All **colors**, **typography (font + size + weight per style)**, spacing scale, button styles, radii, logo, favicon, color **schemes**, default section padding | Theme editor → *Settings* (`config/settings_schema.json`) | brand orange `#f57f29`, slate `#2c393e`, white; H1/H2/eyebrow/body/price fonts; primary/secondary button styles; "New"/sale badge colors |
| **2 · Section & block settings + metaobjects** | Page/marketing **content & arrangement** — headings, images, CTAs, which blocks appear and in what order, reusable content (tech blurbs, size charts, collection stories) | Theme editor → *Sections*, and *Content → Metaobjects* | homepage hero, category tiles, feature banners, tech-guide copy, collection intro/SEO copy |
| **3 · Product/variant metafields** | **Per-product data** that differs item to item | Product admin / data migration | VLT, lens category, frame material, weight, Base, MIPS, technologies |

**Decision rule:** *Brand-wide and visual → Layer 1. Page content an editor changes → Layer 2. Differs per product → Layer 3.* Brand tokens (orange, fonts) are **Layer 1 theme settings — not metafields.**

**Theme-settings requirements (Layer 1) — build these out fully so nothing is locked in code:**
- **Colors:** use Horizon's **color-palette architecture** (Shopify's newer color system, Spring 2026) — define named brand colors/palettes once in settings and reference them across every surface and color scheme (default/light, dark/footer, accent/sale, announcement bar). Change once → updates site-wide. Don't hard-code hex anywhere.
- **Typography:** a font **and** size/weight/line-height/letter-spacing setting for **each text style**: H1, H2, H3, eyebrow/overline, body, small/caption, price, buttons, nav. Heading font vs body font selectable independently.
- **Buttons & shapes:** primary/secondary/tertiary button styles, border radius, border width.
- **Layout:** page width, section spacing/density, grid gutters.
- **Brand assets:** logo (+ inverse), favicon.
- **Badges/labels:** colors/text for "New", "Sale", color-count.
- **Responsive media settings:** any section whose source uses different assets/layout per breakpoint must expose **separate mobile / tablet / desktop** settings — e.g. a hero with **3 image slots** (mobile, tablet, desktop), plus per-breakpoint text alignment/overlay/height. Never force one desktop image to do all three. Confirm during Phase 0 which sections are breakpoint-specific (hero, banners, category tiles) and spec the per-breakpoint settings.

> Acceptance check for Layer 1: changing a single theme-setting value (e.g. swap the orange, or change the heading font) must visibly update **everywhere** it's used, with **zero code edits**.

## 1.6 Build it the current way — leverage what's new (Spring 2026)

Horizon remains Shopify's flagship base theme (no successor announced as of Spring 2026). Build on these current capabilities so the store is future-proof:

- **Color-palette architecture (new color system):** drive all theme color from named palettes/settings (see §1.5). Reinforces Layer 1.
- **Theme blocks everywhere (custom-built to match 1:1):** keep the nestable theme-block + section-group architecture for editability and the metafield-driven PDP/PLP — but **author custom sections/blocks styled pixel-exact to SPY**. The block *system* is the win; the stock block *look* is not a constraint. Don't compromise the design to reuse a default.
- **Standard storefront events & actions:** implement Horizon's **standard events/actions** so apps *and* AI agents/analytics interact with the storefront reliably — wire GA4/marketing pixels and the "add to cart / variant change" events to these, not bespoke handlers.
- **Rollouts:** plan to publish the finished theme (and run A/B tests / scheduled launches / safe rollbacks) via **Rollouts** — fold this into the cutover step (§8).
- **AI dev tooling:** the build session may use Shopify's dev MCP / Sidekick (manage themes from Claude Code) and **SimGym** (AI store analysis) to spot UX/conversion issues pre-launch. Use as accelerators, not substitutes for the audit.
- **Customer accounts (web components / new accounts):** use the current customer-account components rather than legacy classic accounts.

> Confirm in the Theme Store / shopify.dev at kickoff that Horizon is still current and note any newer first-party base theme before scaffolding.

## 2. Phase 0 — Site reconnaissance & specification ⭐ (most important phase)

**Goal:** a complete, structured understanding of every page type so the build is mechanical, not exploratory. Output is a set of spec docs, not code.

### 2.1 Build the full site map
- Pull `sitemap.xml` and all child sitemaps; crawl the main nav + mega-menu + footer to catch anything not in the sitemap.
- Classify **every URL** into a page type (below). Record: URL, page type, template candidate, notes.
- Deliverable: **`/audit/sitemap.csv`** (URL, type, parent, status) and **`/audit/sitemap.md`** (tree view).

### 2.2 Page-type taxonomy (confirmed from recon)
| Page type | Examples | Template strategy |
|---|---|---|
| **PDP – Eyewear (default)** | Sunglasses, Eyeglasses, Blue Light, Safety, Fishing | `product.default` |
| **PDP – Snow goggles** | Marauder, Megalith, Marshall 2.0 | `product.snow-goggle` |
| **PDP – Moto goggles** | Foundation, Woot | `product.moto-goggle` (variant of goggle) |
| **PDP – Snow helmet** | (Snow Helmets line) | `product.helmet` |
| **PDP – Replacement lens** | Replacement Lens Marauder, Bravo Lens | `product.lens` (simplified) |
| **PDP – Apparel / Gear** | Shirts, Hoodies, Hats/Beanies | `product.apparel` (size options) |
| **PDP – Accessory / Case** | Sunglass cases | `product.default` (lean) |
| **PLP / Category** | /sunglasses/, /goggles/snow-goggles/ | `collection.default` + faceted filters |
| **Collection (curated)** | Discord Series, Happy Boost, SLAYCo | `collection.story` (editorial + grid) |
| **Homepage** | / | `index` |
| **Tech feature guide** | HappyBoost, HappyLens, SnowTech, SnowHelmetTech | `page.tech-guide` (metaobject-driven) |
| **Editorial / brand** | About, ChangeAgents (athletes), ESG, Loyalty | `page.editorial` |
| **Policy / support** | Warranty, Returns, Shipping, FAQ, Privacy, Terms, Accessibility | `page.default` |
| **Blog (Journal)** | /spy-blog/ | `blog` + `article` |
| **Account / Cart / Search** | login, account, cart, search | Horizon defaults, re-skinned |
| **External (not rebuilt)** | Store locator (stores.spyoptic.com), SportRx, Dealer Portal | Link out |

### 2.3 Per-page-type spec (do this for ONE representative page of each type)
Because the target is **pixel-perfect**, capture enough to rebuild exactly. For each representative page:
- Full-page screenshots at **desktop 1440, tablet 768, mobile 390** (these become the visual diff baseline).
- **Exact design measurements from computed styles:** container/max widths, column counts & gutters, paddings/margins (px), font-size / weight / line-height / letter-spacing per element, exact colors (hex/rgba), border radii, shadows, image aspect ratios. Save as data, not eyeballing.
- **Exact breakpoints** where layout changes (don't assume — read the CSS media queries) and what changes at each.
- **Fonts:** exact font families + the actual `@font-face` files/weights (capture the font files/URLs to re-host or license).
- **Interactions/animations:** hover states, transitions, carousels, sticky behaviors, modals, mega-menu timing — note durations/easing.
- **Section-by-section inventory** top→bottom: section name, purpose, content, and how it'll be implemented — **stock Horizon block (styled to match) vs. custom block** (default to custom whenever stock can't hit 1:1).
- **Data vs. layout split:** mark each element *template* (layout) or *metafield/metaobject* (per-product/page data).
- Deliverable: **`/audit/page-spec-<type>.md`** each, with the measurements table.

### 2.4 Design tokens
Extract and record into **`/audit/design-tokens.md`** → map to Horizon theme settings:
- **Colors:** brand orange `#f57f29`, slate `#2c393e`, white `#fff` (+ greys, sale red). Pull the full palette from computed styles.
- **Typography:** font families, weights, sizes for H1/H2/body/eyebrow/price; map to Horizon font settings.
- **Logo** (SVG), favicon, button styles, radii, spacing scale, badge styles ("New", color-count, sale strikethrough).

### 2.5 Component inventory (cross-page, reusable)
Header w/ mega-menu, announcement bar ("🔥 SALE"), footer (Company/Services/Policy/Programs, payment icons, B-Corp, socials), trust-badge row (Free shipping $50 · Returns 30d · Warranty · Contact), cookie consent (currently Axeptio), country selector. Map each to a Horizon group/section.

**Phase 0 exit criteria:** sitemap complete · every page type has a spec doc · design tokens mapped to Horizon settings · metafield schema drafted (§3) · open decisions resolved (§9). **Only then write code.**

---

## 3. Template-vs-metafield framework + proposed schema

**Principle:** the PDP template is one layout that reads from metafields. "Default products use the default template; special lines (e.g. snow goggles) get a specific template." Special templates are *additive* — same metafield engine, extra sections/blocks for category-specific data (Base, Fit System, Ventilation, MIPS…).

### 3.1 What is TEMPLATE (layout/logic, built once)
Gallery layout, variant pickers, sticky add-to-cart, spec-table **renderer**, lens-tech **modal shell**, VLT/lens-category indicator, trust badges, "Complete your selection" (Shopify product recommendations), "Others also like", breadcrumbs, review widget mount, RX button logic.

### 3.2 What is METAFIELD/METAOBJECT (data, per product)
Every row of the PDP "Technical information" table + marketing modules. **Full proposed schema is in the kickoff prompt appendix.** Summary of namespaces:
- `spec.*` — fit, dimensions, weight, frame/lens material, lens name, lens category, **VLT**, base tint, mirror tint, lens shape, polarized, photochromic, high-contrast, lens coating, available-with-RX, included accessories, certifications.
- `goggle.*` — base, fit system, ventilation, removable padding, OTG, interchangeable lens, extra-lens included + its name/VLT/category.
- `helmet.*` — MIPS, certifications, sizes.
- `pdp.*` (content) — long description (rich text), feature banner (desktop/mobile images), feature carousel, product video, size-chart reference.
- **Metaobjects** — `technology` (Happy Lens, Happy Boost, Anti-Fog, Magnetic Lens, Mono Shield, Snap Hinge…: name, icon, blurb, link); `size_chart`; `collection_story`.
- **Variant level** — Frame Color (option), Lens (option), Extra Lens (option/bundle), swatch image, SKU/Ref.

### 3.3 Decision rule for "template or metafield?"
> If it changes per product → **metafield/metaobject**. If it's the same frame/layout for every product of that type → **template**. If the same blurb repeats across many products (e.g. "What is Happy Lens") → **metaobject** referenced by many products.

---

## 3.5 Phase 0.7 — Metafield definitions ⭐ (run AFTER Phase 0 approval, BEFORE any Phase 1 code)

**Goal:** the metafield schema exists and is validated against the products **already in staging** — so PDP/PLP templates are built against real data. **Skip product creation this round** (products already exist; reuse them). `spy_sample_products.csv` stays as a schema/data reference only — do **not** import or create products from it.

1. **Ensure metafield + metaobject DEFINITIONS via the Shopify Admin GraphQL API** (`metaobjectDefinitionCreate` first — `technology`, `size_chart`, `collection_story` — then `metafieldDefinitionCreate`) for every key in **Appendix A** (`spec.*`, `goggle.*`, `helmet.*`, `pdp.*`). Correct types, human-readable names, pinned to the product admin; reference fields point at the metaobject definitions. **Idempotent** — skip any definition that already exists.
2. **Validate against existing products:** confirm definitions are pinned and that a few real staging products carry the expected metafields. Flag gaps to be filled by the data migration — **do not invent values**.

**Exit criteria:** schema present in staging and validated on existing products. **Only then begin Phase 1.**

## 4. Phase 1 — PDP (build first)

### 4.1 Default eyewear PDP (`product.default`)
Map each observed module to Horizon:
- Breadcrumb · Title · Price (+ "starting from" for variant ranges) · star rating (reviews app).
- **Media gallery** — multi-image + video → Horizon product media.
- **Variant selectors** — Frame Color swatches, Lens, Extra Lens → Horizon variant pickers (swatch style).
- **Add to Cart** (sticky on mobile) + quantity.
- **Buy in Prescription** button + RX eligible-states modal → *see §9 decision*.
- **Lens info / Lens technology modal** — VLT %, Lens Category (Cat 0–4 scale), tint base, technology icon + description → custom block reading `spec.*` + `technology` metaobjects.
- **Trust badges** (Free shipping $50 · 30-day returns · warranty · PayPal Pay-in-4 · lifetime warranty) → reusable block.
- **Size Chart** link → modal from `size_chart` metaobject.
- **Description + Technical Information** spec table → custom block that renders only populated `spec.*`/`goggle.*`/`helmet.*` fields.
- **Feature banner** (desktop+mobile marketing image) → image block from `pdp.feature_banner_*`.
- **"Complete your selection"** & **"Others also like"** → Shopify product recommendations / complementary products (Search & Discovery).

### 4.2 Snow goggle PDP (`product.snow-goggle`)
Same engine + goggle-specific spec block (`goggle.*`: Base, Fit System, Ventilation, Removable Padding, OTG, interchangeable/extra lens), lens-tech tuned for goggles, "included second lens" treatment. Moto-goggle and helmet templates derive from this pattern (`helmet.*` adds MIPS/sizes/certs).

### 4.3 Lens / apparel / accessory PDPs
Leaner default: apparel uses size options + size chart, no lens spec; replacement lens uses a stripped spec block (VLT/category only).

**Phase 1 exit:** default + snow-goggle templates live on staging, populated by metafields on 2–3 sample products each, reviewed and signed off. Document the metafield→block mapping as you go.

---

## 5. Phase 2 — Homepage (`index`)
Rebuild observed blocks with Horizon sections: announcement bar, hero/campaign, **category "lens-hover" tiles** (Snow/Safety/Fishing/Lifestyle/Classics/Moto/Trail/Blue Light), featured-product carousels (New Arrivals, Watermen), collection feature banners (Happy Boost, Region XL), loyalty CTA, value-prop/trust row, editorial links. All content via section settings/metaobjects so marketing can edit without code.

## 6. Phase 3 — PLP / Collections
- `collection.default` with **faceted filters** via **Shopify Search & Discovery** (Category, Color, Price, **Lens Tech / Lens Category**) — map SFCC refinements to Shopify filters (metafield- and option-based).
- Product cards: color-swatch thumbnails + **"N colors available"**, **New** badge, **sale** strikethrough/%, **Quick View**, **Compare** (*see §9*).
- Sort: Most Popular / Price ↑ / Price ↓.
- Intro copy + **bottom SEO content blocks** (e.g. "What are polarized ski goggles", "OTG") → metafields on the collection.
- `collection.story` for curated collections (Discord, Happy Boost, SLAYCo): editorial hero + narrative + product grid.

## 7. Phase 4 — Annex pages
- **Tech-feature guides** (HappyBoost, HappyLens, SnowTech, SnowHelmetTech) → `page.tech-guide` driven by `technology` metaobjects (reused on PDPs).
- **Editorial/brand:** About, ChangeAgents (athletes/team), ESG, Loyalty program.
- **Policy/support:** Warranty, Returns, Shipping, FAQ, Privacy, Terms, Accessibility, Offers & Conditions.
- **Blog (Journal):** `blog` + `article` templates; migrate posts.
- **Account / Cart / Search:** Horizon defaults, re-skinned to tokens.
- **External (link out, not rebuilt):** Store Locator (stores.spyoptic.com), Dealer Portal (b2b-bollebrands), Military/GovX, Affiliate (AvantLink), prescription via SportRx (if applicable per §9).

---

## 8. Cross-cutting requirements
- **SEO/redirects:** export the full URL inventory (from Phase 0) → hand to the 301 redirect workstream (SFCC `.html`/PID URLs → Shopify `/products/`,`/collections/`). Preserve titles, meta, structured data (Product/Breadcrumb), canonicals.
- **Accessibility (ADA/WCAG 2.1 AA):** bake in during build (semantic markup, focus states, alt text, contrast) — eyewear DTC is high-risk for lawsuits.
- **Performance/CWV:** lean on Horizon's native lazy-loading and image handling; budget Core Web Vitals before BFCM load.
- **Cookie consent:** replicate current CMP (Axeptio or replacement) tied to GA4 Consent Mode v2.
- **Data dependency:** PDP correctness depends on the **product + metafield migration** (NetSuite/Matrixify). Coordinate the metafield schema here with that workstream so fields line up 1:1.
- **Analytics via standard events:** wire GA4 (server-side) + ad pixels to Horizon's **standard storefront events/actions** rather than custom DOM hooks — more reliable and agent/app-compatible.
- **Launch via Rollouts:** publish the finished theme using **Rollouts** (scheduled publish, A/B test vs. the current site where possible, instant rollback). Align with the cutover runbook in the migration plan.

---

## 9. Open decisions to confirm (these change the PDP/PLP build)
1. **Prescription (RX):** the live site runs a separate RX ordering system (cart can't mix RX + non-RX) and links to **SportRx** for some categories. For the Shopify build at launch: **(a)** out of scope / link out (recommended for timeline), **(b)** replicate via an RX/lens-configurator app, or **(c)** custom integration? This drives the PDP "Buy in Prescription" button + states modal + cart logic.
2. **Virtual Try-On (VTO):** present on PDPs ("VTO loading…"). Replicate via a Shopify VTO app, drop for launch, or Phase 2?
3. **Compare** feature on PLPs: keep or drop for launch?
4. **Quick View:** keep (Horizon quick-add) or send straight to PDP?
5. **Locales:** US-only at launch confirmed (per migration scope) — the EU locale switcher is not rebuilt? 
6. **Reviews app:** which provider feeds the star ratings (Yotpo/Okendo per migration plan) — confirm so the PDP review block targets the right app.
7. **Collection "story" pages:** how many curated collections need the editorial template vs. a standard grid?

---

## 10. How the new Claude Code session should operate
1. Start by reading the kickoff prompt / `CLAUDE.md`.
2. Execute **Phase 0** fully; produce the `/audit/` artifacts; **stop and present** the sitemap, page specs, design tokens, and metafield schema for approval.
3. After approval, run **Phase 0.7**: ensure metafield/metaobject definitions exist (idempotent). **Skip product creation — reuse the products already in staging.** Validate the schema on a few existing products.
4. On the **"Staging v2"** theme, build **PDP default** → review against existing staging products with a 1:1 screenshot diff → sign-off → **PDP snow goggle** → sign-off.
5. Proceed Homepage → PLP → Annex, gating each.
6. Keep a living **`/audit/metafield-map.md`** (block ↔ metafield) and update the redirect URL inventory as pages are finalized.
7. Never edit the published theme; always staging + PR.
