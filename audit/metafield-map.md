# SPY Optic — Metafield ↔ Block Map (Living Document)

> Updated after Phase 1–4 build. Reflects blocks and sections as actually implemented.

---

## PDP Blocks — `product.json` (default eyewear)

| Block / Section | File | Metafield(s) Read |
|---|---|---|
| Breadcrumbs | `blocks/spy-breadcrumbs.liquid` | `product.collections` (first non-all/non-frontpage) |
| Lens Info | `blocks/spy-lens-info.liquid` | `spec.vlt_percent`, `spec.lens_category`, `spec.base_tint`, `spec.mirror_tint`, `spec.polarized`, `spec.technologies` → `technology.name`, `.icon`; `goggle.otg` |
| Variant picker | Horizon `variant-picker` block | `product.options_with_values`, `variant.swatch` (file) |
| Size Chart | `blocks/spy-size-chart.liquid` | `pdp.size_chart` → `size_chart.name`, `.image` |
| Buy Buttons | Horizon `buy-buttons` block | — |
| Trust Badges | `blocks/spy-trust-badges.liquid` | Section settings (Layer 2): badge text 1–5, icon 1–5 |
| Technical Information | `blocks/spy-spec-table.liquid` | All `spec.*` fields + `goggle.*` + `helmet.*` (conditionally) |
| Yotpo Reviews | `blocks/spy-yotpo-reviews.liquid` | Yotpo app widget via `snippets/yotpo-reviews.liquid` |
| Feature Banner | `sections/spy-feature-banner.liquid` | `pdp.feature_banner_desktop`, `pdp.feature_banner_mobile` |

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
| Collection Hero | `sections/spy-collection-hero.liquid` | `collection.hero_image` |
| Collection Header | Horizon `section` with text blocks | `collection.title`, `collection.description` (Liquid vars) |
| Product Grid | Horizon `main-collection` | — |
| Color Count | `blocks/spy-color-count.liquid` | `product.options_with_values` (counts Frame Color / Color / Colour option values) |
| Tech Badge | `blocks/spy-tech-badge.liquid` + `snippets/spy-tech-badges.liquid` | `spec.technologies` → `technology.name`, `.icon` (Happy Boost); `spec.certifications` (ANSI Z87 / Z87-2+). Per-swatch set resolved from each colour option value's product (combined-listing child, else product-level). Hover swap via `assets/spy-tech-badge.js`. |
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

---

## Metaobjects (referenced by blocks)

| Metaobject | Fields | Used By |
|---|---|---|
| `technology` | `name`, `icon` (file), `short_blurb`, `long_description` (rich_text), `link` (url) | `spy-lens-info`, `spy-spec-table`, `spy-tech-guide` |
| `size_chart` | `name`, `image` (file), `category` | `spy-size-chart` |
| `collection_story` | `headline`, `hero` (file), `hero_mobile` (file), `body` (rich_text), `featured_products` (list.product_reference) | `spy-collection-story` |

---

*Last updated: Phase 1–4 build complete (July 2026).*
