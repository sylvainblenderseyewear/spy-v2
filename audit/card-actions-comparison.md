# Product card actions: spyoptic.com vs our store (30 Oct 2026)

Old site: tile script and CSS from the saved copies (`main.js` `swatchHover` / `.cbo` click, `audit/product-card-full-spec.md`,
`reference/quick-view-dialog/quickview-outline.txt`), then **checked live on spyoptic.com** in Goran's Chrome (see "Live check" below).
Our store: live theme `spy-v2/main` (after `00a29c4` + `20ac2b7`), tested with Playwright at 1440 (mouse), 768 (mouse) and 390
(touch), and hover states confirmed in a real Chrome.

## Card types

| spyoptic.com | Ours | Where ours appears |
|---|---|---|
| Model tile: one card per model, "N colors available", 4 thumbs + arrow | Grouped card (`spy-grouped-product-card`) | Sunglasses, Men's, Polarized, Snow Goggles PLPs; PDP "You Might Also Like" |
| Colourway tile: one card per frame + lens, colour name, 1 thumb | Grouped card in colourway mode | Homepage rails |
| (same colourway tile) | Standard card (`_product-card` + `spy-swatches`) | Every other PLP (Eyeglasses, Goggles, Moto, Helmets…) |
| Model tiles in search results | Rebuy Smart Search cards | `/search`: the theme's own grid is hidden while Rebuy is the search engine |

## Actions

