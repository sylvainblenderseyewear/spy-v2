# Rebuy Smart Search — research (Blenders → SPY)

Date: 2026-10-13, updated 2026-10-14. Status: **theme side built for the search box and the results page,
not committed; Smart Search still not started in the Rebuy admin** (sections 9 and 10).
Scope: how blenderseyewear.com runs its search box and results page on Rebuy, and what SPY needs to do the same.

Evidence is in `audit/search-rebuy/` (screenshots, Rebuy config dump, probe results). Blenders theme code is in
`reference/blenderseyewear/`.

---

## 1. Short version

1. **Blenders' theme draws no search UI.** Rebuy Smart Search draws both the search box ("Quick View") and the
   results page. The theme only opens it, adds a dark overlay, adds the model name to cards and swaps the loader.
2. **SPY cannot switch it on today.** On production, Rebuy reports `has_smart_search_enabled: false` and there is
   no `Rebuy.SmartSearch` object, even after accepting cookies. Smart Search is part of Rebuy's paid
   "Search & Collections" package.
3. **Blenders does not block Rebuy before consent. SPY does.** With consent reset on Blenders and the banner
   left unanswered, 58 Rebuy requests still fired and the results rendered behind the banner. On SPY, 0 Rebuy
   requests fire before Accept (28 after). So a Rebuy-only search, copied as-is, would be dead on SPY for
   every shopper who has not accepted.
4. **Rebuy boots late.** It was ready 11–32 s after load on Blenders (my slow line) and 6–15 s on SPY (cart
   work, 12 Oct). Until then Blenders' search icon does nothing, and its results page shows only a loader.
5. **Rebuy shows one card per product, so one per colourway.** SPY's current results page shows one card per
   model with swatches, like the source. Rebuy cannot group them.
6. **Recommendation:** use Rebuy as an enhancement on top of the theme search we already have, the same way
   the cart works (`data-cart-engine`). Keep the SPY look, keep the CSS in git. Details in section 6, open
   decisions in section 7.

---

## 2. How Blenders does it

### 2.1 Theme code

| What | Where | Notes |
|---|---|---|
| Search icon | `sections/header-v2.liquid:24`, `:62` | `<a data-search-trigger href="/search" aria-label="Search">`. Comment in the file: search bar removed, Rebuy handles the UI. |
| Open / close | `assets/global.js:81-137` | Finds `.rebuy-quick-view-dropdown`, climbs to the element with `__vue__`, calls `vm.openQuickView()` / `vm.closeQuickView()`. If Rebuy is not there it retries every 300 ms, 15 times, then goes to `/search`. |
| Dark overlay | `layout/theme.liquid:146` + `assets/theme-init.js:582` | `#rebuy-search-overlay`, `rgba(30,30,30,0.9)`, fixed, z-index 49. Shown while `.rebuy-quick-view-dropdown__container.visible` exists. |
| Header on top | `layout/theme.liquid:156` | `#header-group.rebuy-position-relative { z-index: 2147483647 !important }`. |
| Model name on cards | `assets/theme-init.js` (`window.__blendersInjectCollectionTitles`, `:840`) | Adds `<p class="rebuy-product-collection">` from the `collection::MODEL` tag. Reads Rebuy's Vue data first, then `/products/<handle>.json` as a last resort. |
| Results page | `templates/search.json` → `sections/rebuy-search-results.liquid` | Only `<div id="rebuy-search-result-container">` with a loader image. A MutationObserver removes the loader, moves the product detail inside the image box and adds model names. |
| Preconnect | `layout/theme.liquid:10` | `<link rel="preconnect" href="https://cdn.rebuyengine.com">`. |

`snippets/search-modal.liquid` is still rendered in the layout but nothing opens it.

### 2.2 Rebuy admin configuration (read from the live site)

Full dump: `audit/search-rebuy/blenders-smart-search-settings.json`.
Admin custom CSS (16,373 characters): `audit/search-rebuy/blenders-rebuy-admin-custom.css`.

**Global**
- Mode `hybrid`, results page URL `/search`, 12 excluded products, offensive terms excluded, out-of-stock hidden.

**Quick View (search box)**
- Layout `dropdown`. Columns 4 / 3 / 2 (desktop / tablet / mobile). 12 results. Image ratio 1:1.
- Before typing: "Most Searched" (suggested collections) and "Popular Shades" (4 suggested products).
  **[16 Oct] Popular Shades are not hand-picked.** Every item is `type: "trending-products"` from one
  source, so Rebuy's automatic Trending Products fills the row. It changes by itself: on 13 Oct Dapper
  Sleeve, Legend Forever, Keep A Breast, Carrots; on 16 Oct Lavender Drift, Dapper Sleeve, Legend Forever,
  Keep A Breast. The $5 sleeve shows because Rebuy can't drop one product from Trending, only exclude it
  from all search (Rebuy FAQ). The no-results "Recommended Products" row is off.
- While typing: "Matching Products", "Matching Collections" (max 4), autocomplete terms (max 4). Matching
  content is off.
- Add to cart off, ratings off.
- Trigger selector in the admin is `.header-v2 [data-rebuy-search-trigger]`. It matches nothing in the theme
  (the attribute there is `data-search-trigger`), so the theme script is what really opens it.
- Event callbacks `ready`, `open`, `close`, `view`, `productsChange` all call
  `window.__blendersInjectCollectionTitles()`.

**Results page**
- Rendered into `#rebuy-search-result-container`. Layout `sidebar`. Title `You searched for: "{term}"`.
- Continuous scroll, 15 per page. Columns 3 / 2 / 2.
- Filters: Price plus six product metafields: `sort_by.collection`, `sort_by.shape`, `sort_by.color`,
  `sort_by.lens_type`, `sort_by.feature`, `sort_by.size`. Availability, Product Type, Tags and Vendor are off.
- Sorts: Relevance, Latest Release, Best Selling (7 days), Price (high to low), A–Z, Z–A.
- Content search off. Add to cart off.

**All the styling is the admin CSS blob.** None of it is in the theme repo, and the results-page rules also
sit in the Quick View CSS box (Rebuy applies Quick View CSS on the results page too).

### 2.3 Search box — measured

| | 1440 | 768 | 390 |
|---|---|---|---|
| Panel | full width, covers the header | same | same |
| Input row | 1300 px wide, padding 16×24, 1 px black border, radius 8 | 696×58 | 318×58, ✕ to the right |
| Product columns | 4 | 4 (165 px tiles) | 2 (157–164 px tiles, 12 px gap) |
| Results area | grows with content | 620 px tall | scrolls inside the panel (744 px view) |
| Overlay | `rgba(30,30,30,.9)` behind | same | same |

Behaviour:
- Opens with focus in the input. Empty state shows the chips and the 4 popular products.
- Search starts at **3 characters**, about 220–350 ms after the last key.
- Request: `POST https://rebuyengine.com/api/v1/smart-search/search` with `searchTerm`, `pageSize: 12`,
  `quickviewMode: true`. The response carries `tags`, `images`, `variants`, `price`, `handle`.
