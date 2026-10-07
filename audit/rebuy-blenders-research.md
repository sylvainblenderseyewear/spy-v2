# How Blenders runs Rebuy — research against `reference/blenderseyewear`

Date: 2026-10-07
Why: SPY is about to build a Rebuy Smart Cart mini-cart. Blenders is the same company running Rebuy
Smart Cart **in production today**, so its theme is the best available evidence for what is actually
achievable. Read before trusting `docs/superpowers/plans/2026-10-07-rebuy-smart-cart.md`.

Everything below is read off the theme files, not inferred.

---

## 1. What Blenders actually runs

| Surface | Implementation |
|---|---|
| Mini-cart | **Rebuy Smart Cart** (`#rebuy-cart`, `.rebuy-cart__flyout`) |
| PDP add-ons | Rebuy widget, theme-side template, Swiper carousel |
| Recently viewed (PDP + cart) | Rebuy widgets, theme-side templates |
| Search | Rebuy-powered (`sections/rebuy-search-results.liquid`, `templates/search.rebuy.json`) |
| Cross-sell inside the cart | Rebuy widget in the `.rebuy-cart__custom-widget` slot |

## 2. Template control: widgets yes, Smart Cart no

| | Count | Files |
|---|---|---|
| Rebuy **widget** templates overridden from theme files | **4** | `rebuy__popular-add-ons`, `rebuy__popular-add-ons-plus-icon`, `rebuy__product-recently-viewed`, `rebuy__product-recently-viewed-on-cart` |
| Rebuy **Smart Cart** templates overridden from theme files | **0** | — |

Widgets use the documented pattern:

```liquid
<script id="rebuy-widget-{% endraw %}{{rebuy_widget_id}}{% raw %}" type="text/template">
```

There is no `rebuy-cart-template` snippet anywhere in the theme. **The Smart Cart markup is Rebuy's.**

### The proof it is not a choice

`snippets/rebuy-delivery-range-shim.liquid` (159 lines) traps `Rebuy.SmartCart` with
`Object.defineProperty` and stubs `deliveryRange()` and `progressBar.tiers`, because the Rebuy-hosted
template **calls functions the account does not provide** and Vue throws without them.

If Blenders could edit that template they would delete the offending call in one line. Instead they
monkey-patch the runtime so markup they do not control stops throwing. That is Smart Cart **v2**
behaviour: *"the new Smart Cart templates do not accept templates from the theme files."*

## 3. The real Rebuy widget Vue API (harvested from production)

This is the binding map SPY's Task 0 could not obtain, because SPY has no Smart Cart and therefore no
templates on the page. Taken verbatim from `snippets/rebuy__popular-add-ons.liquid`.

**Data**

| Binding | Notes |
|---|---|
| `products` | the widget's product array |
| `product.selected_variant` | currently chosen variant |
| `product.title`, `product.product_type`, `product.tags`, `product.images[]`, `product.variants[]` | tags are a **single string**, matched with `product.tags.match(/rebuy::([^,]+)/)` |
| `id` | widget id, used as `'rebuy-widget-' + id` |
| `config.type`, `config.language.super_title`, `config.language.description`, `config.language.timer_title`, `config.timer.*` | widget config |

**Methods**

`stopPropagation($event)` · `currentLayout()` · `hasTimer()` · `variantAvailable(variant)` ·
`itemImage(product, variant, '400x400')` · `formatMoney(value)` · `variantPrice(product, variant)` ·
`variantCompareAtPrice(product, variant)` · `toggleProductSelect(product)`

**Smart Cart methods** (from `assets/product-popular-add-ons.js` and `assets/global.js`)

`Rebuy.SmartCart.show()` · `Rebuy.SmartCart.items()` · `Rebuy.SmartCart.decreaseItem(item)`

**Events** (from the shim and image fix)

`rebuy.ready` · `rebuy:ready` · `rebuy:cart.ready` · `rebuy:cart.show` · `rebuy:cart.change` ·
`rebuy:smartcart.didRender`

**Tailwind works inside a Rebuy template.** Blenders writes literal utilities directly in the Vue markup
(`flex justify-between items-center gap-8 w-full mb-4`, `text-[#30333d]`). SPY's planned approach for the
rail is sound — but SPY must write `[display:flex]`, since Horizon's `base.css` owns `.flex`.

## 4. Customising Smart Cart without template control

| File | Lines | What it does |
|---|---|---|
| `assets/theme.css` | **303 `#rebuy-cart` rule blocks** | restyles the full `.rebuy-cart__*` BEM surface |
| `snippets/rebuy-smartcart-image-fix.liquid` | 187 | MutationObserver on `#rebuy-cart`, swaps line-item and cross-sell images by product type, per-handle fetch cache |
| `snippets/rebuy-delivery-range-shim.liquid` | 159 | stubs missing template functions so Vue does not throw |
| `assets/global.js` → `bindScrollPreservation()` | ~35 | MutationObserver on `#rebuy-cart` class changes to lock/unlock body scroll |
| `layout/theme.liquid` | ~15 | raw CSS, including `#header-group.rebuy-position-relative { z-index: 2147483647 !important }` |

