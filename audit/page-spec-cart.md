# Cart page — measured spec (spyoptic.com US)

Date: 2026-08-05

Source: `reference/cart/Cart.html` — the real US `/us/cart` (`Sites-SPYOptic_US-Site`,
canonical `https://www.spyoptic.com/us/cart`), 10 line items, served locally with its own
`global.css` (6875 rules) live. Every value below is a **computed style**.

> **Font caveat.** The saved copy never loads DINNextLTPro, so box geometry and computed
> type values are trustworthy; rendered text widths are not. Same rule as the PLP samples.

## Layout — 1440

Container **1425**. Two columns, Bootstrap `col-md-7` + summary:

| Band | Box | Notes |
|---|---|---|
| `< CONTINUE SHOPPING` | 151 × 18 | above the heading |
| `Your Cart (17)` | — × 29 | `margin-bottom: 8` |
| Items column | 831 × 2075 | `col-md-7`, starts x=0 |
| Line item | 801 × 196 | x=15 |
| Order Summary | 564 × 269 | x=846, `#f8f8f8` |
| Promo form | 801 × 72 | **below** the items list, y=2258 |

## Type & colour

| Element | Size / line-height | Weight | Colour | Other |
|---|---|---|---|---|
| Continue shopping | 13 / 18.2 | 600 | `#393939` | uppercase |
| Cart heading | 24 / 28.8 | 600 | `#1d2a2b` | `mb 8` |
| Item name | 16 / 22.4 | **700** | `#1d2a2b` | `mb 5` |
| Item attributes | 13 / 18.2 | 400 | `#1d2a2b` | `Color: …` |
| `Quantity : N` label | 13 / 18.2 | 600 | `#1d2a2b` | inline |
| In Stock | 13 / 18.2 | 400 | **`#88c290`** | `mt/mb 4` |
| QUANTITY / REMOVE | 12 / 16.8 | 400 | **`#ababab`** | uppercase |
| Line price | 16 / 22.4 | 600 | `#222` | right |
| Compare-at | 16 | — | `#ababab` | `line-through` |
| Estimated Total row | 16 / 22.4 | 400 | `#1d2a2b` | right-aligned value |
| Checkout button | 14 / 19.6 | **400** | `#fff` on `#F27E37` | uppercase, radius 0 |

## Boxes

```
.product-info (line item)   801×196 · border 1px #e6e6e6 · padding 24
  .item-image               140×146 · margin-right 15
    img                     140×140
  .product-details          270 · flex column · justify-content center
  select (quantity)         100×36 · border 1px #e6e6e6 · 13px · centre
                            padding 6.4 / 8 / 6.4 / 4
.totals                     564 · #f8f8f8 · padding 16
.checkout-btn               532×54 · padding 16 · margin-top 16
.promo-code-form            801×72 · border 1px #e6e6e6 · margin-bottom 24
```

## Order Summary rows

Source renders five rows and **hides any that are zero**:

| Row | Source | Our build |
|---|---|---|
| Shipping (select) | `Standard delivery (3 to 5 days)` | **dropped** — no Shopify cart-page rate API |
| Shipping cost | `$0` | editable row, "Shipping cost / Calculated at checkout" (block settings) |
| Sales Tax | `$0` *(hidden at zero)* | **dropped** — checkout-only |
| Order Discount | `- $0` *(hidden at zero)* | kept, hidden at zero (automatic discounts) |
| Estimated Total | `$3,339` | `cart.total_price` |
| Checkout | ✓ | ✓ |

Subtotal row is off by default (`show_subtotal`); the source has none.

## Responsive

At **390** the item keeps image-left / details-right — it does *not* stack per item. The
summary column drops below the list. Item internals reflow: price sits under the QUANTITY
label, REMOVE moves below-right.

Breakpoint is Bootstrap `md` = **768** (`col-md-7`), matching the theme's container ladder.

## Re-verified against the LIVE page — 2026-09-23

Live `/us/cart` measured at 1440 / 768 / 390 (two line items). Source grid is Bootstrap
**769 / 992 / 1200**, not 768: items + summary go side by side from 769; the line-item row
is `col-lg-7` (image 33% + details) · `col-lg-2` quantity · `col-lg-3` remove/price from 992,
and below 992 quantity/price drop to a second row at `offset-4 col-4` · `col-4`. Row padding
`p-2 p-md-4`. Promo label sits beside the field only from 1200; under 544 a collapsible
"Enter promo code (optional)" header is added. Heading is fluid `calc(1.275rem + .3vw)`,
capped at 24px. Hovers: Checkout / Apply → `#272727`, Continue shopping → `#cf570d`.

Ours now lands within ~3px of every box above (the rest is scrollbar width and product copy).
Styling is Tailwind utilities in the markup, page-guarded, so the drawer is unaffected.

**Theme editor surface (no new files):**
- `main-cart` section — width "Container ladder (540/720/1140/1440)", side gutter, summary
  width (columns of 12), column gap, continue link on/off + label + URL, promo on/off + four copy fields.
- `_cart-products` block — quantity picker (dropdown | stepper), dropdown max, image max width,
  title case, show "Quantity : N", show stock.
- `_cart-summary` block — heading, subtotal row, shipping row label/value, checkout label,
  background (blank = `--color-spy-tile`).

## Deviations from the source (deliberate)

1. **Shipping / tax rows dropped.** Shopify cannot compute either on the cart page.
2. **Promo code** posts to `/discount/{CODE}?redirect=/cart` — Shopify has no cart-page
   discount API, but that route applies a code and returns.
3. **One orange.** `--color-spy-orange #f57f29` for the checkout button, not the source's
   `#F27E37` (≤14/255 on one channel), per CLAUDE.md rule 3b.
4. **Recommendations band removed** — the source cart has none.
5. **Quantity is a `<select>`** (block setting), matching the source. It dispatches Horizon's
   own `QuantitySelectorUpdateEvent` via `onQuantitySelect`, so AJAX/morphing is unchanged.
6. **Cents.** Source prints `$800`, we print `$800.00` — the shop's currency format
   (Admin → Settings → Currency formatting), site-wide; needs a business decision.

## Constraints on the implementation

- `snippets/cart-products.liquid` and `cart-summary.liquid` are **shared with the cart
  drawer** (`context == 'drawer'`). Every change must be scoped to the page, or guarded on
  `context`, so the drawer keeps its own layout.
- Horizon's quantity/remove AJAX runs off `ref="cartItemRows[]"`, `on:click="/onLineItemRemove/N"`
  and `cart-items-component`. Those hooks stay untouched.
- Styling goes in `src/tailwind.css` (rule 9). The existing `{% stylesheet %}` blocks in the
  Horizon snippets are stock code and are left alone rather than rewritten.

## Definition of done

- Card geometry within 1px of the table above at 1440 / 768 / 390
- Quantity change and remove still work (AJAX, no page reload)
- Cart drawer unaffected
- No console errors
- `npm run build:css` run