- Cards: grey tile `#F3F4F7`, model name bold top-left, product title under it, price bottom-right.
- Escape, the ✕ and a click on the overlay close it. The typed value is kept. Focus returns to the icon.
- Enter goes to `/search?q=…`. There is no "see all" link.
- No results: `No Results For [term]`.
- Keyboard: Tab leaves the panel after the ✕ and did not reach the product links in my test. Arrow keys do
  nothing.
- Scroll lock behind the panel: not confirmed. Rebuy's docs say closing "re-enables page scrolling", but the
  unanswered cookie banner was already locking the page in my test.
- Product links carry Rebuy tracking parameters (`_rdiscovery-*`).

### 2.4 Results page — measured

| | 1440 | 768 | 390 |
|---|---|---|---|
| Grid | 3 columns, 369 px cards, 12 px gap | 2 columns, 357 px | 2 columns, 168 px |
| Filters | sticky 220 px sidebar | "Filter and sort" button | "Filter and sort" button |
| Filter panel | in the sidebar | full-screen flyout | full-screen flyout (380×844) |

- Top to bottom: Rebuy's own search input, `You searched for: "prime"`, sort menu, "PRODUCTS", the grid.
  There is no `<h1>`.
- Filter and sort state lives in the URL, for example
  `/search?q=prime&rb_sort_by=highest-price&rb_metafields=product.sort_by.shape.Round`. Opening that URL
  directly restores the state. Changing a filter re-queries in place, with no page reload.
- Each filter option shows its count. Selected filters show as chips with a "Reset" link.
- Escape does **not** close the mobile filter flyout; only its ✕ does.
- Seen once: after continuous scroll had loaded page 2, ticking a filter sent `currentPage: 2` and the page
  showed no products for a filter that had one match.
- Prices showed as `89.00 RSD` for an $89 product: the currency code changed but the amount did not. Rebuy
  documents this as a Markets limitation that needs a workaround.

### 2.5 When Rebuy is not there

With `rebuyengine.com` blocked (`bl-1440-results-rebuy-blocked.png`):
- The results page showed only the loader for the 15 s I watched. No results, no message.
- The header icon did nothing for about 13 s on my line, then landed on that same empty page.

Blenders can live with this because Rebuy is not consent-gated there:
- With the consent cookies cleared and the banner unanswered, Shopify reported marketing, analytics and
  preferences all as "no", and Rebuy still made 58 requests and rendered 15 result cards
  (`bl-1440-results-before-consent.png`).
- Blenders' banner is a wall: `#gdpr-blocking-page-overlay` covers the page and scrolling is disabled until
  the visitor answers. So nobody can click search before choosing, but Rebuy is already loaded by then.
- I did not test what a "decline" through Preferences does on Blenders. Since Rebuy loaded while every
  category was "no", my reading is that it is not tied to a category at all.

---

## 3. What Rebuy Smart Search offers (from Rebuy's docs)

**Setup**
- Needs the "Search & Collections" package or Enterprise. Features are not sold one by one.
- Steps: configure Quick View, Results Page and Global Settings → check the "Rebuy Connector" app embed is on
  → turn off the theme's own search → switch Smart Search on. The first product sync can take 30 minutes.
- Quick View and Results Page each have their own on/off switch. One can run without the other.
- There is an "in-store preview" that shows the search on the storefront before customers see it.
- It cannot run next to another search app.
- Sales that come from a Rebuy search count as "Rebuy Generated Revenue", which feeds into Rebuy's invoices.

**Quick View**
- Layout: dropdown, or side panel (left or right).
- "Trigger Element": the selector that opens it. "Embedded Element": where the results are placed. It "does
  not currently support an always-visible search bar".
- Custom CSS box and event-callback boxes in the admin.

**Results page**
- Layouts: Dropdown, Side Bar, Flyout Filters. One layout for all devices.
- Filters: Availability, Product Type, Price, Tags, Vendor, product options, and product or variant
  metafields.
  - Metafield types allowed: single line text, list of single line text, decimal, integer, true/false.
  - Limits: 25 product and 25 variant metafields; values over 256 characters or with HTML are dropped.
  - Different filters combine with AND, values inside one filter with OR.
- Sorts: Relevance, Best Sellers (window of 1–365 days), Highest/Lowest Price, New Arrivals, Highest/Lowest
  Rating, Oldest, Name A–Z / Z–A.
- **Content Search:** adds a "Blog & Pages" tab next to "Products", and a "Matching Content" group in the
  Quick View. Articles and pages sync once a day.
- Products tagged `exclude_rebuy` are hidden from search.

**Hooks for the theme**
- Events on `document`:
  - `rebuy:smartsearch.quickview.init | beforeReady | ready | open | close | view | beforeProductsChange |
    productsChange | beforeAdd | add`
  - `rebuy:smartsearch.resultsPage.init | beforeReady | ready | view | beforeProductsChange | productsChange
    | beforeAdd | add`
- Methods on `window.Rebuy.SmartSearch.quickView.view`: `openQuickView(event)`, `closeQuickView()`,
  `search(term)`, `goToSearchPage()`.
- Switch a surface off from the theme: `Rebuy.SmartSearch.quickView.quickViewSettings.setting.enabled = false`
  and `Rebuy.SmartSearch.resultsPage.isVisible = false`, each inside its `ready` listener.
- Rebuy's advice: change the product data in the callbacks, not the DOM. Blenders does the opposite.
- **Custom templates live in the theme**, unlike Smart Cart v2: snippets `rebuy-quick-view-template` and
  `rebuy-results-page-template`, rendered just before `</body>`. They are Vue templates inside
  `<script type="text/template">`, wrapped in `{% raw %}`. If present, Rebuy uses them instead of its own
  markup. Rebuy support does not cover them, and they do not pick up Rebuy's later template changes.
- Metafields are not in the search response by default. They can be requested from the
  `resultsPage.init` callback.

---

## 4. Where SPY stands today

**Rebuy on production** (`spyoptic-com.myshopify.com`, probed 13 Oct after Accept)
- `has_smart_search_enabled: false`, `has_smart_collections_enabled: false`, no `Rebuy.SmartSearch`.
- Smart Cart v2 is live and loads normally.
- 0 Rebuy requests before Accept, 28 after. The block is the Pandectes custom rule on `rebuyengine.com`.
- One presentment currency (USD), so the Markets limitation above does not apply yet.

**Theme search (built, live on `main`)**
- Search box: `snippets/search-modal.liquid` + `sections/predictive-search.liquid` +
  `assets/predictive-search.js`. Opened by `on:click="#search-modal/showDialog"` in
  `blocks/spy-utility-nav.liquid:39` and `snippets/search.liquid:17`.
- Results page: `templates/search.json` = `search-header` + `spy-grouped-collection`. One card per model,
  Products / Articles tabs, product-only search so the filters work.
- This is server-rendered, works with no consent, and matches the source design.

**Catalog data Rebuy would index** (`audit/search-rebuy/spy-catalog-filter-data.json`)
- 398 products. 397 carry a `collection::MODEL` tag, the same convention Blenders uses for the model name.
- Product types: Eyeglasses 149, Sunglasses 127, Motocross Goggles 61, Accessories 24, Snow Goggles 19,
  Gear 15, Snow Helmets 3.
