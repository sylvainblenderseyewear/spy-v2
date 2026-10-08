# Rebuy Smart Cart — settings to apply

Date: 2026-10-07
Store: `spyoptic-com.myshopify.com`, Rebuy shop id **50277**
Target: `audit/page-spec-cart-drawer.md` §10 (the measured source mini-cart)
Settings list sourced from Rebuy's own Smart Cart Settings doc, read 7 Oct 2026.

**The settings below describe the v2 editor** (components, layouts, Cart Items Settings). If the admin
shows a plain settings page instead, you are on Legacy — tell the dev, because that changes the build.

---

## 0. Do this in Preview, not live

`spy-v2/main` is the **published** theme. Publishing a Smart Cart makes it take over the cart for every
visitor immediately, and the coordinator that arbitrates between Rebuy and our own drawer is not built yet.

- Configure the cart, **Save**, and use **Preview Cart** — it renders an unpublished cart on the storefront
  for you only.
- Do **not** toggle "Publish/Enable" until the dev has run the spike and built the coordinator.
- Only one Smart Cart can be active at a time. Enabling a new one auto-disables the current one.

Name the cart something traceable, e.g. **`SPY mini-cart (1:1 source)`**.

---

## 1. Layout

| Setting | Value | Why |
|---|---|---|
| Layout | **Single column** | The source panel is **320px**. Double column exists to put cross-sells in a side column and cannot work at that width. |

---

## 2. Turn OFF — the source mini-cart has none of these

Each one adds a module the measured source does not have, and every one of them breaks the 1:1 target.

| Setting | Value | Why |
|---|---|---|
| Announcement Bar | **Off** | Not in the source drawer. |
| Tiered Progress Bar | **Off** | The source has an `.approaching-discounts-ctr` slot but it was **empty in every state captured** (§7). Do not invent one. |
| Buy More Save More | **Off** | Not in the source. |
| Switch to Subscription | **Off** | SPY sells no subscriptions. |
| Share Cart | **Off** | Not in the source. |
| Login | **Off** | Not in the source; it also force-aligns the title bar. |
| Notes | **Off** | Not in the source. |
| Terms & Conditions | **Off** | Not in the source. |
| Payment Installments | **Off** | The source drawer has no installments CTA. |
| Shop Pay / accelerated checkout | **Off** | Source has an express-pay slot that renders nothing (§5). Rebuy also lists accelerated buttons as **deprecated**. |
| Discount code field | **Off** | The source footer has **no discount accordion** (§5). The cart *page* keeps its own promo form. |

---

## 3. Cart Items Settings

| Setting | Value | Why |
|---|---|---|
| **Enable Quantity Input** | **OFF** | The spec requires a **read-only** `Quantity : N`, not a stepper (§4). This is the single most important setting on the page. |
| Nested Cart Items | Off (default) | No bundles in scope. |
| Product Metafields | Off for now | Useful later for a custom template; not needed to match the spec. |

### Check what "off" actually renders

When Enable Quantity Input is off, confirm in Preview whether the line still **shows the quantity as text**
or hides it entirely. The spec needs the text `Quantity : 1`, right-aligned.

- Shows text → done, this requirement is solved by configuration.
- Hides it → tell the dev. It then has to come back through a component custom template, and it is the
  riskiest item in the build.

### Empty cart language

Source (§6) shows exactly: **"Your Shopping Cart is Empty"**, with the header and footer still present and
a **disabled** CTA. Rebuy defaults to "Your cart is empty! / Add your favorite items to your cart. / Shop Now".

- Set the text to **`Your Shopping Cart is Empty`**
- Clear the secondary line if it can be left blank
- The **"Shop Now" link must go** — the source has no such link. If it cannot be removed here, flag it:
  hiding a focusable link with CSS leaves it in the accessibility tree and fails our WCAG 2.1 AA requirement.

---

## 4. Buttons — read this one carefully

The source mini-cart has **one** button: a solid orange bar reading **`GO TO CART`** that links to the
cart page. It does **not** go to checkout (§5, §10).

| Setting | Value |
|---|---|
| Checkout Button | **Off** |
| **View Cart Button** | **On**, label **`GO TO CART`** |
| Continue Shopping Button | **Off** |

