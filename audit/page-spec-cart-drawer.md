# Cart drawer (mini-cart) — measured spec + gap analysis

Date: 2026-09-22

**Source:** live `https://www.spyoptic.com/us/` (`Sites-SPYOptic_US-Site`), minicart opened from the
header bag icon with 2 line items. Measured at 1440 / 768 / 390 with playwright-core + system
Chrome on a warmed profile. Raw dump: `audit/cart-drawer-source-measurements.json`.

**Ours:** `shopify theme dev` on `spydevsylv.myshopify.com` (theme `spy-v2/main`), same three
widths, 2 line items, drawer opened via `[data-testid="cart-drawer-trigger"]`.

Both sides are **computed styles off a live render** — no values below are inferred from code.

The drawer is **stock Horizon, untouched**: `src/tailwind.css` contains zero cart-drawer rules.
The cart *page* was built 1:1 (commit `05ff871`) and deliberately scoped to `.cart-page` so the
drawer kept Horizon's layout (`audit/page-spec-cart.md` → "Constraints on the implementation").
Nobody came back for the drawer, so this is a missing component, not drift.

---

## 1. Panel / shell

| Property | Source | Ours | Verdict |
|---|---|---|---|
| Width @1440 | **320** | **480** | +160 (50% too wide) |
| Width @768 | **320** | **480** | +160 |
| Width @390 | **320** | **390 (full-bleed)** | +70, and the source never goes full-width |
| Height | 900 (`100vh`), `top:0` | 900 (`100dvh`) | ok |
| Background | `#fff` | `#fff` | ok |
| Left border | none | **`1px solid #e5e5e5`** | extra |
| Backdrop | `.modal-background` stays `opacity:0 / visibility:hidden` | `::backdrop` = `rgba(0,0,0,0)` | **both undimmed — matches** |
| **Page push** | **none** — overlays the page | **@1440 `.page-wrapper` 1440 → 960, `margin-right:480px`** | **wrong**, and only at 1440 |
| **Body scroll lock** | **none** at every width | **`overflow:hidden` @1440**; free at 768/390 | **wrong**, and inconsistent |
| `:modal` | n/a (plain div) | `false` @1440, `true` @768/390 | inconsistent |
| Transition | `top .426s cubic-bezier(.5,.25,0,1), transform .426s …` | `all` + `drawer-slide-in` keyframe | not matched |
| Closed state | `translateX(320px)` | `right: -480px` | same direction |
| z-index | `51` | `8` | check against header |

## 2. Open / close behaviour

| Trigger | Source | Ours |
|---|---|---|
| Header bag click | opens | opens |
| **Add to cart** | **auto-opens ~1.5 s, then auto-closes** | `auto_open_cart_drawer` unset → default `false`, never opens |
| Click outside | closes | closes |
| `×` button | closes | closes |
| **Escape** | **does not close** | closes (native dialog) |

## 3. Header

| | Source `319 × 41` | Ours `479 × 74` |
|---|---|---|
| Padding | title `pl-3` (16) `py-2` (8) | `20px` all round |
| Icon | `far fa-shopping-bag` 16×14 | **none** |
| Label | **"Your Cart (2)"** · 13 / 18.2 · **600** | **"Cart"** · 20 / 20 · **700** |
| Count | inline, in parentheses | separate **pill badge** 22×22, `rgba(44,57,62,.1)` |
| Bottom rule | **`1px solid #e6e6e6`** | **none** |
| Close | 46×40, `padding 8 16`, `fal fa-times` | 34×34 circular, `rgb(0 0 0 / .5)` |

## 4. Line item

| | Source | Ours |
|---|---|---|
| Row box | `319 × 198` | `439 × 161` |
| Row padding | `16` all round | `0 0 20` |
| **Gap between rows** | **0 — contiguous, no border** | **20px + bottom border** |
| Image | **95 × 95** (wrapper 95×166, `margin-right 15`) | **66 × 66** |
| Title | 15 / 18 · **700** · `#1d2a2b` | 16 / 22.4 · **400** · `#2c393e` |
| Variant line | `Color:` 13/600 + value 13/400 | `Medium, Demo W/ Spy+ Lens Print` 16/400 @70% opacity |
| **Quantity** | **static text `Quantity : 1`**, right-aligned | **stepper `− 2 +`**, 105×36 |
| Remove | `×` glyph, 26/36.4, `#ccc`, top-right | trash icon button 44×44, mid-row |
| Line price | right, 16 / 22.4, `#222` | right, **14 / 14**, `#2c393e` |
| Unit price | not shown | shown (`$85.00`) |

