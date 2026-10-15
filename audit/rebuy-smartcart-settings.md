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

---

## SOLVED: Preview Mode works on the dev theme — 8 Oct

The missing piece was **`cart_version=2`**. The guessed `?preview_smart_cart=<id>` alone does nothing.
The URL Rebuy's own PREVIEW button generates is:

```
https://spyoptic-com.myshopify.com/?preview_smart_cart=37798&viewcart=true&cart_version=2
```

Add `preview_theme_id=<dev theme id>` to run it against the development theme. Shopify consumes that
parameter and stores it in a cookie, so it disappears from the URL after the first load — that is normal.

### Verified end to end, on the dev theme

```
rebuyReq: 23 · smartCart: "object" · rebuyCartNode: true
handoffLoaded: true · engine: "rebuy" · themeDrawer: true
qtyText: "Quantity : 1" · qtyButtons: 0 · panelW: 500
```

- **The coordinator works in the real world.** `spy-cart-handoff.js` detected Smart Cart and switched
  `data-cart-engine` from `theme` to `rebuy`, with the theme drawer still present as the fallback.
- **The custom template works on the storefront**: `Quantity : 1` as text, **zero** quantity buttons.
- **Panel is 500px; the spec wants 320px.** That, and the type/spacing/colour work, is the CSS pass.

This unblocks all remaining styling work. Local `shopify theme dev` is **not** needed for it — preview
runs against the real storefront with the dev theme applied.

### Note: consent is required first

Rebuy will not load until the Pandectes banner is accepted. In an automated browser, the banner is a
`<pandectes-cmp>` custom element and Accept lives in its **shadow root** (see the section above).

### Open discrepancy to watch

The storefront preview renders **both** `Checkout →` **and** `GO TO CART`, while the Rebuy admin preview
shows only `GO TO CART` and the Checkout Button toggle is confirmed **off** and saved. Most likely a
config propagation delay on Rebuy's side rather than a theme problem. Re-check before writing footer CSS;
if it persists, it is one for Rebuy support.

---

## Gotcha: our Tailwind utilities override Rebuy's inline styles — 8 Oct

The Checkout button stayed visible on the storefront even though the admin toggle was off and saved.
It was **our bug, not Rebuy's**:

```
inlineStyle: "display: none;"                       <- Rebuy correctly hid it
class: "rebuy-button rebuy-cart__checkout-button block"
computedDisplay: "block"                            <- our Tailwind .block won
```

`src/tailwind.css` starts with `@import "tailwindcss" important`, so **every** utility is `!important`
inside a Tailwind layer. Rebuy puts a literal `block` class on that button, and for `!important`
declarations **layer order reverses** — a layered `!important` beats an inline style, and also beats an
unlayered `!important` rule of ours. So the first fix (an unlayered `#rebuy-cart ... { display: none
!important }`) did nothing.

Fix: put the override in an **earlier** layer, which wins for `!important`:

```css
@layer components {
  #rebuy-cart .rebuy-cart__checkout-button[style*='display: none'] { display: none !important; }
}
```

**Watch for this across the whole Rebuy surface.** Rebuy uses Tailwind-style class names (`block`, and
likely `flex`, `grid`, `hidden`) on its own elements. Anywhere Rebuy sets an inline style or its own CSS
and our utility shares the class name, **ours wins and silently breaks Rebuy's behaviour**. Same family
as the existing `.grid` / `.flex` collision with `base.css`.

## Still outstanding

- **Subtotal label is stale on the storefront.** Admin and admin-preview show `Estimated Total`; the
  storefront still renders `Subtotal (1 item)`. Rebuy-side config propagation, not the theme — re-check
  before chasing it.
- **`(N)` count in the cart title.** `{{item_count}}` works in the subtotal label but renders literally in
  the Cart Title field, so the count needs a title-component custom template.
- **Bag icon** in the header is not yet added (decorative `::before` with an inline SVG).
- Row is 305 wide with a 163px details column vs the spec's 319 / 177 — the 14px difference is the
  scrollbar. Decide whether the source uses an overlay scrollbar before chasing it.

## Brand colours applied — 8 Oct

Rebuy ships its own blue (`#2491c4`) on every button. Replaced with SPY tokens, verified computed on the
storefront preview:

| Element | Result |
|---|---|
| `GO TO CART` | `rgb(242,126,55)` = `--color-spy-orange-ui`, blue border removed |
| Rail `Add` / `Options` | white ground, `rgb(44,57,62)` = `--color-spy-slate` border and text |
| Rail titles / prices | `--color-spy-ink` / `--color-spy-price-reco` |
| Links | `--color-spy-ink` |

The rail buttons are **outlined slate, not solid orange** — the source has no rail, so this is our call:
three stacked solid-orange buttons would compete with the single primary CTA. Hover inverts to solid slate.

**Subtotal label resolved.** `Estimated Total` now renders on the storefront. The earlier mismatch was
propagation delay after all, not a Rebuy fault — no action needed.

## Overlay behaviour fixed and verified — 8 Oct

Rebuy locks **`body`** when the cart opens, not `.page-wrapper`, so the first override missed it. The
source never locks scroll and never pushes the page. Both now cleared, verified computed on the preview:

```
bodyOverflow: visible · bodyPosition: static
pageWrapperOverflow: visible · pageWrapperMarginRight: 0px
scrollableNow: true   <- the page scrolls behind the cart, like the source
```

Also resolved: with the wrapper padding removed the row is now **320 wide with a 95px + 178px grid**,
against the spec's 95 + 15 + 177. The earlier 14px shortfall was the double padding, not the scrollbar.

## BLOCKED: responsive verification at 768 / 390

CLAUDE.md requires 1440 / 768 / 390. **Only 1440 has been verified.** Three routes, all currently closed:

| Route | Result |
|---|---|
| Chrome extension `resize_window` | reports success but the window stays 1920 — it is maximised and silently refuses |
| Playwright against production | `spyoptic-com.myshopify.com` redirects to `/password`; no `SPY_PASSWORD` available |
| Playwright against `theme dev` | Rebuy will not load locally even with consent granted — `rebuyRequests: 0`, inconsistent run to run |

**To unblock, either:**
1. **Un-maximise the Chrome window** so `resize_window` can take effect — then I verify through the
   extension in minutes; or
2. **Put `SPY_PASSWORD` in `.env`** — then Playwright drives the production preview at any width and the
   whole check is scriptable and repeatable.

Option 2 is better long term: it makes the responsive check part of `scripts/`, not a manual session.

**Reasoned but NOT verified:** the panel is `width: 320px !important` with no media query, so it cannot
go full-bleed at 390. That is an argument, not a measurement, and does not satisfy the definition of done.

## Header bag icon done — 8 Oct

Rebuy's header markup is fixed, so the icon is a decorative `::before` on `.rebuy-cart__title` that masks
the theme's existing `assets/spy-fa-bag.svg`. A relative `url('spy-fa-bag.svg')` resolves correctly —
Shopify serves both files from the same `/assets/` path on the CDN. Verified computed:

```
iconW: 16px · iconH: 14px        (spec 16x14)
headerH: 41 · border: 1px solid rgb(230,230,230)
mask: url("https://spyoptic-com.myshopify.com/cdn/shop/t/4/assets/...")
```

Header is now spec-complete apart from the `(N)` count, which needs a title-component template.

## Responsive check is scripted and waiting on one line

`scripts/rebuy-cart-responsive.mjs` drives the production preview at **1440 / 768 / 390**, handles the
storefront password and the shadow-root consent, and asserts per width: panel 320, never full-bleed, no
body lock, no page push, engine `rebuy`. Exits non-zero on drift.

It needs the storefront password, which is **not** in the repo:

```
echo "SPY_PASSWORD=yourpassword" >> .env    # .env is gitignored (.gitignore:4)
node scripts/rebuy-cart-responsive.mjs
```

Without it the script exits 2 with a clear message rather than pretending to pass.

## Responsive verification PASSED at all three widths — 8 Oct

`node scripts/rebuy-cart-responsive.mjs` against the production storefront with the dev theme applied:

| Width | Panel | Result |
|---|---|---|
| 1440 | 320 | ok |
| 768 | 320 | ok |
| 390 | 320 | ok |

Each width asserts: panel 320 (±1), **never full-bleed**, no body scroll lock, no page push, engine
`rebuy`. At 390 the panel stays 320 against a 390 viewport — that is the specific regression the spec
calls out, since the old theme drawer went full-bleed at mobile and the source never does.

