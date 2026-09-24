# SPY v2: ADA (WCAG 2.1 AA) and performance audit

**Date:** 23 Sep 2026 · **Theme:** `spy-v2/main` (the same code as the published theme on production)
**Tested on:** `spydevsylv.myshopify.com` through the `shopify theme dev` local preview. Both storefronts are password-protected, and the storefront password was not available, so production was not tested live.

## How it was tested

| Check | Tool | Coverage |
|---|---|---|
| Automated WCAG 2.0/2.1 A + AA | axe-core 4.x in Chrome (Playwright) | 11 pages × 2 widths (1440, 390) = 22 scans |
| Keyboard | Scripted Tab walk of the first 40 stops per page | Skip link, focus ring visible, off-screen focus |
| Performance + Lighthouse a11y/SEO/best practices | Lighthouse 12, mobile (Moto G4-class, slow 4G) and desktop | 5 pages × 2 form factors × 3 runs, median reported |
| Code review | Manual read of the `spy-*` sections, blocks and snippets, `layout/theme.liquid`, and the settings | Every finding cites file:line |

Pages tested: home, `/collections/sunglasses`, PDP sunglass (Canston 56), PDP snow goggle (Waypoint), PDP helmet (Neutron MIPS), cart, search, a tech page (Happy Boost), a policy page (Return policy), and 404.

> **Automated tools catch about 30–40% of WCAG issues.** Before launch the site still needs a manual pass with a screen reader (VoiceOver on iOS Safari and NVDA on Windows Chrome) on the purchase path: home → PLP → PDP → add to cart → cart drawer → checkout.

---

## 1. Summary

| Area | Result |
|---|---|
| **ADA** | **Not yet AA compliant.** 9 axe rule types fail, across every page tested. Most of the failures by count come from **3 fixes**: brand-orange and grey contrast, 4 empty footer links on every page, and a mislabelled close button. None are big rebuilds. Estimated **3–5 dev days** for everything Critical and High. |
| **Performance (desktop)** | Lighthouse **71–84**. LCP (when the main content appears) is **1.7–2.4s**. TBT is ~0 and CLS is 0. That is acceptable, and there is room to improve. |
| **Performance (mobile)** | Lighthouse **53–56**. LCP is **7.9–10.6s**. These numbers are **inflated by the local preview**: it serves uncompressed HTML (570KB instead of about 79KB gzipped), unminified CSS, and no CDN. Real production mobile scores need a re-test with the storefront password. The main problem is real regardless: **about 470–510KB of unused CSS blocks rendering on every page.** |
| **What already passes** | `<html lang>`, a skip link as the first Tab stop on every page, a `<main>` landmark, visible focus rings (0 missing on desktop), labelled quantity and email inputs, a `<dialog>` cart drawer, no render-blocking JS, and CLS 0 on all pages tested. |

### Lighthouse medians (preview, dev store)

| Page | Mobile perf | Mobile LCP | Desktop perf | Desktop LCP | TBT m/d | CLS | LH a11y m/d |
|---|---|---|---|---|---|---|---|
| Home | 54 | 10.6s | 71 | 2.4s | 163 / 0 ms | 0 | 86 / 93 |
| PLP sunglasses | 53 | 10.1s | 84 | 1.75s | 205 / 0 ms | 0 | 80 / 91 |
| PDP sunglass | 54 | 8.7s | 81 | 1.74s | 197 / 1 ms | 0 | 77 / 84 |
| PDP snow goggle | 54 | 9.0s | 83 | 1.77s | 178 / 0 ms | 0 | 77 / 83 |
| Cart | 56 | 7.9s | 83 | 1.8s | 191 / 0 ms | 0 | 89 / 93 |

Best-practices is 73 everywhere and SEO is 85–100. The best-practices score is pulled down by preview-only console errors (403/400 proxy requests), which production will not have.

### Fix status (23 Sep, final axe run on the same 11 pages × 2 widths + 18 scripted keyboard checks)

