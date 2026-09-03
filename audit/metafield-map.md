# SPY Optic — Metafield ↔ Block Map (Living Document)

> Updated after Phase 1–4 build. Reflects blocks and sections as actually implemented.

---

## PDP Blocks — `product.json` (default eyewear)

| Block / Section | File | Metafield(s) Read |
|---|---|---|
| Breadcrumbs | `blocks/spy-breadcrumbs.liquid` | `product.collections` (first non-all/non-frontpage) |
| Lens Info | `blocks/spy-lens-info.liquid` | `spec.vlt_percent`, `spec.lens_category`, `spec.base_tint`, `spec.mirror_tint`, `spec.polarized`, `spec.technologies` → `technology.name`, `.icon`; `goggle.otg`. With no `spec.technologies`, `spec.lens_technology` text is matched against `technology.aliases` so the logo still resolves — add an alias, no code change. |
| Variant picker | Horizon `variant-picker` block | `product.options_with_values`, `variant.swatch` (file) |
| Frame Fit Guide | `blocks/spy-frame-fit-guide.liquid` | **Collection**: `custom.fit_guide` → `fit_guide.frame_name`, `.image_front`, `.image_side`, `.temple_width`, `.temple_length`, `.lens_height`, `.frame_fit`, `.temple_pressure`, `.frame_size` (smallest collection wins). Fallback: `spec.fit` |
| Buy Buttons | Horizon `buy-buttons` block | — |
| Trust Badges | `blocks/spy-trust-badges.liquid` | Section settings (Layer 2): badge text 1–5, icon 1–5 |
| Technical Information | `blocks/spy-spec-table.liquid` | All `spec.*` fields + `goggle.*` + `helmet.*` (conditionally) |
| Star Rating | `blocks/spy-app-embed.liquid` (`embed: yotpo_bottomline`) | `yotpo.product_id` via the block's `legacy_id_metafield` setting. Yotpo keys reviews to its own IDs, never the Shopify product ID — see `audit/yotpo-product-map.csv`. |
| Yotpo Reviews | `blocks/spy-yotpo-reviews.liquid` | Yotpo app block child; script loaded by `snippets/spy-yotpo-loader.liquid`. The app block resolves the Shopify product itself, so it cannot use `yotpo.product_id` — swap it for a classic `yotpo-main-widget` embed to map it. |
| Feature Banner | `sections/spy-feature-banner.liquid` | `pdp.feature_banner_desktop`, `pdp.feature_banner_mobile` |
| Lifestyle Carousel | `sections/spy-lifestyle-carousel.liquid` | `pdp.feature_carousel` (list.file_reference) — no images means the section does not render |

---

## PDP Blocks — `product.snow-goggle.json` + `product.moto-goggle.json`

Same as default PDP, plus:

| Block | File | Metafield(s) Read |
|---|---|---|
| Goggle Fit Guide | `blocks/spy-goggle-fit-guide.liquid` | `goggle.base`, `goggle.fit_system`, `goggle.ventilation`, `goggle.fit_a_mm`, `goggle.fit_b_mm`, `goggle.fit_c_mm`, `goggle.fit_d_mm` |

`spy-spec-table` also renders goggle-specific rows: `goggle.base`, `goggle.fit_system`, `goggle.ventilation`, `goggle.removable_padding`, `goggle.otg`, `goggle.interchangeable_lens`, `goggle.extra_lens_included`, `goggle.extra_lens_name`, `goggle.extra_lens_vlt_percent`, `goggle.extra_lens_category`.

---

## PLP Blocks — `collection.json` + `collection.story.json`

| Block / Section | File | Metafield(s) Read |
|---|---|---|
| Collection Hero | `sections/spy-collection-hero.liquid` | `collection.hero_image` (desktop, ~6.4:1) · `collection.hero_image_mobile` (2:1) · `collection.hero_image_tablet` (⚠️ not defined yet — falls back to desktop). Also read from the `custom` namespace, and overridable per breakpoint by section settings. Title is `collection.title`. |
| Collection Header | Horizon `section` with text blocks | `collection.title`, `collection.description` (Liquid vars) |
| Product Grid | Horizon `main-collection` | — |
| Grouped Product Grid | `sections/spy-grouped-collection.liquid` | Product tag `collection::MODEL` for the group; the matching model collection's `all_products_count` for the colourway count and `products.first` for the card's representative |
| Grouped Product Card | `blocks/_spy-grouped-product-card.liquid` + `snippets/spy-grouped-product-card.liquid` | Group name + count passed in by the section; `spec.*` via `snippets/spy-tech-badges.liquid`; `pdp.badge_text` / `pdp.badge_new` via `snippets/spy-product-badge-text.liquid` |
| Color Count | `blocks/spy-color-count.liquid` | `product.options_with_values` (counts Frame Color / Color / Colour option values) |
| Tech Badge | `blocks/spy-tech-badge.liquid` + `snippets/spy-tech-badges.liquid` | `spec.technologies` → `technology.name`, `.icon` (Happy Boost); `spec.ansi_rating` → ANSI badge art, `spec.certifications` as fallback. Per-swatch set resolved from each colour option value's product (combined-listing child, else product-level). Hover swap via `assets/spy-tech-badge.js`. |
| Quick View Button | `blocks/spy-quick-view-btn.liquid` | `closest.product.handle` |
| ~~Compare Button~~ (removed from card) | `blocks/spy-compare-btn.liquid` | `closest.product.handle`, `.title`, `.url`, `.price`, `.featured_image` |
| Collection SEO Copy | `sections/spy-collection-seo.liquid` | `collection.seo_content` (rich_text) |
| Collection Story | `sections/spy-collection-story.liquid` | `collection.story` → `collection_story.hero`, `.hero_mobile`, `.headline`, `.body`, `.featured_products` |
| ~~Compare Bar~~ (removed from `collection.json`) | `sections/spy-compare.liquid` | localStorage (JS-driven) |
| Quick View Modal | `sections/spy-quick-view.liquid` | — (modal shell; content fetched via section rendering API) |
| Quick View Content | `sections/spy-quick-view-content.liquid` | `spec.vlt_percent`, `spec.lens_category`, `spec.base_tint`, `spec.mirror_tint`, `spec.polarized`, `spec.technologies`, `product.options_with_values`, `product.variants` |

