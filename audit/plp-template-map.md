# PLP page template + product card: spyoptic.com vs our store (31 Oct 2026)

**Old site:** all 55 category URLs in the live spyoptic.com nav, fetched in Goran's Chrome. Page shell = children of
`section.main-content`. Tiles sorted by `.swatches-label`: "N colors available" = **model tile**, a colour name =
**colourway tile**. Categories with more than 24 products were counted in full through `Search-UpdateGrid` (sz=600).
**Our store:** live main menu (Admin API), each collection's `templateSuffix`, and the live page. The section IDs tell the
template apart, and `product-card.spy-grouped-card` is the model card. Nothing was changed.

## 1. Page template

**spyoptic.com uses ONE page template for every category.** That covers all 55, including the curated Collections and all
of Sale. There are no Page Designer or story layouts:

1. Hero banner (`.category-banner`): image on 47 of 55, title only on Discord Series, Helm Series, Shirts, Hats and
   Beanies, Crypto and the 3 Sale Eyeglasses pages
2. Breadcrumb + intro copy with Read more (most product-type categories; none on the Collections and Sale sub-pages)
3. Filters: Category, Color, Price (+ Lens Category when the products have it). Sort: Most Popular / Price Low to High /
   Price High to Low
4. Grid: up to 4 columns (4 from 1460px), 1 on phone; 24 per page + "More Results"
5. Category cross-links row (`ul.seo-categories`)
6. Bottom SEO copy (only Sunglasses, Snow Goggles, Blue Light Glasses)
7. Compare bar on every page + a Compare checkbox on every tile

**Ours has three collection templates:**

| Template | Sections | Card | Used by (main menu) |
|---|---|---|---|
| `collection` (default) | hero → breadcrumbs + intro → grid with filters, sort, 24/page, More results, cross-links → SEO → Quick View modal | standard card (one per colourway) | 24 collections |
| `collection.grouped-plp` | same page; the grid is `spy-grouped-collection` | grouped card (one per model) | 4: sunglasses, mens-sunglasses, polarized-sunglasses, snow-goggles |
| `collection.story` | story hero + body → breadcrumbs → grid → SEO → Quick View → compare bar | a third card: Horizon swatches + colour count + Quick view + Compare | **none** |

- `collection` and `collection.grouped-plp` follow the old page section for section. The one gap: **no Compare** (no
  checkbox, no bar). Compare exists only in the unused story template, although open-decisions.md #3 says "Keep — build
  1:1 custom".
- `collection.story` matches no page on the old site. The old curated pages (Happy Boost, Discord, Helm, Trail, Flag…)
  are plain PLPs. The Phase 0 sitemap's "Collection – Curated → `collection.story`" was a guess that the live site doesn't
  confirm.

## 2. Product card

**spyoptic.com has one tile (`.product-tile`) with two modes.** The mode is set by what is assigned to the category, not
by the category itself:

- **Model tile** (a master is assigned): "N colors available", up to 4 swatches + arrow, model name, "Starting from"
  price.
- **Colourway tile** (a variation group = frame + lens is assigned): frame colour name, 1 swatch, that colourway's own
  price.
- Both modes have Quick view, Compare, stickers and the sale badge.
- A parent category also lists what its subcategories hold. So Sunglasses shows all 55 models as model tiles plus 37 extra
  colourway tiles from Fishing/Polarized, and Eyeglasses shows 80 model tiles plus 17 Screen/Gaming colourways. Snow
  Helmets and Blue Light list every model twice: one model tile + one tile per colourway.

**Ours:**
- The model tile = the grouped card (`_spy-grouped-product-card`, `card_per: model`).
- The colourway tile = the standard Horizon card (`_product-card` + spy blocks). It is one card per frame product (its first
  available variant), whereas the old tile is one per frame + lens.
- Neither card has Compare.

## 3. Per-PLP map

Old tiles = model / colourway, counted over the whole category.