- Options: `Size` and `Lens` on every product. 252 products have a single variant.
- Other tags: only `Spy` and `Sunglasses` (on every product) and `YGroup_discord` (11).
- Vendor is spelled two ways: `Spy` 313, `SPY` 85.
- The lowest price in the catalog is $0, so at least one product needs excluding.

---

## 5. Gaps between the Blenders way and SPY

| Topic | Blenders | SPY | Effect |
|---|---|---|---|
| Rebuy package | Smart Search on | off | Nothing can be built or tested until it is on. |
| Consent | Rebuy runs before consent | blocked until Accept | Rebuy-only search would be dead for non-accepters. |
| Late boot | accepted: icon dead, loader on results | theme search answers at once | We need a hand-over, not a replacement. |
| Card grouping | one card per colourway everywhere | one card per model with swatches | Rebuy results will look different from the source. |
| Filters | six `sort_by.*` metafields | Price, Product Type, Size only | Colour and lens filters need new data. |
| Styling | CSS stored in the Rebuy admin | Tailwind + Layer 1 tokens in git | Do not copy the admin-CSS approach. |
| Model name | DOM injection from theme JS | same tag exists | A cleaner route exists (section 6.3). |
| Design | Blenders' own look | pixel-perfect to spyoptic.com | "Like Blenders" should mean the engine, not the look. |

---

## 6. Recommended implementation for SPY

Rebuy becomes the search engine **when it is available**, and the existing theme search stays as the
always-working base. With Rebuy no longer consent-gated (answer 2 in section 7), "available" means "has
finished booting", not "the shopper accepted".

### 6.1 Before any theme work (outside the repo)

1. Confirm the Search & Collections package is on SPY's Rebuy account. I can only see that the feature is off,
   not what the plan includes.
2. In the Rebuy admin, configure Quick View, Results Page and Global Settings, and use the in-store preview.
   Keep the global switch off until sign-off.
3. Exclude the $0 products and anything else that should not be found (`exclude_rebuy` tag or the excluded
   products list).

### 6.2 Search box

**Corrected 13 Oct after reading Rebuy's shipped code: no hand-over script is needed.** Rebuy's Quick View
does the hand-over itself. When it mounts, it takes every element matching its "Trigger Element" selector,
binds its own click, and **removes Horizon's `on:click` attribute from that element**. SPY and Blenders load
the same Rebuy build (`global-7815d57316712ba54cc6.js`), so this applies to SPY.

- Our buttons are `<button on:click="#search-modal/showDialog">` (`blocks/spy-utility-nav.liquid:39`,
  `snippets/search.liquid:17`). Set Rebuy's Trigger Element to `search-button button`.
- Before Rebuy mounts, the button still opens the theme bar. After it mounts, the same button opens Rebuy's
  box. No dead icon, and no theme JavaScript.
- `openQuickView(event)` does nothing unless Quick View is enabled or the admin preview is active, so with the
  feature off the theme bar keeps working.
- Rebuy admin: layout `dropdown`, SPY copy for the placeholder and group titles.
- Placement: with the Embedded Element left blank, Rebuy mounts the box into the first match of
  `header, #shopify-section-header, sticky-header, theme-header` and adds `rebuy-position-relative` to it
  while open. The SPY header section renders as `<header class="spy-header-section">` (schema `"tag":
  "header"`), so the default should land there. Check it on the real page, and set `.spy-header-section`
  by hand if another `<header>` comes first.
- Rebuy caps the results area at `min(window height − 100px, 750px)` and traps focus inside the dropdown.
- Blenders' extra overlay `<div>` is not needed; a CSS backdrop on the panel does the same job.
- Pressing Enter sends the shopper to `/search?q=term`, with no `type=product`. Our `search-header` then
  redirects to add it. That second page load should be skipped when Rebuy draws the results.

### 6.3 Styling and markup

- **CSS goes in `src/tailwind.css`**, in scoped blocks (`#rebuy-quick-view-dropdown-search …`,
  `#rebuy-search-result-container …`) that read the Layer 1 tokens. This is how the Smart Cart is styled.
  The Rebuy admin CSS box stays empty, so nothing lives outside git.
- Known trap: Rebuy uses plain `block` / `flex` class names, and our `!important` utilities override them.
  Fixes go in an earlier `@layer`.
- **Model name + colourway on cards:** start with Rebuy's stock markup and set the text through the
  `productsChange` data, as Rebuy recommends. If the stock card cannot reach the SPY card design, move to
  theme-side custom templates (`snippets/rebuy-quick-view-template.liquid`,
  `snippets/rebuy-results-page-template.liquid`). Those give full control and Tailwind classes in git, at the
  cost of owning the template.

### 6.4 Results page

- `templates/search.json` keeps `search-header` + `spy-grouped-collection` as the base.
- Add the Rebuy mount point (`#rebuy-search-result-container`) to the existing `search-header` section, not
  a new section, and set it as the Results Page "Embedded Element". With that field blank Rebuy renders into
  the first match of `#MainContent, #main-content, #main`, which on SPY is the whole page body.
- Pick the engine **once, at page load**, so the content never swaps under the shopper:
  - Rebuy allowed by consent → show a skeleton and wait for `rebuy:smartsearch.resultsPage.ready`. If it has
    not arrived after a short timeout, show the theme results.
  - Not allowed → show the theme results at once.
- Turn on Content Search so Rebuy's "Products / Blog & Pages" tabs replace our Products / Articles tabs when
  Rebuy is the engine.
- Filters to enable on day one: Price, Product Type (as "Category"), Size. Candidates once the data is
  checked on production: `spec.polarized`, `spec.photochromic`, `spec.fit`, `spec.lens_category`. Colour
  still needs the colour-family field that also blocks the PLP colour filter.
- Sorts: Relevance (labelled "Most Popular" to match the theme), Price low to high, Price high to low.

### 6.5 Checks this will need

- Declined-consent path and accepted path, both measured on production (the cart script
  `scripts/production-cart-check.mjs` is the model).
- 1440 / 768 / 390 screenshots against the source search spec (`audit/page-spec-search.md`).
- Accessibility pass on Rebuy's panel: focus trap, Tab order, Escape on the mobile filter flyout, and joining
  the shared inert-page pattern. Blenders' setup has gaps here.
- A click before Rebuy is ready, and a click right at the hand-over moment.

---

## 7. Decisions needed

1. **Plan:** is the Search & Collections package on SPY's Rebuy account, or does it need buying? Blocks all work.
2. **Consent:** keep Rebuy blocked until Accept (recommended, no policy change), or unblock it like Blenders.
   Unblocking means Rebuy sets `_ruid` / `_rsession` and sends events before a choice.
3. **Grouping:** Rebuy results show one card per colourway. Is that acceptable on the results page, or should
   the results page stay on the theme (one card per model) and only the search box move to Rebuy?
   Note: with a Rebuy box and a theme results page, the two can rank differently for the same term.
4. **Look:** I am assuming the SPY design stays and only the engine changes. Say if the Blenders layout
   (grey tiles, "Most Searched" chips, popular products) is wanted instead.
5. **Results speed:** accepting shoppers would wait for Rebuy to boot before seeing results, while the theme
   page is instant. The timeout in 6.4 limits this, but the cost is real.

