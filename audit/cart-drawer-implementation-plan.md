# Cart drawer — implementation plan (pixel-perfect, settings-driven, zero new files)

Date: 2026-09-22
Target spec: `audit/page-spec-cart-drawer.md` · raw: `cart-drawer-source-measurements.json`,
`cart-drawer-ours-measurements.json`

## 0. Constraint: no new sections or blocks

**Nothing new is created.** The drawer is rendered from `layout/theme.liquid:150` as a
**snippet** (`{% render 'cart-drawer' %}`), not as a section in a section group — so section
settings cannot reach it and a new section would be *unusable* anyway. The editable surface is
**Layer 1 theme settings**, which is also what CLAUDE.md rule 3b requires for brand-wide visuals.

Files touched — all existing:

| File | Why | Kind |
|---|---|---|
| `config/settings_schema.json` | add settings to the **existing** `t:names.cart` group | edit |
| `config/settings_data.json` | flip existing values | edit |
| `snippets/cart-drawer.liquid` | pass `context: 'drawer'` + title/icon | edit |
| `snippets/cart-products.liquid` | extend the **existing** `context == 'drawer'` guards | edit |
| `snippets/cart-summary.liquid` | add `context` param + guards | edit |
| `snippets/theme-drawer-header.liquid` | optional icon param — **only consumer is cart-drawer** | edit |
| `src/tailwind.css` | all styling (rule 9) | edit |
| `locales/en.default.json` | CTA + title strings | edit |

Assets already present, nothing to add: **`assets/spy-fa-bag.svg`** (the FA bag the header
already uses) and `assets/icon-delete.svg`.

Two things make this cheap: `cart-products.liquid` **already carries `context == 'drawer'`
guards** (control labels, remove button), so the pattern is established; and
`theme-drawer-header.liquid` has **exactly one consumer**, so changing it is contained.

---

## 1. Reusability model

One snippet pair serves both surfaces, parameterised — no duplication:

```
cart-products.liquid   ──┬── context: 'page'    → cart page (signed off 1:1)
cart-summary.liquid    ──┘── context: 'drawer'  → cart drawer
```

Every drawer-specific difference becomes **a theme setting read at render time**, never a
hard-coded value. Changing the drawer width, CTA text or thumbnail size is then a theme-editor
edit with zero code — the acceptance test in CLAUDE.md 0.3.

---

## 2. Lever map — every difference to its mechanism

### 2a. Already covered by EXISTING settings (just flip them)

| Difference | Existing setting | Now | Set to |
|---|---|---|---|
| Discount accordion in drawer | `show_add_discount_code` | `true` | **`false`** |
| Payment installments | `show_installments` | `true` (default) | **`false`** |
| Express checkout buttons | `show_accelerated_checkout_buttons` | `true` (default) | **`false`** |
| Never opens on ATC | `auto_open_cart_drawer` | unset (`false`) | **`true`** (auto-close: see §7.2) |
| Title case | `product_title_case` | `default` | **leave `default`** — decided: CSS `text-transform` scoped to the drawer instead |
| Price typography | `cart_price_font` | `subheading` | pick to hit 16px/`#222` |
| Cart note | `show_cart_note` | `false` | keep `false` ✓ |
| Thumbnail border | `cart_thumbnail_border*` | none/0 | keep ✓ |

**Regression check done:** flipping `show_add_discount_code` to `false` is *safe and beneficial*
for the signed-off cart page. The page's promo form is `spy-cart-promo`, rendered directly from
`sections/main-cart.liquid:66` and independent of this setting. Horizon's `.cart-actions` is
currently still in the page DOM as a **2px hairline remnant** — turning the setting off removes
it cleanly. `.cart-totals__tax-note` is already `height:0` on the page, so nothing changes there.

### 2b. Needs a NEW setting in the EXISTING `t:names.cart` group

Added under a new `header` labelled "Cart drawer" inside the group that already exists:

| id | type | default | drives |
|---|---|---|---|
| `cart_drawer_width` | range 280–520 step 10 | **320** | `--theme-drawer-width` |
| `cart_drawer_push_page` | checkbox | **false** | `.page-wrapper--drawer-open` margin |
| `cart_drawer_lock_scroll` | checkbox | **false** | body scroll lock |
| `cart_drawer_thumbnail_size` | range 60–140 | **95** | line-item image box |
| `cart_drawer_quantity_editable` | checkbox | **false** | stepper vs static `Quantity : N` |
| `cart_drawer_row_gap` | range 0–32 | **0** | gap between line items |
| `cart_drawer_dividers` | checkbox | **false** | line-item bottom border |
| `cart_drawer_show_subtotal` | checkbox | **false** | subtotal row |
| `cart_drawer_show_tax_note` | checkbox | **false** | tax note |
| `cart_drawer_cta_target` | select `cart`/`checkout` | **`cart`** | CTA destination |
| `cart_drawer_cta_style` | select `solid`/`outline` | **`solid`** | CTA fill |

CTA label comes from `locales/en.default.json` (`content.cart_drawer_cta` = "Go to cart"), not a
text setting — it needs translating, and locale files are the right home.

### 2c. Liquid guards in existing snippets

| Change | File | Guard |
|---|---|---|
| Static `Quantity : N` instead of stepper | `cart-products.liquid` ~l.367 | wrap `{% render 'quantity-selector' %}` in `{% if context != 'drawer' or settings.cart_drawer_quantity_editable %}` |
| Drop unit price in drawer | `cart-products.liquid` ~l.439 | `{% unless context == 'drawer' %}` |
| Hide subtotal row | `cart-summary.liquid` ~l.235 | `{% if context != 'drawer' or settings.cart_drawer_show_subtotal %}` |
| Hide tax note | `cart-summary.liquid` ~l.268 | same pattern |
| CTA → link vs submit | `cart-summary.liquid` ~l.276 | `{% if context == 'drawer' and settings.cart_drawer_cta_target == 'cart' %}<a href="{{ routes.cart_url }}">` |
| Pass context | `cart-drawer.liquid` | add `context: 'drawer'` to the `cart-summary` render |
| Header title + icon | `cart-drawer.liquid` | pass `Your Cart`, `title_append` = `({{ cart.item_count }})`, `icon: 'spy-fa-bag.svg'` |
| Empty state keeps header+footer | `cart-drawer.liquid` | drop the `cart.empty?` branch that swaps in a lone close button |

### 2d. Tailwind utilities on the markup (rule 9 — no hand-written CSS)

Every drawer style is a utility class on the element, guarded by `context == 'drawer'` in the two
shared snippets. Tailwind utilities are `!important` inside their layer, so they beat Horizon's
`{% stylesheet %}` blocks without needing an ID selector.

| Where | Carries |
|---|---|
| `cart-drawer.liquid` `<dialog>` | `border-l-0 z-[51] [--animation-speed:426ms] [--animation-timing-fade-in:cubic-bezier(0.5,0.25,0,1)]` |
| `cart-drawer.liquid` header render | `class` / `title_class` / `icon_class` / `close_class` params |
| `cart-drawer.liquid` content, items, summary | flex sizing, padding, `[mask-image:none]` |
| `cart-products.liquid` row | grid columns/rows + `[grid-template-areas:…]`, padding, gap and divider settings |
| `cart-products.liquid` children | media, image, product-info, variants, title, quantity, remove, price |
| `cart-summary.liquid` | totals, total row, labels, both CTA branches |
| `layout/theme.liquid` `.page-wrapper` | `[&.page-wrapper--drawer-open]:mr-0` so an overlay drawer never pushes the page |

`theme-drawer-header.liquid` gained four optional class params rather than drawer-specific styling,
so it stays generic for any future drawer.

---

## 3. CSS variable architecture (this is what makes it flexible)

Settings are emitted **once** as custom properties on the dialog; every rule reads a variable, so
no rule needs editing when a setting changes:

```liquid
<dialog ref="panel" class="theme-drawer__dialog color-custom-drawer" style="
  --theme-drawer-width: {{ settings.cart_drawer_width }}px;
  --cart-drawer-thumb: {{ settings.cart_drawer_thumbnail_size }}px;
  --cart-drawer-row-gap: {{ settings.cart_drawer_row_gap }}px;
">
```

`--theme-drawer-width` is the variable **Horizon already reads** for both the panel width and the
page push (`assets/base.css:65,70`), so setting it drives width for free. The push is then killed
separately — otherwise a 320px width would also push the page 320px:

```css
.page-wrapper--drawer-open { margin-right: 0; }   /* when cart_drawer_push_page is false */
```

Colour and type keep reading Layer 1 tokens (`--color-spy-orange`, DIN stack) — **no hex in the
drawer CSS**, per rule 3b.

---

## 4. Pixel targets (source, measured)

```
panel      320 x 100vh · #ffffff · no left border · fixed right
           closed translateX(320px) · .426s cubic-bezier(.5,.25,0,1)
           page NOT pushed · body scroll NOT locked

header     319 x 41 · border-bottom 1px #e6e6e6
  icon     16 x 14   (spy-fa-bag.svg)  · 16px from panel left
  title    "Your Cart (N)" 13 / 18.2 / 600 · #1d2a2b · 8px after icon
  close    46 x 40 · padding 8 16 · x glyph

list       flex: 1 1 auto · overflow-y: auto   (footer is a static sibling, not sticky)
row        319 x 198 · padding 16 · NO border, NO gap
  image     95 x 95 · margin-right 15
  name      15 / 18 / 700 · #1d2a2b · margin-bottom 4.7 · links to PDP
  remove    x · 26 / 36.4 · #ccc · top-right · no hover change
  attr      "Color:" 13/600 + value 13/400
  qty       "Quantity : N" right · label 13/600 + count 13/400
  price     right · 16 / 22.4 · #222 · margin-top 16
  strike    #ababab · margin-right 4

footer     319 x 122 · padding 0 16 16
  total    "Estimated Total" 16/600 + value 16/600 · margin 16 0
  cta      287 x 51 · #f27e37 (token) · #fff · 12 / 16.8 / 400
           uppercase · radius 0 · hover bg #272727
```

Identical at 1440 / 768 / 390 — the source drawer has **no breakpoint behaviour at all**, which
makes CLAUDE.md rule 7 (per-breakpoint settings) a no-op here. Worth stating in the sign-off.

---

## 5. Regression guards

1. **Cart page is signed off at 1:1** — every guard is `context == 'drawer'`, and the page must be
   re-shot at 1440/768/390 after each step.
2. `theme-drawer-header.liquid` has one consumer, but confirm with a grep before editing.
3. Horizon's AJAX hooks stay untouched: `ref="cartItemRows[]"`, `on:click="/onLineItemRemove/N"`,
   `cart-items-component`. Replacing the stepper with text must not remove the row refs.
4. `--theme-drawer-width` is shared with other drawers (`base.css`); scope the override to
   `#cart-drawer` so the mobile nav drawer keeps its width.
5. Tailwind utilities are `!important` inside a layer — cap type with `max-width`, not `width`
   (see `tailwind-important-beats-unlayered`).

## 6. Sequence

1. Settings schema + data (no visual change yet, everything defaults to source values)
2. CSS variable plumbing on the dialog + width/push/scroll — biggest visual win
3. Header (icon, title, rule, close)
4. Line item (padding, image, type, quantity→text, gap/dividers)
5. Footer (drop modules, CTA label/target/style)
6. Empty state
7. `auto_open_cart_drawer` (auto-close behaviour pending §7.2)
8. `npm run build:css`, re-shoot both drawer and cart page at all three widths

## 7. Decisions

### 7.1 Settled

1. **CTA destination — `Go to cart` → `routes.cart_url`**, solid orange, source parity.
   `cart_drawer_cta_target` defaults to `cart`.
2. **Title case — CSS, drawer only.** `text-transform: uppercase` scoped to `#cart-drawer`;
   `product_title_case` stays `default`, so the cart page and the rest of the site are untouched.

### 7.2 OPEN — auto-close on add-to-cart (needs re-verification)

**My earlier "~1.5 s then auto-closes" was imprecise.** Re-reading the actual timeline, with no
mouse movement and no clicks between polls:

| elapsed (approx) | state |
|---|---|
| ~0.6 s | closed |
| ~1.5 s | **OPEN** |
| ~4 s | closed |
| ~11 s | closed |

So it *opened* by 1.5 s and *closed by itself* somewhere between 1.5 s and 4 s — a visible
duration of roughly 2.5–3.5 s, not a 1.5 s dismiss. The close was genuine: no pointer input
occurred.