| Our menu item | spyoptic.com | Old tiles | Old card | Our collection | Template now | Card now | Match |
|---|---|---|---|---|---|---|---|
| Sunglasses | /us/sunglasses/ | 55 / 37¹ | Model | sunglasses | grouped-plp | Model | ✓ |
| › Men's Sunglasses | /us/mens-sunglasses/ | 33 / 0 | Model | mens-sunglasses | grouped-plp | Model | ✓ |
| › › Polarized | …/mens-sunglasses/polarized/ | 1 / 44 | Colourway | polarized-sunglasses (1 product) | grouped-plp | Model | ✗ |
| › › Wraps | …/mens-sunglasses/wraps/ | 14 / 0 | Model | wrap-sunglasses | default | Colourway | ✗ |
| › › Shields | …/mens-sunglasses/shields/ | 5 / 0 | Model | shield-sunglasses | default | Colourway | ✗ |
| › Women's Sunglasses | …/womens-sunglasses/ | 16 / 8 | Mostly model | womens-sunglasses | default | Colourway | ✗ |
| › › Polarized | …/womens-sunglasses/polarized/ | 1 / 9 | Colourway | womens-polarized-sunglasses (0 products) | default | Colourway | ✓ (empty) |
| › › Shields | …/womens-sunglasses/shields/ | 1 / 4 | Colourway | womens-shield-sunglasses | default | Colourway | ✓ |
| › Safety (+ ANSI)² | …/safety-sunglasses/ | 10 / 0 | Model | safety-sunglasses | default | Colourway | ✗ |
| › Fishing | …/fishing-sunglasses/ | 0 / 37 | Colourway | fishing-sunglasses | default | Colourway | ✓ |
| › Sunglass Accessories | …/sunglass-accessories/ | 15 / 0 | Model | sunglass-cases³ | default | Colourway | ✗ |
| › › Replacement Lenses | …/sunglass-accessories/replacement-lenses/ | 12 / 0 | Model | replacement-lenses | default | Colourway | ✗ |
| › › Sunglass Cases | …/sunglass-accessories/sunglass-cases/ | 2 / 0 | Model | sunglass-cases³ | default | Colourway | ✗ |
| Goggles | /us/goggles/ | 36 / 0 | Model | goggles | default | Colourway | ✗ |
| › Snow Goggles | …/snow-goggles/ | 23 / 0 | Model | snow-goggles | grouped-plp | Model | ✓ |
| › › Replacement Lenses | …/snow-goggles/replacement-lenses/ | 9 / 0 | Model | snow-replacement-lenses | default | Colourway | ✗ |
| › Motocross Goggles | …/motocross-goggles/ | 13 / 0 | Model | moto-goggles | default | Colourway | ✗ |
| › › Youth | …/youth-motocross-goggles/ | 0 / 6 | Colourway | youth-motocross-goggles | default | Colourway | ✓ |
| › › Replacement Lenses | …/motocross-goggles/replacement-lenses/ | 2 / 0 | Model | replacement-motocross-goggle-lenses | default | Colourway | ✗ |
| › › Accessories | …/motocross-goggle-accessories/ | 6 / 0 | Model | motocross-goggle-accessories | default | Colourway | ✗ |
| Snow Helmets | /us/snow-helmets/ | 4 / 23⁴ | Both | snow-helmets (1 product live) | default | Colourway | ≈ |
| Eyeglasses | /us/eyeglasses/ | 80 / 17¹ | Model | eyeglasses | default | Colourway | ✗ |
| › Men's Eyeglasses | …/mens-eyeglasses/ | 57 / 0 | Model | eyeglasses (shared) | default | Colourway | ✗ |
| › Women's Eyeglasses | …/womens-eyeglasses/ | 42 / 0 | Model | eyeglasses (shared) | default | Colourway | ✗ |
| › Blue Light Glasses | …/blue-light-glasses/ | 12 / 17⁴ | Both | blue-light-glasses | default | Colourway | ≈ |
| › › Happy Gaming / Happy Screen | …/happy-gaming/, …/happy-screen/ | 6 / 0, 5 / 0 | Model | blue-light-glasses (shared) | default | Colourway | ✗ |
| Gear | /us/gear/ | 8 / 0 | Model | gear | default | Colourway | ✗ |
| › Apparel, Shirts, Hats and Beanies | /us/gear/apparel/… | 7, 2, 5 / 0 | Model | gear (shared) | default | Colourway | ✗ |
| › Accessories | /us/gear/accessories/ | 0 / 14 | Colourway | sunglass-cases³ | default | Colourway | ✓ card |
| Collections › Happy Boost™ Sun | …/happy-boost-sun-collection/ | 0 / 23 | Colourway | happy-boost (1 product) | default | Colourway | ✓ |
| › Discord Series | …/discord-series/ | 6 / 0 | Model | discord⁵ | default | Colourway | ✗ |
| › Helm Series | …/helm-series/ | 0 / 14 (+3 lenses) | Colourway | helm⁵ | default | Colourway | ✓ |
| › Flag Collection | …/flag-collection/ | 0 / 3 | Colourway | flag-collection | — | — | 404 |
| › Murdered Out | …/murdered-out-collection/ | 0 / 6 | Colourway | murdered-out-collection | default | Colourway | ✓ |
| › Happy Boost™ Snow | …/happy-boost-snow-collection/ | 0 / 10 | Colourway | happy-boost-snow | — | — | 404 |
| › SLAYCo | …/slayco-by-axell-hodges/ | 1 / 3 | Colourway | discord-slayco (1 product) | default | Colourway | ✓ |
| Sale + 9 sub-links | /us/sale/… | 0 / 8–128 | Colourway | sale, sale-* | — | — | 404 ×10 |
| (not in our menu) Trail, Classics, Lifestyle | /us/collections/sunglasses/… | 0 / 19, 0 / 21, 0 / 61 | Colourway | — | — | — | missing |
| (not in our menu) Crypto | /us/collections/spy-merch/crypto-collection/ | 1 / 0 | Model | — | — | — | missing |