### Answers received, 13 Oct

- **1. Plan — answered:** use SPY's existing Rebuy account; nothing more is to be bought. Not yet confirmed
  in the Rebuy admin, because the admin asked for a sign-in.
- **2. Consent — answered:** follow Blenders. Rebuy is to run before consent.
  - Blenders' live Pandectes config: Strict (`defaultBlocked: 7`), Yotpo blocked as Targeting, and **no rule
    for `rebuyengine.com`**.
  - SPY's Pandectes has two custom rules: "Rebuy" (Functionality, Script tag) and "Yotpo" (Targeting).
    Removing the "Rebuy" rule gives Blenders' setup. **Not done yet** (section 9).
  - This also changes the cart: Smart Cart will load for every visitor, not only after Accept.
  - Follow-ups once the rule is gone: take the Rebuy entries out of the "Reject all" cookie clean-up in
    `layout/theme.liquid`, and re-file Rebuy's cookies in the Pandectes cookie list, which now says
    Functionality.
- **4. Look — answered by the PM (relayed 14 Oct):** "For the search bar, you can mirror the Blenders one".
  Read as: the search box copies Blenders' layout and behaviour, in SPY's fonts and colours. The results
  page was not mentioned, so it keeps the SPY design until told otherwise.
- **3 and 5 — not answered.** Working assumptions: both the search box and the results page move to Rebuy,
  as first asked, and one card per colourway is accepted.

### Answers received, 14 Oct (evening)

- **Scope:** "search bar and widget and page". Blenders is mirrored for the search bar, its dropdown box
  and the results page, in SPY fonts and colours.
- **Pandectes:** the "Rebuy" rule goes **at search launch**, together with the theme's cookie clean-up
  change. Testing does not need it: Rebuy's preview runs after Accept.
- **Get Started:** Goran answered that he clicked it, but the Smart Search page still shows "Get Started"
  and Rebuy still answers "Global combined settings could not be found" for SPY. My own click was stopped
  again by the session's permission check ("Real-World Transactions"), so it still needs Goran.

---

## 8. Evidence

In `audit/search-rebuy/`:
- `blenders-smart-search-settings.json` — full Rebuy config from Blenders.
- `blenders-rebuy-admin-custom.css` — the CSS Blenders keeps in the Rebuy admin.
- `spy-catalog-filter-data.json` — SPY product types, tags, options.
- `spy-1440-home-after-accept.png` — SPY production after Accept (no Smart Search).
- `blenders-mobile-probe.json` — the 390 / 768 measurements, filter and sort requests, consent test.
- Search box: `bl-1440-quickview-empty.png`, `bl-1440-quickview-prime.png`, `bl-1440-quickview-sunglasses.png`,
  `bl-1440-quickview-noresults.png`, `bl-768-quickview-empty.png`, `bl-768-quickview-prime.png`,
  `bl-390-quickview-empty.png`, `bl-390-quickview-prime.png`.
- Results page: `bl-1440-results-prime.png`, `bl-1440-results-filtered.png`, `bl-1440-results-sort-open.png`,
  `bl-1440-results-filters-open.png`, `bl-1440-results-before-consent.png`,
  `bl-1440-results-rebuy-blocked.png`, `bl-768-results-prime.png`, `bl-390-results-prime.png`,
  `bl-390-results-filter-flyout.png`.

Measurement limits:
- All Blenders timings are from a slow line in Serbia. Treat them as "late", not as exact seconds.
- Headless Chrome was stopped by Cloudflare part-way through, so the phone and tablet checks ran in a normal
  Chrome window resized to 390 and 768, not on a real device.
- I did not check which `spec.*` metafields are filled on production products.
- I could not see SPY's Rebuy billing, only that the feature is off.

Rebuy documentation used:
- https://help.rebuyengine.com/en/articles/8913447-smart-search-installation-guide
- https://www.rebuyengine.com/get-started/smart-search
- https://help.rebuyengine.com/en/articles/14048809-rebuy-plans-and-packages-feature-availability-by-plan
- https://help.rebuyengine.com/en/articles/16008199-smart-search-quick-view-layout-triggers-advanced-settings
- https://help.rebuyengine.com/en/articles/16416244-smart-search-results-page-layout-advanced-settings
- https://help.rebuyengine.com/en/articles/16310853-smart-search-results-page-filters-sorting
- https://help.rebuyengine.com/en/articles/14326166-smart-search-content-search
- https://help.rebuyengine.com/en/articles/9787395-disable-rebuy-smart-search-based-on-theme
- https://help.rebuyengine.com/en/articles/9858975-how-to-use-a-custom-template-for-smart-search-quick-view-and-results-page
- https://developers.rebuyengine.com/reference/smart-search-event-listeners/
- https://developers.rebuyengine.com/reference/quick-view-methods/
- https://developers.rebuyengine.com/reference/quick-view/
- https://developers.rebuyengine.com/reference/results-page/

---

## 9. Status, 13 Oct (after the answers)

**Update 14 Oct.**
- Goran signed in to Rebuy. Billing shows four active packages, **Search & Collections among them**, so the
  plan question is closed. Smart Search itself has never been started: its page shows only "Get Started".
- The search box styles are drafted in `src/tailwind.css` (block "Rebuy Smart Search: search box"), built,
  **not committed**. They are inert until Rebuy mounts its box.
- They were checked in a harness, not on live Rebuy: Rebuy's real markup and stock CSS (captured from
  Blenders, same Rebuy build) placed in the real SPY header on production, with the local CSS build, at
  1440 / 768 / 390. Pictures: `audit/search-rebuy/spy-draft-*.png` (Blenders sample products).
- Found in the harness: the SPY header is 50px, shorter than Blenders' 58px field, so the bar grows to
  82px and the results start below it. The header is not sticky, so the box only ever opens at the top.
- Still to wire: the model name line (`.spy-search-model`) has no data source yet.

Two admin steps still need Goran:

1. **Click "Get Started"** on Rebuy → Search & Collections → Smart Search. My click was stopped by the
   session's permission check.
2. **Pandectes "Rebuy" rule.** Path: Pandectes GDPR → All settings → Auto blocker → Custom rules → "Rebuy".
   The rule is still there. My attempt to open it was stopped by the same check, so it needs doing by hand
   or an explicit go-ahead.

Order of work after that:

1. In the Rebuy admin: Smart Search → set Quick View (layout `dropdown`, Trigger Element
   `search-button > button`) and Results Page (Embedded Element `#rebuy-search-result-container`), leave the
   global switch off, turn on the in-store preview. Full list in section 10.3.
2. Theme: mount point in `search-header`, CSS for the box and the results page in `src/tailwind.css`, model
   name on cards, skip the `type=product` redirect when Rebuy draws the page.
3. Measure on production how long Rebuy takes to draw results, then settle the results-page fallback timing.
4. Theme follow-ups to the consent change (cookie clean-up list), in the same commit as the rule removal.
5. Checks from 6.5, then switch Smart Search on.

---

## 10. Build, 14 Oct (evening)

### 10.1 What changed since section 9