**Separately**, when the drawer is opened *manually* from the header bag, it was still open after
a 2.5 s wait and only closed on an explicit outside click. 2.5 s is inside the window above, so
that observation does **not** prove manual-open persists.

Both can be true at once — ATC-open auto-dismisses, manual-open persists — which is a common SFCC
pattern and is consistent with your recollection, since clicking the bag is the case you'd
naturally have tried.

**I cannot re-verify right now:** spyoptic.com is serving the bot challenge to this machine on
every profile (`title: spyoptic.com`, empty body) after this session's crawling. Retry later from
a clean IP, or confirm from your own browser:

> add something to the cart, do not touch the mouse, and watch whether the drawer closes on its
> own within ~4 s — then open it again from the bag icon and see whether *that* one persists.

Until that is settled, the build ships `auto_open_cart_drawer: true` with **no auto-close timer**
(the better UX, and what you remember). Adding a timer later is a one-line change behind a
setting.

### 7.3 Still open

**Approaching-discounts bar** — could not trigger it (test cart was over the $50 free-ship
threshold), so I have the container but not its populated markup. Leaving the slot empty unless
you want me to chase the real design.

---

## 10. Build status — 2026-09-22

Built against the plan. **12 existing files changed, zero new sections or blocks.**

`config/settings_schema.json` · `config/settings_data.json` · `snippets/cart-drawer.liquid` ·
`snippets/cart-products.liquid` · `snippets/cart-summary.liquid` ·
`snippets/theme-drawer-header.liquid` · `assets/cart-drawer.js` ·
`assets/component-cart-items.js` · `locales/en.default.json` · `src/tailwind.css`
(+ built `assets/tailwind.css`)

### Verified on the dev server

| Check | Result |
|---|---|
| Panel width @1440 / 768 / 390 | **320 / 320 / 320** at x=1120 / 448 / 70 — matches source |
| Page push | gone — `.page-wrapper` stays 1440, `margin-right: 0` |
| Stacking | drawer now paints **over** the pinned header (hit test returns the drawer title) |
| Grid tracks | `95px 178px` — source is 95 + 177 |
| Header | 320x41, bag icon 16x14, "Your Cart (4)" 13/18.2/600 `#1d2a2b`, 1px `#e6e6e6` rule, close 46x40 |
| Quantity | read-only "Quantity : 2", right-aligned — stepper gone |
| Remove | top-right, `#cccccc` |
| Line price | right, 16/22.4, `#222222` |
| Discount / subtotal / tax note | all absent from the drawer |
| CTA | `<a href="/cart">` "Go to cart", `#f27e37`, 288x52, uppercase |
| **Cart page regression** | **clean** — promo form intact, stepper intact, `Check out` button intact, and Horizon's 2px `.cart-actions` remnant is now gone |

### Two things fixed that the plan did not predict

1. **Grid areas.** In drawer context Horizon sets `.cart-items__details { display: contents }` and
   places `variants` / `unit_price` / `error` areas. A two-area template collapsed the details
   column to 0 and wrapped the title one letter per line. The template now names all five rows and
   targets `.cart-items__product-info`.
2. **z-index.** The dialog is **non-modal on desktop**, and the SPY header is `z-50`, so Horizon's
   `--layer-sticky` (8) put the drawer *under* the header. Set to **51**, matching the source.

### Not yet verified

- **Empty state** — the dev server died before this run. The Liquid is written (header and footer
  stay, centred "Your Shopping Cart is Empty", disabled CTA) but has not been seen rendered.
- **Final 768 / 390 screenshots** after the last two cosmetic edits (close-button shadow removed,
  bin icon swapped for the source's times glyph). Geometry was verified at all three widths
  *before* those two edits; both are cosmetic and low risk.
- **Auto-close on add** — shipped **off** (`cart_drawer_close_after_add: false`) pending §7.2.
  `auto_open_cart_drawer` is **on**.

Blocker at time of writing: `shopify theme dev` and `shopify theme list` both abort
("socket hang up" / "operation was aborted"), and spyoptic.com is still IP-blocked. Both need the
network back before the remaining checks can run.