> **This contradicts Rebuy's own advice**, which is to send shoppers straight to checkout to remove a step.
> We are matching the source site, which routes to the cart page. It is a deliberate 1:1 decision, not an
> oversight — but it is a **commercial call worth confirming**, because routing to checkout instead would
> very likely convert better. If the business wants checkout, say so and the spec gets amended; do not
> change it silently.

---

## 5. Cart page — do NOT follow Rebuy's recommendation

| Setting | Value | Why |
|---|---|---|
| **Use Cart Page** | **ENABLED** | Rebuy recommends **disabling** it, which redirects `/cart` to the homepage. SPY has a **pixel-perfect, signed-off cart page**, and the mini-cart's only CTA points at it. Disabling this would break both. |
| Override Cart Page Checkout Button | Off | Only needed when discount codes are entered in Smart Cart, and that field is off. |
| Product Form Submission Behavior | **Stay on current page** | Auto-open handles showing the cart; redirecting would fight it. |

---

## 6. Auto-open behaviour

The source opens the drawer about **1.5s after add-to-cart, then closes it again** (§2).

Set auto-open on add-to-cart **on**, with auto-close to match. Our theme drawer already implements this
via its `auto-open` and `close-after-add` attributes, so **exactly one** engine must do it — the dev's
coordinator enforces that, but the Rebuy side must be configured to match, not to differ.

---

## 7. Theme Selectors

Rebuy syncs the theme's cart bubble and subtotal through CSS selectors. Its defaults (`.cart-count`,
`.cart-subtotal`) do **not** exist in this theme. Set:

| Field | Value |
|---|---|
| Cart count | `.cart-bubble__text-count` |
| Cart subtotal | `.cart__subtotal-container` |

---

## 8. Accessibility

Set **Accessibility Heading Level** for the cart title to **h2**. The project requires exactly one `h1`
per page and WCAG 2.1 AA; a cart title rendering as `h1` would break both.

---

## 9. What to report back to the dev

1. **Legacy or v2** — plain settings page, or a component-based editor?
2. **What Enable Quantity Input = off renders** — static quantity text, or nothing?
3. **Whether the empty-cart "Shop Now" link can be removed** entirely.
4. Leave the cart **saved but unpublished**, and send the Preview link.

Then the dev re-runs `node scripts/rebuy-spike.mjs` to dump the real default template and build the
binding map, and Task 0 closes.

---

## Applied state — 8 Oct 2026

Cart **`SPY mini-cart (1:1 source)`**, id **37798**, on **Smart Cart v2**. Saved and **UNPUBLISHED**
(the "Publish Smart Cart" / Live toggle was never touched). Cross-sell rail is **Widget 314347**.

### Done

| Setting | Value | Verified |
|---|---|---|
| Layout | Single column | preview |
| Cart Share | hidden | share icon gone from the top bar |
| Login Button | hidden | Login button gone |
| Checkout Button | off | blue "Checkout →" gone |
| View Cart Button | **on**, label `GO TO CART` | single CTA in the footer |
| Continue Shopping | off | — |
| Shop Pay | off | purple button gone |
| Terms & Conditions · Pre-Purchase Pop-Up · Installments | off | — |
| Switch to Subscription · Use Product Metafields · Buy More Save More · Nested Cart Items | off | — |
| Theme selector — Item Count | `.cart-bubble__text-count` (was `.cart-count`) | — |
| Theme selector — Cart Subtotal | `.cart__subtotal-container` (was `.cart-subtotal`) | — |

### Still to do

- Cart Title: inline `(N)` count, heading level **h2**
- Empty-cart copy → `Your Shopping Cart is Empty`, and remove the "Shop Now" link
- Cart Subtotal → single `Estimated Total` row (currently `Subtotal (6 items)`)
- Read-only quantity — **needs a custom template, see below**

### RESOLVED: `Enable Quantity Input = off` does NOT remove the stepper

Turned off, saved and confirmed; the `− 6 +` stepper still renders in both the editor preview **and**
the standalone preview at `/admin/smartcart/preview/37798/`. The setting governs **min/max limits and
input type** (buttons vs dropdown), exactly as Rebuy's docs describe — not whether the control exists.

