# How Blenders runs Rebuy — research against `reference/blenderseyewear`

Date: 2026-10-07
Why: SPY is about to build a Rebuy Smart Cart mini-cart. Blenders is the same company running Rebuy
Smart Cart **in production today**, so its theme is the best available evidence for what is actually
achievable. Read before trusting `docs/superpowers/plans/2026-10-07-rebuy-smart-cart.md`.

---

## 1. Blenders runs Smart Cart, and does NOT template it

| | Count | Files |
|---|---|---|
| Rebuy **widget** templates overridden from theme files | **4** | `rebuy__popular-add-ons`, `rebuy__popular-add-ons-plus-icon`, `rebuy__product-recently-viewed`, `rebuy__product-recently-viewed-on-cart` |
| Rebuy **Smart Cart** templates overridden from theme files | **0** | — |

Every widget override uses the documented pattern:

```liquid
<script id="rebuy-widget-{% endraw %}{{rebuy_widget_id}}{% raw %}" type="text/template">
```

There is no `rebuy-cart-template` snippet anywhere in the theme. The Smart Cart markup is Rebuy's.

## 2. Everything Smart Cart is patched from the outside

Because the markup cannot be edited, every customization is a post-render patch:

| File | Lines | What it does | Why it exists |
|---|---|---|---|
| `snippets/rebuy-smartcart-image-fix.liquid` | 187 | MutationObserver on `#rebuy-cart`, swaps line-item and cross-sell images by product type, with a per-handle fetch cache | the template's image logic is not editable |
| `snippets/rebuy-delivery-range-shim.liquid` | 159 | `Object.defineProperty` traps `Rebuy.SmartCart`, stubs `deliveryRange()` and `progressBar.tiers` | the Rebuy-hosted template **calls functions the account does not provide**, and Vue throws without them |
| `assets/global.js` → `bindScrollPreservation()` | ~35 | MutationObserver on `#rebuy-cart` class changes to lock/unlock body scroll | open/close side effects cannot live in the template |
| `layout/theme.liquid` | ~15 | raw CSS for `.rebuy-quick-view__product`, `body.blenders-rebuy-loading`, a `z-index: 2147483647` on the header | — |
| `assets/theme.css` | **535 `rebuy` references** | restyles the full `.rebuy-cart__*` BEM surface | the only lever left |

The delivery-range shim is the clearest tell. If Blenders could edit the Smart Cart template they would
delete the offending call in one line; instead they monkey-patch the runtime object so a template they
do not control stops throwing.

**Conclusion: Blenders has no template control over Smart Cart.** That is the behaviour Rebuy documents
for **Smart Cart v2** — "the new Smart Cart templates do not accept templates from the theme files".

## 3. What this means for SPY

SPY's Rebuy install has **never had Smart Cart enabled** (`Rebuy.smart_cart = false`,
`active_packages = []` — see `audit/rebuy-smartcart-spike.md`). A fresh 2026 activation is very likely to
provision **v2**, which is what Blenders appears to be on.

**If that happens, Approach A in the current plan is not buildable.** The plan's Tasks 2 and 4–6 assume a
theme-side Vue template that we author. On v2 that template is ignored.

### What survives regardless of generation

- **The cross-sell rail (Task 8) is a widget, not the cart.** Blenders proves widgets accept theme-side
  templates with full Vue control in production. That task is safe either way.
- **The coordinator (Task 3) is validated by production code.** Blenders' `bindCartTrigger()` does exactly
  what the plan specifies — bind your own trigger, call `Rebuy.SmartCart.show()`, and fall back when Rebuy
  is not loaded:

  ```js
  if (typeof Rebuy !== 'undefined' && Rebuy.SmartCart) {
    Rebuy.SmartCart.show();
  } else {
    document.addEventListener('rebuy.ready', () => { Rebuy.SmartCart.show(); }, { once: true });
  }
  ```

  Note Blenders does **not** let Rebuy auto-bind the bag; they own the trigger. That resolves risk R1.
- **Risk R2 is confirmed twice over.** SPY's spike measured Rebuy's sheets loading after `tailwind.css`;
  Blenders needed 535 CSS rules to win. Rebuy-scoped overrides need the layer treatment.

### What a v2 build would actually cost

Restyling Smart Cart to the source spec without template control means:

1. **Geometry** — achievable in CSS against `.rebuy-cart__*`, the way Blenders does it.
2. **Markup changes are not CSS.** The spec requires a **read-only `Quantity : N`** in place of Rebuy's
   stepper. Hiding a stepper with CSS leaves it in the accessibility tree, which fails the project's
   WCAG 2.1 AA requirement. This has to come from Rebuy's own settings — Smart Cart documents product
   tags that disable quantity selectors — or from v2's in-admin template editor, i.e. **configuration
   outside git**.
3. **Defensive JS** — budget for the same class of shims Blenders needed.

## 4. Open question for the store owner

Enable Smart Cart in the Rebuy admin and report which generation appears. Blenders' own Rebuy contact can
likely answer faster than trial and error, and can say whether Legacy is still available to a new
activation at all.

- **Legacy available** → the current plan stands.
- **v2 only** → re-plan: CSS-first restyle against `.rebuy-cart__*`, quantity control via Rebuy settings,
  rail still a theme-side widget template. The 1:1 target is still reachable, but the build is a different
  shape and the "template lives in git" property of the design is lost.