### Two traps in getting this to run

1. **The storefront password field is 0x0** behind an "Enter using password" toggle, and **the Pandectes
   banner intercepts pointer events**, so neither `fill()` nor a real click on the toggle ever lands.
   The script sets the value and calls `form.submit()` directly instead. (The same overlay is what made
   an ordinary bag click time out earlier.)
2. **Rebuy loses a cold first load.** The first width in a run reported "SMART CART DID NOT RENDER" while
   768 and 390 passed; an isolated rerun of 1440 passed. The script now **retries once** before failing —
   a harness that reports a red which a rerun turns green is as corrosive as one that reports a false
   green.

`WIDTHS=1440 node scripts/rebuy-cart-responsive.mjs` retests a single breakpoint instead of all three.

## Title count done — 9 Oct

`Your Cart (N)` now renders, via a **Cart Title custom template** (Fixed Top Bar → Cart Title →
Advanced Settings → Custom Template → Edit Code). Rebuy's default was a single element:

```html
<component :is="getCartTitleHeadingTag()" ... v-html="getCartTitle()"></component>
```

Replaced with the same element plus a count span:

```html
<span v-html="getCartTitle()"></span>
<span class="spy-cart-title-count">{{ (typeof cart !== "undefined" && cart && cart.item_count != null)
  ? " (" + cart.item_count + ")" : "" }}</span>
```

Verified on the storefront preview:

| Cart | Title |
|---|---|
| 1 line, qty 2 | `YOUR CART (2)` |
| 1 line, qty 3 | `YOUR CART (3)` |
| empty | `YOUR CART (0)` |

**It is `cart.item_count`, i.e. total quantity — not the line count.** Seeding one line at qty 2 and
again at qty 3 is what proved that; a line-count binding would have shown `(1)` both times. This matches
the bag badge, which also counts units.

**The `!= null` test matters.** A truthiness test renders a bare `YOUR CART` on an empty cart, but
spec §6 keeps `Your Cart (0)` with the header and footer still present. That bug is invisible in any
test that has items in the cart.

**Heading level needed no work** — Rebuy already defaults the title to **H2**, which is what the spec and
the one-H1-per-page rule require. Confirmed rendered as `H2`.

### Where this lives

In the **Rebuy admin, not git** — the second component template after `SPY cart items - read-only
quantity`. Rebuy keeps a Previous Templates history on each, so both are revertible there.

---

## Published — 12 Oct

