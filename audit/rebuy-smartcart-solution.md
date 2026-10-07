# Rebuy Smart Cart — the full implementation solution

Date: 2026-10-07
Target: `audit/page-spec-cart-drawer.md` §10 — the measured 1:1 source mini-cart
Supersedes the task breakdown in `docs/superpowers/plans/2026-10-07-rebuy-smart-cart.md`, which assumed
Legacy Smart Cart. That plan's Tasks 0, 1, 3 and 8 survive unchanged; Tasks 2 and 4–6 are re-cut here.

Evidence behind every claim: `audit/rebuy-smartcart-spike.md` (this store),
`audit/rebuy-blenders-research.md` (a production Rebuy Smart Cart at the same company),
`audit/rebuy-smartcart-settings.md` (Rebuy's own settings list).

---

## 1. The architecture

```
                         ┌─ Rebuy loaded (consent granted) ──► Smart Cart  (+ cross-sell rail)
  bag click ──► coordinator ─┤
                         └─ Rebuy absent / blocked / errored ─► theme drawer (unchanged, signed off)
```

**Rebuy is an enhancement, never the baseline.** Consent on this store is Pandectes **Strict**, and it is
measured that **0 Rebuy requests fire before the shopper answers the banner**. Decline is a real path. If
Rebuy owned the cart outright, anyone declining would have no cart at all. The existing theme drawer —
already verified to 1px — stays as the fallback and is not touched.

### Five layers, and which one owns each requirement

| Layer | Lives in | Owns |
|---|---|---|
| **L1 Rebuy settings** | Rebuy admin (**outside git**) | which modules exist, quantity input, button set, labels, auto-open |
| **L2 Scoped CSS** | `src/tailwind.css`, scoped `#rebuy-cart` | all geometry, type, colour — the bulk of the work |
| **L3 Widget template** | `snippets/rebuy__cart-crosssell.liquid` | the cross-sell rail only — full Vue control, ours |
| **L4 Theme JS** | `assets/spy-cart-handoff.js` | engine selection, Esc suppression, undoing Rebuy's scroll lock |
| **L5 Fallback** | existing `snippets/cart-drawer.liquid` | the whole cart when Rebuy is absent — unchanged |

The important consequence: **on Smart Cart v2 the cart's own markup is not ours.** L2 is how we hit the
spec, exactly as Blenders does it with ~300 scoped rules. Only L3 is template-controlled, because a widget
in the `.rebuy-cart__custom-widget` slot still accepts a theme-side template on either generation.

---

## 2. Every spec requirement, mapped to its mechanism

### Panel

| Requirement | Mechanism |
|---|---|
| 320px at every breakpoint | **L2** `#rebuy-cart .rebuy-cart__flyout { width: 320px }` (Blenders sets 375px this way) |
| Overlay only — no page push | **L2** `:root[data-cart-engine="rebuy"] .page-wrapper { margin-right: 0 }` |
| No body scroll lock | **L4** — Rebuy locks scroll itself; we undo it. Source never locks. |
| No left border, radius 0 | **L2** |
| `translateX(320px)` closed, `.426s cubic-bezier(.5,.25,0,1)` | **L2** |
| Backdrop undimmed | **L2** on `.rebuy-cart__flyout__background` |
| Sits above the header | **L2** z-index, checked against the header's own stacking |

### Header

| Requirement | Mechanism |
|---|---|
| 41px tall, 1px `#e6e6e6` rule | **L2** |
| Close button 46×40 | **L2** |
| `Your Cart (N)` 13 / 18.2 / 600 `#1d2a2b` | **L2** type; **L1** label text |
| Count **inline in parentheses** | **L1** if the language setting allows `(N)`; else **component template** ⚠️ |
| Bag icon 16×14 at `rx17 / y13` | **L2** `::before` with an inline SVG data URI (decorative, so no a11y cost) ⚠️ |
| Title renders as `h2` | **L1** Accessibility Heading Level |

### Line item

| Requirement | Mechanism |
|---|---|
| Rows contiguous, padding 16, no border | **L2** |
| Image 95×95, 15px gutter inside the track | **L2** (`max-width: none` — `base.css` sets `img{max-width:100%}`) |
| Name 15 / 18 / 700 · variant 13 / 18.2 / 400 | **L2** |
| **Read-only `Quantity : N`** | **L1** `Enable Quantity Input` → **off**. The literal `Quantity :` label may need **L2** `::before` or a component template ⚠️ |
| Remove glyph `#cccccc`, absolute `top 8 / right 16` | **L2** |
| Line price right, 16 / 22.4, `#222222` | **L2** |
| No currency code suffix | **L1** — Rebuy formats money itself; the theme's own setting does not reach it |

### Footer

| Requirement | Mechanism |
|---|---|
| 122px, padding `0 16 16` | **L2** |
| **Single** `Estimated Total` row, 16 / 22.4 / 600 | **L1** label + subtotal display; **L2** type |
| No discount accordion / subtotal row / tax note | **L1** all off |
| CTA 287×51, solid orange, white, 12 / 16.8, uppercase, radius 0 | **L2** |
| Label `GO TO CART`, target `/cart` | **L1** — Checkout Button **off**, **View Cart Button on** |

### Empty state

| Requirement | Mechanism |
|---|---|
| Header + footer stay, CTA disabled | **L1** / **L2** |
| Centred "Your Shopping Cart is Empty" | **L1** empty-cart language |
| No "Shop Now" link | **L1** if removable; **CSS-hiding is not acceptable** — a hidden focusable link stays in the accessibility tree and fails WCAG 2.1 AA ⚠️ |

### Behaviour

| Requirement | Mechanism |
|---|---|
| Click outside / close button closes | Rebuy default |
| **Escape does not close** | **L4** keydown capture, rebuy engine only |
| Auto-open ~1.5s after add, then auto-close | **L1**, matched to the theme drawer's existing `auto-open` / `close-after-add`; **L4** guarantees only one engine acts |
| Bag bubble + subtotal stay in sync | **L1** Theme Selectors → `.cart-bubble__text-count`, `.cart__subtotal-container` |

### The rail (the only new element)

Sits above the Estimated Total — the same position as the source's own `.minicart-recommendations` slot,
so it is spec-consistent rather than invented.

| Requirement | Mechanism |
|---|---|
| Rebuy In-Cart Recommendations in the custom-widget slot | **L1** |
| Compact rows: 56×56 thumb · title · price · add | **L3**, our own Vue template |
| Max 3, scrollable | **L3** |
| Heading + widget ID editable | theme settings, passed in outside the `raw` block |

Usable width is 288px (320 − 2×16) — too narrow for a product carousel, hence compact rows.

**The rail's bindings are already known**, harvested from Blenders' production widget template, so this
does not wait on anything: `products`, `product.selected_variant`, `variantPrice()`,
`variantCompareAtPrice()`, `itemImage(product, variant, '400x400')`, `formatMoney()`, `variantAvailable()`.
Tailwind utilities work inside a Rebuy template — but write `[display:flex]`, since Horizon's `base.css`
owns `.flex`.

---

## 3. The four ⚠️ items

These are the only requirements not satisfied by settings or CSS. Each needs an answer before the
corresponding build step:

1. **Read-only quantity.** Does `Enable Quantity Input = off` render static text, or nothing? If nothing,
   the `Quantity : N` line has to come back through a component template.
2. **The literal `Quantity :` label.** Likely a `::before`, unless Rebuy's language settings expose it.
3. **Count format `(N)`.** Inline parentheses may or may not be configurable.
4. **Empty-cart "Shop Now" link.** Must be genuinely removable, not hidden.

None is a blocker on its own. Together they decide how much component-template work sits in the Rebuy
admin — i.e. how much of this build lives outside version control.

---

## 4. Build order

| # | Step | Status |
|---|---|---|
| 0 | Spike — dump the real template, build the binding map | **blocked** on Smart Cart being enabled |
| 1 | Measurement harness | ✅ **done**, `72fa228`, review approved |
| 2 | Apply the L1 settings per `audit/rebuy-smartcart-settings.md`, in **Preview**, unpublished | ready for the store owner |
| 3 | Coordinator + fallback (`spy-cart-handoff.js`) | ready — pattern validated by Blenders production code |
| 4 | L2 panel + header | after 0 and 2 |
| 5 | L2 line items + the quantity answer | after 0 and 2 |
| 6 | L2 footer, CTA, empty state | after 0 and 2 |
| 7 | L4 behaviour parity — Esc, scroll lock, auto-open arbitration | after 3 |
| 8 | L3 cross-sell rail | **unblocked** — bindings already known |
| 9 | Verification, both paths × three widths, cart-page regression | last |

Step 3 is deliberately **not** done yet: the coordinator arbitrates a collision we have not been able to
observe, and writing it blind means rewriting it.

### The coordinator, with the bug Blenders has

Blenders owns the bag click and calls `Rebuy.SmartCart.show()` explicitly rather than letting Rebuy
auto-bind — that resolves the double-bind risk without a spike. But their `e.preventDefault()` runs
**before** the Rebuy check, on a real `<a href="/cart">`. If Rebuy never loads, the click is cancelled and
the listener waits forever: **the bag does nothing.** Ours must only `preventDefault()` once it is certain
it is about to open something, and otherwise fall through to the theme drawer or the `/cart` link.

---

## 5. Verification

Unchanged from the plan, and already enforced by `scripts/cart-measure.mjs`:

- `--engine=rebuy` (consent granted) and `--engine=theme` (consent **declined**) at **1440 / 768 / 390** — six runs, all 0 drift
- The harness fails on a missing or hidden element, validates `--engine`/`--width` so a typo cannot print a mislabelled green, compares raw unrounded pixels, and asserts the panel is 320px **and narrower than the viewport** (the full-bleed check)
- Tasks 5 and 6 extend it first with quantity, remove, footer and total — including **absence** assertions, so a drawer that wrongly carries a discount accordion fails
- Cart page regression-checked at all three widths
- Deliberate test: block `rebuyengine.com`, reload, confirm the theme drawer still opens and works
- Console clean on both paths · `npm run build:css` run

---

## 6. If it comes back Legacy

Then the cart template is ours, authored at `snippets/rebuy-cart-template.liquid` in git and styled in
Tailwind. L2 shrinks dramatically, all four ⚠️ items disappear (they become markup we write), and the
original plan stands as written. That is the better outcome; it is just not the one the evidence predicts.

---

## 7. Open decisions for the business

1. **`GO TO CART` vs checkout.** The source routes the mini-cart CTA to the cart page. Rebuy's own advice
   is to go straight to checkout, and that would very likely convert better. We are matching the source by
   default — this is a commercial call, not a design one.
2. **Rebuy's weight.** Rebuy costs ~190–260ms of script on every page today for features nobody sees.
   Blenders lazy-loads `rebuy.js` on first shopper intent. Worth adopting — **but it must fire after an
   explicit consent grant**, since a hand-rolled loader bypasses Pandectes' auto-blocker and SPY has
   already had to fix a Rebuy-before-consent leak once.
3. **Legacy's shelf life.** If Legacy is available and we take it, a future forced migration to v2 moves
   the template out of git into Rebuy's admin. Worth knowing before choosing it.
