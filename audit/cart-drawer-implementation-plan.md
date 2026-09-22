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
| Never opens on ATC | `auto_open_cart_drawer` | unset (`false`) | **`true`** |
| Title case | `product_title_case` | `default` | **`uppercase`** (source titles render uppercase) |
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

### 2d. Pure CSS (`src/tailwind.css`, scoped to `#cart-drawer`)

- panel width, left border removal, transition timing
- header height/padding/rule, title type, count in parentheses
- line-item padding, image box, type scale, remove glyph
- footer padding, total row, CTA geometry and hover
- neutralise `.page-wrapper--drawer-open { margin-right }`

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
7. `auto_open_cart_drawer` + auto-close after ~1.5 s
8. `npm run build:css`, re-shoot both drawer and cart page at all three widths

## 7. Decisions I need from you

1. **CTA destination** — source sends people to the cart page (`Go to cart`), ours goes straight
   to checkout. I've defaulted the setting to `cart` for source parity, but this changes your
   funnel. Confirm, or set it to `checkout` and accept the copy difference.
2. **Auto-open + auto-close on ATC** — the source opens for ~1.5 s then closes itself. That is
   unusual and arguably worse UX. Match it, or auto-open and leave it open?
3. **`product_title_case: uppercase`** is global — it would uppercase titles on the cart page too.
   Source titles are uppercase in the catalog data, so this is cosmetic parity, not a data fix.
   Apply globally, or scope to the drawer in CSS?
4. **Approaching-discounts bar** — I could not trigger it (test cart was over the $50 free-ship
   threshold), so I have the container but not its populated markup. Leave the slot empty for now,
   or do you want me to chase the real design?