Goran asked for it, so cart **37798** was switched **Live** in the editor (top bar → Live → "Yes, enable
Cart"). Rebuy confirms with "will replace your online store's current shopping cart"; Save stays greyed,
the switch saves on its own. To roll back: same switch, off.

### What the published cart showed that the preview never could

The preview holds the cart open, so the bag, close and add paths had never run for real. On the live
theme, after Accept, they exposed four bugs on our side, not Rebuy's:

| Bug | Cause | Fix |
|---|---|---|
| **Every desktop page frozen** (wheel scrolled 0px) | `:root[data-cart-engine='rebuy'] .page-wrapper { overflow: visible }`. From 990px Horizon locks `html` and scrolls `.page-wrapper` instead, so this killed the only scroller for anyone who accepted cookies. The 8 Oct "scrollableNow: true" was a computed-style check, not a real scroll | Removed. The only override left is `body.rebuy-cart-visible { overflow: visible }`, which undoes Rebuy's one lock (`.rebuy-cart-visible{overflow:hidden !important}` in its `global.css`) |
| **Bag opened both carts** | Horizon's `on:click` delegate listens on `document` in the **capture** phase and registers first, so our `stopPropagation()` on `document` ran too late | Intercept on `window` capture, which runs before anything on `document` |
| **Handover missed on slow devices** | We listened for `rebuy:ready` (Rebuy fires `rebuy.ready`) and `rebuy:cart.ready` (fires *before* `SmartCart` exists). Only the 500ms poll worked, and it gave up at 20s | Listen for `rebuy:smartcart.ready`; poll is a 60s backup |
| **Two carts after an early add** | Rebuy boots **6–15s after load** (measured, both themes). An add in that window opens the drawer; if Rebuy finishes booting mid-add it opens too | After the handover, the drawer's `open()` routes to Smart Cart, and Smart Cart opening closes a drawer that is still up, then takes focus back |

Also: from 990px Rebuy's fixed backdrop sits outside `.page-wrapper`, so a wheel over it went nowhere.
The source never locks, so `spy-cart-handoff.js` passes those wheel events on to `.page-wrapper`.

**Panel geometry, also wrong since 8 Oct** (the old checks measured width, never position):

| | Before | Source / now |
|---|---|---|
| 1440 | `x1110 y10 320x880`, Rebuy's `margin: 10px` kept, page header showing through the gap | `x1120 y0 320x900` |
| 390 | `x0`, **left** side: Rebuy turns the panel into a full-width bottom sheet under 480px and our 320 pinned it left | `x70 y0 320x900` |
| Slide | none: we set `transition: transform` but Rebuy moves it with `right` / `top` | `translateX(100%)` → `none`, 0.426s source easing |
| Header rule | 242 wide, stopped short of the close button | full row, `320x41`, `1px #e6e6e6` |

**Correction (same evening):** closed, Rebuy sets `aria-hidden="true"` on `#rebuy-cart` but only parks the
panel off-screen (its own CSS: `inset: 0 -100% 0 auto`, nothing hides it), so its controls stay in the Tab
order. On live, Tab after the last page link lands on "Close Cart" at x1698, plus the recommendation links
and buttons once they have rendered (7 stops), and axe flags `aria-hidden-focus` on every page. The first
check here said "Tab can't reach it" because it only pressed Tab 6 times from the bag.

**Fixed in `src/tailwind.css`, verified on the dev theme:** the closed panel is `visibility: hidden`,
switched on by `visibility 0s linear 426ms` so the slide-out still plays with its content. That alone
left 6 of 10 controls focusable: Rebuy's `global.css` has `.rebuy-widget .splide.is-initialized
{ visibility: visible }`, which beats the inherited `hidden`. So the cart's carousel gets the same rule
while closed.

| | Live (before) | Dev theme (after) |
|---|---|---|
| Controls in the closed cart that take `.focus()` | Close Cart + recommendations | **0 of 10** (1440 and 390) |
| Tab after the last page link | "Close Cart", off-screen at x1698 | skips the cart |
| axe `aria-hidden-focus` | 1 (`#rebuy-cart`) | **0** |
| Open | | panel and carousel visible, focus on Close |
| 200ms into the close | | still visible, x1437 at 1440 |
| Closed | | hidden, focus back on the bag |

Same dev theme: `production-cart-check.mjs` 33/33 at 1440 (final CSS) and 390 (panel rule only),
`rebuy-cart-behaviour.mjs` 12/12, `rebuy-cart-responsive.mjs` all three widths match the spec.

**Rebuy's real event names** (logged live, in order): `rebuy.beforeLoaded` · `rebuy:tracker.ready` ·
`rebuy:cart.init` · `rebuy:cart.change` · `rebuy:cart.ready` · `rebuy.loaded` · `rebuy:smartcart.init` ·
`rebuy:smartcart.ready` · `rebuy.ready` · then `rebuy:smartcart.show` / `rebuy:smartcart.hide`.

### Verified

`scripts/production-cart-check.mjs` rewritten for the published state: a real **Decline** (0 Rebuy
requests, theme drawer works) and a real **Accept** (one cart, scroll, outside click, keyboard, focus,
PDP add, handover). Run against the dev theme with the fixes, `THEME_ID=189382623539`:

| Width | Result |
|---|---|
| 1440 | 33/33 |
| 768 | 33/33 |
| 390 | 33/33 (after the panel fix) |

Panel geometry measured on its own at all three widths (open, mid-slide, closed): matches the spec.

**Esc closes the published cart** (the preview hid that). Same as our theme drawer, kept for WCAG.

Too many headless runs in a row make the storefront answer **429 "Just a moment…"** to automated
Chrome (not to a normal browser). It clears on its own; space the runs out.

### Checked in a real browser — 12 Oct, evening

Goran's Chrome on the live theme, 1920×889, after a real **Accept** on the banner (set back to Decline
afterwards, cart left empty as found):