| axe rule | Before (nodes / page-widths) | After | Items |
|---|---|---|---|
| link-name | 76 / 18 | **0 / 0** | A3 fixed |
| aria-allowed-attr | 28 / 6 | **0 / 0** | A9 fixed |
| aria-prohibited-attr | 36 / 6 | **0 / 0** | A9 fixed |
| aria-hidden-focus | 5 / 5 | **0 / 0** | A5 fixed |
| select-name | 2 / 2 | **0 / 0** | A8 fixed |
| Pages with no H1 | 5 templates | **0** | A7 fixed |
| Tab stops landing off-screen | up to 9 per page | **0** | A5 fixed |
| scrollable-region-focusable | 20 / 8 | 14 / 8 | A10 open (stock Horizon slideshow) |
| list | 2 / 1 | 1 / 1 | A17 part open (search filter markup, stock Horizon) |
| color-contrast | 73 / 19 | 69 / 18 → 39 / 13 after A1 → **5 / 1** after A2 (admin page content only) | **A1 fixed** (23 Sep): all orange failures gone except 5 inline `#f27e37` links typed into the Return policy page body in the admin. A2 open (greys, green, cyan). |

**A1 decision (23 Sep): darker orange `#b85314` (4.9:1) for text and button fills.** The bright `#f57f29` stays on the logo, borders, accent bars and bullets.
- **New Layer 1 setting:** Theme settings → Colors → "Orange for text and buttons" (`spy_orange_accessible`). It is output as `--color-spy-orange-ui` in `snippets/theme-styles-variables.liquid`, so every `-ui` utility follows it.
- **Other colour values:** palette `color3` and `badge_sale_background_color` are also `#b85314`. The 404 button and the home "SHOP NEW ARRIVALS" colour now reference `color3` instead of a hard-coded hex.
- **Class swap:** 49 `text-/bg-spy-orange` text and white-text-fill uses moved to `-ui`, plus 5 hand-written rules in `src/tailwind.css` (Quick View button, Sale nav, arrow glyph, locator hover).
- **Verified on the PDP:** Add to Cart renders `rgb(184, 83, 20)` with white text.

**A2 fixed (24 Sep).** Token values changed in `src/tailwind.css`:

| Token | Old | New | Ratio |
|---|---|---|---|
| `spy-muted` (breadcrumbs, Ref line) | `#a6a6a6` | `#6a6c77` | 5.2:1 |
| `spy-positive` (In Stock, PDP) | `#4bb151` | `#2e7d32` | 5.1:1 |
| `spy-cart-stock` (In Stock, cart) | `#88c290` | `#2e7d32` | 5.1:1 |
| `spy-strike` (compare-at price) | `#ababab` | `#767676` | 4.5:1 |

- **Happy Boost cyan:** the 11 `#00ceff` settings in `page.happy-boost.json` are now `#00749a` (5.1:1). All of them sit on white.
- **Inline links:** the darker orange is only 2.35:1 against body text, so "See conditions" (trust badges) and the fit-guide footer links are now underlined (1.4.1).
- **Final dev-store axe scan (24 Sep): 17 of 20 page views fully clean.** A10 is verified: `scrollable-region-focusable` is gone on all 3 PDPs at both widths. A17 is verified: `list` is gone on search. What's left: search keeps its card-gallery `scrollable-region` (by design, see below), and the Return policy page has 5 inline colours in the admin content.
- **A10 (24 Sep):** `snippets/slideshow.liquid` has a new `scroller_label` option. The PDP main gallery passes it, so its scroller becomes `tabindex="0" role="region" aria-label="Slideshow"`, and arrow keys scroll it natively. Product-card galleries stay out of the tab order on purpose: each would add a tab stop per card, and the same images are on the PDP.
- **A17 (24 Sep):** in the horizontal filter bar, each top-level facet `<accordion-custom>` now gets `role="listitem"`, through a new `role` option on `accordion-custom-component`. The vertical and drawer layouts are unchanged. The pattern was checked with axe on a local copy of the shadow-DOM list: `list` fails without the role and passes with it.
- **Axe after A1 + A2:** colour contrast is **0** theme failures. The only 5 left are inline styles in the Return policy page body in the admin. **11 of 20 page views are fully clean.** The rest fail only A10 (gallery scroll, 7 page views) and one search list (A17).