¹ Extra colourway tiles inherited from subcategories. The same models also have a model tile.
² The old "ANSI Sunglasses" link drops `/us/` and opens a non-US storefront (7-column grid, no Quick view). That's an
old-site bug; ours points to safety-sunglasses.
³ One collection serves two old categories with different cards: Sunglass Accessories (model tiles: cases, pouch,
lenses, side shields) and Gear › Accessories (colourway tiles: pouch prints).
⁴ Every model is listed twice: one model tile + one tile per colourway. On the first page shoppers mostly see colourway
tiles (Snow Helmets: 1 model + 23 colourway).
⁵ `discord` and `helm` are the DISCORD and HELM **model collections**, which the grouped card also reads for its colour
list. The old Discord Series spans 6 models (Discord, Gaming, SLAYCo, Optical 56/58, Replacement Lens). Helm Series =
Helm + Helm Optical 54/56 colourways + 3 lenses.

## 4. What doesn't match

- **Model card missing on 14 collections** that the old site shows as model tiles. They still use the default template:
  wrap-sunglasses, shield-sunglasses, womens-sunglasses, safety-sunglasses, sunglass-cases³, replacement-lenses, goggles,
  snow-replacement-lenses, moto-goggles, replacement-motocross-goggle-lenses, motocross-goggle-accessories, eyeglasses,
  gear, discord⁵.
  - The data supports it: in the 29 Oct export every published product in these collections carries a `collection::`
    tag except 1 goggle, and model collections exist for all models except 4 goggle models and 1 gear item.
- **Wrong way round on 1:** polarized-sunglasses has `grouped-plp` (model card); the old Men's › Polarized shows colourway
  tiles (44 of 45).
- **Compare** is missing on every live PLP. The old site has it on every tile and page.
- **`collection.story`** is unused, and it fits no old page.
- **12 menu links are 404** (Flag, Happy Boost Snow, Sale + 9). **4 old collections are not in our menu** (Trail,
  Classics, Lifestyle, Crypto).
- **Shared collections** stand in for old subcategories with their own lists: Men's/Women's Eyeglasses → eyeglasses;
  Happy Gaming/Screen → blue-light-glasses; Apparel/Shirts/Hats → gear; both Accessories → sunglass-cases.
- **Model vs colourway doubles:** the old Sunglasses, Eyeglasses, Snow Helmets and Blue Light pages repeat models as extra
  colourway tiles. Our grouped card shows each model once.

## 5. Applying it

A collection's template is set on the collection itself (Theme template = `templateSuffix`), which is a collection edit.
Two ways:

1. **Admin, no code:** set Theme template to `grouped-plp` on the 14 collections above and back to Default on
   polarized-sunglasses.
2. **Theme only:** let one template pick the card per collection, for example the default template using the grouped
   section with a setting that lists the colourway-card collections.

**Preview without any change:** add `?view=grouped-plp` to a PLP URL (e.g. `/collections/eyeglasses?view=grouped-plp`
shows 26 grouped cards instead of 24 normal ones; checked live 1 Nov).