**Geometry is reachable in CSS.** The panel is set exactly the way SPY would need to:

```css
#rebuy-cart .rebuy-cart__flyout {
  width: 375px;          /* SPY would use 320px */
  z-index: 2147483648;
  border-radius: 0;
  overflow: hidden;      /* body anchor is the only scroller */
}
```

**The cart's custom-widget slot is the supported way to put a widget inside Smart Cart:**

```css
#rebuy-cart .rebuy-cart__custom-widget { padding: 12px 16px; }
```

So SPY's **cross-sell rail can be fully templated from the theme even on v2** — it is a widget in that
slot, not cart chrome. Task 8 survives any generation outcome.

## 5. The coordinator pattern — and the bug in it

`assets/global.js` owns the bag click rather than letting Rebuy auto-bind:

```js
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-mini-cart-trigger]');
  if (!trigger) return;
  e.preventDefault();                                    // <-- unconditional
  if (typeof Rebuy !== 'undefined' && Rebuy.SmartCart) {
    Rebuy.SmartCart.show();
  } else {
    document.addEventListener('rebuy.ready', () => { Rebuy.SmartCart.show(); }, { once: true });
  }
});
```

This **resolves SPY's risk R1 without a spike**: own the trigger, call `show()` explicitly, and Rebuy
never double-binds against the theme drawer.

**But note the defect.** `e.preventDefault()` runs before the Rebuy check, and the bag is a real
`<a href="{{ routes.cart_url }}">`. If Rebuy never loads — blocked by consent, offline, script error —
the click is cancelled and the `rebuy.ready` listener waits forever. **The bag does nothing.** Horizon's
`cart-drawer` is still rendered (via `snippets/header-actions.liquid`) but nothing ever opens it.

SPY must not copy this. `assets/spy-cart-handoff.js` should only `preventDefault()` when it is certain it
is about to open something, and otherwise fall through to the theme drawer or the `/cart` link. SPY's
`data-cart-engine` design already does this correctly — this is the failure it was designed to avoid, now
with a production example of what it looks like when you get it wrong.

## 6. Rebuy loading and performance

`layout/theme.pagefly.liquid` does **not** rely on the app embed. It injects the script itself:

```js
s.src = 'https://cdn.rebuyengine.com/onsite/js/rebuy.js?shop={{ shop.permanent_domain }}';
```

loaded on first shopper intent — `pointerdown`, `pointermove`, `touchstart`, `keydown`, `scroll`,
`wheel` — with a `requestIdleCallback(…, { timeout: 4000 })` fallback, mirrored in `theme-init.js`.

**Relevant to SPY**, which currently pays ~33 KB on home / ~280 KB on PDP and ~190–260 ms of script on
every page for a Rebuy that renders nothing (`audit/ada-performance-report.md`).

**Consent hazard — do not copy blindly.** A hand-rolled loader bypasses Pandectes' auto-blocker. SPY
measured and fixed a "Rebuy before consent" leak once already (`audit/ga4-status.md`). If SPY adopts
warming, it must fire **after** an explicit consent grant, not on pointer intent.

## 7. Quantity controls — no precedent here

Blenders **keeps** Rebuy's stepper and styles its buttons
(`.rebuy-cart__flyout-item-quantity-widget-button`). They never had SPY's requirement.

SPY's spec demands a read-only `Quantity : N`. That is a **markup** change, not a CSS one. Hiding a
stepper with CSS leaves it in the accessibility tree and fails the project's WCAG 2.1 AA requirement. On
v2 it must come from Rebuy's own settings (Smart Cart documents product tags that disable quantity
selectors) or the in-admin template editor — i.e. **configuration outside git**. This is the single
hardest open item in the SPY build.

## 8. What this means for SPY

SPY's Rebuy install has **never had Smart Cart enabled** (`Rebuy.smart_cart = false`,
`active_packages = []` — `audit/rebuy-smartcart-spike.md`). A fresh 2026 activation is very likely to
provision **v2**, which is what Blenders appears to be on.

**If so, Approach A in the current plan is not buildable.** Tasks 2 and 4–6 assume a theme-side Vue
template that v2 ignores.

### Survives either way
- **Task 8, the cross-sell rail** — a widget in the custom-widget slot, theme-templatable, proven in production.
- **Task 3, the coordinator** — validated by production code, with a known defect to avoid.
- **Risk R2** — confirmed twice: SPY's spike saw Rebuy's CSS load after `tailwind.css`; Blenders needed 303 scoped rule blocks to win.

### A v2 build, realistically
1. Geometry via ~300 scoped CSS rules against `.rebuy-cart__*` — proven achievable.
2. Read-only quantity via Rebuy settings or product tags — **unproven, and the main risk**.
3. Budget for defensive JS of the same class as the image fix and the shim.

### Ask the store owner
Enable Smart Cart and report which generation appears. Blenders' own Rebuy contact can likely answer
faster than trial and error, including whether Legacy is still offered to a new activation at all.

- **Legacy available** → the current plan stands.
- **v2 only** → re-plan around CSS-first restyling; the 1:1 target stays reachable, but the
  "template lives in git" property of the design is lost.
