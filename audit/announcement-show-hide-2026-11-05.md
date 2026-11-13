# Announcement bar: when it shows and when it hides (5 Nov 2026)

The block is "🔥 CHECK OUT THE SALE SECTION ✕". On the old site it is `section.preheader`. Ours is
`sections/header-announcements.liquid` + `blocks/_announcement.liquid`.

## Old site (sample) logic

This comes from the menu module in the source `main.js`. The code is the same in every saved copy
under `reference/` (22 Jul – 28 Aug), and the 21 Oct review saw the same behaviour live
(`announcement-action-review-2026-10-21.json`).

```js
// de-minified; runs inside $(document).ready
var dismissed = sessionStorage.getItem('hide_header_banner'); // read once per page
$('.preheader .promo-banner_close').on('click', function () {
  $('.preheader').addClass('d-none').parents('body').removeClass('banner-promo_active');
  sessionStorage.setItem('hide_header_banner', '1');
  setMainPadding(); // .main-content padding-top = header bands' heights
});
$(window).on('load', function () {
  if (!dismissed || dismissed < 0) {
    $('.preheader').removeClass('d-none').parents('body').addClass('banner-promo_active');
    setMainPadding();
  }
});
```

1. The server sends the bar hidden: `<section class="preheader d-none">`. Load never adds `d-none`,
   so the server copy must already carry it, or a closed bar would come back on the next page.
2. The bar only appears on `window` `load`, after every image and script has finished. Then the
   content moves down by the bar height (40 / 48 / 56px).
3. ✕ hides it at once and stores `hide_header_banner = "1"`. The content moves up.
4. There is one key for the whole site, not one per message.
5. The 404 page uses the slim header and never has the bar.

## Old site today

- **The bar is gone.** No `preheader` in the server HTML of `/us/`, `/us/sunglasses/`, the Cyrus
  Switch PDP or `/us/cart`, and none in the homepage DOM after load.
- The live `main.js` (version stamp 5 Nov 2026 16:44 UTC) has no `hide_header_banner`,
  `promo-banner` or `preheader` code. 16 old CSS rules are still there.
- The header is new: a search field in the top row, plus Sign in and the cart. The only dismissible
  bar left is the country banner (`sessionStorage.hideRedirectionBanner`).
- So the old bar can't be tested live any more. The baseline is the saved code above.
- One homepage load in Goran's Chrome: first paint 1.7 s, DOMContentLoaded 5.4 s, `load` 41.7 s.
  With the old logic, the bar would only have appeared at 41.7 s. This is a single sample.

## Current logic

- The bar is in the server HTML, so it is visible from the first paint.
- An inline script right after it checks `sessionStorage['spy-ann-dismissed-' + section.id]`. If the
  key is set, it hides the bar and its background before the header offset is measured. The script
  is skipped in the theme editor.
- ✕ hides both and sets the key to `"1"`. `--spy-header-offset` follows through the ResizeObserver in
  `layout/theme.liquid` (90 → 50px).
- Live key: `spy-ann-dismissed-sections--27218397462835__header_announcements_WXA98z`.
- No script re-renders the header group: cart, facets and the colour switch only morph cart or
  `main` sections. So once closed, the bar can't come back on the same page.

## Cases

Current was tested live on 5 Nov in Goran's Chrome (theme 188282798387 `spy-v2/main`). Old comes
from the saved code, because the live site no longer has the bar.

