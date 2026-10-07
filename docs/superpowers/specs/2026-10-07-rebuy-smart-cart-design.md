# Rebuy Legacy Smart Cart as the mini-cart — design

Date: 2026-10-07
Status: approved, ready for implementation planning
Target launch: **1 November 2026**
Spec of record for the visual target: `audit/page-spec-cart-drawer.md` (§1–§10)

---

## 1. Goal

Make Rebuy's **Legacy Smart Cart** the mini-cart on `spyoptic-com.myshopify.com`, without
losing the pixel-perfect drawer already built and signed off, and without making the cart
depend on cookie consent.

Non-goals this round: PDP recommendation widgets, cart-page changes, Rebuy search,
post-purchase offers. The cart *page* stays exactly as signed off.

---

## 2. Ground truth established before designing

All verified in-session, not assumed:

| Fact | Source |
|---|---|
| Rebuy installed on production with `write_cart_transforms`, `write_script_tags` | `appInstallations` query |
| Rebuy global embed enabled, renders nothing today | `config/settings_data.json` |
| Rebuy costs ~33 KB home / ~280 KB PDP, ~190–260 ms script, every page | `audit/ada-performance-report.md` |
| `spy-v2/main` is the **published** theme; a Development theme exists | `themes` query |
| Store is on **Legacy** Smart Cart, so theme `.liquid` templates are honoured | confirmed from the Rebuy admin |
| Smart Cart **v2 ignores theme-file templates** | Rebuy help centre |
| Consent is **Strict for every visitor**; 0 Rebuy requests before a choice | `audit/ga4-status.md`, verified live 2 Oct, decline path 5 Oct |
| Drawer already matches source within 1px | `audit/page-spec-cart-drawer.md` §10 |
| `@source "../snippets/**/*.liquid"` already in the Tailwind config | `src/tailwind.css:102` |

### The decision that shaped everything

Consent is Strict. Rebuy does not load until the shopper answers the banner, and **Decline is
a real, measured path**. If Rebuy were the only cart, a shopper who declines would have no
mini-cart. That is unacceptable for core commerce, so Rebuy is an **enhancement**, never the
baseline.

---

## 3. Architecture

```
                         ┌─ Rebuy loaded (consent granted) ──► Smart Cart  (+ cross-sell rail)
  bag click ──► coordinator ─┤
                         └─ Rebuy absent / blocked / errored ─► theme drawer (unchanged)
```

Two engines, **one visual spec**, consent decides which runs.

The theme drawer is not a second build. It exists, it is verified, it is signed off. We keep
it. The new work is the Smart Cart template built to the *same* measured tables, so the
handoff is invisible to the shopper.

The only visible difference between the two paths is the cross-sell rail, which appears only
on the consented path. That is correct: personalization requires consent.

### Trade-off, recorded once

With the fallback in place, what the shopper sees converges on "keep the drawer, add a Rebuy
widget". The delta being bought is **Rebuy owning cart state when it is loaded** — its rules
engine, cart-level offers, and cart analytics. That is the whole delta, and it was chosen
knowingly.

### Shelf life

Legacy Smart Cart is the generation Rebuy is steering installs away from. v2 does not read
theme templates at all. This build is therefore time-limited; a future v2 migration moves the
template into Rebuy's admin editor and out of git. Recorded so it is not a surprise.

---

## 4. Files

| File | Change | Kind |
|---|---|---|
| `snippets/rebuy-cart-template.liquid` | Vue template, 1:1 to spec | new |
| `assets/spy-cart-handoff.js` | picks the engine for the bag click | new |
| `layout/theme.liquid` | render template before `</body>`; load coordinator | edit |
| `config/settings_schema.json` | rail toggle, heading, widget ID | edit |
| `config/settings_data.json` | values for the above | edit |
| `src/tailwind.css` | rail styles, Rebuy-scope overrides | edit |
| `snippets/cart-drawer.liquid` | one `data-cart-engine-fallback` attribute for the coordinator to read; **no visual change** | edit |

Untouched by design: `templates/cart.json`, `snippets/cart-products.liquid`,
`snippets/cart-summary.liquid`, `assets/cart-drawer.js`. The drawer keeps working exactly as
it does today.

---

## 5. The Liquid / Vue boundary

Rebuy's template must sit inside a Liquid `raw` block so Liquid does not consume Vue's
mustache syntax. Consequence: **no theme setting can be interpolated inside the template
body.**

Pattern (same shape as the existing Liquid-built-class constraint):

- Emit a wrapper **outside** the raw block carrying Layer 1 tokens as CSS custom properties.
- The Vue markup **inside** the raw block consumes `var(--cart-drawer-thumb)` and friends.
- Tailwind utility classes inside the raw block stay **literal**, never assembled, so the
  compiler can see them.

Both engines then read one set of settings. That is also the mechanism that stops the two
carts drifting apart.

---

## 6. Template → spec mapping

