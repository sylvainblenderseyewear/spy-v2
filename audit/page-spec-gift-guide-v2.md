# Page spec — Gift Guide 2026 (`page.gift-guide-v2`) — code ready, store data pending

Source: `https://www.spyoptic.com/us/` (the US homepage now *is* the 2026 holiday gift guide), read on
11 Nov 2026 with curl (the HTML is server-rendered, so no browser is needed for structure). Every asset
is `…/giftguide/<n>-SPYHGG26-…`. v1 (`page.gift-guide`, 2025 guide) stays untouched.

## What changed from v1 (2025)

- **No copy on any banner.** Headline + "SHOP NOW" are baked into the art. Every banner is image only,
  and the whole banner is the link (incl. Sale, which was CTA-only in 2025).
- **New hero** on top: Crosspoint launch, 1920×800 desktop / 800×1200 mobile.
- **Category rail:** labels now baked into the art (label field empty), 7 tiles (Him, Her, Snow, Moto,
  Fishing, Safety, Under $100). The rail sits on a **background image** (1920×1080 PNG, cover, centre)
  with **top padding = 10% of the card height**, and its margins are now **0 / 0** (2025: 30 / −50).
  Hover art is still commented out on the source: no hover.
- **Strips gone** (Buy now pay later, Free shipping) and the Apparel / Flynn banners are gone.
- **Product rails = the homepage config:** no centre mode above 1140, dots at ≤540, slick default
  speed 300. Rail 1 has no arrows at 541–1140; rail 2 has arrows there.
- All half banners are 1000×800 (no more 1000×869).

## Section inventory

| # | Band | Art (D ≥992 / M) | Link (source → ours) | Section |
|---|---|---|---|---|
| 1 | Hero | `00-Desktop-CrosspointLaunch-FullBanner-1920x800` / `00-SPYHGG26-Mobile-FullBanner-CrosspointLaunch-800x1200` | `crosspoint-264965.html` → `/collections/snow-goggles` **(placeholder, product handle TBC)** | `spy-feature-link-banner` |
| 2 | Category rail | `{1..7}-SPYHGG26-CategoryCarousel-{ForHim,ForHer,ForSnow,ForMoto,ForFishing,ForSafety,Under100}-387x553v2` + background | same targets as v1 | `spy-category-tiles` |
| 3 | Half | `1-…HalfBanner-Sun` / `2-…HalfBanner-Snow` (D + M) | `/us/sunglasses/` → `sunglasses`; `/us/goggles/snow-goggles/` → `snow-goggles` | `spy-half-banners` |
| 4 | Full | `3-Desktop-MurdrdOut-FullBanner-1920x600` / `3-…Mobile-FullBanner-MurdrdOut-800x1200` | Murdered Out collection → `/collections/murdered-out-collection` | `spy-feature-link-banner` |
| 5 | Product rail | — | Cyrus Switch 257654 · 257652 · 257655 · Bowery 267070 · 267071 → collection `gift-guide-26-lifestyle` | `spy-product-carousel` |
| 6 | Half | `4-Desktop-Discord-HalfBanner` / `4-…Mobile-HalfBanner-Discord`; `5-Desktop-Cyrus-HalfBanner` / `5-…Mobile-HalfBanner-Discord-1000x800 copy` (renamed `5-SPYHGG26-Mobile-HalfBanner-Cyrus-1000x800.jpg`) | Discord, Cyrus PDPs (v1 handles) | `spy-half-banners` |
| 7 | Full | `6-Desktop-Waypoint-FullBanner-1920x600` / `6-…Mobile-FullBanner-Waypoint-800x1200` | Waypoint PDP | `spy-feature-link-banner` |
| 8 | Product rail | — | Mainline ANSI 257647 · Overhaul XL 212609 · Overhaul 249301 · Region 249296 · Rebar ANSI 184197 → collection `gift-guide-26-performance` | `spy-product-carousel` |
| 9 | Half | `7-…HalfBanner-Megalith` (D + M); `8-…HalfBanner-Helmets` (one file both widths) | `/collections/megalith`; `/collections/snow-helmets` | `spy-half-banners` |
| 10 | Full | `9-…Desktop-FullBanner-Sale-1920x600` / `9-…Mobile-FullBanner-Sale-800x1200` | `/us/sale/sunglasses/` → `/collections/sale-sunglasses` | `spy-feature-link-banner` |
| — | Value props · footer | — | — | global |