| Check | Result |
|---|---|
| Accept mid-page | handover without a reload, about 6s later |
| Bag click | Smart Cart only, `x1600 y0 320x889`, header row `320x41` + `1px #e6e6e6`, focus on Close |
| Real wheel, cart open then closed | `.page-wrapper` 0 → 500 → 800 |
| Outside click · Esc · × | each closes it, focus back on the bag |
| Keyboard | Enter opens it, 12 Tabs stay inside |
| PDP add | Smart Cart only, `YOUR CART (1)` + line + subtotal, theme drawer shut |
| Remove inside the cart | empty state, badge hidden; focus drops to `body`, the next Tab is back inside |
| Console | no errors |

**Add-to-cart is slow to show.** Rebuy only opens Smart Cart once it has refetched and enriched the
cart: click → `rebuy:cart.add` +1.5s → `rebuy:cart.change` +3.0s → `smartcart.show` +3.1s. The source
shows its mini-cart about 1.5s after the add. Until then the shopper only sees the button's tick. It
always opened; a check at 3s just reads it as "didn't open", and a click in the meantime lands on the
backdrop when it arrives. `production-cart-check.mjs` now waits for it and prints the time.

How Rebuy opens after an add (read in `SmartCartV2.js`): with **Product form redirect = disabled** it
never touches the product form. It watches `/cart/add` on the network, refetches, and
`handleCartChangeEvent` calls `show()` on **any** cart change, even `/cart/clear.js`. `show()` does
nothing while the cart is visible, and while Smart Cart is still `initializing` it queues the open and
replays it at ready, so an early bag click is late, not lost. Rebuy has no auto-close; ours is off too
(`cart_drawer_close_after_add`), so both engines stay open after an add.

Live theme, headless, after the deploy:

| Width | Result |
|---|---|
| 1440 | 33/33, PDP add opened after 2.3s |
| 768 | 33/33 |
| 390 | 33/33 |

`rebuy-cart-behaviour.mjs` and `rebuy-cart-responsive.mjs` had never run since the publish. The first
crashed: after the password submit, `waitForLoadState` returns at once (the password page is already
loaded), so the next `goto` collided with the login redirect. All three scripts now wait for the URL to
leave `/password`. Behaviour then passed 12/12.

The homepage hero is a broken frame in that Chrome too, but not because of consent: this network's DNS
sends `player.vimeo.com` to `10.10.7.111`. Check the video from another network.

---

## Figma redesign built on a copy — 14 Oct

The new mini-cart (`audit/page-spec-mini-cart-figma.md`) is built on an **unpublished copy** of the
live cart. The live cart **37798 was not touched** (last edit still 12 Oct, widget 314347 intact).

| | Live today | New, not published |
|---|---|---|
| Cart | `SPY mini-cart (1:1 source)` **37798** | `SPY mini-cart (Figma redesign)` **38089** |
| Theme CSS | on `main` | in the working tree; each cart's rules apply only to that cart (see "Two carts, one stylesheet") |

Preview: `https://spyoptic-com.myshopify.com/?preview_theme_id=189382623539&preview_smart_cart=38089&viewcart=true&cart_version=2`
(accept the cookie banner first, Rebuy does not load without it).

### What cart 38089 holds

| Slot | Component | Setting |
|---|---|---|
| Fixed top bar | Cart Title | `Shopping Cart`, custom template with the `(N)` count |
| Goal box | Tiered Progress Bar `Free shipping` | one tier, type Free Shipping, **$50**, Shopify Functions off (text only, no discount) |
| | labels | `You're <b>{{remaining_amount}} away</b> from Free Shipping!` / `You unlocked Free Shipping!` |
| Body 1 | Cart Items | custom template `SPY cart items - Figma redesign`; empty-cart copy `Your bag is currently empty.` / `Shop our best sellers` |
| Body 2 | Widget **315460** `Bundle with Accessories` | list, 3 products, `+ Add`; data source **325522** |
| Body 3 | Widget **315461** `You Might Also Like` | grid, 2 columns, 4 products, `+ Add`; data source **325521** |
| Body 4 | Widget **315471** `Empty cart best sellers` (tabbed) | 4 tabs, 11 products each, list |
| Footer 1 | Cart Subtotal | labels `Total :`, custom template `SPY subtotal - total and savings badge` |
| Footer 2 | Checkout Area | Checkout button **on**, label `Checkout Securely`; View Cart **off** |
| Footer 3 | Custom Code Block | the trust row (`src/rebuy/trust-row.html`) |