| Case | Old site (by code) | Current (tested) |
|---|---|---|
| First page view in a new tab | Hidden at first. Appears only when the page has fully loaded, then the content jumps down | Visible from the first paint. No jump |
| Click ✕ | Hides at once, flag stored | Hides at once, flag stored, header 90 → 50px |
| F5 after ✕ | Stays hidden (never shown) | Stays hidden. No flash, no header layout shift |
| Ctrl+Shift+R after ✕ | Stays hidden | Stays hidden |
| Other pages in the same tab | Stay hidden | Stay hidden (home → PLP → PDP) |
| Back after ✕ | Stays hidden when the page reloads. A page restored from the back/forward cache shows it again (no `pageshow` check) | Stays hidden. Fixed 5 Nov, see below |
| Link opened with Ctrl+click | Shows again (new tab = new session) | Shows again |
| New tab, new window, browser restart | Shows again | Shows again |
| Click the message link | Navigates; the bar stays (not a dismiss) | Same |
| Scroll | Stays pinned in the fixed header | Stays pinned in the sticky header group |
| 404 | Not rendered (slim header) | Not rendered (`header-404-group`) |
| Theme editor | n/a | Always shown, even after ✕ |
| Site data blocked (rare) | Never shows: `sessionStorage` throws and stops the menu script | Shows. ✕ hides it for that page only; it is back after every refresh |
| Mobile / tablet | Same rules | Same rules |

## Differences and decisions

1. **When it appears.** Old: only after the full page load, so it pops in late and pushes the
   content down. Current: at once. Keep ours, because copying the delay would only add layout shift.
2. **Key.** Old: one global `hide_header_banner`. Current: one key per section. With a single bar,
   users see the same behaviour.
3. **The old site no longer has the bar.** Goran decides whether to keep it on Shopify or switch the
   section off in the theme editor (no code).
4. **Link target (updated 13 Nov).** The link is now `/collections/sale`, set in the theme editor on
   10 Nov at 18:01 UTC. The `sale` collection was created and put on the Online Store on 10 Nov at
   00:33 UTC, but it has 0 products (Admin API, 13 Nov), so the bar opens an empty page. Adding
   products is catalog work, not theme. `/collections/sale-sunglasses` still doesn't exist. Since
   01a9c7f (6 Nov), a block with no link shows plain text instead of the `/collections/sunglasses`
   fallback.

## Update, 13 Nov: "the bar disappears when I click the link"

- On 10 Nov, from about 01:05 to 18:01 UTC, the link was `/collection/sale`, with the "s" missing.
  That path is always a 404.
- The 404 page uses `header-404-group` (logo only), so it has no bar (`layout/theme.liquid`). The
  click looked like "the page refreshes and the bar is gone", but it was not a dismiss. Nothing was
  stored, so the bar was back on the next normal page.
- The 18:01 UTC theme editor save fixed it. The live `sections/header-group.json` (`spy-v2/main`,
  updated 18:01:47 UTC) was read through the Admin API on 13 Nov. The click was not re-tested live,
  because the store password is on.

## Fix: Back from the back/forward cache (5 Nov, committed in 8674aaf)

- **Problem.** Shopify sends shoppers `Cache-Control: private, max-age=0, must-revalidate` (checked on
  Blenders, same platform; SPY is behind the password). With no `no-store`, browsers can keep a page
  in the back/forward cache, and Safari on iPhone does this often. Example: the bar is visible on
  page A, the shopper opens B, closes the bar there, then presses Back. A comes back exactly as it
  was left, with the bar showing. The admin session in Goran's Chrome gets `no-store`, so the live
  check above could not show this.
- **Fix.** The first-load check is now `restore()`, and a `pageshow` listener runs it again when
  `e.persisted` is true. It still skips the theme editor.
- **Test.** `ann-dismiss.test.cjs` (session scratchpad) takes the real script from the section and
  serves two pages with Shopify's header. It runs in Chrome 156 headless (Playwright's
  `--disable-back-forward-cache` removed) and in WebKit:
  - Before the fix, Chrome restored A from the cache and the bar was visible (`hidden:false, h:40`).
  - After the fix: 15 passed, 0 failed. That covers first view, close, reload, next page, new tab,
    theme editor, Back from the cache, and no script errors.
  - Playwright's WebKit build did not use its page cache, so the Back case is inconclusive there.
  - The error check was proven on a deliberately broken copy.
- No markup or class changed, so nothing changes visually.