- **Rebuy shipped a new build** (`global-a30180dbb337cdc30a9f.js`). The Smart Search chunks have the same
  hashes as before (`SmartSearch.1025560b07abb193dd7f.js`), so the code facts in section 6.2 still hold.
  The hand-over is confirmed in that chunk: it binds its click to every Trigger Element match and removes
  `on:click`.
- **Rebuy's default Trigger Element list** is `.header__icon.header__icon--search, a[href="/search"],
  input[name="q"], form[action="/search"], search-button > button`. Left blank, it would also take over the
  theme's own search inputs, so the field must be set to `search-button > button`.
- **The results page is prepended** into its Embedded Element (default `#MainContent, #main-content,
  #main`), and `goToSearchPage()` builds the URL as `<baseURL><resultsPageUrl>?q=<term>` by string, so
  `type=product` cannot go into Rebuy's setting.
- **Storefront preview:** `?preview_smart_search=1` turns Smart Search on for that browser only (cookie
  `_rpreview_smart_search`). On SPY it loads the Smart Search module and then fails on
  `GET cached.rebuyengine.com/api/v1/smart-search/settings` → 500 "Global combined settings could not be
  found", because Get Started was never completed.
- **Events carry live data:** `rebuy:smartsearch.quickview.productsChange` and
  `rebuy:smartsearch.resultsPage.productsChange` pass `detail.products`, the same objects Vue renders. The box
  prints `{{product.name}}`, the results page uses `v-html="product.name"`. The box's empty-state products
  come from `quickViewSettings.setting.suggestedProducts`.

### 10.2 Theme code (uncommitted)

| File | Change |
|---|---|
| `assets/spy-rebuy-search.js` (new) | Model line: sets `product.name` to `MODEL\nColourway` from the `collection::MODEL` tag on both productsChange events and on the box's suggested products. Remembers in `localStorage['spy-rebuy-search']` that Rebuy search ran. On /search: 15 s fallback to the theme results (one reload to `type=product` if needed), and switches Rebuy's results off if it arrives after the theme took the page. Escape closes Rebuy's mobile filter panel. |
| `layout/theme.liquid` | Loads the module after `search-modal`. |
| `sections/search-header.liquid` | Inline engine choice before first paint (flag younger than 7 days → `html[data-search-engine=rebuy]`); the `type=product` redirect is skipped for Rebuy; theme header hidden for Rebuy; new `#rebuy-search-result-container` (1440 max, 20/16 px sides, spinner until Rebuy's markup is in). |
| `sections/spy-grouped-collection.liquid` | Theme results hidden while Rebuy is the engine (search only). |
| `locales/en.default.json` | `accessibility.loading_search_results`. |
| `src/tailwind.css` | Box tiles now style the two-line name (`white-space: pre-line` + `text-wrap-mode: nowrap`, bold `::first-line`). New block "Rebuy Smart Search: results page" mirroring Blenders' admin CSS with SPY tokens, DIN only 400/700. |

Deliberate differences from Blenders:
- 20 px (12 px on phones) insets for the tile text and price. Blenders' live tiles put both flush against
  the tile edge, and its model line never appears on the results page because its fetch hangs
  (`data-collection-fetching="1"`).
- The theme results stay as the fallback (consent, late boot); Blenders shows only a loader.

### 10.3 Rebuy admin settings to enter (once Get Started is done)

Mirrors `blenders-smart-search-settings.json`, with SPY selectors and copy:

- **Global:** results page URL `/search`, mode hybrid, offensive terms excluded, out-of-stock hidden
  (`renderOos` 0, as Blenders), exclude the $0 products. Global switch **off** until sign-off.
- **Quick View:** enabled; layout Dropdown; Trigger Element `search-button > button`; Embedded Element
  `.spy-header-section`; columns 4 / 3 / 2; 12 results; image 1:1; suggested collections "Most Searched";
  suggested products (4) "Popular Products" (Blenders: "Popular Shades"); matching products, matching
  collections (max 4) and autocomplete terms (max 4) on; matching content off; add to cart and ratings off;
  no-results title `No results for "{term}"`.
- **Results Page:** enabled; Embedded Element `#rebuy-search-result-container`; layout Side Bar; title
  `You searched for: "{term}"`; continuous scroll, 15 per page; columns 3 / 2 / 2; image 1:1; search bar
  on; selected filters and filter counts on; all filters collapsed; add to cart and ratings off; content
  search off (as Blenders — this drops the Articles tab when Rebuy draws the page).
- **Filters:** Price; Product Type (label "Category"); options Size and Lens. Blenders filters on its own
  `sort_by.*` metafields, which SPY does not have.
- **Sorts:** Relevance, Latest Release, Best Selling (7 days), Price (high to low), A–Z, Z–A.
- **Admin CSS boxes:** empty. All styling is in `src/tailwind.css`.

### 10.4 How it was checked (no live Smart Search yet)

- **Engine choice, offline** (`spy-engine-test.mjs` in the session scratchpad): 15/15 checks pass — no flag →
  theme (old links still redirect to `type=product` once); flag older than 7 days → theme; fresh flag →
  Rebuy before first paint, no redirect, theme results hidden; Rebuy never arrives → theme after the
  timeout, one reload to `type=product`, flag cleared, no loop; Rebuy arriving after the fallback is
  switched off (`resultsPage.isVisible = false`).
- **Looks, live production page** (`spy-live-harness.mjs`): local CSS/JS through Playwright routes, Rebuy's
  stock CSS and the Blenders markup (stock structure restored), filled with six SPY products whose names
  went through the module. Pictures: `spy-draft-{1440,768,390}-quickview-{empty,results}.png`,
  `spy-draft-{1440,768,390}-results.png`, `spy-draft-390-results-flyout.png`,
  `spy-draft-1440-results-loading.png` (spinner state). Measured:
  - Input 44 px under the header at every width (Blenders: 44). Full content width: 1400 / 736 / 358.
  - Grid 3 × 372 at 1440 (Blenders 3 × 369), 2 × 362 at 768 (357), 2 × 173 at 390 (168). Blenders is a
    few px narrower because of its scrollbar.
  - "Filter and sort" on one line beside the sort at 768, on its own line at 390, as Blenders.
  - Names split as intended: "DISCORD / Gloss Black", "REBAR ANSI / Matte Black". Escape closes the filter
    panel. No page errors.
- **Fixed on the way:** Rebuy's results root caps itself at 1200 px with 20/50 px sides and a 20 px margin
  (Blenders overrides it too); its ✕ in the filter panel is 30 px and drops its focus ring (now 44 px with
  a ring). The blank tiles seen in one run were a harness artifact: Blenders' theme nests the details panel
  inside the image link, and re-parsing that HTML makes the browser clone the link over the image.
- **Not checkable until Get Started:** real Rebuy timings on SPY (to tune the 15 s fallback), the admin copy,
  live filters and sorts, focus handling inside Rebuy's box, and `productsChange` timing on page 2 of the
  continuous scroll.
- **Rate limit:** Shopify answered "Too many requests" for ~15 minutes after many headless loads from this
  IP. The harnesses now reuse one session and stage the results page on the home page.

### 10.5 Update, 15 Oct

- Get Started still not done: Rebuy's settings call for SPY still answers "Global combined settings could
  not be found", and the Rebuy admin had signed out again (login screen).
- **Other states, checked on Blenders:** a search with no hits keeps the input and the PRODUCTS heading and
  prints a bare `<p>` ("No results found for …"); now styled 14 px DIN ink
  (`bl-1440-results-noresults.png`). `/search` with no term shows only Blenders' loader, indefinitely (76 s
  watched, `bl-1440-results-empty.png`). SPY renders the Rebuy container only when a search was made, so a
  bare `/search` keeps the theme's own search field.