**So the spec's read-only `Quantity : N` can only come from a custom template.**

### RESOLVED: v2 DOES have custom templates — per component, in the admin

**Cart Items → ADVANCED → Enable Custom Template → Edit Code** opens a **Monaco editor holding Rebuy's
real default template: 605 lines, 25,883 chars.** Confirmed first lines:

```html
<div data-rebuy-component="cart-items" data-rebuy-component-id="cart_items">
  <ul v-if="hasItems()" data-smartcart-items tabindex="0" role="list">
    <li class="rebuy-cart__flyout-item"
        v-for="(item, index) in items()"
        v-if="!isHiddenItem(item)"
        :key="getLineItemKey(item, index)"
        v-bind:class="[ 'product-' + item.handle, itemProductTagsClasses(item), itemPropertyClasses(item) ]">
```

**Binding map** (read off the live template):

- Items: `hasItems()` · `items()` · `isHiddenItem(item)` · `getLineItemKey(item, index)` · `item.handle`
- Links: `isItemClickable(item)` · `itemLinkLabel(item)` · `itemURL(item)`
- Classes: `itemProductTagsClasses(item)` · `itemPropertyClasses(item)`
- Quantity: `isQuantityEnabled` · `getQuantityInputType` · `getEffectiveQuantityLimits` · `getQuantityLabel`
  · `getQuantityError` · `setItemQuantity` · `increaseItem` · `decreaseItem`
- Discounts/props: `hasLineItemDiscount` · `hasItemProperties`
- Quantity CSS hooks: `.rebuy-cart__flyout-item-quantity{,-widget,-widget-button,-widget-input,-widget-label,
  -dropdown,-dropdown-content,-dropdown-label,-dropdown-value,-dropdown-error,-error}`

**Global Settings also carries:** a whole-cart Custom Template, **Custom CSS**, and **event callbacks**
(Init / Ready / Show / Hide / LineItemIncrease / LineItemDecrease / LineItemRemoved) — the callbacks are
useful for the theme-side coordinator.

**Consequence for the build:** the read-only quantity, the `(N)` title format and the empty-cart link
removal all land in **admin-hosted templates, outside git**. That is the v2 cost, now confirmed rather
than predicted.

### Not a risk after all

Global Settings has **no "disable cart page" toggle** in this build — only "Override Cart Page Checkout
Button" and "Product Form Submission Behavior". The signed-off cart page cannot be redirected away.

---

## Custom template applied — 8 Oct 2026

**Read-only quantity is DONE.** Verified on the saved config at `/admin/smartcart/preview/37798/`:
the line item renders **`Quantity : 6`** as static text and the `- 6 +` stepper is gone.

Template name in Rebuy: **`SPY cart items - read-only quantity`** (Cart Items -> Advanced -> Enable
Custom Template). Rebuy keeps a **Previous Templates** history, so this is revertible.

What was changed, against Rebuy's 605-line default:

```html
<!-- Quantity is read-only here, like the old site -->
<div class="rebuy-cart__flyout-item-quantity spy-qty-static">
  <span class="spy-qty-label">Quantity :</span>
  <span class="spy-qty-value">{{ item.quantity }}</span>
</div>
```

This replaced lines 105-200 of the default (96 lines -> 5). The original class
`rebuy-cart__flyout-item-quantity` is kept so Rebuy's own CSS hooks still resolve; `spy-qty-static`,
`spy-qty-label` and `spy-qty-value` are ours to style to the spec (13 / 18.2, label 600, value 400,
right-aligned).

**Gotcha for whoever edits this next:** the default template contains **more than one** quantity
rendering. Removing the block at 105-200 leaves a second stepper (`increaseItem` / `decreaseItem`,
comment "Buttons/Default Mode") further down, which belongs to the **nested / bundle** item path and
does not render for a plain line item. Leave it unless nested items get enabled.

### Current saved state of the cart

Header `YOUR CART` + close only - line item with image, title, variant, **static quantity**, price and
remove - cross-sell rail (Widget 314347) - `Subtotal (6 items)` - single **`GO TO CART`** button.

### Still outstanding in the Rebuy admin