Data sources made for it:

| ID | Name | Rule |
|---|---|---|
| 325522 | Cart - Bundle with Accessories | see "Bundle rules" below |
| 325521 | Cart - You Might Also Like | see "You Might Also Like rules" below |
| 325527 | Mini-cart empty state - Men | Anything → collection `mens-sunglasses` |
| 325528 | Mini-cart empty state - Women | Anything → collection `womens-sunglasses` |
| 325529 | Mini-cart empty state - Goggles | Anything → collection `goggles` |
| 325530 | Mini-cart empty state - Eyeglasses | Anything → collection `eyeglasses` |

All of them filter out-of-stock products, unpublished products and products already in the cart.

**Bundle rules (325522), as the Figma frames draw them.** A sunglasses cart shows case, pouch and the
replacement lens of that model; a goggle cart shows only its lens. Rules run top to bottom and the
widget keeps the first 3 products.

| # | If the cart has a product in | Show |
|---|---|---|
| 1 | `sunglasses` or `eyeglasses` | Sunglass Case Black, Sunglass Pouch Pouch Aliens |
| 2-7 | `cyrus` · `dirk` · `discord` · `helm` · `montana` · `rocky` | that model's `…-replacement-lens` collection |
| 8-10 | `marauder` · `marauder-se` · `waypoint` | `replacement-lens-marauder` · `-marauder-se` · `-waypoint` |
| 11-12 | `foundation` · `woot-race` (moto, added 15 Oct) | `foundation-lens` · `woot-race-lens` |
| 13 | `woot` or `woot-race` | `woot-woot-race-mx-lens` (its name says it fits both; unpublished today) |
| 14 | `sunglasses` or `eyeglasses` | Sunglass Case Small Black (fills the third row when the model has no lens) |

Only exact model ↔ lens pairs are mapped, so the box never offers a lens that does not fit. The
Marauder SE, Waypoint and Woot/Woot Race MX lenses are unpublished today, so those rules show nothing
yet. Checked: gaming eyeglasses → case, pouch, small case; Cyrus → case, pouch, Cyrus lens; Marauder →
Marauder lens only; Foundation → 3 Foundation lens tints; Woot Race → its 2 lenses; Woot → no box.

**You Might Also Like rules (325521).** Same category first, ranked by Rebuy's Smart Sort (what was
bought together with the cart's products), then Rebuy's AI to fill: snow goggles → `snow-goggle-frames`,
moto goggles → `moto-goggles`, sunglasses → `sunglasses`, eyeglasses → `eyeglasses`, then Recommended
(AI). An exclusion filter drops every accessory by its `collection::` tag (29 tags: lenses, cases,
pouches, tear-offs, CVS, nose guard, side shields), so a lens never shows here and in the bundle box at
the same time. Checked: Marauder → Marauder SE ×2, Marauder Elite Eco, Crusher Elite Eco (close to the
Figma goggle frame); Cyrus → Montana + Cyrus colourways; gaming → Cyrus Gaming, Crossway Screen ×2,
Crossway Gaming. Changing the ranking is one dropdown per rule in Rebuy (Similar Sort shows the same
frame in other colours first).

### Where the code lives

| Part | File | Goes where |
|---|---|---|
| Line item, empty message | `src/rebuy/cart-items.html` | Rebuy → cart → Cart Items → Advanced → Edit Code |
| Total + savings badge | `src/rebuy/cart-subtotal.html` | Rebuy → cart → Cart Subtotal → Advanced → Edit Code |
| Title with count | `src/rebuy/cart-title.html` | Rebuy → cart → Cart Title → Edit Code (unchanged) |
| Trust row | `src/rebuy/trust-row.html` | Rebuy → cart → footer Custom Code Block |
| Colour-over-model name on cards and tab rows | `snippets/spy-rebuy-widget-templates.liquid` | theme; Rebuy reads `script#rebuy-widget-<id>` |
| Widget IDs for that snippet | theme settings → Cart → Rebuy Smart Cart | `rebuy_cart_recs_widget_id` (315461), `rebuy_cart_empty_widget_id` (315471) |
| All styling | `src/tailwind.css`, blocks "Rebuy Smart Cart: …" (shared / OLD / NEW) | theme |