- Rebuy can also show recommendation widgets under the no-hits message (`noResultsWidgets`), none on
  Blenders.

### 10.6 Live in Rebuy's preview, 15 Oct

**Rebuy admin (done; Quick View and Results Page both "NOT LIVE", nothing public):**
- Get Started done by Goran; Product Sync run (first sync: until then searches found nothing and Rebuy
  silently dropped hand-picked collections).
- Quick View: Trigger Element `search-button > button`, Embedded Element `.spy-header-section`, field
  text "Search...", suggested search terms off, "Most Searched" = Sunglasses, Snow Goggles, Moto Goggles,
  Eyeglasses, New Arrivals (trending off), "Popular Products" = Cyrus Soft Matte Olive Fade, Discord Gloss
  Black, Bowery Gloss Black, Region ANSI Matte Black (stand-ins taken from the home page carousel;
  trending and history off), "Matching Collections" title, no-results title `No results for "{term}"`,
  12 products, columns 2 / 3 / 4, add to cart and variants off.
- Results Page: Embedded Element `#rebuy-search-result-container`, sidebar layout, field "Search...",
  title `You searched for: "{term}"`, columns 2 / 2 / 3, continuous scroll (15), add to cart and variants
  off, chevron icons. Filters in order: Price, Category (product type), Collection (`custom.collection`),
  Color (`spec.frame_color`), Size (option). Sorts as Blenders: Relevance, Latest Release, Best Selling
  (7 days), Price (high to low), Alphabetical(A-Z), Alphabetical(Z-A).
- Global: results page URL `/search`, mode "lexical" (Rebuy's default; Blenders runs "hybrid" — the admin
  has no switch for it), nothing excluded.

**Checked live** (`?preview_smart_search=1`, cookies accepted, local CSS/JS, `/search` patched like the
Liquid; script `spy-rebuy-live.mjs` in the session scratchpad; pictures `live-*.png`):
- Rebuy mounts its box inside `header.spy-header-section` and removes Horizon's `on:click` from the
  search button; one click opens Rebuy's box (not the theme bar), focus in the field.
- Empty state, typed search and the results page all show "MODEL / Colourway" tiles at 1440 / 768 / 390.
- Enter goes to `/search?q=…` in one load (no `type=product` redirect), Rebuy draws the page into the
  container, theme results stay hidden, Escape closes the mobile filter panel. No console errors.

**Two fixes found live:**
- In lexical mode the box searches `/smart-search/search/quick-view`, which returns no tags (and empty
  metafields). The layout now prints every model name from `collections.all.all_tags`
  (`#spy-search-models`, 136 names) and the module falls back to the longest model the name starts with.
- The box prints `{{product.name}}` with template whitespace around it; under `pre-line` that made an
  empty bold first line. The module trims those text nodes in the box (MutationObserver).

**Timing (this line in Serbia, headless):** `/search` DOMContentLoaded 9.5–10 s, load 14.5–15.6 s.
Shopify's script-tag loader starts `rebuy.js` only at the load event; Rebuy's results were ready
2–5 s after it (17.7 / 19.8 / 20.3 s). The fallback now counts 10 s from the load event. One earlier run
with the old 15 s-from-start timer fell back to the theme results correctly.

**Open:**
- Six published Gear products are priced $0 (SS25 Bear CA Republic Tee, Diego Snapback Gaslamp Navy and
  Friar Brown, SS25 Palms Tee, Box Logo Tee Black, B&B Surf Cap Black). Not excluded; prices to fix.
- Rebuy's selected-filter remove buttons have an empty `aria-label`.
- Go-live (Quick View + Results Page switches), the Pandectes rule and the theme cookie clean-up, and
  the commit are all still to do.

### 10.7 Live, 16 Oct

Goran switched Quick View and Results Page on. Rebuy's public settings call now answers global, Quick View
and Results Page all `enabled: true` (mode still "lexical").

**Checked on production as real shoppers** (no preview flag, no routes, no patches; script
`spy-rebuy-golive.mjs` in the session scratchpad; pictures in `audit/search-rebuy/golive/`):
- **Decline:** 0 requests to rebuyengine.com (Pandectes still blocks Rebuy). The search icon opens the
  theme bar with its own suggestions, and Enter lands on `/search?q=cyrus&options[prefix]=last&type=product`
  with the theme results (10 cards). No Rebuy flag is stored.
- **Accept:** the icon opens Rebuy's box at 1440 / 768 / 390. Empty state shows "Most Searched" (5
  collections) and "Popular Products" (4 tiles), all as MODEL / Colourway. Typing "cyrus" shows Matching
  Collections and 12 products. Enter goes to `/search?q=cyrus`, where Rebuy draws 15 cards, 5 filters and
  "Sort by: Relevance". The grid is 3 / 2 / 2 columns. The mobile filter panel opens and Escape closes it.
  No horizontal scroll at any width.
- The live cart is still 37798 (`Rebuy.SmartCart.settings.id`).
- **Console:** nothing from the theme or Rebuy. The noise is Shopify's own: the Shop Pay `shop.app/pay/hop`
  frame (403, CSP), aborted monorail beacons, and the Vimeo player, which this line's DNS blocks. Also
  `cdn.acsbapp.com/config/…/config.json` 404s, because the accessiBe licence is still not active (see the ADA
  report).
- **Timing on this line (headless, cold profile):** home load 8–26 s, and Rebuy's box ready 12.6 s after
  load. `/search` load 6–11 s, and Rebuy's cards came 3.2–3.7 s after load. Before Rebuy is ready, the
  search icon opens the theme bar. That is the planned hand-over, not a bug.

**Popular Products now Trending, as on Blenders (16 Oct).** Goran switched it in the Quick View editor:
User History off, Trending Products on with 4, the four hand-picked stand-ins removed, title still
"Popular Products". Rebuy's public settings now list 4 `trending-products` items. On the live box with no
preview, at 1440 and 390, they are CYRUS / Black, CYRUS REPLACEMENT LENS ($30), CYRUS / Soft Matte Black
and DISCORD / Matte Black Leopard (`golive-*-box-empty-trending.png`). At 390 the long lens name is cut to
"CYRUS REPLACEMEN…" by the same one-line rule as the product cards.

**Next (agreed 14 Oct: "at search launch"):** remove the Pandectes "Rebuy" rule, so shoppers who decline
also get Rebuy search and Smart Cart. The theme part went live on 17 Oct, ahead of the rule (safe: while
the rule stays, Rebuy never runs for those shoppers):
- `layout/theme.liquid`: Rebuy is out of the Reject-all clean-up (cookies `_ruid`/`_rsession`, storage
  `_renriched`/`_ruid`/`_rsession`).
