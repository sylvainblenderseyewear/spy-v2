# Rebuy Smart Cart spike (Task 0)

Status: BLOCKED. Smart Cart is not enabled in the Rebuy admin for this store.
Only the store owner can clear this.

## Evidence

Run: `node scripts/rebuy-spike.mjs` against `shopify theme dev` (127.0.0.1:9292), 1440x900, system Chrome.

- Consent: the Pandectes banner has an "Accept" button. It was clicked. Cookie `_pandectes_gdpr` then reads `status: allow`.
- Rebuy loads only after consent, and fully boots on the next page load (`rebuy.js`, `global-*.js`, CSS, `vendor-splidejs`).
- `Rebuy._status` = `initialized`. `Rebuy.shop.active_packages` = `[]`.
- `Rebuy.smart_cart` = `false`. `Rebuy.SmartCart` is `undefined`. No `#rebuy-cart` node.
- `script[type="text/template"]` count on the page: 0. So there is no default template to dump.
- Calling `Rebuy.fetchSmartCartData(undefined, 2)` hit `/api/v1/smart-cart-v2/undefined` and returned 404. There is no Smart Cart id to fetch.
- After add to cart, only the theme drawer opened (`THEME-DRAWER#cart-drawer[open]`). Rebuy did nothing.

## The four questions

1. Does Rebuy bind the bag click, and do both open? Cannot be answered. Rebuy has no Smart Cart, so it binds nothing. `bothVisible` is false: only the theme drawer opens.
2. Binding map: not derivable. No template exists. Nothing is invented here.
   Item loop, title, variant line, quantity, line price, remove method, subtotal, cross-sell predicate: all UNKNOWN.
3. CSS order: Rebuy sheets load after `tailwind.css` (base.css idx 0, tailwind.css idx 1, rebuy global.css idx 14, rebuy-icons idx 15, Rebuy custom stylesheet idx 16). Rebuy would win equal-specificity ties, so Rebuy-scoped overrides need the layer treatment. Rebuy CSS is loaded already, so this holds even without Smart Cart.
4. Panel selector: unknown. `#rebuy-cart` does not exist.

## What the store owner must do

Enable Smart Cart in the Rebuy admin (Legacy Smart Cart, with its default template active), then re-run the spike. Useful extra facts seen: Rebuy shop id 50277, `Rebuy.importSmartCartModule(version)` and `Rebuy.fetchSmartCartData(id, version)` exist, version 1 uses `/smart_cart/{id}`, version 2 uses `/smart-cart-v2/{id}`.