Built against `audit/page-spec-cart-drawer.md` §10, using Rebuy's documented Legacy API
(`items()`, `removeItem()`, `subtotal()`, `hasCrossSells()`).

### Panel
- **320px at every breakpoint.** Overlay only — no page push, no body scroll lock, no left border.
- Closed state `translateX(320px)`; transition `.426s cubic-bezier(.5,.25,0,1)`.
- Backdrop undimmed (matches source).

### Header — 41px
- Bag icon 16×14 at `rx17 / y13`
- `Your Cart (N)` — 13 / 18.2 / **600**, `#1d2a2b`, count **inline in parentheses**
- Close 46×40 at `rx274`
- 1px `#e6e6e6` bottom rule

### Line item
- Rows **contiguous** — no gap, no bottom border; padding 16 all round
- Image **95×95** at `rx17`; grid track `calc(var(--cart-drawer-thumb) + 15px)` so the 15px
  gutter lives inside the track
- Name 15 / 18 / **700** `#1d2a2b`; variant line 13 / 18.2 / 400
- **Quantity read-only**: `Quantity : N`, right-aligned, label 600 + value 400.
  Rebuy ships steppers — `increaseItem()` / `decreaseItem()` are deliberately not rendered.
- Remove glyph `#cccccc`, `position:absolute`, `top 8 / right 16` (keeps row height honest)
- Line price right, 16 / 22.4, `#222222`; no currency code suffix

### Footer — 122px, pad `0 16 16`
- **Single** `Estimated Total` row, 16 / 22.4 / 600
- No discount accordion, no subtotal row, no tax note (drawer context only — the cart page
  keeps its own)
- CTA **287×51**, solid `--color-spy-orange`, white, 12 / 16.8, uppercase, radius 0
- Label **`GO TO CART`**, target `routes.cart_url` — a link, not a checkout submit

### Empty state
- Header stays: `Your Cart (0)` + close
- Centred "Your Shopping Cart is Empty"
- Footer stays: Estimated Total `$0` + **disabled** `GO TO CART`

### Behaviour
- Click outside closes · close button closes · **Esc does not close**
- Auto-open ~1.5 s after add-to-cart, then auto-close. Configured so **exactly one** engine
  does this — see §8.

---

## 7. Cross-sell rail

Position: directly above the Estimated Total — the same slot the source itself exposes as
`.minicart-recommendations` (present but empty on US). The addition is therefore
spec-consistent rather than invented.

Usable width is 288px (320 − 2×16), too narrow for a product carousel. Treatment:

- **Compact rows**: 56×56 thumb · title · price · add button
- Capped at **3**, vertically scrollable beyond that
- Heading and Rebuy widget ID are theme settings, not hard-coded
- Rendered only when `hasCrossSells()` is true — collapses to nothing otherwise

Appears only on the consented path, by construction.

---

## 8. Settings (Layer 1 / Layer 2)

Reuse the existing `settings.cart_drawer_*` tokens so both engines read identical values.

New:

| Setting | Type | Purpose |
|---|---|---|
| `cart_drawer_crosssell_enabled` | checkbox | master toggle for the rail |
| `cart_drawer_crosssell_heading` | text | rail heading |
| `cart_drawer_crosssell_widget_id` | text | Rebuy widget ID, editable without code |

Auto-open parity is a **configuration** task, not code: Smart Cart's own auto-open is set in
the Rebuy admin to match the theme's `auto-open` + `close-after-add`, and the coordinator
guarantees only the active engine acts.

---

## 9. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Double-bind.** Rebuy auto-attaches to cart triggers; Horizon's `theme-drawer` has its own. Both could open, or race. | **Timeboxed spike as build step 1**, before any styling. Everything else depends on the answer. |
| R2 | Rebuy's injected stylesheet fighting Tailwind. Our utilities are `!important` inside a layer and should win, but load order is Rebuy's. | Verify in the same spike; scope overrides under the Rebuy root if needed. |
| R3 | The two carts drift apart over time. | Both driven from one set of CSS custom properties (§5); the spec tables are the shared contract. |
| R4 | Legacy is a dead-end generation. | Recorded in §3. Migration path is understood, not urgent. |
| R5 | Cents: source prints `$200`, we print `$130.00`. | Pre-existing, store-wide currency formatting. **Out of scope** — do not "fix" in CSS. |

---

## 10. Definition of done

- Panel and line-item geometry within 1px of `audit/page-spec-cart-drawer.md` §10 at
  **1440 / 768 / 390**
- **Both paths verified**: consent granted → Smart Cart; consent declined → theme drawer.
  Screenshots at all three widths for each.
- Quantity read-only; remove still works over AJAX
- Rail renders on the consented path, collapses cleanly on the declined path
- **Cart page regression-checked** at all three breakpoints — unchanged
- No console errors
- `npm run build:css` run
- Pushed to the staging theme and signed off