Scripted keyboard checks (Playwright, all 18 pass):
- **Mobile menu:** it is `inert` while closed and a `role="dialog"` when open. Focus moves in on open, and Tab stays inside it (40 presses, 0 escapes). Forward and Back move focus correctly. Esc closes it and returns focus to the toggle.
- **Desktop mega-menu:** `aria-expanded` follows hover and focus. Esc hides the panel and puts focus back on the top link.
- **Hero video:** the pause/play button sits outside the link, and its label and icon flip when pressed.
- **Fit guide and Quick View:** Tab stays inside (25 presses, 0 escapes). The close label reads "Close". Esc makes the page usable again.
- **Console:** no errors on the home page or PDP.

Other items fixed in code:
- **A6:** the hero video can be paused. Under reduced motion it starts paused.
- **A11:** the lens drawer and Compare use the same inert-page pattern as the fit guide and Quick View.
- **A12:** covered by the mega-menu checks above.
- **A14:** the footer country/language selects no longer reload the page while you arrow through them, and they show a focus ring.
- **A16:** half-banners have an alt text setting, and a banner with no link becomes a `div`.
- **A18:** category tiles no longer repeat their label as alt text, and new-tab links announce "Opens in a new window".
- **Carousel dots:** they read "Slide 2 of 5" instead of "2".
- **P2:** the first two banners and the first four category tiles load eagerly with high priority.
- **P4:** the Barlow preloads are removed everywhere except Rewards.
- **P6:** banner `<img>` and `<source>` tags carry width and height.

Not yet seen on a rendered page: A15 (form errors are only visible after a failed form post) and the A17 table/heading changes. Deliberately not done:
- **P5:** gating the product scripts would break Quick View, whose product form needs `product-form.js` on every page.
- **A10:** stock Horizon behaviour; the fix would add a tab stop to every product card.
- **A13:** target size is a WCAG 2.2 criterion, not 2.1 AA.
- **Compare checkbox focus style:** it needs a Tailwind rebuild. See the note in section 4.

### Production speed baseline (24 Sep, `spyoptic-com.myshopify.com`, published theme — today's fixes NOT yet pushed)

Lighthouse 12, median of 3 runs per page and form factor. Every run was checked to land on the real page, not the password page.

| Page | Mobile | Mobile LCP | Mobile TBT | Desktop | Desktop LCP | CLS | TTFB |
|---|---|---|---|---|---|---|---|
| Home | 77 | 3.8 s | 246 ms | 90 | 1.5 s | 0.00 | 234 ms |
| Collection (Sunglasses) | 74 | 4.4 s | 269 ms | 90 | 1.4 s | 0.00 | 243 ms |
| PDP sunglass | 75 | 3.9 s | 399 ms | 95 | 1.2 s | 0.00 | 238 ms |
| PDP snow goggle | 73 | 4.2 s | 290 ms | 90 | 1.6 s | 0.00 | 233 ms |
| Cart | 79 | 4.1 s | 297 ms | 94 | 1.2 s | 0.01 | 239 ms |

The earlier preview numbers (mobile ~54, LCP ~10s) were proxy artefacts.

What production shows:
- **Desktop is good.** Every page scores 90–95.
- **Mobile LCP is 3.8–4.4s.** Google's "good" threshold is 2.5s.
- **Nothing blocks the first render.** Server response is fast (~240ms), and layout shift is near zero.

**Third-party weight is now the main mobile cost** (home page, mobile):

| Source | Transfer | Script time | Note |
|---|---|---|---|
| Yotpo (`staticw2.yotpo.com`) | ~330 KB | **~920 ms** | **`widget.js` (116 KB) loads twice**, see below |
| Rebuy (`cdn.rebuyengine.com`) | 33 KB home / ~280 KB PDP | ~190 ms on the PDP | App, loads on every page |
| Shopify platform (web pixels, checkout, trekkie) | ~250 KB | ~100–500 ms | Can't be removed |
| GA4 gtag (`G-1F4T2NDY34`) | 156 KB | sandboxed | Our own custom pixel, expected |