**Catch for route 2:** 180 of 184 collections use the default template, and 148 of them are single-model collections
(`/collections/cyrus` …). In model mode they collapse to one card (`/collections/cyrus?view=grouped-plp` = one "CYRUS,
20 colors available" card). These pages don't exist on spyoptic.com. Shoppers only reach them through our card's arrow,
and spyoptic.com's arrow opens the model's product page instead. Since 9613c9e our product page lists every colourway
(same count as the card), so the arrow can match the source and these pages drop out of the shopping path.

**Colourway pages need lens-level data for a true 1:1 (checked live 2 Nov).** spyoptic.com assigns single frame + lens
colourways to these pages. Our collections hold whole frames with all their lenses (manual lists, or `collection::` model
tags for Fishing, Helm and SLAYCo), so nothing in the data says which lens belongs on the page.
- Murdered Out: 4 frames = 7 colourways, only 3 with a Murdered Out lens. The standard card fronts CYRUS Black with
  Happy Grey Green ($150) instead of its Murdered Out lens.
- Happy Boost Sun: 1 frame = 3 colourways, 1 of them Happy Boost.
- Fishing: 39 frames = 52 colourways vs 37 old tiles.
- Closest theme-only rule: one card per frame, fronting the lens that fits the page (Murdered Out, Polar, Happy Boost),
  otherwise the frame's first colourway.

**Doubles, not copied:** the old Snow Helmets and Blue Light list each model twice, and Sunglasses/Eyeglasses add tiles
from their subpages. That comes from SFCC assignment, not design. Proposal: each model once; Snow Helmets on colourway
cards (its first page is 23 colourway tiles + 1 model tile), Blue Light on model cards (the collection also stands in for
Happy Gaming/Screen, which are model pages).

Rows ³ and ⁵ need data either way: separate collections for the two Accessories categories, and series collections for
Discord/Helm.

## 6. Built on a preview theme (2 Nov, Goran's "ok"), shipped in 645d02c (3 Nov)

Preview **190195728691** "Colourway PLP preview (temp, delete after review)" = a copy of live + 8 files:
- `templates/collection.json`: the grid is `spy-grouped-collection` with the grouped template's settings (row gap 35,
  bottom padding 16), so every default PLP shows model cards.
- `sections/spy-grouped-collection.liquid`: a "Colourway pages" list (10 collections), "Lens words" (Polar, Murdered
  Out, Happy Boost) and "Cards per page" (24). On those pages, and on any collection that holds a single model, it skips
  the grouping and shows one card per frame, without `dedupe-groups`.
- `templates/collection.grouped-plp.json`: the same list, so polarized-sunglasses shows colourway cards.
- Card (`blocks/_spy-grouped-product-card.liquid`, `snippets/spy-grouped-product-card.liquid`): `card_per` + `variant`
  params, colourway price (`snippets/spy-card-price.liquid`), arrow → product page.
- Quick View (`snippets/spy-quick-view-button.liquid`, `assets/spy-quick-view.js`): a colourway card opens on its lens.

Checked: 26 pages render with no Liquid errors. Grid geometry equals live Sunglasses at 1440/768/390. Murdered Out picks
the Murdered Out lens and Happy Boost picks the Happy Boost lens. Quick View shows that lens. Fishing "More results"
goes from 24 to 39 cards. Homepage cards are identical to live. Theme Check is clean for the 8 files. Console errors
are only third-party, and live has them too.

Data gaps left (product data, not touched): Cyrus Black's Murdered Out variant has no photo (the card shows the green
lens), Cyrus Matte Black has no photos, stickers follow the frame (no CAT 4 on Bowery Matte Black's Murdered Out
card), thin collections (Polarized 1 frame vs 44 tiles, Happy Boost 1 vs 23, Snow Helmets 1 vs 23), half prices.

**Shipped 3 Nov** on Goran's "push": commit 645d02c (the 8 files only, no CSS change: a clean build of the commit tree
equals the committed tailwind.css). Live synced all 8 files. The 22 collection pages give the same cards, labels, prices,
links and Quick View variants as the preview. Search matched once loaded back to back, because the search index shifts a
result between runs. On live in a browser: the same grid, Quick View on the Murdered Out lens, More results 24 to 39, and
only the known third-party failures (accessiBe config 404, shop.app 403). The preview now equals live in all 666 files.
