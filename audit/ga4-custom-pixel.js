/*
  SPY GA4 — Shopify custom pixel (source of truth)

  Paste into: Admin → Settings → Customer events → Add custom pixel ("SPY GA4").
  Kept here so the code is reviewable in git; the admin copy is the deployed one.

  How it works:
  gtag.js is loaded from Google, but every hit goes to our own tagging server
  (see `server_container_url` below). The server container GTM-K3RX42CH passes
  them on to GA4 and owns the visitor cookie — the point of server-side tagging.

  Custom pixels already provide `analytics`, `browser`, `init` — no imports.
  Events arrive because Horizon dispatches Shopify standard events
  (see assets/view-event-elements.js and snippets/product-card.liquid).
*/

// Our own subdomain, via a Google Cloud load balancer in front of Cloud Run.
// Live since 17 Sep 2026 — this is what makes the visitor cookie first-party.
const TAGGING_URL = 'https://sgtm.spyoptic.com';
const TAG_ID = 'G-1F4T2NDY34'; // GT-NS4QG8B8 is the same tag, either works

window.dataLayer = window.dataLayer || [];

// Events and page context are held back until the shopper consents, then sent
// after the consent update so they count as granted. Declining drops them.
let consentReady = false;
let consentDeclined = false;
const pending = [];

// Someone can browse all day without touching the banner, so cap the queue.
// Keep the earliest entries: the first page_view carries utm/gclid.
const PENDING_MAX = 50;

function gtag() {
  let args = arguments;
  const cmd = args[0];
  if (cmd === 'event') args = withEngagement(args);
  if (cmd === 'event' || cmd === 'set') {
    if (consentDeclined) return;
    if (!consentReady) {
      if (pending.length < PENDING_MAX) pending.push(args);
      return;
    }
  }
  dataLayer.push(args);
}

// Block everything until the shopper has chosen.
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
});

/* ---------- engagement time ---------- */

/*
  GA4 reads engagement time from engagement_time_msec (gtag sends it as `_et`).
  gtag only counts while its own frame has focus, and this sandbox frame never
  has it, so GA4 got none: engagement time read zero and every one-page visit
  looked like a bounce. Count the time the page is visible instead and put it
  on the next event, as gtag does on a normal page. Stop counting after 5
  minutes with no sign of the shopper.
*/
const IDLE_MS = 5 * 60 * 1000;
let lastActive = Date.now();
let visibleSince = isVisible() ? lastActive : null;
let banked = 0;

function isVisible() {
  return document.visibilityState !== 'hidden';
}

// Move the visible time so far into the bank, up to the idle cut-off
function bank() {
  if (visibleSince === null) return;
  const now = Date.now();
  const end = Math.min(now, lastActive + IDLE_MS);
  if (end > visibleSince) banked += end - visibleSince;
  visibleSince = now;
}

function takeEngagement() {
  bank();
  const ms = Math.round(banked);
  banked = 0;
  return ms;
}

function markActive() {
  bank();
  lastActive = Date.now();
}

// gtag only reads real `arguments` objects from the dataLayer
function asArguments() {
  return arguments;
}

function withEngagement(args) {
  const params = args[2] || {};
  if ('engagement_time_msec' in params) return args;
  const ms = takeEngagement();
  return ms ? asArguments(args[0], args[1], Object.assign({}, params, { engagement_time_msec: ms })) : args;
}

function sendEngagement() {
  bank();
  visibleSince = null;
  const ms = takeEngagement();
  // A blip under a second is not engagement
  if (ms >= 1000) gtag('event', 'user_engagement', { engagement_time_msec: ms });
}

document.addEventListener('visibilitychange', () => {
  if (isVisible()) {
    lastActive = Date.now();
    visibleSince = lastActive;
  } else {
    sendEngagement();
  }
});

// Leaving the page: send the rest before this frame goes away
window.addEventListener('pagehide', sendEngagement);

// Clicks, typing, banners scrolling into view and Shopify events all mean someone is there
analytics.subscribe('all_standard_events', markActive);
analytics.subscribe('all_custom_events', markActive);
analytics.subscribe('all_dom_events', markActive);

