# Slideshows: old site (spyoptic.com) vs new site (Shopify), 12 Nov 2026

## Outcome, 13 Nov 2026 (read this first)
This report is the 12 Nov research. What shipped is different:
- **The old site's motion was not copied.** Goran judged spyoptic.com's slider animation "not good" and asked for the pre-update feel instead.
- **The first build jumped instead of sliding.** Two Chrome rules caused it: scroll-snap chases cards moved by a transform, and an `!important` transform never runs on the graphics card. The fixed engine `assets/spy-slider.js` turns snap off during the glide and animates with `el.animate()`, so it stays smooth on a busy page.
- **Speeds:**
  - Card rows: 300ms, with the pre-update soft ease-in-out.
  - Category tiles: 200ms.
  - Photo galleries and Quick View: 400ms.
- **Every product-card carousel is one section and one behaviour.** They all use Horizon's Product list (Collection list for collection cards, Product recommendations for "You might also like"). The behaviour:
  - 1 card per click;
  - arrows from 769px, outside the cards; swipe on phones;
  - a rail loops only when it autoplays, or on phones when it peeks;
  - cards that all fit are centred, or left as a setting ("Cards that fit in one row").
- **Rail widths are classes** set in each section's CSS class field: `spy-rail--contained`, `spy-rail--edge-mobile`, `spy-rail--row-inset`. The lens-benefits carousel uses `wm-band--benefits`.
- **Commits:** 616e9be (code), 3c67165, ff80812 and 8d52087 (templates; the last two only re-triggered a GitHub sync Shopify had missed), 42e834b (removed the old SPY rail section and Collection list's products mode).

## How this was checked
- **Old site:** live www.spyoptic.com in Goran's Chrome.
  - Read each slider's own settings: slick `options`, including the `responsive` rules per breakpoint.
  - Read the arrows' computed styles.
  - Clicked every visible slider to its end at 1920px.
- **New site:**
  - Live spyoptic-com.myshopify.com, theme spy-v2/main, HEAD 66793fd. Clicked to the end at 1920px.
  - Phone and tablet behaviour on the new site comes from the code (file:line below). Goran's Chrome window can't be resized.
- **Smoothness:** measured in a headless 60fps lab (`scratchpad/slider-lab/`).
  - Goran's Chrome paints only about 2 frames per second, so it can't show smoothness.
  - The lab runs the new tiles and rails move code unchanged. It compares that with Horizon's native smooth scroll and with a slick-style CSS transform.
- **Live homepage change:** since 11 Nov (00cdb37) the live homepage is the gift guide v2 layout. The old homepage is kept as `page.homepage-2025`.

## Short answer
1. **Why arrow clicks feel jerky**
   - Our two custom sliders (homepage tiles and the product rails) move the row with JavaScript, one frame at a time, on the page's main thread (`tween()`, spy-category-tiles.liquid:385, spy-product-carousel.liquid:341).
   - Swiping is a native browser scroll, and the old site's slick slider moves with a CSS transform. Both keep running even when the page is busy, so they stay smooth.
   - Our JavaScript move stops whenever the page is busy, and it goes wrong when you click again before it finishes.
2. **At the last card**, the two sites often behave differently. For example:
   - The old site dims the arrow to 40%. We either hide it or leave it looking active while it does nothing.
   - The old site loops in Quick View and in the Watermen lens-benefits slider; ours stops.
3. **Looks:** the old site has five arrow designs. Ours were unified to one, a 40px white circle with an orange chevron (QA PLP A8, 9-10 Nov). That difference is on purpose.

## 1. Arrow click smoothness (lab, 60fps, cards 480px)

| Strategy | Single click | Double click (90ms apart) | Triple click (70ms apart) | 150ms busy page during the move |
|---|---|---|---|---|
| **New tiles** (JS move, 200ms) | smooth, 13 frames | twitches back, stalls, then **jumps 480px in one frame** | stalls, then **jumps 228px in one frame** | **froze**: 1 frame painted out of ~9 |
| **New product rails** (JS move, 300ms) | smooth, 19 frames | 2nd click lost, **stalls** halfway | stalls, then **jumps 159px in one frame** | **froze**: 1 of ~9 |
| Horizon rails (native smooth scroll) | smooth | smooth, 1 card | smooth, 2 cards | 4 of ~9 |
| **Old slick** (CSS transform, 200 or 500ms ease) | smooth, 12 frames | smooth (extra clicks ignored) | smooth | **kept gliding: 9 of ~9** |

**Why the new sliders behave this way**
- **Nothing stops a second move from starting.** A click during a move starts a second animation loop from mid-flight. There is no `cancelAnimationFrame` and no click lock.
  - When the first loop ends, it switches snapping back on while the second is still moving. Every later frame is then pulled to a card edge.
  - The tiles also run their jump-back to the real tiles (`normalize()`) at that moment (spy-category-tiles.liquid:398-406).
  - The old site's slick ignores clicks while it moves (`waitForAnimate: true`, read live).
- **The next stop is measured from the current position** (`scrollLeft + card width`), not from the card index. A click mid-move aims between cards, and the snap then corrects it with a jump.
- **The move runs on the main thread.** On the live homepage the main thread had 16 long tasks in the first 12s after load, about 1.2s in total and up to 199ms each.
  - Any click during that time freezes the move and then jumps.
  - Phones are slower, so this happens more often there.
- **Speed:** the new rails take 300ms (`transition_speed`), where the old rails, gallery and Quick View take 500ms. The tiles take 200ms on both sites. Our curve (ease-in-out) starts slowly and then rushes, whereas slick's `ease` starts fast and settles.

## 2. What happens at the last card

| Slider | Old site (live) | New site |
|---|---|---|
| Homepage / gift guide category tiles | 1 tile per click, **loops forever** (clones). Both arrows always active, 200ms | 1 tile per click, **loops forever** (clones). Both arrows always active, 200ms. **Same** |
| Gift / homepage product rails, desktop | All 5 fit, no arrows | All fit, no arrows. **Same** |
| Same rails, 721-1140px | 3 per click. Stops with the last card flush right. Arrows: none (rail 1) or dimmed (rail 2) | 3 per click. Stops, but **the arrow stays looking active and does nothing** (spy-product-carousel.liquid:416-428) |
| Same rails, ≤540px | 1 centred card. **Loops seamlessly**, dots with an active colour | 1 card, **rewinds the whole rail in one 300ms move**. Dots have **no active state** (:404-406) |
| PDP gallery | Desktop: **loops** (8 → 1). ≤992: stops | ≥992: **loops** (one-step wrap). <992: dots, no arrows. **Same at desktop** |
| PDP "Features" strip (lifestyle) | Loops. Full-height side bars, desktop only | Loops from 770px, stops below with arrow hidden. **No product has images yet**, so it never shows |
| PDP recommendations | 4 visible, 1 per click. **Stops: Next dims to 40%**, Prev dimmed at start | 1 per click. **Stops: Next disappears**, Prev hidden at start |
| Quick View | 1 per click, **loops** (8 → 1) | **Stops** at the last photo, arrow still looks active, click does nothing |
| Watermen frames rail | Loops, auto-moves every 3s | Loops by rewinding, auto-moves every 3s. **Same idea** |
| Watermen lens rails (Ice Blue, Black Mirror) | Loop, **no auto-move** | Loop by rewinding, **auto-move every 3s** |
| Watermen Bronze rail | 1 item, no arrows | 1 item, **two dead arrows** drawn |
| Watermen lens benefits | 4 slides, **loops** (4 → 1). Arrows always visible | 4 slides, **stops**. At rest **only the dead Previous arrow shows; the working Next arrow is invisible** until hover, so on phones it never shows |
| Snow Tech goggles | 6 items, **2 per click**, stops, **Next dims to 40%**. Arrows desktop only | 6 items, **1 per click**, stops, **Next disappears** |
| Snow Helmet Tech helmets | 5 items, 2 per click, stops, auto-move 3s. Arrows desktop only | 4 helmets in 4 columns: no arrows on desktop, arrows below 992. No auto-move |
| ANSI frames | 4 fit. ≤540: 1 centred card, loops, arrows | 4 fit. Below 992: arrows, and the hidden arrow at each end |
| Happy Boost, Happy Lens, PLP | No sliders | No sliders |

## 3. How the arrows look

| Old slider | Old arrow | New (all sliders since 9-10 Nov) |
|---|---|---|
| Category tiles | 40px **dark slate disc** (#1d2a2b) with a thin white chevron, 1vw from the edge | 40px white circle, orange 20px chevron, shadow 0 0 9px rgb(119 119 119/.35), .6 on hover |
| Product rails, recommendations, Snow Tech | 35px white circle, orange glyph at 75% (100% on hover), shadow .1 (.4 on hover), 45px outside the row. **Disabled = 40% opacity** | same unified circle; ends hidden or not marked (section 2) |
| PDP gallery, Quick View | 40px / 35px white circles inside the photo | unified circle; the PDP pair sits bottom-left |
| PDP features strip | 51px full-height translucent white bars, 48px orange glyph | unified circle |
| Watermen lens benefits | 50px white squares, black icon, 4 dots | unified circle, hover-reveal (bug, section 2), 4 square dots |
| Dots | 8px, white / slate when active | Product rails: 10px slate with no active state. PDP: Horizon dots |

## 4. Other findings
- **Quick View:** `disabled:opacity-40` is never used, because the JS never disables the arrows (spy-quick-view.js:41-49).
- **Hard-coded labels:** the tile and product-rail arrows have English-only aria-labels, "Previous"/"Next".
- **Two icon shapes:** the Horizon caret (rails, PDP) draws about 2.1px thick and the SPY chevron about 1.3px. Same size, different look.
- **Lifestyle strip and Quick View** ignore reduced-motion.

## 5. Suggested fixes (not done, waiting for Goran)
1. **Smooth arrows (tiles + product rails):**
   - Ignore clicks while a move runs, like slick, or restart from the intended card.
   - Aim at card positions, not the current scroll.
   - Never turn snapping back on during a move.
   - Then move the row with a CSS transform on the compositor (slick's method) instead of a frame-by-frame scroll. A page busy loading apps then can't freeze it, and native swipe stays.
   - Use 500ms `ease` like the old rails; the tiles stay at 200ms.
2. **End states, one rule for every slider:**
   - Non-looping sliders dim the end arrow to 40% and disable it, like the old site. Today it is hidden, or left looking active.
   - Loop where the old site loops: Quick View, lens benefits, and product rails on phones (seamless, no rewind).
3. **Bugs:**
   - Lens-benefits arrow visibility.
   - Active dot colour on the product rails.
   - Hide the arrows on 1-item rails (Watermen Bronze).
4. **Decisions for Goran:**
   - Snow Tech: 2 per click like the old site, or keep 1.
   - Whether the Watermen lens rails should auto-move. The old site does not.