**P9 (new, High): Yotpo is installed twice.**
- **Copy 1:** `widget.js?lang=en` is injected by the Yotpo **app embed** (Theme settings → App embeds).
- **Copy 2:** `widget.js?shop=spyoptic-com.myshopify.com` comes from Shopify's `asyncLoad` list, meaning a **legacy ScriptTag** the Yotpo app registered on the store.
- **Not the theme:** the theme loads neither copy (manual loader removed in `d669f06`).
- **Fix:** remove the legacy ScriptTag. Only the owning app can do that, so it goes through the Yotpo admin (turn off script-tag / "legacy" installation) or Yotpo support. Keep the app embed.
- **Expected saving:** about 116KB, plus a large share of Yotpo's ~0.9s of main-thread time on every mobile page. It also removes the double-initialisation risk noted in `d669f06`.

Severity: **Critical** = blocks a user or is a clear legal-risk failure on the purchase path · **High** = AA failure seen site-wide · **Medium** = AA failure in a secondary component · **Low** = best practice.

| # | Sev | WCAG | Finding | Where (evidence) | Fix | Effort |
|---|---|---|---|---|---|---|
| A1 | Critical | 1.4.3 Contrast | **White on brand orange fails at 2.64–2.68:1** (it needs 4.5:1). This covers Add to Cart, Checkout (cart page and drawer), the sale badge, filter buttons, notify-me and the compare bar. **Orange text on white** also fails (2.64:1): the Sale nav link, "See conditions", Quick View, "View full details", read more, category chips, and even the 35px "SHOP NEW ARRIVALS" heading. | axe: 31 nodes on every page. `templates/product.json:353-355`, `src/tailwind.css:128-132,1357,1907`, `config/settings_data.json:55,143` | **Needs a brand decision.** Add a Layer 1 "accessible orange" setting for text and CTA fills (`#b85314` = 4.90:1, `#c05621` = 4.57:1), or keep `#f57f29` as a fill with dark text `#1d2a2b` (5.61:1). Keep the bright orange for borders and decoration. | S (after sign-off) |
| A2 | High | 1.4.3 | **Grey and colour text too light:** breadcrumbs `#a6a6a6` (2.43:1, 22 nodes on PDP/PLP), "In Stock" `#4bb151` (2.72:1) and `#88c290` in the cart (2.07:1), the "HAPPY BOOST™" cyan `#00ceff` (1.86:1) on home and the tech page, compare-at prices `#ababab` (2.30:1), and fit-guide greys `#bbb`/`#999`. | axe + `snippets/spy-breadcrumbs.liquid:122-159`, `blocks/spy-stock-status.liquid:19`, `src/tailwind.css:798,1213` | Swap to the existing `#6a6c77` (5.22:1) or `#767676`, use green `#2e7d32`, and use a darker cyan or add a text shadow for Happy Boost. | S |
| A3 | High | 2.4.4 / 4.1.2 | **4 empty links in the footer value-props row** (Shipping, Returns, Warranty, Contact) on **every page**. They are `<a class="group-block__link"></a>` overlays with no text, so screen readers say "link" with no name. | axe `link-name`, 68 nodes | Add `aria-label` from the group's heading (or `aria-hidden` + `tabindex=-1` if the heading is itself a link). | S |
| A4 | High | 4.1.2 | **Close buttons read "Translation missing: en.accessibility.close"** in the PDP lens drawer, fit guide and Quick View. The Quick View Prev/Next arrows and the store-locator "loading" text have the same problem. *Verified in the rendered HTML.* | `snippets/spy-drawer.liquid:48`, `blocks/spy-frame-fit-guide.liquid:177`, `sections/spy-quick-view.liquid:50`, `sections/spy-quick-view-content.liquid:85,90`, `sections/spy-store-locator.liquid:86` | Use the existing keys `actions.close` and `accessibility.slideshow_previous/next`. | S |
| A5 | High | 2.1.1 / 2.4.3 / 4.1.2 | **Mobile menu:** the closed drawer is `aria-hidden="true"` but its links are still focusable (axe `aria-hidden-focus` on mobile). Opening it doesn't move focus in or trap it, and closing doesn't return focus to the toggle. It has no dialog role. | `blocks/spy-mega-menu.liquid:68-78,197,213-250` | Add `inert` when closed. On open: `role="dialog" aria-modal`, focus the first item, and make the page `inert`. On close: return focus. | M |
| A6 | High | 2.2.2 Pause, Stop, Hide | **The homepage hero video autoplays and loops with no pause control**, and it ignores `prefers-reduced-motion`. The same applies to background videos on the ANSI and ESG pages. | `snippets/spy-video-embed-src.liquid:40,43`, `sections/spy-feature-link-banner.liquid:316-330`, `blocks/video.liquid:26-27` | Add a visible pause/play button (Vimeo player API), and skip autoplay under reduced motion. | M |
| A7 | High | 1.3.1 / 2.4.6 | **Missing or meaningless H1:** there is no H1 on search, the tech page or the policy page, or on a PLP whose collection has no hero image. The homepage H1 is the shop name (on the dev store it reads "SPYDEVSYLV"). | axe/DOM scan; `sections/spy-collection-hero.liquid:62,110-133`, `sections/spy-header.liquid:8` | Give each template exactly one descriptive H1 (it can be `sr-only`). | S |
| A8 | High | 4.1.2 | **Mobile sort `<select>` has no accessible name**, because its label is `display:none` (axe *critical*). | `/collections/*` at 390px, `snippets/sorting.liquid` | Use a `sr-only` label instead of hiding it. | S |
| A9 | Medium | 4.1.2 | **PDP gallery ARIA misuse (stock Horizon):** `aria-selected` on thumbnail and dot `<button>`s (28 nodes), and `aria-label` on role-less skeleton `<div>`s (36 nodes). | axe `aria-allowed-attr` / `aria-prohibited-attr` on every PDP | Use `aria-current="true"` on the active thumbnail, and `role="status"` (or no label) on the skeletons. | S |
| A10 | Medium | 2.1.1 | **Scrollable carousels can't be reached by keyboard:** `slideshow-slides tabindex="-1"` on the PDP and search cards (stock Horizon). | axe `scrollable-region-focusable`, 12 nodes | Make the scroller focusable (`tabindex="0"` + label), or make sure the arrows are reachable. | S |
| A11 | Medium | 2.1.2 | **The custom drawers don't keep keyboard focus inside while open:** the PDP lens drawer, fit guide, Quick View and Compare. Tab walks out into the page behind. | `assets/spy-drawer.js:29-46`, `assets/spy-quick-view.js:129-140`, `assets/spy-compare.js:88-96` | Use `<dialog>.showModal()` like the cart drawer, or `inert` the page wrapper while open. | M |
| A12 | Medium | 1.4.13 | **Desktop mega-menu** opens on hover/focus-within, can't be closed with Esc, and has no `aria-expanded` on the top items. | `blocks/spy-mega-menu.liquid:20-33` | Add a disclosure button per top item, and close on Esc. | M |
| A13 | Medium | 2.5.8 / 2.5.5 | **Touch targets too small** on mobile (Lighthouse `target-size` on home, PLP, PDP and cart). | Lighthouse mobile | Make them at least 24×24px, with spacing between them. | S |
| A14 | Medium | 2.4.7 / 3.2.2 | **Footer country/language selects** have their focus outline removed and submit on change. **The Compare checkbox** has no visible focus. Input borders are too faint (`#e6e6e6`, 1.25:1). | `snippets/spy-footer-locale.liquid:42-68`, `blocks/spy-compare-btn.liquid:7-18`, `blocks/spy-notify-me.liquid:69` | Add a focus ring, add a submit button, and use borders of at least `#949596`. | S |
| A15 | Medium | 3.3.1 / 4.1.3 | **Notify-me and contact-form errors** are not announced or tied to their field. | `blocks/spy-notify-me.liquid:38-70`, `sections/spy-contact-form.liquid:111-119` | Add `role="alert"`, `aria-invalid` and `aria-describedby`. | S |
| A16 | Medium | 2.4.4 | The homepage half-banner links read "LEARN MORE LEARN MORE" (the alt text falls back to the CTA text). They also use `href="#"` when no link is set. | `sections/spy-half-banners.liquid:48-71` | Add an alt text setting per banner. | S |
| A17 | Low | 1.3.1 | Search results filter: `<ul>` directly contains `<accordion-custom>`. On the PDP, "Complete your selection" is an H3 placed before an H2. The spec table `<th>` elements have no `scope`. | axe `list`; `templates/product.json:463,670`; `blocks/spy-spec-table.liquid` | Fix the markup. | S |
| A18 | Low | 1.1.1 / 3.2.5 | Redundant alt text ("Snow Snow" on category tiles). External links open a new tab with no warning. The mega-menu promo image has no alt. | `sections/spy-category-tiles.liquid:80,103`, `blocks/spy-menu-promo.liquid:29`, `blocks/spy-social-buttons.liquid:81` | Use `alt=""` where the label is text, and add a sr-only "(opens in new tab)". | S |