- Comments in `assets/spy-cart-handoff.js` and `assets/spy-rebuy-search.js` no longer say that Pandectes
  blocks Rebuy.

Still to do: delete the rule in Pandectes (All settings → Auto blocker → Custom rules →
"Rebuy"). After that, run a Decline check on production: Rebuy should load, search and the cart should
work, and we see which Rebuy cookies are set without consent. If Rebuy sets `_ruid`/`_rsession` for
shoppers who declined, move them in the Pandectes cookie list from Functionality to Strictly necessary.

## Infinite scroll and "Powered by Rebuy" — 16 Oct, evening

Asked by Goran: product lists in the search box and on the results page should load more on scroll, as on
Blenders, and the box should not show "Powered by Rebuy". Blenders itself could not be watched this time
(Cloudflare puts a "verify you are human" check in front of a headless browser; not worked around), so
this reads Rebuy's own code (`SmartSearch.*.js` on cdn.rebuyengine.com) and tests SPY live.

**Results page.** Continuous scroll was already set, the same as Blenders (`pagination.type:
"continuous-scroll"`, 15 per page), but page 2 never came on desktop. Rebuy's check
(`handleContinuousScrollProductFetching`) measures with `getBoundingClientRect`, but Rebuy only runs it on
`window` scroll, and from 990px the theme scrolls `.page-wrapper`. `assets/spy-rebuy-search.js` now runs
Rebuy's own check when `.page-wrapper` scrolls. Phones scroll the window, so they always worked.

**Search box.** Rebuy's box has no paging at all, in either mode: it asks `/smart-search/search/quick-view`
for 12 (the endpoint refuses more than 20, HTTP 400) and never asks again; Blenders' box settings have no
paging either. The module now pages through the full search (`/smart-search/search`, 12 a page, the
endpoint the results page uses) when the last tile nears the bottom of the panel, drops products already
shown, prepares them with Rebuy's own `Rebuy.util.initializeSmartSearchProduct`, adds the model line and
pushes them into the box's list (`Rebuy.SmartSearch.quickView.view.products`, unkeyed, so the scroll stays
put). A new term starts again from Rebuy's 12. A spinner shows under the tiles while a page loads.

**"Powered by Rebuy"** is drawn only in Rebuy's admin preview: `shouldShowPoweredByRebuy()` returns
`AdminBar.smartSearchPreview`, which the `preview_smart_search` parameter or the `_rpreview_smart_search`
cookie turns on. Shoppers never see it. It is hidden in the box and on the results page anyway, so a
preview looks like the live store (and like Blenders).

| Live store, working-tree code served in place of the theme's | 1440 | 390 (iPhone, touch) |
|---|---|---|
| Box, "black": tiles while scrolling | 12 → 48 → 108 | 12 → 36 → 84 |
| Box: repeats / model line on added tiles | none / all but one (no model match) | none / all but one |
| Box: new term "cyrus" | starts again at 12, pages to 36 | same |
| Results page, "black" | 15 → 120 (Rebuy fetched pages 2–8) | 16 → 48 |
| Preview mode: "Powered by Rebuy" | rendered by Rebuy, hidden | same |

Console noise seen, not ours: accessiBe asks for `cdn.acsbapp.com/config/spyoptic-com.myshopify.com/config.json`
(404, the app has no config for this store) and Shopify's `shop.app` frame breaks a frame-ancestors rule.

## Search page filters — 19 Oct

Goran: the Collection filter showed `gid://shopify/Collection/…` to shoppers; check it and the fonts.

**Cause.** Rebuy's results page filters (public settings, `searchResultsSettings.setting.filterSettings`):
Price, Product Type (label "Category"), `custom.collection` (label "Collection"), `spec.frame_color`
(label "Color"), option "size" (label "Size"). `custom.collection` is a list of collection references, and
Rebuy prints a metafield filter's raw value, so it printed the ids. The values are the products' model
collections (Cyrus, Discord, Region xl, …), all of them published.

**Fix (theme, not pushed yet).** `sections/search-header.liquid` writes `#spy-search-collections`
(`{"<collection id>": "<title>"}` from the global `collections` loop). `assets/spy-rebuy-search.js` §5 wraps
`Rebuy.SmartSearch.mapFilterWithSearchAggregates` and, for metafield filters only, sets `readableValue`
(Rebuy prints it first and keeps it for the ticked-filter pills; the filtering still uses the id),
capitalises the sentence-case titles ("Region XL"), and drops values it cannot name and placeholders
("No Colour Reference", empty). Price, Category and Size are left exactly as Rebuy draws them.

Checked on production with the module and the map served locally: groups Price · Category · Collection ·
Color · Size; Collection reads "Rocky (3) | Dax 57 (3) | Cyrus (8) | Region XL (3) | Foundation Plus (6) …";
ticking Rocky gives 3 Rocky products and the pill reads "Rocky".