| Action | spyoptic.com | Our grouped card | Our standard card |
|---|---|---|---|
| Hover the image band (≥769) | Quick View fades in (0.2s); labels snap off, thumbs fade in (0.3s) | same | same |
| Hover the title / price | Quick View only, labels stay | same | Quick View **and** thumbs (Horizon's full-card link, known deviation) |
| Hover a thumb | photo + stickers switch to that colourway | same; stickers follow the frame product, not the lens (tags are per product) | single thumb = the card itself |
| Leave the thumb row (gaps count as the row) | photo + stickers restore | same | — |
| Click a thumb | colourway PDP with that frame + lens preselected (`?dwvar_…_color=`); Ctrl/⌘/middle → new tab | that colourway's variant URL (`?variant=`); new tab works natively | product URL without `?variant=` |
| Click the arrow (> 4 colours) | the model's product page ("See more variations on the X page") | the model's **collection** page (deliberate) | no arrow |
| Click the image / title | model page, default colourway | representative colourway's variant page | product page, first available variant |
| Quick View | gallery + video, colourway buttons (switch in place), Colour / Lens / Extra Lens, Size Chart, stock, Add to Cart, View Full Details; quantity present but hidden | gallery, colourway links (switch in place), Size / Lens buttons, Size Chart, stock, Add to Cart, View Full Details, stickers; no quantity | same as grouped |
| ≤768 | no Quick View; thumbs 3–4 hidden (2 + arrow) | same | same |
| Phone tap on the image | opens the product page; thumbs never show | same | same |
| Keyboard | thumbs are `span`s (not focusable); Quick View is focusable but stays invisible | card link → Quick View → thumbs → arrow, all shown on focus (WCAG) | card link → Quick View → thumb |

## Differences worth a decision

1. **Grouped cards only on 4 collections.** spyoptic.com uses model tiles on most categories, so our Eyeglasses, Goggles, Moto etc.
   show one card per frame, with no "N colors available", no thumb row and no arrow (open since 29 Oct).
2. **Arrow target:** model collection page (ours) vs model product page (old site).
3. **Search** shows Rebuy's cards, not ours or the old site's model tiles.
4. **Thumb stickers** follow the frame product; a frame whose lenses differ in tech (e.g. Happy Boost vs plain Happy) can show the
   wrong sticker on hover. Fix = per-variant data, not theme.
5. Standard card: title hover also reveals thumbs; its thumb link has no `?variant=` (minor).

No compare button on live cards: `spy-compare-btn` lives only in `collection.story.json`, which no collection uses.

## Live check on spyoptic.com (30 Oct, after Goran passed the bot check)

`/us/sunglasses/` (DISCORD model tile), `/us/` (CYRUS SWITCH colourway tile in the slick rail), and the PLP in a 768px and a
390px iframe. Real mouse, about 8 page loads.

| Check | spyoptic.com live | Same as ours? |
|---|---|---|
| Hover photo / title / thumb 2 / gap / back / off card | QV + thumbs / QV only / photo → that colourway / kept / restored / all reset | yes |
| Thumb stickers | per colourway: plain Happy = none, Happy Boost = HB, Murdered Out = CAT 4 + Not for driving | **no**: ours per frame. Our DISCORD Soft Matte Black – Happy Gray Green thumb shows the HB sticker |
| Click thumb 2 | `discord-41876.html?dwvar_…=black-ii_happy-boost-bronze…`, that colourway selected | yes (variant URL) |
| Click arrow | `discord-41876.html`, no colour | **no**: ours → `/collections/discord` |
| Quick View | 15 frame+lens buttons (4 sold out), Ref, Colour, Lens, Size Chart, stock, **"Add to Cart · $220"**, View Full Details, sticker, 8 images; colour pick switches in place; Esc closes | mostly: ours = 9 frames + Lens buttons, Ref, Size Chart, stock, **"Add to cart"** (no price) |
| Keyboard | thumbs `tabindex=-1`; Tab: photo link → photo link → sticker link → QV (invisible) → title | ours better |
| Homepage rail tile | colour name label, 1 thumb, same hovers | yes |
| 768 / 390 | QV never shows; 2 thumbs + arrow | yes |
| Hidden QV at ≤768 | still `visibility: visible`, `pointer-events: auto`: a tap on the bottom 35px of the photo **opens Quick View** (clicked at 390: opened) | not copied: ours is `display: none` there |

## New finding: standard cards swap the big photo on hover (live, 30 Oct)

**Fixed 30 Oct:** Goran unticked "Show second image on hover" in the theme editor (`038e199`). Live re-check after:
Cyrus Screen, Crossway Screen, Breakaway ×3 and Neutron MIPS keep their photo on hover, like spyoptic.com.

On every PLP that uses the **standard** card (all collections except Sunglasses, Men's, Polarized, Snow Goggles), hovering
the photo switches the big photo to the product's **second** photo, and back on leave (Eyeglasses `…_01` → `…_02`, Goggles
Breakaway Black → a strap-only shot, Snow Helmets Neutron MIPS `-01` → `-02`). Cards with one photo don't change.
Cause: theme setting **"Show second image on hover"** (`show_second_image_on_hover: true`, Horizon default) →
`snippets/card-gallery.liquid` `on:pointerenter="/previewImage"` → `assets/product-card.js` `previewImage()` (mouse only).
The **grouped** card has one photo and no such handler, so it never changes; **spyoptic.com doesn't change the photo either**.
Fix = untick the setting (Theme settings → Product cards), no code.
The card carousel itself is off (slideshow `disabled`, arrows 0px, no swipe), matching the old site.

**Old store logic (checked live 30 Oct).** spyoptic.com has the same feature in code, but it is data-driven:
`search.js` (also in `main.js`) `tileHover` → on `mouseenter` of `.product-tile .image-container`, if `img.tile-image` has
`data-alternate-image-src`, show that image; on `mouseleave`, go back to `data-src`. No attribute = nothing happens.
The attribute is only printed when a product has an alternate image, and **no tile has one**: 0 of 407 tiles in the
`Search-UpdateGrid` lists for sunglasses (92), eyeglasses (97), goggles (36), snow-helmets (27), gear (8), collections (147),
and 0 on the first 24 tiles of `/us/eyeglasses/`, `/us/goggles/`, `/us/snow-helmets/`. Real mouse on Goggles → BREAKAWAY:
photo stays `323291038100-01.jpg`, only the thumbs (and Quick View) fade in. The only photo change on the old site is
`swatchHover`: hovering a thumb shows that colourway; leaving the thumb row restores it.
So the 1:1 match is the setting **off** for every card. If SPY ever wants a hover photo on chosen products only, that needs a
per-product field (like the old alternate image), not the all-or-nothing theme setting.

**Blenders (code `reference/blenderseyewear` + live, 30 Oct).** Every Blenders card is the custom `product-card-v2`
(`blocks/_product-card.liquid`), so Horizon's `show_second_image_on_hover` (left at its default, on) never reaches the grid.
The card has its own hover: at ≥750px, hovering the photo opens a pop-up **detail card** over the card (108% wide, white,
shadow): a photo swiper of up to 7 colours with dots, title, price, stars, a 3-line description and Add to Cart
(`product-card-v2.liquid:820-979`, CSS `:1053-1089`). Its photo is a different shot from the card's
(`:833-851`, same rule in `templates/product.lifestyle-data.liquid`):
- Sunglasses / Snow Lenses: card = 1st photo, pop-up = 2nd photo ("packshot")
- everything else: card = 2nd photo, pop-up = 1st photo

Live, `/collections/all-sunglasses` → KINGPIN Crystal: rest `BE9307_Kingpin_Crystal_2_o.webp`, hover → pop-up with
`BE9307_Kingpin_Crystal_1_o.webp`, leave → pop-up hidden, card photo unchanged. Phones (<750): no pop-up.
So Blenders also changes the photo on hover, but as a whole pop-up card, not a photo swap. The design follows
spyoptic.com, so this is a logic reference only.

## New finding: dead click zone on our grouped card (live, 30 Oct)

The photo sits 10% inside its square, and on our **grouped** card the white border around it is not clickable:
clicks/taps at the top, sides or bottom of the square land on `div.card-gallery` and **do nothing** (desktop and phone,
`/collections/sunglasses`). Only the photo itself opens the product. On spyoptic.com the whole square is the link
(`a.image-wrapper` with the 10% padding inside it). Our standard card (`/collections/eyeglasses`, desktop) does open the
product from the border, except the bottom strip. Not fixed yet.

## Test notes

- Measure pointer paths with stepped moves and coordinates taken after the last scroll: a one-jump move from stale
  coordinates landed on thumb 3 and looked like a broken restore.
- After `/search` (Rebuy absent in headless), the tab stopped producing frames: CSS transitions froze at opacity 0 and
  screenshots timed out (headless shell and full Chromium alike). Check hover visuals in a real Chrome.
