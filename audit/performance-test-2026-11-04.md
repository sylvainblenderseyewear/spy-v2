# SPY v2 — performance test, 4 Nov 2026 (live store)

**Store:** `spyoptic-com.myshopify.com`, theme `188282798387` (spy-v2/main, the published theme). The password has been off since 3 Nov. `www.spyoptic.com` still points to SFCC, so no real shoppers are on Shopify yet. That makes this the right time to fix things.

## How it was tested

| | |
|---|---|
| Tool | Lighthouse 13.6, the same engine as PageSpeed Insights, run in headless Chrome 156 on this PC |
| Profiles | **Mobile**: Moto G Power, slow 4G, 4× slower CPU (simulated). **Desktop**: Lighthouse desktop preset |
| Pages | Home, `/collections/sunglasses`, PDP sunglass (Discord Gloss Black), PDP snow goggle (Marauder Elite Eco), `/cart` (empty) |
| Runs | 3 per page and profile, median reported. Runs were spaced 50 s apart, and each one was checked for a 429 or challenge page |
| Visitor | **First visit, no cookie choice yet.** Pandectes is Strict, so Yotpo, Rebuy, GA4 and Clarity are blocked. A smaller set of runs after "Accept" is listed separately |

**Limits (read before comparing numbers):**
- **PageSpeed Insights could not be used.** Its shared key is out of quota (HTTP 429), and the project has no API key of its own.
- **This office network blocks `player.vimeo.com`** (DNS gives 10.10.7.111). The homepage hero video never loads in these runs, so the real homepage is **heavier** than measured here.
- **This connection stalls at random** (TLS handshakes up to 14 s). Lighthouse builds its simulation from the real load, so one run can come out much worse than the next: home mobile scored 61, then 44. Medians help, but a ±10-point difference between single runs is noise.
- **Shopify rate-limits this IP.** It answered 429 after about 12 quick requests, so the suite was paced.
- The September baseline used Lighthouse 12 on a different PC. Compare trends, not exact points.
- **The live theme changed during the test:**
  - Sylvain switched on the **Amp Back in Stock** app embed at 23:24 UTC (`e76897a`). Runs from 23:24 on (round 3, the what-ifs, after Accept) carry its ~44 KB, so the what-if gains below are conservative.
  - `eda75d6` (removed the empty "Complete your selection" PDP block) landed just before the suite. `a5e68c6` (PDP panel slide) landed during round 3.

## Results (median of 3, first visit)

| Page | Mobile score | LCP | TBT | Speed Index | Desktop score | LCP | TBT |
|---|---|---|---|---|---|---|---|
| Home | **45** (61, 44, 45) | 4.6 s | 463 ms | 20.2 s | **75** | 2.1 s | 24 ms |
| Collection (Sunglasses) | **50** (50, 49, 62) | 4.0 s | **1,554 ms** | 16.9 s | **68** | 2.8 s | 60 ms |
| PDP sunglass | **52** (50, 52, 64) | 4.1 s | 724 ms | 29.0 s | **78** | 1.9 s | 84 ms |
| PDP snow goggle | **53** (45, 59, 53) | 4.3 s | 1,222 ms | 17.3 s | **75** | 2.2 s | 99 ms |
| Cart (empty) | **38** (58, 29, 38) | **10.0 s** | 1,527 ms | 19.8 s | **80** | 1.9 s | 93 ms |