`src/rebuy/` is the source of truth. A change there must be pasted into Rebuy again; Rebuy keeps a
Previous Templates history for each.

### Two carts, one stylesheet

The Cart Items template of 38089 carries `class="spy-mc"` on its root. The stylesheet has three blocks:

- **shared** — the closed-panel Tab fix, the body scroll unlock, the hidden-Checkout guard;
- **OLD source cart** — the 12 Oct rules, every selector `#rebuy-cart:not(:has(.spy-mc))`;
- **NEW Figma cart** — every selector `#rebuy-cart:has(.spy-mc)`.

So the theme can go live any time **before** the Rebuy switch without changing the live cart, and
once both are live, rolling back is only the switch. Proof, on the live theme and live cart 37798 with
the theme's CSS swapped for the working tree's: every element of the open cart has the same box and
the same computed style, at 1440 and 390, with items (131 elements) and empty (91). Delete the OLD
block once 37798 is retired.

**Order matters one way (corrected 15 Oct).** Switching 38089 Live *before* the push is not safe:
`main` still has the old, unscoped `#rebuy-cart` rules, which would put the 320px styles on the new
cart until the push lands. Push first, then switch.

### How the templates decide things

- **Model and colour.** The model is the product tag `collection::<MODEL>`. The colour is what is left of
  the title after the model. No tag, or a title that does not start with the model = the full title.
- **Variant line.** Printed only when the product has more than one variant.
- **Remove.** There is no × button. Minus at quantity 1 removes the line (Rebuy's own `decreaseItem`
  does this) and its label then reads "Remove …". Lines without a stepper (gifts) keep a small remove button.
- **Savings badge.** `getOriginalCartTotal() - subtotalNumber()`: compare-at savings plus discounts.
  Hidden at zero. No product has a compare-at price today, so it was checked with a faked one.
- **Bundle vs. recommendations.** The CSS tells the two widgets apart by Rebuy layout (`line` vs `grid`),
  not by ID. The tabbed widget shows only in an empty cart; bundle and recommendations only with items.
- **Size / lens picker.** A widget product with a real choice keeps Rebuy's picker. One option = no picker.

### Checked on the preview (dev theme + cart 38089)

| Check | Result |
|---|---|
| `node scripts/rebuy-figma-behaviour.mjs` at 1440 / 768 / 390 | 23 / 23 at each width |
| Geometry against the spec (header 48, items at y94 / y199, bundle 311px rows, cards 164 wide, footer 151) | matches |
| Panel | 375 wide and docked right from 481px; full width on phones |
| axe on the open cart, WCAG 2.1 A + AA | only the orange contrast (2.68:1), the accepted brand choice |
| Keyboard focus ring | the theme's ring in ink on every control (was Rebuy's blue `#2491c4`); drawn inside on the clipped image link |
| Live cart under the new stylesheet | identical, see "Two carts, one stylesheet" |
| Captures | `audit/mini-cart-figma/build/` (two-items, goggle, empty, one-item-below) |

One 390 run failed on "minus at 1 removes the line": Rebuy took longer than the fixed wait. The script
now waits for the list instead of the clock, and passed again at 390 and 1440 after that change.

The 14 Oct evening checks ran with the working tree's CSS served in place of the theme's
(`LOCAL_CSS=1` in `rebuy-figma-preview.mjs` / `rebuy-figma-behaviour.mjs`), because the Shopify CLI
login had expired. `THEME_ID=live CART_ID=live` points the preview script at the published theme and cart.

15 Oct, after the login: `shopify theme dev` synced the dev theme 189382623539 again. Its
`tailwind.css` is byte-identical to the working tree's build (same SHA-256), and
`rebuy-figma-behaviour.mjs` passes 23/23 on it at 1440, 768 and 390 without the CSS swap. The live
cart (37798) on that theme still opens at 320px, flush right (x1120 at 1440, x70 at 390).

A page error seen now and then, `Cannot read properties of undefined (reading 'createShopifyExtend')`,
comes from Shopify's Web Pixels sandbox (`/cdn/wpm/…`), not from the theme or Rebuy.

### Not the design, on purpose