/*
  Opt-in everywhere, like Blenders: GA4 waits for an explicit choice.
  Before the shopper clicks, Shopify fills the gap with its regional default,
  which is "allowed" outside the EU/UK — so that value alone would track US
  visitors before they choose. Only two things count as a real choice:
  - `visitorConsentCollected` fires (the shopper clicked on this page), or
  - a choice saved on an earlier page. Pandectes keeps it in `_pandectes_gdpr`
    (base64 JSON; `status` is "" until the shopper picks, then e.g. "allow").
    Shopify's own `_tracking_consent` is checked too, in case it is ever written.
*/
let hasChosen = false;
let gtagLoaded = false;

// gtag.js is only fetched once there is consent to act on
function loadGtag() {
  if (gtagLoaded) return;
  gtagLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + TAG_ID;
  document.head.appendChild(script);
}

// Shopify holds the consent state; mirror it into gtag.
function applyConsent(c) {
  if (!c || !hasChosen) return;

  // US states give shoppers a "do not sell my data" opt-out, and Shopify
  // reports it here. Ad signals have to respect it, not just marketing consent.
  const adsAllowed = c.marketingAllowed && c.saleOfDataAllowed !== false;

  gtag('consent', 'update', {
    analytics_storage: c.analyticsProcessingAllowed ? 'granted' : 'denied',
    ad_storage: adsAllowed ? 'granted' : 'denied',
    ad_user_data: adsAllowed ? 'granted' : 'denied',
    ad_personalization: adsAllowed ? 'granted' : 'denied',
  });

  if (c.analyticsProcessingAllowed) {
    // Replay what happened before the click, now that it counts as granted
    consentReady = true;
    consentDeclined = false;
    pending.splice(0).forEach((args) => dataLayer.push(args));
    loadGtag();
  } else {
    consentDeclined = true;
    pending.length = 0;
  }
}

// Pandectes writes status "" on the first visit and a value once the shopper picks
function pandectesChose(raw) {
  if (!raw) return false;
  try {
    return !!JSON.parse(atob(decodeURIComponent(raw))).status;
  } catch (e) {
    return false; // unreadable: treat as no choice
  }
}

// A choice made on an earlier page
Promise.all([
  browser.cookie.get('_pandectes_gdpr').catch(() => ''),
  browser.cookie.get('_tracking_consent').catch(() => ''),
]).then(([pandectes, shopify]) => {
  if (!pandectesChose(pandectes) && !shopify) return; // no choice yet, stay silent
  hasChosen = true;
  applyConsent(init.customerPrivacy);
});

// The sandbox exposes this as `api.customerPrivacy` or bare `customerPrivacy`
// depending on version — a hard reference to the wrong one kills the whole file.
const privacy =
  typeof api !== 'undefined' && api.customerPrivacy
    ? api.customerPrivacy
    : typeof customerPrivacy !== 'undefined'
      ? customerPrivacy
      : null;

if (privacy) {
  // The shopper just clicked Accept/Decline/Save on the banner
  privacy.subscribe('visitorConsentCollected', (e) => {
    hasChosen = true;
    applyConsent(e.customerPrivacy);
  });
}

/*
  The library comes from Google; the DATA goes to our server.
  Verified 2026-09-10: our tagging server answers /g/collect (200) but does not
  serve /gtag/js (400) — the GA4 (Web) client only claims collection paths.
  To serve the library from our domain too, use the "Serve Google scripts from
  your tagging server" setup in GTM, then point this src at TAGGING_URL.
*/
// Commands queue in dataLayer until loadGtag() runs; nothing leaves the browser before then.
gtag('js', new Date());
gtag('config', TAG_ID, {
  server_container_url: TAGGING_URL, // every hit goes here, not to Google
  send_page_view: false, // Shopify page_viewed drives this instead
});

/*
  To debug later, add `debug_mode: true` above and re-save the pixel — that feeds
  GA4 DebugView.

  Don't reach for GTM's server Preview. It claims a session with a cookie on
  sgtm.spyoptic.com, which is third-party to this sandbox, so it stays empty
  while data flows fine (proved 22 Sep, cost an hour). Use DevTools Network
  filtered to `sgtm`, and GA4 Realtime.
*/

