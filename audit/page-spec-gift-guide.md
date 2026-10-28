# Page spec — Gift Guide (`page.gift-guide`) — live: pushed 28 Oct (`cf5daf5`), page published 28 Oct

Source: `https://www.spyoptic.com/us/giftguide.html`, read live on 27 Oct 2026 in a signed-in Chrome.
DataDome shows a slider check to automated browsers, so Playwright could not load it.

The live page is the **2025** guide (every asset is `25-SPY-Digital-GiftGuide-…`). The Dec 2024
version (Wayback `20241207204858`) had another layout, with two banner carousels.

**Measured at 390 / 768 / 1024 / 1440 / 1920.** The Chrome window is maximised and can't be
resized, so each width is a same-origin iframe (CSP `frame-ancestors 'self'`) with the scrollbar
hidden. Media queries and slick respond to the iframe's own width. All numbers come from the DOM.

**Baselines:** `audit/gift-guide/source-390.png`, `source-768.png`, `source-1440.png`, from the top
of the page to the end of the sale banner (value props and footer are global). Hidden for the
capture: the geo "Choose another country" bar (Serbia only, a US visitor never sees it), the
accessiBe button (still visible in the first five 390 shots), back-to-top and the reCAPTCHA badge.
The header shows on the first screen only. Each screen is one 945px capture (1440 in two 720px
halves, because the capture tool caps output at 1366px), stitched with PIL.

## Source construction

SFCC Page Designer: `experience-layouts-1_column` / `2_column` rows holding `assets-banner`, one
`assets-contentAsset` (the category rail) and two `carousel-productCarousel`. These are the same
components the homepage uses, and we already ported all of them.

## Section inventory

`25LP-` = `25-SPY-Digital-GiftGuide-LandingPage-`. "D / M" = image at ≥992 / below 992.
Every banner links as a whole (`.hero-banner-overlay-wrapper` covers it) except band 13.

| # | Band | Source art | Copy → link | Build |
|---|---|---|---|---|
| 1 | Empty banner (0px tall) | — | — | skip |
| 2 | Gift category rail, 7 cards | `25LP-CategoryCarousel-GiftsFor{Him,Her,SnowBums…V4,Motoheads,Watermen,Doers}-387x553px`, `…GiftsUnder100-387x553px` | GIFTS FOR HIM → `/us/mens-sunglasses/` · HER → `/us/sunglasses/womens-sunglasses/` · SNOW BUMS → `/us/goggles/snow-goggles/` · MOTOHEADS → `/us/goggles/motocross-goggles/` · WATERMEN → `/us/sunglasses/fishing-sunglasses/` · DOERS → `/us/sunglasses/safety-sunglasses/` · GIFTS FOR UNDER $100 (sic) → `/us/sale/sunglasses/` | `spy-category-tiles`, 7 × `tile` |
| 3 | Half banners | D/M `25LP-HalfBanner-HappyBoostSun-Desktop-1000x869pxV2` / `…-Mobile-1000x869px`; `…HappyBoostSnow-Desktop-1000x869pxV3` / `…-Mobile-1000x800px` | SHOP HAPPY BOOST SUN → `/us/collections/sunglasses/happy-boost-sun-collection/`; SHOP HAPPY BOOST SNOW → `/us/collections/goggles-ski-snowboard/happy-boost-snow-collection/` | `spy-half-banners` |
| 4 | Full banner | `25LP-Banner-Waypoint-Desktop-1920x600px` / `…-Mobile-800x1200px` | SHOP WAYPOINT → `waypoint-225603.html`; right-centre ≥992, centre below | `spy-feature-link-banner` |
| 5 | Strip | `25LP-Banner-BuyNowPayLater-Desktop-1920x250px` / `…-800x300pxV2` | **black** heading BUY NOW. PAY LATER. + LEARN MORE → `/us/buy-now-pay-later.html`; centre | `spy-feature-link-banner` |
| 6 | Full banner | `25LP-Banner-Flynn-Desktop-1920x600px` / `25-SPY-Digital-GiftGuide-Banner-Flynn-Mobile-800x1200px` | no copy; → `flynn-41881.html` | `spy-feature-link-banner` |
| 7 | Product rail | — | Discord 41876 · Cyrus 171236 · Rebar ANSI 150743 · Overhaul XL 195135 · Region XL 212514 | `spy-product-carousel` |
| 8 | Half banners | `25LP-HalfBanner-Marauder-1000x800pxV3`, `…Megalith-1000x800pxV3` (one file for both widths) | SHOP MARAUDER → `marauder-36615.html`; SHOP MEGALITH → `megalith-145220.html` | `spy-half-banners` |
| 9 | Strip | `25LP-Banner-FreeShipping-Desktop-1920x250px` / `…-Mobile-800x300pxV2` | **black** heading FREE SHIPPING ON ORDERS OVER $50 + LEARN MORE → `/us/shipping/shipping.html` | `spy-feature-link-banner` |
| 10 | Full banner | `25LP-Banner-Waypoint-Apparel-1920x600px` / `25LP-Banner-Apparel-Mobile-800x1200px` | SHOP APPAREL → `/us/gear/apparel/`; centre | `spy-feature-link-banner` |
| 11 | Half banners | `25LP-HalfBanner-Cyrus-Desktop-1000x800px` / `…-Mobile-1000x800px`; `…ANSI-Desktop-1000x800px` (both widths) | SHOP CYRUS → `cyrus-41874.html`; SHOP REBAR → `rebar-ansi-102505.html` | `spy-half-banners` |
| 12 | Product rail | — | Marauder Elite 74507 (price "N/A" on source) · Megalith 145220 · Waypoint 225603 · Marshall 2.0 145219 · Raider 36617 | `spy-product-carousel` |
| 13 | Full banner | `25LP-Banner-Sale-Desktop-1920x600px` / `…-Mobile-800x1200px` | SHOP SUN SALE → `/us/sale/sunglasses/`; centre; **only the button links** | `spy-feature-link-banner`, `link_scope: cta` |
| — | Value props · newsletter · footer | — | — | already global |