**Not tested (needs a manual pass or production):** the Yotpo reviews widgets (not loaded on the dev store), ExpertVoice, the Stockist locator, checkout (Shopify-owned and generally compliant), reflow at 320px / 200% zoom, and screen-reader announcements for add to cart and filter counts.

---

## 3. Performance findings (ranked)

| # | Sev | Metric | Finding | Evidence | Fix | Effort |
|---|---|---|---|---|---|---|
| P1 | ~~High~~ **Low (re-measured 24 Sep)** | FCP / LCP | **Re-measured:** in production the whole CSS payload is about 104KB gzipped per page (~54KB Horizon `compiled_assets/styles.css`, ~36KB `tailwind.css`, ~15KB `base.css`). The 470–510KB figure below came from the local preview serving unminified, uncompressed CSS. Narrowing Tailwind's scan saves 0.5KB. Splitting out page-specific CSS saves about 3–4KB. Deleting the 28 stock Horizon sections/blocks that no template uses would save about 10KB. **Decision: skipped until production is measured.** Original note: | **About 470–510KB of unused CSS blocks rendering on every page.** Lighthouse's biggest mobile opportunity is 2.4–2.7s. The sources are `tailwind.css` (220KB raw, 35KB gz), `base.css` (106KB) and Horizon's `compiled_assets/styles.css` (about 420KB unused per page). Tailwind scans vendor JS and all templates, and page-specific CSS (store locator, Stockist, legal, blog, cart page) ships everywhere. | Lighthouse `unused-css-rules`; `snippets/stylesheets.liquid:2-3`; `src/tailwind.css:1,80-85` | Limit Tailwind `@source` to `spy-*` files. Split page-specific CSS into per-template files. Remove the `{% stylesheet %}` blocks of unused Horizon sections. Consider inlining critical CSS for the header and hero. | M |
| P2 | High | LCP | **The homepage hero is a Vimeo iframe** injected at DOM-ready on every device, with no poster/facade and no `fetchpriority` image. The first category tiles are lazy-loaded although they are in the first viewport at 1440. | `sections/spy-feature-link-banner.liquid:185-208,300-331`, `snippets/spy-banner-picture.liquid:26,59`, `sections/spy-category-tiles.liquid:100-104` | Set desktop and mobile posters with `loading="eager" fetchpriority="high"`, load Vimeo after `load`/idle (or use a native `<video>`), and make the first 2–4 tiles eager. | M |
| P3 | ~~High~~ **Low (re-measured 24 Sep)** | TTFB / HTML weight | **Re-measured gzipped:** the homepage is 81KB. The header is 11KB, and the duplicated mobile menu is only 3.4KB of that. The two carousels together are 19KB, and the page has about 1,900 elements. Realistic saving is about 8–10KB, so this is skipped until production is measured. Original note: | **Heavy HTML:** the homepage is 557KB raw (79KB gz). The header is 110KB, because the desktop mega-menu and mobile menu both render full menu trees. The New Arrivals and Watermen carousels are 180KB and render every card with full galleries. | Section-by-section breakdown of the rendered page | Render the mobile menu from the same markup, or lazy-load it. Cap carousel cards (8–12) and render only the first gallery image per card. | M |
| P4 | Medium | Font bytes | **Unused Barlow fonts preloaded 3×** on every page (the theme overrides all fonts to DIN). DIN is served as **WOFF, not WOFF2** (2 preloads, about 104KB). *Verified in the rendered `<head>`.* | `snippets/fonts.liquid:4-12`, `snippets/spy-fonts.liquid:1-27` | Remove the Barlow preloads, convert DIN to WOFF2 (check the licence), and preload Regular only. | S |
| P5 | Medium | JS / TBT | **About 30 product-only JS modules** (`product-form`, `variant-picker`, `media-gallery`, `slideshow`…) load on every page, including home and cart. Mobile TBT is 160–205ms. | `snippets/scripts.liquid:126-258`; Lighthouse `unused-javascript` | Only load them when `request.page_type == 'product'` or Quick View is present. | S |
| P6 | Medium | CLS (risk) | `spy-banner-picture` outputs `<img>` with no `width`/`height`, which affects the Region XL/Watermen banners and the half-banners. CLS measured **0** on the tested viewport, but these banners sit below the fold and will shift when a user scrolls quickly or clicks an anchor link. | `snippets/spy-banner-picture.liquid:56-62` | Add width/height plus an aspect-ratio wrapper per breakpoint. | S |
| P7 | Medium → **defer (reviewed 24 Sep)** | Server render | **Reviewed:** the real cost is `spy-model-collection-facts` walking `product.collections` for up to 50 products, plus `col.products.first` on pages with more than 50 products. Fix it after the catalog migration by storing `model_count` and `model_rep` as metafields and reading those instead. De-duplicating the `spy-group-name` renders (about 150 → 100 tag loops) saves only milliseconds, so it's not worth changing a snippet shared by 3 sections. The colour-picker loop is already capped at 50 by Liquid, so no fix is needed there. Measure with Shopify Theme Inspector on production. Original note: | The grouped PLP makes several heavy Liquid passes over 50 products. The PDP colour picker loops model collections with no `limit`. | `sections/spy-grouped-collection.liquid:70-208`, `snippets/spy-color-picker.liquid:108` | Profile with Shopify Theme Inspector, cache the group name once per product, and add `limit`. | M |
| P8 | Low | Third-party | The Shopify platform scripts (trekkie, perf-kit, web-pixels, about 125KB) can't be removed. Yotpo and ExpertVoice load site-wide on production but not on the dev store, so they're **not measured here**. | Lighthouse `third-party-summary` | Re-measure on production, and keep review widgets off templates that don't show reviews. | — |

---

## 4. Recommended plan

1. **Get a brand decision on orange (A1).** This is the one item that changes the look. It affects the Add to Cart button, so it's legally the most visible issue. Put the options in front of the PM and brand team.
2. **Quick fixes (≈2 days, no visual change):** A3, A4, A7, A8, A9, A13, A15, A17, P4, P5.
3. **Component work (≈3 days):** A5, A6, A11, A12 (focus management + video pause), P2, P6.
4. **CSS diet (≈2–3 days):** P1, P3.
5. **Re-test on production** with the storefront password: Lighthouse ×3 per page plus PageSpeed Insights field data after launch.
6. **Manual screen-reader pass** on the purchase path before Oct 12. Update the existing `page.accessibility-statement` template with the audit date and a contact.

Raw data (axe JSON, Lighthouse JSON, screenshots) was captured locally during the run and can be re-generated with the scripts on request.