/*
  item_id is the product ID, like Blenders: a model's lens and size variants
  add up in item reports, and a product sold under two SKU schemes counts once.
  The variant stays in item_variant / item_variant_id. merchant_center_id is
  the Google Merchant Center ID (shopify_US_<product>_<variant>), the key
  Google Ads matches on once the feed is connected. Not `id`: gtag reads that
  as an old name for item_id and drops it. SKU is no key: it has three schemes.
*/
// Shopify may hand over gid://shopify/Product/123; keep the number
function shortId(id) {
  return String(id || '').split('/').pop();
}

function item(v, qty) {
  const p = v.product || {};
  const productId = shortId(p.id) || shortId(v.id);
  const variantId = shortId(v.id);
  return {
    item_id: productId,
    item_name: p.title,
    item_brand: (p.vendor || '').toUpperCase(), // staging has both "Spy" and "SPY"
    item_category: p.type, // thin data — most products are typed "Sunglasses"
    item_variant: v.title,
    item_variant_id: variantId,
    merchant_center_id: 'shopify_US_' + productId + '_' + variantId,
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
const JUNK_PARAMS = ['_r', '_fd', '_ab', '_sm', 'preview_theme_id', 'customer_posted', 'contact_posted'];

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

/*
  The footer sign-up and the contact page are plain Shopify forms. After a
  good submit Shopify reloads the page with customer_posted=true or
  contact_posted=true, so that is the moment to count a lead.
*/
const LEADS = { customer_posted: 'newsletter', contact_posted: 'contact_form' };

function leadSource(href) {
  try {
    const params = new URL(href).searchParams;
    const flag = Object.keys(LEADS).find((k) => params.get(k) === 'true');
    return flag ? LEADS[flag] : '';
  } catch (e) {
    return '';
  }
}

/* ---------- funnel ---------- */

analytics.subscribe('page_viewed', async (event) => {
  setPage(event);
  gtag('event', 'page_view');
  const doc = event.context && event.context.document;
  const source = doc && doc.location ? leadSource(doc.location.href) : '';
  // Once per tab, so refreshing the "thanks" page doesn't count again
  if (source && (await firstTime('lead', source))) gtag('event', 'generate_lead', { lead_source: source });
});

/*
  Remember the last list shown, by product handle, so a click on one of its
  products can go out as select_item. GA4 then credits the add to cart and the
  purchase to that list.
*/
let shownList = null;

function productHandle(url) {
  const m = String(url || '').match(/\/products\/([^/?#]+)/);
  return m ? m[1] : '';
}

function viewList(id, name, variants) {
  const list = variants || [];
  const items = list.map((v, i) => Object.assign(item(v, 1), { index: i }));
  shownList = { id, name, byHandle: new Map() };
  list.forEach((v, i) => {
    const handle = productHandle(v.product && v.product.url);
    if (handle && !shownList.byHandle.has(handle)) shownList.byHandle.set(handle, items[i]);
  });
  const params = { item_list_id: id, item_list_name: name, items: items.slice(0, 20) };
  // GA4 wants a currency whenever items carry a price
  const currency = (list[0] && list[0].price && list[0].price.currencyCode) || shopCurrency();
  if (currency) params.currency = currency;
  gtag('event', 'view_item_list', params);
}

analytics.subscribe('collection_viewed', (event) => {
  setPage(event);
  const c = event.data.collection;
  if (!c) return;
  viewList(c.id, c.title, c.productVariants);
});

analytics.subscribe('product_viewed', (event) => {
  setPage(event);
  const v = event.data.productVariant;
  if (!v || !v.price) return;
  gtag('event', 'view_item', {
    currency: v.price.currencyCode,
    value: Number(v.price.amount),
    items: [item(v, 1)],
  });
});

analytics.subscribe('search_submitted', (event) => {
  setPage(event);
  const r = event.data.searchResult;
  if (!r) return;
  gtag('event', 'search', { search_term: r.query });
  // The results are a list too, so a click on one can be credited
  if ((r.productVariants || []).length) viewList('search_results', 'Search results', r.productVariants);
});

analytics.subscribe('product_added_to_cart', (event) => {
  setPage(event);
  const line = event.data.cartLine;
  if (!line || !line.cost) return;
  gtag('event', 'add_to_cart', {
    currency: line.cost.totalAmount.currencyCode,
    value: Number(line.cost.totalAmount.amount),
    items: [item(line.merchandise, line.quantity)],
  });
});

analytics.subscribe('product_removed_from_cart', (event) => {
  setPage(event);
  const line = event.data.cartLine;
  if (!line || !line.cost) return;
  gtag('event', 'remove_from_cart', {
    currency: line.cost.totalAmount.currencyCode,
    value: Number(line.cost.totalAmount.amount),
    items: [item(line.merchandise, line.quantity)],
  });
});

analytics.subscribe('cart_viewed', (event) => {
  setPage(event);
  // An empty cart arrives as null and used to throw here, killing the handler.
  // Nothing to report either way, so skip it.
  const cart = event.data.cart;
  if (!cart || !cart.cost) return;
  gtag('event', 'view_cart', {
    currency: cart.cost.totalAmount.currencyCode,
    value: Number(cart.cost.totalAmount.amount),
    items: (cart.lines || []).map((l) => item(l.merchandise, l.quantity)),
  });
});

analytics.subscribe('checkout_started', async (event) => {
  setPage(event);
  const c = event.data.checkout;
  if (!c || !c.totalPrice) return;
  // Back from PayPal or a refresh starts the same checkout again
  if (!(await firstTime('begin', c.token))) return;
  gtag('event', 'begin_checkout', {
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  });
});

function shopCurrency() {
  const shop = init && init.data && init.data.shop;
  return (shop && shop.paymentSettings && shop.paymentSettings.currencyCode) || '';
}

/*
  The shipping method name sits on the delivery option. `shippingLine` only
  has a price, which is why shipping_tier never arrived before.
*/
function shippingTier(c) {
  const option = ((c.delivery && c.delivery.selectedDeliveryOptions) || [])[0];
  return (option && option.title) || '';
}

// Codes the buyer typed in, not automatic discounts
function couponCodes(c) {
  return (c.discountApplications || [])
    .filter((d) => d.type === 'DISCOUNT_CODE' && d.title)
    .map((d) => d.title)
    .join(',');
}

/*
  Remember which checkout steps were already counted. The checkout page can
  reload (back from PayPal, a refresh), so keep it for the tab session too.
  If storage is blocked, the in-memory guard still covers this page.
*/
const counted = new Set();

async function firstTime(step, token) {
  const key = 'spy_ga4_' + step + '_' + (token || 'checkout');
  if (counted.has(key)) return false;
  counted.add(key);
  try {
    if (await browser.sessionStorage.getItem(key)) return false;
    await browser.sessionStorage.setItem(key, '1');
  } catch (e) {
    // storage not available
  }
  return true;
}

/*
  Contact and address come before shipping. With them, a funnel exploration
  shows where in checkout people stop. Counted once per checkout, like shipping.
*/
async function checkoutStep(event, step, name) {
  setPage(event);
  const c = event.data.checkout;
  if (!c || !c.totalPrice) return;
  if (!(await firstTime(step, c.token))) return;
  gtag('event', name, {
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  });
}

analytics.subscribe('checkout_contact_info_submitted', (event) => checkoutStep(event, 'contact', 'add_contact_info'));
analytics.subscribe('checkout_address_info_submitted', (event) => checkoutStep(event, 'address', 'add_address_info'));

/*
  The next two fill GA4's built-in checkout funnel. Without them the report
  jumps from begin_checkout straight to purchase, so a drop-off at shipping
  looks the same as one at payment.

  Optional params are only added when Shopify sends them: an `undefined`
  param is worse than none.
*/

/*
  One-page checkout picks the free Standard rate as it loads, and Shopify
  sends this event again on every change after that. Count the step once per
  checkout, or the funnel shows more shipping steps than checkouts. The method
  the buyer ends up with goes on the purchase.
*/
analytics.subscribe('checkout_shipping_info_submitted', async (event) => {
  setPage(event);
  const c = event.data.checkout;
  if (!c || !c.totalPrice) return;
  if (!(await firstTime('shipping', c.token))) return;
  const params = {
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  };
  const tier = shippingTier(c);
  if (tier) params.shipping_tier = tier;
  gtag('event', 'add_shipping_info', params);
});

analytics.subscribe('payment_info_submitted', async (event) => {
  setPage(event);
  const c = event.data.checkout;
  if (!c || !c.totalPrice) return;
  // A declined card and a second try is still one payment step
  if (!(await firstTime('payment', c.token))) return;
  const params = {
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  };
  // "Visa" or "PayPal" reads better in reports than the gateway name
  const tx = (c.transactions || [])[0];
  const method = tx && ((tx.paymentMethod && (tx.paymentMethod.name || tx.paymentMethod.type)) || tx.gateway);
  if (method) params.payment_type = method;
  gtag('event', 'add_payment_info', params);
});

analytics.subscribe('checkout_completed', (event) => {
  setPage(event);
  const c = event.data.checkout;
  if (!c || !c.totalPrice) return;
  const params = {
    // Same ID everywhere, or the order is counted twice.
    transaction_id: (c.order && String(c.order.id)) || c.token,
    currency: c.currencyCode,
    value: Number(c.totalPrice.amount),
    tax: Number(c.totalTax && c.totalTax.amount) || 0,
    shipping: Number(c.shippingLine && c.shippingLine.price.amount) || 0,
    items: (c.lineItems || []).map((li) => item(li.variant, li.quantity)),
  };
  // The method actually paid for, which add_shipping_info can't know yet
  const tier = shippingTier(c);
  if (tier) params.shipping_tier = tier;
  const coupon = couponCodes(c);
  if (coupon) params.coupon = coupon;
  // New or returning buyer; GA4 says leave it out when unsure, e.g. a guest
  const buyer = c.order && c.order.customer;
  if (buyer && typeof buyer.isFirstOrder === 'boolean') params.customer_type = buyer.isFirstOrder ? 'new' : 'returning';
  gtag('event', 'purchase', params);
});

/* ---------- promo banners ---------- */

/*
  Shopify has no standard event for a banner, so the theme sends its own from
  <spy-promotion> (assets/spy-promotion-event.js), on six banner sections.

  Custom events carry their payload in `customData`, not `data` — reading the
  wrong one gives an empty object and no error.
*/
function promotion(event) {
  const d = (event && event.customData) || {};
  const id = d.promotion_id || '';
  const name = d.promotion_name || '';
  return {
    promotion_id: id,
    promotion_name: name,
    creative_slot: d.creative_slot || '',
    location_id: d.location_id || '',
    // GA4 leaves a promotion out of its Promotions report unless it has an
    // item. A banner sells no single product, so the banner is the item.
    items: [{ item_id: 'promo_' + id, item_name: name }],
  };
}

analytics.subscribe('custom_view_promotion', (event) => {
  setPage(event);
  gtag('event', 'view_promotion', promotion(event));
});

analytics.subscribe('custom_select_promotion', (event) => {
  setPage(event);
  gtag('event', 'select_promotion', promotion(event));
});

/* ---------- links ---------- */

/*
  GA4's own outbound-click and file-download tracking needs gtag in the page.
  Shopify passes every click to the pixel with the element's href, so rebuild
  both here. Query strings are dropped: they can carry emails or tokens.
*/
const OWN_HOSTS = ['spyoptic.com', 'www.spyoptic.com', 'spyoptic-com.myshopify.com'];
const FILE_TYPES = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|txt)$/i;

analytics.subscribe('clicked', (event) => {
  const el = event.data && event.data.element;
  const doc = event.context && event.context.document;
  if (!el || !el.href || !doc || !doc.location) return;
  let url;
  let pageHost;
  try {
    url = new URL(el.href, doc.location.href);
    pageHost = new URL(doc.location.href).hostname;
  } catch (e) {
    return;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return; // mailto:, tel:, javascript:
  const link = url.origin + url.pathname;
  const file = url.pathname.match(FILE_TYPES);
  if (file) {
    setPage(event);
    gtag('event', 'file_download', {
      file_extension: file[1].toLowerCase(),
      file_name: url.pathname.split('/').pop(),
      link_url: link,
    });
    return;
  }
  if (url.hostname === pageHost || OWN_HOSTS.includes(url.hostname)) {
    // A product picked from the last list shown
    const picked = shownList && shownList.byHandle.get(productHandle(url.pathname));
    if (picked) {
      setPage(event);
      gtag('event', 'select_item', { item_list_id: shownList.id, item_list_name: shownList.name, items: [picked] });
    }
    return;
  }
  setPage(event);
  gtag('event', 'click', { link_url: link, link_domain: url.hostname, outbound: true });
});