**Rail hover art:** each gift card also carries a homepage hover image (HIM → TRAIL-HOVER, HER →
SAFETY, SNOW BUMS → FISHING, MOTOHEADS → LIFESTYLE, WATERMEN → CLASSICS, DOERS → MOTO, UNDER $100 →
SNOW). The page CSS keeps `.hover-image` at `opacity: 0` with no `:hover` rule and no script
handler, so it never shows (checked with a real hover). The gift tiles get no hover image.

## Measurements (1920)

- **Stacking:** rows sit flush (`mb-0`). The rail keeps the homepage's `.rx-landing-container`
  margin `30px 0 -50px`, so the first half banners overlap it by 50px.
- **Rail:** card 80.5 × 110vw (below 769) · 30.242 × 42.944vw (≥769) · **25** × 35.972vw (≥992).
  Image box 88% × 90%, pushed right. Label DIN 600, white, line-height 1, 30px below 992 and
  2.083vw from 992 (40px at 1920). Two arrows; slick `variableWidth`, infinite, speed 200.
- **Banner CTA (all banners):** DIN 14/21 400, uppercase, `#1d2a2b` text and 1px border, white
  fill, square, padding 8 × 32, 150ms ease-in-out. This is our `solid` CTA and the half-banner CTA.
- **Copy box:** padding 16/16/64, and 16 on all sides when the overlay has the *base* class
  `align-items-center` (`.hero-banner .hero-banner-overlay.align-items-center
  .hero-banner-overlay-inner { padding: 1rem }`). Centred here: bands 4, 5, 9, 10, 13.
- **Strip heading:** DIN 28/33.6 600, `#000` from the banner's inline colour, 8px under it.
  The per-banner CSS is `object-fit: cover`, `object-position: 50% 50%` and `aspect-ratio: auto`
  at every width.
- **Half banners:** no channel between them (512 + 512 at 1024, 720 + 720 at 1440), unlike the
  homepage's 30px.
- **Heights:** 1000×869 half art → 828px; 1000×800 → 762px; 1920×600 → 596px; 1920×250 → 249px.

### Product rails — slick config (both rails, read off `getSlick()`)