## 5. Footer

| | Source `319 × 122`, pad `0 16 16` | Ours `479 × 274`, pad `24` |
|---|---|---|
| Discount field | **none** | **`Discount` accordion** (`show_add_discount_code: true`) |
| Subtotal row | **none** | **`Subtotal $340.00`** |
| Total row | `Estimated Total` 16/600 | `Estimated Total` 16/400 |
| Tax note | **none** | **"Taxes and shipping calculated at checkout."** |
| CTA label | **`GO TO CART`** | **`CHECK OUT`** |
| CTA target | **`/us/cart`** (link) | **submits to checkout** |
| CTA style | `287×51` · **solid `#F27E37`** · white · 12/16.8 · uppercase · radius 0 | `431×52` · **white with 1px border** · `#1d2a2b` · 14/14 · uppercase |
| Express pay | none | slot present (none rendered on dev store) |

The footer is **2.2× the source's height** because of the three modules the source doesn't have.

## 6. Empty state

| | Source | Ours |
|---|---|---|
| Header | stays — "Your Cart (0)" + `×` | replaced by a **lone close button** |
| Body | `<div class="py-3 text-center">Your Shopping Cart is Empty</div>` | h2 "Your cart is empty" + **"Continue shopping"** button |
| Footer | **stays** — Estimated Total `$0` + **disabled** "Go to cart" | **absent** |

## 7. Source slots we have nothing for

- `.approaching-discounts-ctr` — free-shipping / approaching-discount bar under the header.
  Empty in every state captured (cart was over the $50 threshold), so its populated markup
  is **unverified**.
- `.minicart-error.cart-error` — inline error line.
- `.minicart-recommendations` — recommendation slot above the total. Empty on US.

## 8. Colour note

Source drawer text is `#1d2a2b`; ours is `#2c393e` (brand slate). Source CTA is `#F27E37`; per
CLAUDE.md rule 3b the build uses `--color-spy-orange #f57f29`. Keep the token — but the CTA must
become a **solid orange bar**, which it currently is not.

## 9. Fix list, highest impact first

1. **CTA**: label `Go to cart`, target `routes.cart_url`, solid orange fill, white text, 12px uppercase.
2. **Width 320px** at every breakpoint — override `--theme-drawer-width`, and stop the full-bleed at 390.
3. **Stop pushing the page** and stop locking body scroll at 1440; the source overlays at all widths.
4. **Quantity → read-only `Quantity : N`**, right-aligned; drop the stepper.
5. **Rows contiguous**: remove the 20px gap and bottom border; pad each row 16; image 95×95.
6. **Header**: bag icon + `Your Cart (N)` at 13/600 inline, 1px `#e6e6e6` rule, 46×40 close.
7. **Footer**: single Estimated Total row; drop the discount accordion, subtotal row and tax note
   **in drawer context only** — the cart page keeps its own.
8. **Empty state**: keep header + footer, centred "Your Shopping Cart is Empty", disabled CTA.
9. Turn on `auto_open_cart_drawer`, then add the source's auto-close after ~1.5 s.
10. Match transition `.426s cubic-bezier(.5,.25,0,1)`; drop the left border; stop ESC closing it.
11. Add the `approaching-discounts` / error / recommendations slots.

Everything must be guarded on drawer context — `cart-products.liquid` and `cart-summary.liquid`
are shared with the cart page, which is already signed off at 1:1.

## Definition of done

- Panel and line-item geometry within 1px of the tables above at 1440 / 768 / 390
- Quantity read-only; remove still works over AJAX
- **Cart page unaffected** — regression-check it at all three breakpoints
- No console errors · `npm run build:css` run · pushed to Staging v2