- Cart Title: inline `(N)` count and heading level **h2**
- Empty-cart copy -> `Your Shopping Cart is Empty`, and delete the "Shop Now" link (the field is a
  rich-text editor, so the link is removable content)
- Cart Subtotal -> single `Estimated Total` row (currently `Subtotal (6 items)`)

All geometry, type and colour remain theme-side CSS scoped to `#rebuy-cart`, per
`audit/rebuy-smartcart-solution.md`.

---

## Preview Mode does NOT work through `shopify theme dev` — 8 Oct

**Question:** can we render Smart Cart on a local dev-theme page, so the theme CSS can be written
against it without publishing? **Answer: no, not as things stand.**

Measured on `shopify theme dev` (port 9293 — 9292 held a stale session serving a Shopify error page):

| Check | Result |
|---|---|
| Storefront renders | yes, full SPY+ Optic page |
| `rebuy` in served HTML | yes — **but only inside Pandectes' blocker config** |
| Rebuy network requests | **0** |
| `Rebuy.SmartCart` | `undefined` |
| Theme cart drawer | present |
| Consent banner | **never renders locally** |

### Why

Pandectes now carries the blocker rule the GA4 audit asked for:

```json
"blocker":{"enabled":true,"scripts":{"1":["rebuyengine.com"],"4":["yotpo.com"]}}
```

`rebuyengine.com` is blacklisted under category **1 = Functionality**. That is correct and wanted — but
on the local dev theme Pandectes loads the **blocker** and never renders the **banner**
(`PandectesCore` exposes only `PandectesWebComponent`; `PandectesRules` only `initialize`, so there is no
programmatic accept). With no banner there is no way to consent, so Rebuy never loads and Smart Cart can
never render locally.

Four plausible `_pandectes_gdpr` cookie shapes were tried (the cookie is base64 JSON with a `status`
field, per `audit/ga4-custom-pixel.js`). None unblocked Rebuy, so the exact shape is still unknown.

### Ways forward

1. **Capture a real consent cookie** (recommended, cheapest). Accept the banner once on the production
   storefront in a normal browser, copy the `_pandectes_gdpr` value, and keep it in `.env`. The check
   script can then seed it and local dev works permanently.
2. **Test on the real storefront** with both parameters —
   `?preview_theme_id=<dev theme id>&preview_smart_cart=37798` — where the banner does render. Needs the
   storefront password (`SPY_PASSWORD`).
3. Whitelisting Rebuy in Pandectes would work but **undoes a correct privacy fix** — not recommended.

### Third confirmation of the consent architecture

Rebuy's own docs state: *"Rebuy Smart Cart cannot automatically remove, hide or otherwise override your
theme's native cart drawer. Both can and will exist until you take steps to suppress your native cart
drawer."* Combined with the blocker rule above, this makes the coordinator (`spy-cart-handoff.js`)
**required, not optional**, and it must land before any CSS work — otherwise we would be styling a page
carrying two carts.

Check script: `scripts/rebuy-preview-check.mjs`.

### Consent CAN be granted locally — the banner is a shadow-DOM custom element

Earlier conclusion corrected. The Pandectes banner **does** render on the dev theme; it is a
`<pandectes-cmp>` custom element and the buttons live in its **shadow root**, so `[id*="pandectes"]`
never matched it. It also intercepts pointer events, which is what made an ordinary bag click time out.

Accepting works the same way `layout/theme.liquid` already reaches the reopen button:

```js
document.querySelector('pandectes-cmp')?.shadowRoot
  ?.querySelectorAll('button')  // -> close | Learn more | Accept | Decline | Preferences
```

With consent granted, **Rebuy loads locally** (`_status: "initialized"`, requests > 0). So the consent
half of the preview problem is solved and no `.env` cookie capture is needed.

**Still blocked:** Smart Cart itself does not activate — `Rebuy.smart_cart` is null, `Rebuy.SmartCart` is
undefined and there is no `#rebuy-cart` node. The cart is unpublished and the guessed
`?preview_smart_cart=<id>` parameter does not switch it on. **Next step: capture the exact URL Rebuy's
own PREVIEW button generates** — that is the one remaining unknown before the CSS work can start.

Reusable check: `scripts/rebuy-preview-check.mjs` (grants consent, then reports what Rebuy exposes).