| Window | Per view | Scroll | Infinite | Centre mode | Arrows | Dots |
|---|---|---|---|---|---|---|
| > 1140 | 5 | 1 | yes | **yes, 50px** | yes (hidden: 5 slides fit) | no |
| 721–1140 | 3 | 3 | no | no | no | no |
| 541–720 | 2 | 2 | no | no | no | no |
| ≤ 540 | 1 | 1 | yes | yes, 50px | yes | **no** |

Speed 500. With 5 slides slick makes no clones, so centre mode above 1140 is just 50px of empty
space at both ends of the list (1920: list 16 → 1889, slides 66 → 1841, 5 × 355). The homepage
rails differ: no centre mode above 1140, dots at ≤ 540, speed 300.

## Per breakpoint (layout width, no scrollbar)

| Band | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Rail card (image) · label · in view | 314×429 (276×386) · 30px · 1 + peek | 618×845 (544×760) · 30px · 1 + peek | 256×368 (225×332) · 21.3px · 4 | 360×518 (317×466) · 30px · 4 |
| Half banners | stacked, mobile art · 390×339 / 390×312 | stacked, mobile art · 768×667 / 768×615 | side by side, desktop art · 512×445 / 512×410 | 720×626 / 720×576 |
| Full banners | 390×585 (portrait art), CTA centred | 768×1152 (portrait art), CTA centred | 1024×321, Waypoint CTA right with 15px gutter | 1440×451 |
| Strips | 390×147, heading 23.1px | 768×289, 25.4px | 1024×134, 26.9px | 1440×188, 28px |
| Product rail | one 290px card centred, 50px peeks, arrows | 3 × 266px, no arrows, track hangs 15px past both edges | 3 × 331px, 16px inset, no arrows | 5 × 262px, 50px space at both ends, 16px inset, no arrows |
| Content height (to end of sale banner) | 5869 | 10621 | — | 5334 |

- **768 is still the mobile band.** The rail changes at 769 and the art at 992, so a 768 tablet
  gets the huge 80.5vw cards and the 800×1200 portrait banners.
- **The rail settings are the homepage's, unchanged** (`spy_category_tiles_npxaN3`): 80.5/110 ·
  30.242/42.944 · 25/35.972vw, image 88/90%, margins 30/-50, speed 200, arrows 1vw, heading font
  600 at 30px → 2.083vw. `spy-category-tiles` switches at the same 769 / 992.
- **The strip heading is Bootstrap RFS**, `calc(1.3rem + 0.6vw)` capped at 28px.
  `spy-feature-link-banner` → `heading_fluid` already renders `min(28px, calc(1.3rem + 0.6vw))`
  at every width. The free-shipping heading wraps to two lines at 390.
- **Art swap:** `spy-banner-picture` and `spy-half-banners` change at 992, same as the source.
- **Product rail below 992:** the source track hangs 15px past the viewport. The homepage spec keeps
  this as a deliberate deviation (`track_inset_mobile: 0`), so the gift guide does the same.
- **Content heights** are with the geo bar hidden (it adds 127px at 390). The old 7429 / 10927 /
  6317 readings were whole documents, partly before lazy art had loaded.

## Code changes (no new section or block)

1. `spy-feature-link-banner` → **Heading colour** setting (`heading_color`, empty = white as
   before). Bands 5 and 9 use `#000000`.
2. `spy-feature-link-banner` → the copy box drops to 16px at the bottom when the **mobile**
   vertical placement is centre, like the source rule. No existing banner uses mobile centre
   (homepage bottom/bottom, Watermen and ANSI footers centre/bottom), so nothing else moves.
3. `spy-product-carousel` → **Space at both ends (above 1140px)** (`peek_desktop`, default 0):
   track padding plus matching scroll padding from 1141px. The gift guide uses 50; the homepage
   rails stay at 0.
4. `spy-feature-link-banner` → a banner with no eyebrow, heading or CTA takes the image file's
   alt as its alt and link name. Fixes the source gap where the Flynn link has no name. Banners
   with copy are unchanged.
5. `spy-category-tiles` → the art only fades out on hover when the tile has a hover image. Before,
   it always faded, so a tile without one went blank (slate) on hover. Every real homepage tile has
   a hover image, so the homepage is unchanged; the gift tiles now hold still like the source.