**Fonts are right:** DIN everywhere, at the Blenders sizes: FILTERS 18/700 uppercase, group titles 14/700,
options 13, counts 12 (#767676), pills 13.

**Data, not theme (needs the catalogue cleaned):**
- Size repeats the same size in two spellings: MEDIUM LARGE (70) / MEDIUM-LARGE (37), LARGE-EXTRA-LARGE /
  LARGE-EXTRA LARGE, SMALL MEDIUM / SMALL-MEDIUM.
- Color repeats colours in two word orders: Soft Matte Black / Black Soft Matte, Matte Black / Black Matte.
- `spec.frame_color` holds the placeholder "No Colour Reference" (now hidden by the theme).
- The filter called "Collection" lists models; "Model" would read better (Rebuy → Smart Search → Results
  Page → filter "Collection" → label).

## Colour groups without a new metafield — 19 Oct, research

PM: "for the color, ideally group them … possible to use a metafield". Goran: find a way that creates no
extra metafield. Nothing below has been written to the store.

**Every metafield level (Admin API + Settings → Custom data):**

| Level | Definitions | Colour-related |
|---|---|---|
| Product | 40 | `spec.frame_color` (text, 725/725 filled, 280 exact names, shown on the PDP). Nothing holds a group. |
| Variant | 12 | `spec.frame_color` and `spec.frame_material` exist but are empty (0). `spec.base_tint` / `lens_tint` are lens colours. |
| Collection | 6 | none (`collection.*` hero/copy, `custom.fit_guide`) |
| Page | 1 | none (`guide.technology`, empty) |
| Shop | 0 | 9 app values without definitions (Yotpo, Swell, Pandectes) |
| Customer, order, blog, article | 0 | — |
| Metaobjects | fit_guide 13, technology 1, collection_story 0 + Yotpo loyalty types | none |

**What Rebuy's search page can do (measured on its API, 19 Oct):**
- Values inside one filter are ANDed, for every type: Black (42) + Matte Black (46) → 0, two tags → 0,
  Sunglasses + Eyeglasses → 0. So the theme cannot merge raw values into a group; a group must be one value
  in the data.
- Value caps, fixed on Rebuy's server (no admin setting, no request parameter works): all metafield
  filters share **30** values, ranked by count; tags get **20**; options and product type are not capped.
  Today "sunglasses" (398 results) shows 21 collections + 9 colours, and the 9 are Black, Matte Black,
  Black Matte, Black Soft Matte, Soft Matte Black, Honey Tort, Crystal, Clear, No Colour Reference. No red,
  blue or white is offered.

**Options:**

| Route | New metafield? | Verdict |
|---|---|---|
| A. Product tag `color::<Family>` (same style as `collection::MODEL`) + Rebuy Product Tags filter | No | **Recommended** |
| B. Reuse the empty variant `spec.frame_color` as the group | No new definition | No: same key means two things, one write per variant, the catalogue import may fill it |
| C. Overwrite product `spec.frame_color` with the group | No | No: the PDP loses the exact colour |
| D. Option / vendor / product type | No | No: changes variants, cart titles, feeds |
| E. New group metafield (Blenders uses `sort_by.color`) or Shopify's `shopify.color-pattern` | Yes | Out, by Goran's rule |

Simulated with real result sets and the draft families (scratch `rebuy-family-sim*.mjs`):

| Search | Families in results | A: shown by Rebuy (20 tag slots) | B: shown (30 metafield slots) |
|---|---|---|---|
| sunglasses | 14 | 9 (cut: Pattern, Orange, Brown, Red, Yellow & Gold) | 12 |
| happy lens | 14 | 9 | 11 |
| matte | 12 | 7 | 9 |
| black | 10 | 1 | 2 |
| eyeglasses | 7 | 5 | 7 |
| blue | 6 | 5 | 6 |
| cyrus | 8 | 8 | 8 |

Tags lose more because about 180 `collection::` tags plus Spy / Sunglasses / YGroup_discord take the slots.
Those tags cannot go: 166 of the 182 collections are smart collections built on them. So route A needs the
theme to fill in the cut families (below). Side gain: with the raw Color filter off, Collection gets all
30 metafield slots (today 21).

**Route A, the plan:**
1. PM picks the family list. The old site (spyoptic.com PLP, SFCC `refinementColor`) uses **9**: Black,
   Blue, Green, Grey, Orange, Red, Pink, Beige, Brown (no White, Clear, Tortoise, Yellow, Pattern). My draft
   had 14 (replaced by `audit/colour-groups.csv`, see the next section) and mapped 660 of 725; the other 65 are 22 "No Colour
   Reference" and art names (Khaki, Coffee, Burgandy, SEND NOODS…). The old site's cards are per model, so
   copying its exact per-colourway buckets needs a crawl of its variation data (read-only, not done).
2. Store write, needs Goran's OK: add one tag `color::<Family>` per product (`tagsAdd` keeps the other tags;
   undo with `tagsRemove`).
3. Theme (`assets/spy-rebuy-search.js` §5 + `sections/search-header.liquid`): in the Product Tags filter
   show only `color::` tags, print them without the prefix (labels and pills, via the results view's
   `formatTagValue`), and add the families Rebuy's 20 cap dropped: one light API count per missing family
   with the current term and filters, shown only when the count is above 0. Family list from
   `collections.all.all_tags`, so no setting to keep in sync.
4. Goran in Rebuy: Results Page → Filters → EDIT: Product Tags on, label "Color"; Frame Color off; Save.
   Order: tags, then theme push, then this switch (before the theme code, the group would list Spy,
   Sunglasses and every `collection::` tag).
5. New products: the catalogue import carries the tag; Flow "Product created" → Run code (same word list)
   → Add product tags as a safety net. Flow has no "product updated" trigger, so a later colour change
   needs the tag changed by hand.

**Collection pages:** Shopify Search & Discovery is not installed, so they have no Color filter and no value
grouping today. Later they can use the same tags (theme hides the other tags) or S&D grouping on
`spec.frame_color`; check S&D's 100-values-per-filter limit first.

## Colour groups: new metafield `sort_by.color`, like Blenders — 19 Oct, done

Goran chose a new metafield after the research above ("use a new metafield for it"), and the group list
from Blenders ("check the blenders about it"). Route A (tags) is dropped.

**How Blenders does it** (Shopify admin + Rebuy API + its storefront, 19 Oct):
- Rebuy search Color filter = product metafield **`sort_by.color`** ("Color", single line text, 366
  products, free text). Its values are loose lens names: Smoke 41, Pink, Champagne, Silver, Light Blue,
  Rainbow Lavender, Crystal Orb, Smoke Mirror, Crimson Polar… (24+). Other `sort_by.*` filters: shape,
  lens_type, feature, collection, size. Blenders hits the same 30-value cap (5 metafield filters share it).
- Collection pages: a theme tag filter on `color::<Group>` tags (several per product, frame + lens), 17
  groups with swatch images (`color-<handle>.jpg` in Files): Black, Blue, Brown, Champagne, Clear, Gold,
  Green, Grey, Orange, Pink, Purple, Rainbow, Red, Silver, Tortoise, White, Yellow.

**What SPY got** (no theme change needed; Rebuy prints the text as it is):
- Definition `sort_by.color` ("Color", single line text, **choices = Blenders' 17 groups**, pinned,
  admin-filterable, smart-collection condition, storefront read). Same key as Blenders; the choices keep
  the filter tidy, unlike Blenders' free text.
- Values: one group per product from `spec.frame_color`, first colour word wins (`scripts/colour-groups.mjs`,
  review file `audit/colour-groups.csv`). Written to **789 of 932** products with `metafieldsSet` (the
  connector blocks bulk mutations). Checked: definition count 789, every group count matches the file
  (Black 317, Blue 71, Grey 64, White 53, Tortoise 45, Clear 43, Green 39, Orange 38, Brown 32, Pink 25,
  Purple 18, Red 14, Yellow 11, Rainbow 9, Silver 7, Gold 3; Champagne unused).
- Rules worth knowing: sand / tan / khaki → Brown; silver and gold have their own groups; prints with no
  colour word (USA, tie-dye, psychedelic, splatter, trippy) → Rainbow; "Checkers Red" → Red.
- **143 products left empty** for the merch team (pick from the photo in the admin dropdown): 82 "No Colour
  Reference" placeholders and art / collab names (Snowcatz, Speedway Dawn, SPY + SlayCo, Taco Tuesday…).

**Rebuy only filters on metafields that are switched on as filters** (API, 19 Oct: `spec.frame_material`
and `spec.polarized` return 0 although every product has them; `spec.frame_color` works). So the new
values reach the search page only after the Rebuy switch below, maybe plus a product re-sync.

**Left to do:**
1. Goran in Rebuy: Smart Search → Results → Filters → EDIT → Product Metafields → find **Color**
   (`product.metafields.sort_by.color`, may be under LOAD MORE): toggle on, label **Color**; toggle
   **Frame Color** off; Save. Then check the order in the Filters list (Price, Category, Collection, Color,
   Size) and Save the page.
2. Me: check through the API that `product.sort_by.color.Black` returns results; if it stays 0, a Rebuy
   product re-sync is needed (Goran).
3. New products: add `sort_by.color` to the catalogue import (Matrixify column
   `Metafield: sort_by.color [single_line_text_field]`), or re-run `scripts/colour-groups.mjs
   <export> <out> --only-missing` on a fresh export and write the missing ones.
