/*
  SPY GA4 — Shopify custom pixel (source of truth)

  Paste into: Admin → Settings → Customer events → Add custom pixel ("SPY GA4").
  Kept here so the code is reviewable in git; the admin copy is the deployed one.

  How it works:
  gtag.js is loaded FROM our own tagging server, so GA4 requests go there first
  and the server container (GTM-K3RX42CH) forwards them to GA4. The server owns
  the visitor cookie, which is the whole point of server-side tagging.

  Custom pixels already provide `analytics`, `browser`, `init` — no imports.
  Events arrive because Horizon dispatches Shopify standard events
  (see assets/view-event-elements.js and snippets/product-card.liquid).

  Requires in the server container: the client that serves Google scripts
  (gtag.js) must be enabled, or the script below 404s.
*/

// Cloud Run default URL — swap for https://sgtm.spyoptic.com once the load
// balancer and DNS are live. Until then cookies are NOT first-party.
const TAGGING_URL = 'https://server-side-tagging-hzl3a6ofra-uc.a.run.app';
const TAG_ID = 'G-1F4T2NDY34'; // GT-NS4QG8B8 is the same tag, either works

window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}

// Block everything until the shopper has chosen.
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
});

// Shopify holds the consent state; mirror it into gtag.
function applyConsent(c) {
  if (!c) return;

  // US states give shoppers a "do not sell my data" opt-out, and Shopify
  // reports it here. Ad signals have to respect it, not just marketing consent.
  const adsAllowed = c.marketingAllowed && c.saleOfDataAllowed !== false;

  gtag('consent', 'update', {
    analytics_storage: c.analyticsProcessingAllowed ? 'granted' : 'denied',
    ad_storage: adsAllowed ? 'granted' : 'denied',
    ad_user_data: adsAllowed ? 'granted' : 'denied',
    ad_personalization: adsAllowed ? 'granted' : 'denied',
  });
}

applyConsent(init.customerPrivacy);

// The sandbox exposes this as `api.customerPrivacy` or bare `customerPrivacy`
// depending on version — a hard reference to the wrong one kills the whole file.
const privacy =
  typeof api !== 'undefined' && api.customerPrivacy
    ? api.customerPrivacy
    : typeof customerPrivacy !== 'undefined'
      ? customerPrivacy
      : null;

if (privacy) {
  privacy.subscribe('visitorConsentCollected', (e) => applyConsent(e.customerPrivacy));
}

/*
  The library comes from Google; the DATA goes to our server.
  Verified 2026-09-10: our tagging server answers /g/collect (200) but does not
  serve /gtag/js (400) — the GA4 (Web) client only claims collection paths.
  To serve the library from our domain too, use the "Serve Google scripts from
  your tagging server" setup in GTM, then point this src at TAGGING_URL.
*/
const script = document.createElement('script');
script.async = true;
script.src = 'https://www.googletagmanager.com/gtag/js?id=' + TAG_ID;
document.head.appendChild(script);

gtag('js', new Date());
gtag('config', TAG_ID, {
  server_container_url: TAGGING_URL, // every hit goes here, not to Google
  send_page_view: false, // Shopify page_viewed drives this instead
  debug_mode: true, // REMOVE BEFORE LAUNCH — only here so GA4 DebugView shows events
});

/*
  item_id = variant ID, on purpose.
  Staging SKUs use three schemes on the same product (13-digit placeholders,
  UPCs, and SPY refs like YS020004), so SKU is not a usable key yet.
  Revisit after the NetSuite/Matrixify migration.
*/
function item(v, qty) {
  const p = v.product || {};
  return {
    item_id: String(v.id),
    item_name: p.title,
    item_brand: (p.vendor || '').toUpperCase(), // staging has both "Spy" and "SPY"
    item_category: p.type, // thin data — most products are typed "Sunglasses"
    item_variant: v.title,
    price: Number(v.price && v.price.amount) || 0,
    quantity: qty || 1,
  };
}

/*
  Checkout URLs carry a one-off token per order, so left alone every order
  becomes its own page in reports. Collapse the token and drop Shopify's
  internal params. Campaign params (utm_*, gclid, fbclid) must survive — GA4
  reads attribution straight off page_location.
*/
const JUNK_PARAMS = ['_r', '_fd', '_ab', '_sm', 'preview_theme_id'];

function cleanUrl(href) {
  try {
    const url = new URL(href);
    // /checkouts/cn/<token>/en-us  ->  /checkouts/en-us
    // /checkouts/cn/<token>/thank_you -> /checkouts/thank_you
    url.pathname = url.pathname.replace(/\/checkouts\/[a-z]{2}\/[^/]+/i, '/checkouts');
    JUNK_PARAMS.forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch (e) {
    return href; // never let a URL edge case break tracking
  }
}

/*
  gtag runs inside Shopify's pixel sandbox, so its own location is the sandbox
  iframe URL — useless in reports. Every event carries the real storefront
  context, so push that onto gtag before each event.
*/
function setPage(event) {
  const doc = event && event.context && event.context.document;
  if (!doc || !doc.location) return;
  gtag('set', {
    page_location: cleanUrl(doc.location.href),
    page_title: doc.title,
    page_referrer: doc.referrer,
  });
}

/* ---------- funnel ---------- */

analytics.subscribe('page_viewed', (event) => {
  setPage(event);
  gtag('event', 'page_view');
});

analytics.subscribe('collection_viewed', (event) => {
  setPage(event);
  const c = event.data.collection;
  gtag('event', 'view_item_list', {
    item_list_id: c.id,
    item_list_name: c.title,
    items: (c.productVariants || []).slice(0, 20).map((v) => item(v, 1)),
  });
});

analytics.subscribe('product_viewed', (event) => {
  setPage(event);
  const v = event.data.productVariant;
  gtag('event', 'view_item', {
    currency: v.price.currencyCode,
    value: Number(v.price.amount),
    items: [item(v, 1)],
  });
});

analytics.subscribe('search_submitted', (event) => {
  setPage(event);
  gtag('event', 'search', { search_term: event.data.searchResult.query });
});

analytics.subscribe('product_added_to_cart', (event) => {
  setPage(event);
  const line = event.data.cartLine;
  gtag('event', 'add_to_cart', {
    currency: line.cost.totalAmount.currencyCode,
    value: Number(line.cost.totalAmount.amount),
    items: [item(line.merchandise, line.quantity)],
  });
});

analytics.subscribe('cart_viewed', (event) => {
  setPage(event);
  const cart = event.data.cart;
  gtag('event', 'view_cart', {
    currency: cart.cost.totalAmount.currencyCode,
    value: Number(cart.cost.totalAmount.amount),
    items: (cart.lines || []).map((l) => item(l.merchandise, l.quantity)),
  });
});

analytics.subscribe('checkout_started', (event) => {
  setPage(event);
  const c = event.data.checkout;
  gtag('event', 'begin_checkout', {
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  });
});

analytics.subscribe('checkout_completed', (event) => {
  setPage(event);
  const c = event.data.checkout;
  gtag('event', 'purchase', {
    // Same ID everywhere, or the order is counted twice.
    transaction_id: (c.order && String(c.order.id)) || c.token,
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    tax: Number(c.totalTax && c.totalTax.amount) || 0,
    shipping: Number(c.shippingLine && c.shippingLine.price.amount) || 0,
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  });
});
