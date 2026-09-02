# Page Spec — Announcement Bar (source: `section.preheader`)

Measured live on https://www.spyoptic.com/us/ (2026-09-02) with the country-selector
overlay removed — that `.store-switcher-wrapper` banner is injected INSIDE
`header.site-header` on a first visit and pushes every measurement down by 85px.

## Placement
The bar is the LAST band of the header, under the nav — not above it.

| Header child | Top | Height |
|---|---|---|
| `section.main-menu` (nav) | 0 | 50px |
| `section.preheader` (announcement) | 50 | 40px |
| **header total** | | **90px** |

## Source DOM
```html
<section class="preheader">
  <section class="promo-banner col-12 d-flex align-items-center justify-content-center text-center ml-4">
    <style>…</style>
    <div id="ribbon">
      <div class="ribbon-message active">
        <a href="/us/sale/sunglasses/">🔥 CHECK OUT THE SALE SECTION</a>
      </div>
    </div>
    <script>…</script>
    <button class="btn btn-link promo-banner_close align-self-center" aria-label="Close">
      <i class="icon fal fa-times" aria-hidden="true"></i>
    </button>
  </section>
</section>
```

## Band
- Full-bleed: `left: 0`, `width: 100%` (1425px at a 1440 viewport)
- Background `#1d2a2b` (rgb 29 42 43) · text `#ffffff`
- No border, no shadow

## Breakpoints (from the source's own media queries)

| | ≥ 769px | 481–768px | ≤ 480px |
|---|---|---|---|
| band height | **40px** | **48px** | **56px** |
| `#ribbon` padding | 8px 16px | 10px 12px | 12px 8px |
| `#ribbon` min-height | 40px | 48px | 56px |
| font-size | **12px** | **12px** | **12px** |
| font-weight | 600 | 600 | 600 |
| line-height | 1.4 → 16.8px | 1.5 → 18px | 1.6 → 19.2px |
| letter-spacing | 0.3px | 0.2px | 0.2px |

⚠️ The inline `<style>` declares `font-size: 14px` desktop / `11px` ≤480, but a
higher-specificity rule pins the computed size to **12px at every width**. Verified
by computed style at 1440 / 768 / 390. Use 12px — not the stylesheet's numbers.

## Link
- `display: inline-block`, `text-align: center`, `text-transform: uppercase`
- `color: #fff`, `text-decoration: none`
- Font `DINNextLTPro, sans-serif`
- Hover: `text-decoration: underline` + `opacity: 0.9`
- The 🔥 is INSIDE the link's own text run — same 12px, one plain space after it
  (space advance 2.83px). It is not a separate flex child and there is no gap.
  Emoji advance 16.48px, ink ascent 11 / descent 2.

## Close button
- `<i class="icon fal fa-times">` — `fal` is inert here, the glyph is painted by
  `i::before` from **FontAwesome 4.7** (`\f00d`)
- Glyph is **white `#fff`** (the `<i>` overrides the button's own orange `#f27e37`),
  `font-size: 12px` → advance 9.43px, **ink 9×9px**, ascent 8 / descent 1
- Button `padding: 8px 12px` + 1px transparent border → **35.44 × 34.8px**
- `align-self: center`
- Sits immediately right of `#ribbon`; the two are centred TOGETHER as one flex group,
  so the ✕ is not pinned to the page edge
- `aria-label="Close"`

## Rotation
- Only one message ships (the second is commented out in source)
- `setTimeout` rotation every **5000ms**; `.ribbon-message` crossfades on
  `opacity 0.5s ease-in-out`; `display: none` → `block` on `.active`
- **No arrows** — the source has no prev/next controls

## Off-centre text — reproduced on purpose
`section.promo-banner` is `col-12` (width 100%) plus `ml-4` (margin-left 24px), so it
overflows its parent 24px to the right. Its content box centre therefore sits 24px right
of the page centre, and because the close button shares the centred flex group, the text
lands **+6.28px right of true centre** at every breakpoint (measured: 1440 → 718.78 vs
712.5; 768 → 382.77 vs 376.5; 390 → 193.78 vs 187.5).

It is a markup slip, not a design choice, but rule 2 puts visual fidelity first and the
offset shows up in a screenshot overlay, so we match it. Our row carries `pl-12` (48px
left padding, 0 right), which moves the content-box centre the same 24px without the
source's horizontal overflow. Measured result: **+6.5px**, i.e. 0.22px from the source —
the remainder is our close button being 35px wide against the source's 35.44px (FA's
glyph advance vs its ink).

Reproducing the mechanism rather than the number also keeps the two in step if the close
button is switched off: source and theme both fall back to +24px.

## Baselines
`audit/announcement/src-1440.png` · `src-768.png` · `src-390.png` (element shots of `section.preheader`)