| Design | Built | Why |
|---|---|---|
| Orange `#ED773B` | palette color3 (`#f27e37`) | one orange control for the whole site |
| Grey `#A2A2A2` secondary text | `--color-spy-muted` `#767676` | 2.6:1 fails AA; same rule as the rest of the site |
| DIN weight 500 | `font-weight: 500` in CSS, renders Regular | the Medium file is not loaded; it will pick it up once added |
| `GET 20% OFF` in the bundle title | title is `Bundle with Accessories` | no discount exists; the claim would be false |
| Copy typos | `Free Shipping!` line, `Pay in installments`, `Easy returns`, `Goggles`, `Shop our best sellers` | plain grammar fixes |
| No picker on `+ ADD` | picker shown when the product has a choice | adding a size or lens silently is a wrong order waiting to happen |
| Free shipping scrolls with the items | fixed under the header | Rebuy pins Cart Items first in the body, so the line sits in the goal box |

### To publish (not done)

1. Push the theme changes to `main` (any time; the live cart keeps its look). **Push first** — see
   "Order matters one way".
2. Rebuy → Smart Cart → `SPY mini-cart (Figma redesign)` → Live. Rebuy turns 37798 off by itself.
3. Roll back = the same switch on 37798. No revert needed.
4. Check: `node scripts/production-cart-check.mjs` at `WIDTH=1440`, `768`, `390`, and
   `node scripts/rebuy-cart-responsive.mjs`. Both follow whichever cart is live.
5. Later: delete the OLD CSS block once 37798 is retired.

**The older check scripts follow the live cart (15 Oct).** `production-cart-check.mjs` and
`rebuy-cart-responsive.mjs` read `Rebuy.SmartCart.settings.id` and expect 320px for 37798, or 375px
(full width up to 480px) for 38089. Where a check needs room beside the panel and the new panel
fills a phone screen, it reports n/a. `PREVIEW_CART=38089` runs them against the unpublished cart on
the dev theme. Both now wait for Rebuy to own the bag instead of a fixed 8-9s: in preview Rebuy
often boots later, and a bag click before the handover opens the theme drawer (that is how the
first 768 and 390 runs failed). `rebuy-cart-behaviour.mjs` needed no change. `cart-measure.mjs`
keeps the old spec, which the theme drawer fallback still follows.

| Run, 15 Oct | 1440 | 768 | 390 |
|---|---|---|---|
| `production-cart-check.mjs`, live store, cart 37798 | 34/34 | — | 34/34 |
| `production-cart-check.mjs`, dev theme + `PREVIEW_CART=38089` | 34/34 | 34/34 | 32 + 2 n/a |
| `rebuy-cart-responsive.mjs`, cart 37798 on the dev theme | 320 ok | 320 ok | 320 ok |
| `rebuy-cart-responsive.mjs`, `PREVIEW_CART=38089` | 375 ok | 375 ok | 390 full width ok |

The 38089 production run is the first test of the new cart through both consent paths, the PDP
add (opens after 2.5s at 1440) and the drawer → Smart Cart handover.

### Still open

- **Bundle discount.** Rebuy can show and apply 20% (widget → Discount), but it needs a real Shopify
  discount. Business decision, then one setting.
- **Bundle rules, the rest.** Exact-fit lenses are mapped for 12 models (6 sunglasses, 3 snow, 3 moto).
  Crusher Elite, Marauder Elite, Raider, Megalith and McCoy lenses exist but no frame has the same
  model name (the frames are "Crusher Elite Eco", "Marauder Elite Eco"…), and the lens copy says
  nothing about fit. Which lens fits which frame is a product question, then one rule each.
- **Free-shipping threshold.** $50, taken from the site's own trust badge.
- **Best sellers.** The tabs list the collections in Shopify's order, not sales data.
- **Fallback drawer.** Visitors who have not accepted cookies still get the theme drawer, with the old look.
- **Cart page.** The only button now goes to checkout.
- **DIN Medium (500).** Needs the font file.

### A mistake to know about

While replacing the cart block in `src/tailwind.css` I cut the file at the old block and appended the new
one. The other session had appended its Smart Search styles after that block an hour earlier, so they
went with it. Restored byte for byte from that session's own command (they sit at the end of the file
again) and checked against its built CSS: all 29 rules are back.