6. `src/tailwind.css` → `.spy-product-carousel .product-card .spy-tile-body` gets 24px bottom
   padding at every width, like the Watermen rule above it. The source's carousel tiles have no
   rating or Compare row (`.tile-body` 10/8/24, measured on the gift guide at 1440), but our card
   kept the PLP's 32/40. **This also moves the homepage rails:** New Arrivals at 1440 goes from 423
   to 407, and the homepage spec measured the source at 407.6.

`templates/page.gift-guide.json` is generated from the homepage's own section JSON (rail settings,
banner settings, carousel card block tree), so it stays in step with what is live. It also has a
`custom-liquid` section at the top with a visually hidden `<h1>{{ page.title }}</h1>`, because the
source has no h1.

## Store data (not code)

- **Images — imported 27 Oct:** `audit/gift-guide-images.csv` lists the 28 files the template
  expects, each with its spyoptic.com original (`/on/demandware.static/…/dw<version>/giftguide/<file>`)
  and alt text. All 28 went in with `fileCreate` (`originalSource` = that URL, `alt`), are READY,
  and their names match the template's `shopify://shop_images/…` references one for one.
- **Preview theme:** `Gift guide preview - delete me` (`OnlineStoreTheme/189998596403`), a copy of
  `spy-v2/main` with the four changed Liquid/JSON files and a clean CSS build (HEAD + change 6 only).
  View `/pages/shipping?view=gift-guide&preview_theme_id=189998596403` (the real page is hidden).
  Delete it in the admin after review.
- **How the store writes were done:** `shopify store execute` with the stored CLI store login.
  It had no file or theme scopes at first; `shopify store auth` added `read/write_files` and
  `read/write_themes` on 27 Oct.
- **Page — created 27 Oct hidden, published 28 Oct** on Goran's word ("this page is good"):
  `gid://shopify/Page/162887008563`, handle `gift-guide`, title `Gift Guide`, template suffix
  `gift-guide`. `/pages/gift-guide` answers 200 on the live store. The open links below still 404.
- **Rail 1 → collection `gift-guide-sunglasses` — created 27 Oct** (`Collection/514458059059`,
  manual sort, on the Online Store, `seo.hidden = 1` so it stays out of search and the sitemap), all
  live: `spy-discord-soft-matte-black-sunglasses`, `spy-cyrus-soft-matte-black-sunglasses`,
  `spy-rebar-ansi-matte-black-sunglasses`, `spy-overhaul-xl-soft-matte-black-sunglasses`,
  `spy-region-xl-soft-matte-black-sunglasses`. The source tiles show the Happy Boost Polar Black
  Mirror lens of each.
- **Rail 2 → collection `gift-guide-goggles` — created 27 Oct** (`Collection/514458091827`, same
  setup). All five live since 28 Oct: the four goggles (October new-product batch) were published
  to the Online Store only on Goran's word; Waypoint is also on Point of Sale:
  `spy-marauder-elite-spy-eric-jackson-happy-bronze-black-spectra-mirror-happy-ll-gray-green-red-spectra-mirror-snow-goggles`
  (source: SPY+ Eric Jackson with Happy Boost lenses; no exact lens match),
  `spy-megalith-speedway-dusk-happy-ml-rose-with-black-mirror-and-happy-ll-yellow-snow-goggles`,
  `spy-waypoint-everblack-sunglasses`,
  `spy-marshall-2-0-everblack-happy-boost-bronze-with-ice-blue-mirror-snow-goggles`,
  `spy-raider-matte-black-ml-rose-with-red-mirror-snow-goggles`.
- **Link targets on the live store (27 Oct):**

  | Link | Target used | Status |
  |---|---|---|
  | Rail: him, her, snow bums, motoheads, watermen, doers | `mens-sunglasses`, `womens-sunglasses`, `snow-goggles`, `moto-goggles`, `fishing-sunglasses`, `safety-sunglasses` | live |
  | Rail: under $100, sale banner | `/collections/sale-sunglasses` | 404, Sale tree not created |
  | Happy Boost Sun | `happy-boost` (what the header menu uses) | live, 1 product |
  | Happy Boost Snow | `/collections/happy-boost-snow` (header menu) | 404 |
  | Waypoint, Marauder, Cyrus, Rebar, Flynn | the model's first colourway PDP | live |
  | Megalith | `/collections/megalith` | 404, no Megalith product live |
  | Buy now pay later | `/pages/buy-now-pay-later` | 404, page not created |
  | Free shipping | `pages/shipping` | live |
  | Apparel | `gear` (no apparel collection; Gear holds the tees, hats, beanies) | live |

  Targets that don't exist yet are plain paths, so they start working once created.
