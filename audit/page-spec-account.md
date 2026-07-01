# Page Spec: Account / Cart / Search (Horizon Defaults)

**Template approach:** Use Horizon's built-in templates re-skinned to brand tokens. No custom layout needed.

---

## Login / Register (`customers/login`)

**URL:** https://www.spyoptic.com/us/login

### Sections Observed
- Sign In form: email + password + "Remember me" + "Forgot password?"
- Password recovery: email input + send
- Create Account link
- Guest order tracking: order number + email + billing ZIP

### Shopify Build Approach
- Use Horizon's native customer login template
- Apply brand tokens (orange CTA button, slate headers, typography)
- Add promo strip / trust badges above form (as seen on current site)
- **Use new Customer Accounts** (web components — not legacy classic)

---

## My Account (`customers/account`)

Not deeply inspected — standard authenticated account area.

### Expected Sections
- Order history list
- Order detail view
- Address management
- Account info (name, email, password)

### Shopify Build
- Horizon new customer account components
- Re-skin to brand tokens

---

## Cart (`cart`)

Not directly inspected — standard Shopify cart.

### Expected Elements (from trust badges observed)
- Line items with product images, names, variant, price, qty
- Order summary (subtotal, shipping, total)
- Discount code input
- Checkout button (orange, primary)
- "PayPal Pay-in-4" messaging
- Trust badges: Free shipping threshold · Returns · Warranty
- "Continue shopping" link

### Shopify Build
- Horizon cart template + drawer cart
- Re-skin to brand tokens
- PayPal messaging block (PayPal app or script)

---

## Search Results (`search`)

Not directly inspected.

### Expected Elements
- Search input (pre-filled with query)
- Results grid (product cards — same as PLP card)
- Result count + pagination
- No results state

### Shopify Build
- Horizon search template
- Re-skin to brand tokens
- Shopify Search & Discovery for predictive search + filtering