- **CLS is ≈ 0 on every page**: no layout shift problem.
- **Server response is fine**: 240–850 ms, including this connection's stalls. Shopify's own `server-timing` shows 60–790 ms of processing.
- **Mobile is the problem**: the LCP is 4–4.6 s (Google's "good" is ≤ 2.5 s), and the main thread is blocked for 0.5–1.5 s. Desktop is acceptable apart from LCP 1.9–2.8 s and the slow Speed Index.
- **Speed Index of 17–29 s is mostly the cookie banner** popping up late (it's a full-screen modal) plus late visual changes. On light pages like the empty cart, the banner text becomes the LCP element (10 s).

**Against September (production, same method, Lighthouse 12, other PC):** 24 Sep, no apps: mobile 73–79, desktop 90–95. 28 Sep, apps on: mobile 48–57, desktop 82–90. Today: mobile 38–53, desktop 68–80. Against 28 Sep, mobile LCP improved on the collection page and sunglass PDP (4.0–4.1 s vs 5.4–5.5 s) but not on home (4.6 vs 3.8 s). The cart is again set by the banner. Blocking time rose on the collection page and snow PDP (1.2–1.6 s vs 0.6–0.7 s) and is unchanged on the sunglass PDP. Desktop slipped about 10 points. Since September, Microsoft Clarity's **Brand Agents** embed was switched on (theme editor, 19 Oct, `1e4885e`) and adds 317 KB per page. accessiBe (on since 24 Sep) now runs on a domain where it has no licence. Pandectes Strict mode (29 Sep) made first visits lighter by holding back Yotpo and Rebuy. The account popover has been in the header since July.

## Where the time goes (mobile, first visit)

Medians per page. Transfer size / requests / JavaScript time (script + parse, on the simulated 4× slower phone CPU).

| Owner | Home | Collection | PDP sunglass | PDP snow | Cart |
|---|---|---|---|---|---|
| **accessiBe** (app embed) | 249 KB / 3 / 211 ms | 249 KB / 3 / 375 ms | 249 KB / 3 / 194 ms | 249 KB / 3 / 360 ms | 249 KB / 3 / 297 ms |
| **Microsoft Brand Agents** (Clarity app embed) | 317 KB / 21 / 88 ms | 317 KB / 21 / 116 ms | 317 KB / 21 / 70 ms | 317 KB / 21 / 115 ms | 317 KB / 21 / 125 ms |
| **Shopify account popover + "Sign in with Shop"** | 122 KB / 32 / 213 ms | 141 KB / 32 / 343 ms | 142 KB / 32 / 330 ms | 142 KB / 32 / 324 ms | 141 KB / 32 / 350 ms |
| Pandectes (cookie banner) | 52 KB / 6 / 275 ms | 52 KB / 6 / 421 ms | 61 KB / 6 / 370 ms | 60 KB / 6 / 381 ms | 52 KB / 6 / 396 ms |
| ExpertVoice | 19 KB / 4 / 86 ms | 21 KB / 4 / 105 ms | 21 KB / 4 / 162 ms | 21 KB / 4 / 195 ms | 21 KB / 4 / 59 ms |
| Shopify pixels (web pixel manager) | 139 KB / 4 / 200 ms | 139 KB / 4 / 354 ms | 139 KB / 4 / 323 ms | 139 KB / 4 / 302 ms | 139 KB / 4 / 293 ms |
| Shopify perf-kit + platform scripts | 84 KB / 45 / 294 ms | 85 KB / 45 / 331 ms | 89 KB / 49 / 406 ms | 89 KB / 48 / 304 ms | 88 KB / 45 / 366 ms |
| **Theme JavaScript** | 107 KB / 51 / **4 ms** | 122 KB / 58 / **7 ms** | 120 KB / 57 / **11 ms** | 120 KB / 57 / **5 ms** | 101 KB / 48 / **0 ms** |
| Theme fonts (DIN WOFF) | 104 KB / 3 | 104 KB / 3 | 151 KB / 4 | 150 KB / 4 | 105 KB / 3 |
| Images | **912 KB / 52** | 292 KB / 32 | 270 KB / 30 | 271 KB / 29 | 159 KB / 15 |

Apps and platform add up to **1.4–2.0 s of JavaScript per phone page**. Of that, **0.5–0.85 s is in our hands**: accessiBe, Brand Agents and the account popover. Yotpo, Rebuy and GA4 cost nothing here because Pandectes blocks them until "Accept" (see the after-Accept runs).

**What this shows:** the theme's own JavaScript costs almost nothing: 51–58 small files and under 20 ms of script. Almost all of the phone's main-thread time goes to apps and Shopify features that run on every page, before the shopper has even answered the cookie banner.

## What-if runs: the same pages with apps blocked (mobile)

Lighthouse was told to block the scripts, which is what turning the embed off would do.

| Page | Today (median of 3) | accessiBe + Brand Agents blocked (median of 2) | …and the account popover blocked (1 run) |
|---|---|---|---|
| Home | 45 · TBT 463 ms · 2.5 MB / 297 req | **65** · TBT 274 ms · 1.9 MB / 278 req | — |
| Collection | 50 · TBT 1,554 ms · 1.9 MB / 279 req | **64** · TBT 317 ms · 1.5 MB / 263 req | **74** · TBT 338 ms · 1.3 MB / 185 req |
| PDP sunglass | 52 · TBT 724 ms · 2.2 MB / 301 req | **62** · TBT 348 ms · 1.8 MB / 299 req | 59 · TBT 388 ms · 1.5 MB / 208 req |

**Turning off two app embeds is worth about +10–20 points on phones**, mostly through blocking time. LCP does not improve from this, because LCP is held back by the image issues below (T1, A3).

## After "Accept" (returning shopper with consent, mobile, 1 run each)

| Page | First visit (median) | After Accept | What Accept adds |
|---|---|---|---|
| Home | 45 · TBT 463 ms | 49 · **TBT 1,616 ms** | Clarity 233 ms, Yotpo pixel 497 ms, Shopify pixels +480 ms (the GA4 custom pixel and Clarity's app pixel run there), GA4 `gtag` 162 KB |
| Collection | 50 · TBT 1,554 ms | 48 · TBT 1,934 ms | Clarity 272 ms, Yotpo 302 ms, pixels +230 ms |
| PDP sunglass | 52 · TBT 724 ms | 46 · TBT 1,356 ms | **Rebuy 558 KB / 42 requests / ~1.3 s of script** (global.js 245 KB, Smart Cart, Smart Search, Splide, widgets), Yotpo 287 KB / 22 requests / 475 ms |

The score barely moves because the banner no longer shows (Speed Index improves), but the main thread gets **0.4–1.2 s busier**. Rebuy starts after `load`, so it ran inside the trace only on the PDP run. Expect the same ~560 KB on every page a few seconds after load, which is when shoppers start tapping.
- **Rebuy:** keep it (it runs the cart and search), but ask Rebuy support whether Smart Cart and Smart Search code, and the three widget feeds fetched on every load (`custom/id/325521`, `325527`, `325529`, set up in Rebuy, not in the theme), can wait until the bag or search is first opened.
- **Yotpo:** the review widget only matters on PDPs. Check that the Yotpo pixel and loyalty loader are needed on every page.

## Findings and fixes (ranked by gain for effort)

### A. Admin / app settings — no code (Goran clicks)

| # | Finding | Evidence | Fix | Gain |
|---|---|---|---|---|
| A1 | **Microsoft Clarity "Brand Agents" embed** loads on every page before consent | 317 KB, 21 requests, 70–190 ms JS per page (`adsagentclientafd-…azurefd.net`) | Online Store → Themes → Customize → App embeds → turn **Brand Agents** off. It is a separate embed from Clarity's tracking (`clarity_js`), which stays on, so Clarity keeps working as the PM asked. Check with the PM/marketing first that nobody uses the AI agent. | −317 KB and −21 requests on every page. It also removes a tracker that runs before consent (GDPR checklist) |
| A2 | **accessiBe does nothing on this domain but still costs** | `cdn.acsbapp.com/config/spyoptic-com.myshopify.com/config.json` → **404**. `app.js` is still 248 KB with 200–450 ms JS on every page | Decision for the PM (kept on 28 Sep): (a) keep it, but turn the app embed off and let a small theme snippet load the same script on the first scroll/tap/key press, or (b) remove it. It comes alive only after the domain switch (licence = spyoptic.com) | −248 KB and −200–450 ms on every phone page view |
| A3 | **Homepage hero has no poster image** | `templates/index.json` `spy_hero_video` has no `cover_image` / `cover_image_mobile`. The first screen is an empty box until Vimeo plays. The LCP falls to a category tile | Upload two stills (desktop 12:5, mobile 2:3, first frame of each video, WebP, ≤ 150 KB) and set **Desktop poster / Mobile poster** in the hero section. The code already renders them eager with `fetchpriority=high` (`sections/spy-feature-link-banner.liquid:54-58,203-227`) | The hero becomes a fast, prioritised LCP image, and the first screen is never empty |
| A5 | **Amp Back in Stock now loads on every page** (on since 4 Nov 00:24 CET) | `backinstock.useamp.com/widget/285904_….js` + its Shopify extension file: ~44 KB and 0–190 ms JS per page (most on PDPs), though back-in-stock only matters on a sold-out PDP | Ask Amp whether the widget can load on product pages only, or only when the picked variant is sold out. Measure again once it's set up | ~44 KB and up to ~190 ms on every non-PDP page |
| A4 | **Cookie banner shows late and becomes the LCP on light pages** | Cart LCP element = Pandectes `div.intro`, render delay 9.8 s (observed). Pandectes' core script arrives by 2.3 s, but the banner waits for Shopify's `consent-tracking-api.js` | Ask Pandectes whether the banner can paint before Shopify's consent API is ready. Settings already have delay 0 and geolocation off | Better LCP on first visits to light pages (cart, policy, account) |

### T. Theme code — no visual change (I can do these, Goran reviews and pushes)

| # | Finding | Evidence | Fix (file:line) | Gain | Effort |
|---|---|---|---|---|---|
| T1 | **Collection pages lazy-load the LCP image** | Mobile PLP LCP = first product card, `loading="lazy"`, resource load delay 4.1 s | `snippets/spy-grouped-product-card.liquid:201` hard-codes `loading: 'lazy'`. Pass `card_index` from `sections/spy-grouped-collection.liquid:320`: eager for the first 4 cards on page 1, `fetchpriority="high"` on card 1 | The image starts with the HTML instead of after layout: ≈ −1 s or more on mobile collection LCP | S |
| T2 | **Footer icons are fetched at 832–1200 px for an 84 px slot** | The 4 `spy-footer-icon-*.png` = **≈ 66 KB on mobile (832 px) and ≈ 102 KB on desktop (1200 px), on every page**. Stock Horizon tells the browser they're full-width (`sizes="(min-width: 1024px) 1024px, 100vw"`) | `snippets/icon-or-image.liquid:30-31`: `sizes` = the icon width in px, `widths` = 1×/2×/3× of it | ≈ −60 KB (mobile) / −95 KB (desktop) per page | S |
| T3 | **Category tiles download every hover image on phones** | ≈ 220 KB of `*-HOVER*` images on mobile home, where there is no hover | `sections/spy-category-tiles.liquid:120-131`: wrap the hover image in `<picture>` with a `(hover: none)` source that is a 1×1 data GIF | ≈ −220 KB on mobile home | S |
| T4 (done 4 Nov, uncommitted) | **`<shopify-account>` popover loads Shopify's whole sign-in stack on every page, hidden on phones too** | `blocks/spy-utility-nav.liquid:69` (hidden below 992 px but still in the DOM). Measured by blocking it: **81–97 requests and 217–283 KB per page**: Shop "arrive" Pay assets (32–53 files), ~24 shop-js chunks, the `shop.app/accounts/pre_auth` iframe, the account components and the login-with-Shop calls. 210–400 ms JS | Phones: don't put the element in the DOM (it's never shown there); a plain account link in the phone menu does the job. Desktop: keep it, or create it on the first hover/focus. Trade-off: Shop's automatic sign-in ("Shop recognition") only starts after that | Collection mobile 63 → **74** with the apps already off (1 run); −80–100 requests per page | S–M |
| T5 | **Forced layout while the PDP is still building** | `assets/spy-drawer.js:17` `void drawer.offsetWidth` runs at DOMContentLoaded for closed drawers: 89–178 ms task | Skip the reflow in `portalAll()`. Keep it only on the open path | −90–180 ms on PDP | S |
| T6 | **Yotpo clean-up watches the whole page for its whole life** | `assets/spy-yotpo-a11y.js:30-37`: MutationObserver on `document.body` (subtree) + 5 page-wide queries per frame, even before consent when Yotpo never loads (a 153 ms task on the PDP, though most of that task is the frame's own render work) | Skip the scans until Yotpo has rendered into one of our `.yotpo` placeholders | Small: removes needless work while the page builds | S |
| T7 | **Render-blocking CSS ≈ 100 KB (brotli) before first paint** | `tailwind.css` 294 KB raw / 39 KB br is the slowest blocking file in every run (2.5–5.8 s observed). 19 % of it (53 KB raw) is Rebuy styling, while Rebuy can't run before consent and starts 6–15 s after load. `compiled_assets/styles.css` (43 KB br) is 100 % unused on home | Move the `#rebuy-*` rules into their own stylesheet, loaded when Rebuy boots. Delete unused stock Horizon files whose `{% stylesheet %}` still compiles into every page: `sections/header.liquid`, `blocks/_header-menu.liquid`, `snippets/header-drawer.liquid`, `quick-order-list`, `product-hotspots`, `layered-slideshow`, `disclosures`, `media-with-content`, … (≈ 120 KB raw of 432 KB) | FCP/LCP −100–300 ms on mobile, plus cheaper style recalcs (B1) | M |
| T8 | **Vimeo starts while the page is still loading** | `sections/spy-feature-link-banner.liquid:352`: the iframe is created as soon as the element is parsed | With the poster from A3 in place, create the iframe after `load` + idle, and skip it under Save-Data | Hero video bytes no longer compete with the CSS, fonts and LCP image | S |
| T9 | **Menu promo images download with every phone page** | `Discord2.webp` 46 KB + 13 KB on mobile home. `blocks/spy-menu-promo.liquid` copies the first image into the phone menu with `cloneNode(true)`, and Chrome starts downloading a cloned `<img>` at once, lazy or not (probe: initiator = `place`). The desktop panel copies don't load on phones | Build the phone copy from an inert `<template>`, park its URL in `data-src`, and set it when the menu button is pressed or focused. Desktop unchanged | −59 KB per phone page view until the menu is opened | S |
| T10 | **Dead Liquid on every page** | `layout/theme.liquid:197` loops `collections.all.all_tags` and prints `[ ]` on live. It only matches the `collection::` spelling, while `snippets/spy-group-name.liquid:6-7` lists three spellings in the catalogue (`collection: X`, `collection:X`, `collection::X`). So Rebuy search gets no model names either | Match all three spellings (reuse the `spy-group-name` logic), or drop the loop if search doesn't need it | Correct search model names; less wasted render time | S |

### Suggested order

1. **This week, no code (A1, A3, A5, then A2 when the PM decides):** Brand Agents off, hero posters uploaded, ask Amp about PDP-only loading, accessiBe decision.
2. **One theme PR, no visual change (T1, T2, T3, T5, T6, T9, T10):** about a day with checks at 1440/768/390. It cuts ~350 KB from mobile home and ~60–100 KB from every page, and fixes the collection-page LCP.
3. **Second theme PR (T4, T7, T8):** account popover only on desktop, CSS split and unused Horizon files removed, Vimeo after load. Needs a preview theme and a regression pass.
4. **Re-test** with this suite, plus PageSpeed Insights once there is an API key. Then watch Shopify's Web performance report for 28 days after the DNS switch.

### Theme fix 1: done in the working tree (uncommitted, 4 Nov)

T1, T2, T3, T5, T6 and T9 are in 8 files: `sections/spy-grouped-collection.liquid`, `blocks/_spy-grouped-product-card.liquid`, `snippets/spy-grouped-product-card.liquid`, `snippets/icon-or-image.liquid`, `sections/spy-category-tiles.liquid`, `blocks/spy-menu-promo.liquid`, `assets/spy-drawer.js`, `assets/spy-yotpo-a11y.js`. T10 is left out because it changes what search shows.

**How it was checked (nothing pushed):**
- Theme Check in a clean worktree: 0 offenses in the 8 files.
- LiquidJS: 21/21 checks on the new Liquid logic.
- The exact new output spliced into the live pages in headless Chrome, before vs after, at 390/768/1440 (PDP at 390/1440):

| Check | Before | After |
|---|---|---|
| Footer icons (every page) | 74 KB mobile / 106 KB tablet+desktop | **17 KB / 13 KB**, same 83×72 boxes, icon band looks the same |
| Tile hover art, home phone/tablet | 8 files, 221 KB | **0**. Desktop still loads them, and hover shows the art |
| Menu promo art, phone | 59 KB on load | **0 until the menu opens**, then both load and show (280 px) |
| Collection, card 1 request (unthrottled) | lazy, Low, 4.4–7.1 s | eager, **High**, 1.2–2.9 s |
| Collection, throttled phone A/B (same cached HTML, 3 runs each) | card 1 done 6.0 s, **LCP 6.1 s** | card 1 done 1.7 s, **LCP 3.9 s** |
| PDP drawers (lens tech) | open/close, moved to `<body>` | the same |
| Screenshots top/footer/menu | — | 0 px difference; the only diffs were payment icons still loading and one scroll offset |
| Console | — | no new theme errors; the new ones were Brand Agents/ExpertVoice/closed connections that vary run to run |

**Still to do before it ships:** a real Shopify render. No preview theme (Goran, 4 Nov), so push it live and re-check with the same script. Then re-run the Lighthouse suite.

### Theme fix 2 (4 Nov)

**T4 done (uncommitted), `blocks/spy-utility-nav.liquid`:**
- `<shopify-account>` stays in the server HTML exactly as before, so Shopify still injects `account.js` and `<shopify-store>`.
- A small inline script right after it takes the element out below 992px, before `account.js` can upgrade it. It puts the element back if the screen grows to 992px+.
- In the theme editor it always stays.

Checked by splicing into live home:

| | Phone 390 before | Phone 390 after | Desktop 1440 before | Desktop 1440 after |
|---|---|---|---|---|
| Sign-in chain | 45 req / 191 KB | **4 req / 35 KB** (`account.js` only) | 46 req | 46 req |
| Header screenshot | — | identical | — | identical |
| Click the account icon | — | — | sheet opens | **sheet opens, screenshot identical** |
| Page errors | 0 | 0 | 0 | 0 |

**T7 not done: the "dead" Horizon header CSS is partly alive.**
- 13 files are never rendered: `sections/header.liquid`, `blocks/_header-menu.liquid`, `blocks/_header-logo.liquid`, `snippets/header-drawer.liquid`, `header-actions`, `header-row`, `header-journal`, `menu-font-styles`, `submenu-font-styles`, `mega-menu-list`, `search`, `localization-form`, `link-featured-image`. They hold ~60 KB raw of the render-blocking `compiled_assets/styles.css`.
- A selector check on 8 live page types (361 rules) found **5 rules that reach SPY pages**:
  - `body { --header-height: 60px; --header-group-height; --transparent-header-offset-boolean: 0 }` (`sections/header.liquid`): every `var(--header-height)` reads it.
  - `.account-button { background: transparent }` (`snippets/header-actions.liquid`): stops the colour scheme painting the account icon.
  - `shopify-account { --shopify-account-* … }` (`snippets/header-actions.liquid`): fonts, colours and radii of the account sheet.
  - `header-actions { display: flex }` (`snippets/header-actions.liquid`): Tailwind's `flex` already covers it.
  - `input[type='search']::-webkit-search-cancel-button { appearance: none }` (`snippets/localization-form.liquid`): hides the native × in the search box.
- **To do it:** move those rules into `src/tailwind.css`, rebuild, then delete the 13 files.
- **Waiting** because another session has uncommitted work in `src/tailwind.css` / `assets/tailwind.css` (4 Nov).
- **Rebuy CSS split:** the same `tailwind.css` blocker; also small gain (~7 KB br) against risk to the cart styling.

**T8 not done:** without the hero posters (A3, a Files upload), loading Vimeo after `load` would leave the hero box empty for longer. Do it right after the posters exist.

### B. Bigger items

| # | Finding | Fix |
|---|---|---|
| B1 | **Style & layout on PLP/PDP: 1.8–2.6 s (mobile)**. A collection-page trace with CSS selector stats (its absolute times are inflated by the tracing itself; the ranking holds): **64 style recalcs during load, most re-checking the whole page (~1,250 elements)**. Biggest triggers: Shopify `account.js` (1,266 invalidations, the account popover from T4), Pandectes (596), Shopify pixels (247). All theme scripts together: ~165 | (1) A1/A2/T4 also remove most of the recalc triggers. (2) The costliest selectors are **stock Horizon rules that match nothing on SPY pages** (`.hero__…`, `deferred-media`, `::view-transition-*`, `.group-block__link ~ …`, `.card__link ~ …`), paid on every recalc, so T7's dead-CSS removal cuts recalc time as well as bytes. (3) The costliest SPY rules are the `.product-card:not(:has(.spy-color-swatches)) …` family in `src/tailwind.css`. Replace them with a `product-card--no-swatches` class that Liquid sets (it already knows if swatches render). `:has()` overall is only 12 % of match time |
| B2 | **Fonts are WOFF, not WOFF2** (82 KB preloaded on every page, 4th file on PDPs) | WOFF2 saves ~25 %. The DIN Next LT Pro files have **no clear licence trail** (`reference/fonts/License.txt` is from a free-font site), so get SPY's licensed web kit first, then convert. Also check why `D-DIN-Bold.woff2` loads on home: a glyph missing from DIN Next falls back to it |
| B3 | **Server time** home 330–790 ms, PLP 240–750 ms (`server-timing: processing`). PDP 60 ms, cart 150–210 ms | Profile home and PLP with Shopify Theme Inspector (Chrome extension, needs the admin login). Known suspects: the grouped-card model/colourway loops on the PLP (P7 from September) |
| B4 | **No real-user data yet** | After the DNS switch, watch Admin → Online Store → Themes → **Web performance** (Shopify RUM), then PageSpeed Insights/CrUX after 28 days. Get a free PSI API key so this test can run from Google's servers next time |

## Raw data and how to re-run

- **41 Lighthouse reports + scripts** are in `C:\Users\ADMINI~1\AppData\Local\Temp\claude\bd5268b0c0427138\7fcec730-fea6-42fb-bb12-408ee407e7e6\scratchpad\perf\`. Scratchpads are wiped after about 9 days, so copy them out if you want to keep them.
  - `runs/` is the main suite, `runs-noapps/` and `runs-noaccount/` are the what-ifs, `runs-consent/` is after Accept.
  - `run-lh.mjs` runs the paced suite. It backs off on a 429, uses `BLOCK=` for what-ifs and `CONSENT=1` for the saved consent cookies.
  - `analyze.mjs` gives medians and diagnostics, `who-costs.mjs` the cost per owner, `mainthread.mjs` the main-thread split, and `trace-style.mjs` the CSS selector stats.
- **Traps hit this time:**
  - Git Bash turns a `/collections/…` argument into a Windows path; use `MSYS_NO_PATHCONV=1`.
  - A reused Chrome profile keeps a stray Chrome alive and refuses new runs; use fresh profiles and inject cookies.
  - Lighthouse 13.6 ships its CSS-selector insight switched off.
  - Puppeteer 25 returns the trace as a `Uint8Array`.