Banner image CSS on the source: `object-fit: cover`, `aspect-ratio: auto` (natural height), swap at 992.
The Sun half banner has `object-position: 47% 47%` at ≥992, but with no crop it has no visible effect.

## Code changes

1. `spy-category-tiles` → **Background image** (`background_image`) and **Space above the cards**
   (`padding_top_ratio`, % of card height, default 0). Rendered as a lazy/eager `<img>` (cover, centre),
   padding = `card height × ratio` per breakpoint (769 / 992). Defaults leave the homepage unchanged.
2. `templates/page.gift-guide-v2.json` — generated from v1 (same card block tree, same banner
   settings), with the 2026 content above. Hidden `h1` kept.
3. `npm run build:css` — only the three new padding utilities were added.

## Store data

- **Done 11 Nov:** the 27 files in `audit/gift-guide-v2-images.csv` imported with `fileCreate`
  (`originalSource` = URL, `filename` = first column, `alt` = third column). All READY, names match
  the template one for one. Store auth renewed the same day (`shopify store auth`).
- **Source → store colourways** (from each tile's `data-datalayer` `item_variant`):

  | Source PID | Source variant | Store handle |
  |---|---|---|
  | 257654 | Cyrus Switch matte black, HGG & HGG black mirror | `spy-cyrus-switch-matte-black-happy-gray-green-happy-gray-green-with-black-mirror-sunglasses` |
  | 257652 | Cyrus Switch matte black, HGG & bronze gold mirror | `spy-cyrus-switch-matte-black-happy-gray-green-happy-bronze-with-gold-mirror-sunglasses` |
  | 257655 | Cyrus Switch translucent gunmetal, blue mirror | `spy-cyrus-switch-translucent-gunmetal-happy-gray-happy-gray-green-with-blue-mirror-sunglasses` |
  | 267070 | Bowery black II, happy gray polar | `spy-bowery-gloss-black-sunglasses` (YS062001, Murdered Out Black) |
  | 267071 | Bowery matte black II, happy gray polar | `spy-bowery-matte-black-happy-gray-polar-murdered-out-black-sunglasses` (YS062002) |
  | 257647 | Mainline ANSI matte gray, Boost polar ice blue | `spy-mainline-ansi-ansi-rx-matte-gray-sunglasses` |
  | 212609 | Overhaul XL matte gray, Boost polar ice blue | `spy-overhaul-xl-matte-gray-sunglasses` |
  | 249301 | Overhaul ANSI matte gray, Boost polar ice blue | `spy-overhaul-ansi-matte-gray-sunglasses` |
  | 249296 | Region ANSI matte gray, Boost polar ice blue | `spy-region-ansi-matte-gray-sunglasses` |
  | 184197 | Rebar ANSI matte black, Boost polar ice blue | `spy-rebar-ansi-matte-black-happy-boost-polar-with-ice-blue-mirror-sunglasses` |

- **Crosspoint is not in the store** (no product by title, handle or SKU). The hero links to
  `/collections/snow-goggles` until it is added.
- `murdered-out-collection` and `snow-helmets` exist. `megalith` and `sale-sunglasses` still don't
  (same as v1).
- Still to do: create the hidden collections `gift-guide-26-lifestyle` and `gift-guide-26-performance` (manual sort,
  Online Store, `seo.hidden = 1`) with the products above, if they exist in the store.
- Find the real handles for Crosspoint (hero link), Cyrus Switch, Bowery, Mainline ANSI and check
  `murdered-out-collection` / `snow-helmets` exist.
- Create a hidden page with template suffix `gift-guide-v2` for preview, then verify at 1440 / 768 / 390
  against source baselines (Chrome: enable *View › Developer › Allow JavaScript from Apple Events*, since
  DataDome blocks Playwright).