- **Free shipping copy:** the source strip says "$50". The store's rate rule is free from $70
  (the footer says $50, the PDP trust row $100). Copied as is; the threshold is the client's call.
- **Redirects added to `audit/redirect-urls.csv`** (Pending like all 52 rows: none is created in
  Shopify yet, they go in at cutover): `/us/giftguide.html` → `/pages/gift-guide`, `/us/gear/apparel/` →
  `/collections/gear`, `/us/buy-now-pay-later.html` → `/pages/buy-now-pay-later`. The existing
  PDP rows still point at placeholder handles (`/products/waypoint` etc.), not the real ones.
- Source accessibility gaps, not copied: no `h1`, `alt=""` on every banner image, the Flynn link
  has no accessible name.

## Verification — 27 Oct, preview theme, its own CSS

Screenshots: `audit/gift-guide/theme-{390,768,1440}.png`, same frame as the source baselines
(page top to the end of the sale banner). Consent popup declined before each shot.

| | 390 | 768 | 1440 |
|---|---|---|---|
| Rail card · image · label · in view | 314×429 · 276×386 · 30px · 1 ✓ | 618×845 · 544×760 · 30px · 1 ✓ | 360×518 · 317×466 · 30px · 4 ✓ |
| Half banners | 390×339 / 312 ✓ | 768×667 / 614 (source 615, rounding) | 720×626 / 576, no gap ✓ |
| Full banners · strips | 585 · 147 ✓ | 1152 · 289 ✓ | 451 · 188 ✓ |
| Strip heading · copy box padding | #000 23.14px 600 · 16 ✓ | #000 25.41px 600 · 16 ✓ | #000 28px 600 · 16 ✓ |
| Waypoint CTA | centred ✓ | centred ✓ | right edge 1425 (15px gutter) ✓ |
| Product rail | 290px card, 50px peeks, arrows, no dots ✓ | 3 × 256 (source 266: no 15px hang, on purpose) | 5 × 262, 50px space at both ends, 16px inset ✓ |
| Rail height (source) | 414 (≈412) | 380 (≈386, narrower cards) | 387 (391) |
| Content height (source) | 5875 (5869) | 10607 (10621) | 5321 (5334) |

- The 1440 rail gap (4px) is the source's Discord tile carrying a label slot (it is on sale there,
  `.tile-labels-container` 50.9 vs our 48). Data, not layout.
- Hover: the gift tiles keep their art (opacity 1); homepage tiles still swap (0 / 1).
- Flynn link name and image alt = the file's alt. One hidden `h1`.
- Console: no errors from theme assets. The rest is third-party noise (shop.app frame CSP,
  adsagent 429s, accessiBe config 404).
- axe-core 4.10.3, WCAG 2.1 A/AA, gift guide sections only: **0 violations** at 1440 and 390.
  "Needs review" is only text laid on photos (white tile labels, strip headings), which axe can't
  measure; same as the source and the homepage tiles.
- Card content differs where the store data does: Cyrus shows its gold-lens photo, prices are the
  store's ($150 Discord vs the source's $105 sale), and colour labels read the colourway name
  because each curated collection holds one colourway per model.

## Open

- ~~Push~~ done 28 Oct (`cf5daf5`), verified on the live theme.
- ~~Publish the page~~ done 28 Oct 02:25 UTC; `/pages/gift-guide` answers 200 on the live store.
- ~~Publish the four rail-2 goggles~~ done 28 Oct (Online Store); the rail shows all five, PDPs 200.
- Missing link targets (sale tree, `happy-boost-snow`, `megalith`, `/pages/buy-now-pay-later`) and
  the $50 free-shipping copy against the $70 rule: client decisions.
- Delete the preview theme `189998596403` after review.
- Will SPY refresh the guide for 2026? If the 2024-style banner carousel comes back (autoplay
  3s/5s, dots, no arrows, separate D/M art), Horizon `slideshow` / `_slide` needs a mobile-image
  setting. That is still not a new section.