---

## Homepage Sections — `index.json`

| Section | File | Content Source |
|---|---|---|
| Hero | Horizon `hero` | Section settings (Layer 2): image, headline, CTA |
| Category Tiles | `sections/spy-category-tiles.liquid` | Section settings: up to 8 tiles each with image, label, sublabel, link |
| Region XL Banner | `sections/spy-feature-link-banner.liquid` | Section settings: desktop image, mobile image, eyebrow, heading, CTA |
| New Arrivals carousel | Horizon `product-list` | Section settings: collection reference |
| Watermen carousel | Horizon `product-list` | Section settings: collection reference |
| Loyalty CTA | Horizon `hero` | Section settings: background image, headline, CTA button |
| Happy Boost Banner | `sections/spy-feature-link-banner.liquid` | Section settings: desktop/mobile image, heading, CTA |
| Trust Row | Horizon `section` with text blocks | Section settings: text blocks |
| Journal (Blog) | Horizon `featured-blog-posts` | Blog auto-pulled from settings |

---

## Tech Guide Pages — `page.tech-guide.json`

| Section | File | Metafield(s) Read |
|---|---|---|
| Hero | Horizon `hero` | Section settings (image, optional overlay) |
| Tech Guide Content | `sections/spy-tech-guide.liquid` | `page.guide.technology` → `technology.name`, `.icon`, `.short_blurb`, `.long_description`, `.link` |

### Hand-built tech landing pages (stock blocks only, no metafields)

| Template | Page | Sections | Assets |
|---|---|---|---|
| `page.happy-boost.json` | `happy-boost` | one stock `section` (page-width) | `guide-happy-boost*.webp` (6 files) |
| `page.happy-lens.json` | `happy-lens` | two stock `section`s — white intro + `#57c2e6` tech band | `guide-happy-lens-*.png` (11 files) |

Both are built from `group` / `image` / `text` / `video` / `button` / `custom-liquid` theme blocks.
Content lives in block settings (Layer 2), not metafields.

---

## Annex Pages (Horizon Defaults)

These templates use Horizon built-in sections, branded via `settings_data.json`:

| Template | Sections Used |
|---|---|
| `page.editorial.json` | Horizon `hero` + `main-page` with `page-content` |
| `page.policy.json` | Horizon `main-page` with title text + `page-content` |
| `page.contact.json` | Horizon `main-page` + `section` with `contact-form` |
| `article.json` | Horizon `main-blog-post` (title, details, image, content) |
| `blog.json` | Horizon `main-blog` with `_blog-post-card` |
| `search.json` | Horizon `search-header` + `search-results` |
| `cart.json` | Horizon `main-cart` + `product-list` ("You may also like") |
| `404.json` | Horizon `main-404` + `product-list` ("Discover something new") |
| `list-collections.json` | Horizon `main-collection-list` with `_collection-card` |
| `page.snow-helmet-tech.json` | No metafields — all copy/art is section + block settings; the carousel reads the `snow-helmets` collection |

---

## Metaobjects (referenced by blocks)

| Metaobject | Fields | Used By |
|---|---|---|
| `technology` | `name`, `icon` (file), `short_blurb`, `long_description` (rich_text), `link` (url) | `spy-lens-info`, `spy-spec-table`, `spy-tech-guide` |
| `fit_guide` | `frame_name`, `image_front` (file), `image_side` (file), `temple_width` (int), `temple_length` (int), `lens_height` (int), `frame_fit`, `temple_pressure`, `frame_size` | `spy-frame-fit-guide` — linked from the **collection** metafield `custom.fit_guide` |
| `size_chart` | `name`, `image` (file), `category`, `table_html` (rich_text) | Defined but empty — no entries, no `pdp.size_chart` product definition |
| `collection_story` | `headline`, `hero` (file), `hero_mobile` (file), `body` (rich_text), `featured_products` (list.product_reference) | `spy-collection-story` |

---

*Last updated: Phase 1–4 build complete (July 2026).*
