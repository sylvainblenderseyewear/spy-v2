/*
  Unit test for the GA4 custom pixel, no browser needed.

  Runs audit/ga4-custom-pixel.js in a sandbox shaped like Shopify's
  (analytics, browser, init, api) and checks what reaches the dataLayer.

  Run:  node scripts/ga4-pixel-test.mjs
*/
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCE = readFileSync(new URL('../audit/ga4-custom-pixel.js', import.meta.url), 'utf8');

const tick = () => new Promise((r) => setTimeout(r, 0));

const DOM_EVENTS = ['clicked', 'form_submitted', 'input_blurred', 'input_changed', 'input_focused'];

// A fresh pixel per test, so state never leaks between them
function load({ cookies = {} } = {}) {
  const handlers = {};
  const privacy = {};
  const store = new Map();
  const docListeners = {};
  const winListeners = {};
  const on = (list) => (type, fn) => (list[type] = list[type] || []).push(fn);
  const ctx = {
    console,
    atob,
    URL,
    URLSearchParams,
    __now: 1_000_000,
    document: {
      createElement: () => ({}),
      head: { appendChild() {} },
      visibilityState: 'visible',
      addEventListener: on(docListeners),
    },
    addEventListener: on(winListeners),
    analytics: { subscribe: (name, fn) => (handlers[name] = fn) },
    browser: {
      cookie: { get: async (name) => cookies[name] || '' },
      sessionStorage: {
        getItem: async (k) => (store.has(k) ? store.get(k) : null),
        setItem: async (k, v) => store.set(k, v),
      },
    },
    init: {
      customerPrivacy: { analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true },
      data: { shop: { paymentSettings: { currencyCode: 'USD' } } },
    },
    api: { customerPrivacy: { subscribe: (name, fn) => (privacy[name] = fn) } },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext('Date.now = () => globalThis.__now;', ctx); // a clock the tests can move
  vm.runInContext(SOURCE, ctx);

  const calls = () => ctx.dataLayer.map((a) => Array.from(a));
  const events = (name) => calls().filter((c) => c[0] === 'event' && (!name || c[1] === name));
  // Shopify also hands every event to the matching bulk subscription
  const fire = async (name, payload) => {
    const bulk = DOM_EVENTS.includes(name) ? 'all_dom_events' : name.startsWith('custom_') ? 'all_custom_events' : 'all_standard_events';
    const event = { name, ...payload };
    if (handlers[bulk]) await handlers[bulk](event);
    if (handlers[name]) await handlers[name](event);
    await tick();
  };
  const consent = (c) => privacy.visitorConsentCollected({ customerPrivacy: c });
  const advance = (ms) => (ctx.__now += ms);
  const setVisible = (visible) => {
    ctx.document.visibilityState = visible ? 'visible' : 'hidden';
    (docListeners.visibilitychange || []).forEach((fn) => fn());
  };
  const pagehide = () => (winListeners.pagehide || []).forEach((fn) => fn());
  return { fire, consent, calls, events, advance, setVisible, pagehide };
}

const doc = { context: { document: { location: { href: 'https://spyoptic.com/checkouts/cn/TOKEN123/en-us' }, title: 'Checkout', referrer: '' } } };
const money = (amount) => ({ amount, currencyCode: 'USD' });
const variant = {
  id: '45001',
  title: 'Matte Black',
  price: money(140),
  product: { id: '7001', title: 'Cyrus', vendor: 'Spy', type: 'Sunglasses', url: '/products/cyrus-matte-black' },
};

function checkout(token, extra = {}) {
  return {
    ...doc,
    data: {
      checkout: {
        token,
        currencyCode: 'USD',
        totalPrice: money(155),
        totalTax: money(0),
        shippingLine: { price: money(15) },
        lineItems: [{ variant, quantity: 1 }],
        ...extra,
      },
    },
  };
}

const delivery = (title) => ({ delivery: { selectedDeliveryOptions: [{ title, handle: title.toLowerCase(), cost: money(0) }] } });

let failed = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
  if (!ok) failed++;
}

// Analytics yes, marketing no: events flow, ad signals stay denied
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: true, marketingAllowed: false, saleOfDataAllowed: true });
  const update = p.calls().find((c) => c[0] === 'consent' && c[1] === 'update');
  check('analytics-only consent grants analytics, denies ads',
    update && update[2].analytics_storage === 'granted' && update[2].ad_storage === 'denied' && update[2].ad_user_data === 'denied',
    JSON.stringify(update));
  await p.fire('page_viewed', doc);
  check('analytics-only consent sends events', p.events('page_view').length === 1);
}

// Nothing leaves before a choice
{
  const p = load();
  await p.fire('page_viewed', doc);
  check('no choice: nothing sent', p.events().length === 0, JSON.stringify(p.events()));
}

// Decline drops everything
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: false, marketingAllowed: false, saleOfDataAllowed: true });
  await p.fire('page_viewed', doc);
  check('decline: nothing sent', p.events().length === 0);
}

// Product lists carry a currency
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true });
  await p.fire('collection_viewed', { ...doc, data: { collection: { id: '9', title: 'Sunglasses', productVariants: [variant] } } });
  const e = p.events('view_item_list')[0];
  check('view_item_list has currency', e && e[2].currency === 'USD', JSON.stringify(e && e[2]));

  await p.fire('collection_viewed', { ...doc, data: { collection: { id: '9', title: 'Empty', productVariants: [] } } });
  const empty = p.events('view_item_list')[1];
  check('view_item_list falls back to the shop currency', empty && empty[2].currency === 'USD', JSON.stringify(empty && empty[2]));
}

// Shipping counted once per checkout, with the method name
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true });
  await p.fire('checkout_shipping_info_submitted', checkout('A', delivery('Standard')));
  await p.fire('checkout_shipping_info_submitted', checkout('A', delivery('Express')));
  await p.fire('checkout_shipping_info_submitted', checkout('A', delivery('Standard')));
  const sent = p.events('add_shipping_info');
  check('add_shipping_info once for one checkout', sent.length === 1, `${sent.length} sent`);
  check('add_shipping_info carries shipping_tier', sent[0] && sent[0][2].shipping_tier === 'Standard', JSON.stringify(sent[0] && sent[0][2]));

  await p.fire('checkout_shipping_info_submitted', checkout('B', delivery('Express')));
  check('a new checkout counts again', p.events('add_shipping_info').length === 2);
}

// No delivery data: no shipping_tier key at all
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true });
  await p.fire('checkout_shipping_info_submitted', checkout('C'));
  const e = p.events('add_shipping_info')[0];
  check('missing delivery sends no shipping_tier', e && !('shipping_tier' in e[2]), JSON.stringify(e && e[2]));
}

// Purchase: coupon codes only, final shipping method
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true });
  await p.fire('checkout_completed', checkout('D', {
    order: { id: 777 },
    ...delivery('Express'),
    discountApplications: [
      { type: 'DISCOUNT_CODE', title: 'WELCOME20', value: { percentage: 20 } },
      { type: 'AUTOMATIC', title: 'Free shipping over $50', value: money(15) },
    ],
  }));
  const e = p.events('purchase')[0];
  check('purchase transaction_id is the order id', e && e[2].transaction_id === '777', JSON.stringify(e && e[2]));
  check('purchase coupon has codes only', e && e[2].coupon === 'WELCOME20', JSON.stringify(e && e[2].coupon));
  check('purchase carries the final shipping method', e && e[2].shipping_tier === 'Express', JSON.stringify(e && e[2].shipping_tier));

  await p.fire('checkout_completed', checkout('E', { order: { id: 778 }, discountApplications: [] }));
  const plain = p.events('purchase')[1];
  check('purchase without a code sends no coupon key', plain && !('coupon' in plain[2]), JSON.stringify(plain && plain[2]));
}

// Promotions need an item, or GA4 leaves them out of its Promotions report
{
  const p = load();
  p.consent({ analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true });
  const banner = { ...doc, customData: { promotion_id: 'b1', promotion_name: 'Happy Boost', creative_slot: 'half_banner', location_id: '/' } };
  await p.fire('custom_view_promotion', banner);
  await p.fire('custom_select_promotion', banner);
  const view = p.events('view_promotion')[0];
  const click = p.events('select_promotion')[0];
  check('view_promotion keeps the banner name', view && view[2].promotion_name === 'Happy Boost', JSON.stringify(view && view[2]));
  check('view_promotion has the banner as its item',
    view && Array.isArray(view[2].items) && view[2].items.length === 1 && view[2].items[0].item_id === 'promo_b1' && view[2].items[0].item_name === 'Happy Boost',
    JSON.stringify(view && view[2].items));
  check('select_promotion has the banner as its item',
    click && Array.isArray(click[2].items) && click[2].items[0].item_id === 'promo_b1',
    JSON.stringify(click && click[2].items));
}

const all = { analyticsProcessingAllowed: true, marketingAllowed: true, saleOfDataAllowed: true };
const viewed = { ...doc, data: { productVariant: variant } };
const click = (href) => ({ ...doc, data: { element: { tagName: 'A', href } } });
const page = (href) => ({ context: { document: { location: { href }, title: 'SPY', referrer: '' } } });
const engaged = (p) => p.events().reduce((sum, e) => sum + ((e[2] && e[2].engagement_time_msec) || 0), 0);

// Engagement: visible time rides on the next event, like gtag does on a normal page
{
  const p = load();
  p.consent(all);
  await p.fire('page_viewed', doc);
  p.advance(12000);
  await p.fire('product_viewed', viewed);
  await p.fire('product_viewed', viewed);
  const [first, second] = p.events('view_item');
  check('next event carries the visible time', first && first[2].engagement_time_msec === 12000, JSON.stringify(first && first[2]));
  check('time is not counted twice', second && !('engagement_time_msec' in second[2]), JSON.stringify(second && second[2]));
}

// Hiding the page sends what is left; time spent hidden doesn't count
{
  const p = load();
  p.consent(all);
  await p.fire('page_viewed', doc);
  p.advance(8000);
  p.setVisible(false);
  p.advance(60000);
  p.setVisible(true);
  p.advance(3000);
  p.pagehide();
  const sent = p.events('user_engagement').map((e) => e[2].engagement_time_msec);
  check('hidden page sends user_engagement', sent[0] === 8000, JSON.stringify(sent));
  check('leaving the page sends the rest, hidden time left out', sent[1] === 3000 && sent.length === 2, JSON.stringify(sent));
}

// A tab left open stops counting after 5 idle minutes; a click starts it again
{
  const p = load();
  p.consent(all);
  await p.fire('page_viewed', doc);
  p.advance(10 * 60000);
  await p.fire('clicked', click('/collections/sunglasses'));
  p.advance(4000);
  p.setVisible(false);
  check('idle time is capped at 5 minutes', engaged(p) === 5 * 60000 + 4000, String(engaged(p)));
}

// Blips under a second are noise
{
  const p = load();
  p.consent(all);
  await p.fire('page_viewed', doc);
  p.advance(400);
  p.setVisible(false);
  check('sub-second visit sends no user_engagement', p.events('user_engagement').length === 0);
}

// No choice yet: engagement waits like everything else
{
  const p = load();
  await p.fire('page_viewed', doc);
  p.advance(20000);
  p.setVisible(false);
  await p.fire('clicked', click('https://www.instagram.com/spyoptic/'));
  check('no choice: no engagement or clicks sent', p.events().length === 0, JSON.stringify(p.events()));
}

// Outbound links and file downloads, as GA4's own enhanced measurement reports them
{
  const p = load();
  p.consent(all);
  await p.fire('clicked', click('https://stores.spyoptic.com/search?q=boston#map'));
  const out = p.events('click')[0];
  check('outbound click is sent', out && out[2].outbound === true && out[2].link_domain === 'stores.spyoptic.com', JSON.stringify(out && out[2]));
  check('outbound click drops the query string', out && out[2].link_url === 'https://stores.spyoptic.com/search', JSON.stringify(out && out[2].link_url));

  await p.fire('clicked', click('/collections/sunglasses'));
  await p.fire('clicked', click('https://www.spyoptic.com/pages/about'));
  await p.fire('clicked', click('mailto:help@spyoptic.com'));
  await p.fire('clicked', { ...doc, data: { element: { tagName: 'BUTTON', href: null } } });
  check('own links, mailto and buttons send nothing', p.events('click').length === 1, JSON.stringify(p.events('click')));

  await p.fire('clicked', click('https://cdn.shopify.com/s/files/1/size-chart.PDF?v=3'));
  const file = p.events('file_download')[0];
  check('file link sends file_download',
    file && file[2].file_extension === 'pdf' && file[2].file_name === 'size-chart.PDF' && file[2].link_url === 'https://cdn.shopify.com/s/files/1/size-chart.PDF',
    JSON.stringify(file && file[2]));
}

// Newsletter and contact sign-ups count as leads, once per tab
{
  const p = load();
  p.consent(all);
  await p.fire('page_viewed', page('https://spyoptic.com/?customer_posted=true#footer'));
  const set = p.calls().filter((c) => c[0] === 'set').pop();
  await p.fire('page_viewed', page('https://spyoptic.com/?customer_posted=true#footer')); // refresh
  await p.fire('page_viewed', page('https://spyoptic.com/pages/contact?contact_posted=true#contact_form'));
  await p.fire('page_viewed', page('https://spyoptic.com/pages/contact'));
  const leads = p.events('generate_lead').map((e) => e[2].lead_source);
  check('sign-ups send generate_lead once each', JSON.stringify(leads) === '["newsletter","contact_form"]', JSON.stringify(leads));
  check('the success flag stays out of page_location', set && !/customer_posted/.test(set[1].page_location), JSON.stringify(set && set[1]));
}

// Contact and address steps, once per checkout like shipping
{
  const p = load();
  p.consent(all);
  for (let i = 0; i < 2; i++) {
    await p.fire('checkout_contact_info_submitted', checkout('F'));
    await p.fire('checkout_address_info_submitted', checkout('F'));
  }
  check('add_contact_info once per checkout', p.events('add_contact_info').length === 1);
  check('add_address_info once per checkout', p.events('add_address_info').length === 1);
  const a = p.events('add_address_info')[0];
  check('checkout steps carry value and items', a && a[2].value === 155 && a[2].currency === 'USD' && a[2].items.length === 1, JSON.stringify(a && a[2]));
}

// Items: the product is the key, like Blenders; the variant and the Merchant Center ID ride along
{
  const p = load();
  p.consent(all);
  await p.fire('product_viewed', viewed);
  const it = p.events('view_item')[0][2].items[0];
  check('item_id is the product ID', it.item_id === '7001', JSON.stringify(it));
  check('variant ID and Merchant Center ID ride along', it.item_variant_id === '45001' && it.merchant_center_id === 'shopify_US_7001_45001', JSON.stringify(it));
  // gtag reads a bare `id` as an old alias of item_id and drops it
  check('items carry no bare id field', !('id' in it), JSON.stringify(it));

  const gid = { ...variant, id: 'gid://shopify/ProductVariant/45002', product: { ...variant.product, id: 'gid://shopify/Product/7002' } };
  await p.fire('product_viewed', { ...doc, data: { productVariant: gid } });
  const g = p.events('view_item')[1][2].items[0];
  check('Shopify gid IDs are reduced to the number', g.item_id === '7002' && g.merchant_center_id === 'shopify_US_7002_45002', JSON.stringify(g));
}

// Lists: positions, and a click on a listed product credited to its list
{
  const p = load();
  p.consent(all);
  const discord = { ...variant, id: '45009', product: { ...variant.product, id: '7009', title: 'Discord', url: '/products/discord-gloss-black' } };
  await p.fire('collection_viewed', { ...doc, data: { collection: { id: '9', title: 'Sunglasses', productVariants: [variant, discord] } } });
  const list = p.events('view_item_list')[0][2];
  check('list items carry their position', list.items[0].index === 0 && list.items[1].index === 1, JSON.stringify(list.items.map((i) => i.index)));

  await p.fire('clicked', click('/collections/sunglasses/products/discord-gloss-black?variant=45009'));
  const sel = p.events('select_item')[0];
  check('clicking a listed product sends select_item',
    sel && sel[2].item_list_id === '9' && sel[2].item_list_name === 'Sunglasses' && sel[2].items[0].item_id === '7009' && sel[2].items[0].index === 1,
    JSON.stringify(sel && sel[2]));
  await p.fire('clicked', click('/products/not-in-the-list'));
  check('a product that was not listed sends no select_item', p.events('select_item').length === 1 && p.events('click').length === 0);
}

// Search results are a list too
{
  const p = load();
  p.consent(all);
  await p.fire('search_submitted', { ...doc, data: { searchResult: { query: 'discord', productVariants: [variant] } } });
  check('search still sends search_term', p.events('search')[0] && p.events('search')[0][2].search_term === 'discord');
  const l = p.events('view_item_list')[0];
  check('search results send view_item_list', l && l[2].item_list_id === 'search_results' && l[2].item_list_name === 'Search results' && l[2].items.length === 1, JSON.stringify(l && l[2]));
  await p.fire('clicked', click('https://www.spyoptic.com/products/cyrus-matte-black'));
  const s = p.events('select_item')[0];
  check('a click from search results names that list', s && s[2].item_list_name === 'Search results', JSON.stringify(s && s[2]));
}

// Purchase: new or returning, and nothing when Shopify doesn't know (guest)
{
  const p = load();
  p.consent(all);
  await p.fire('checkout_completed', checkout('G', { order: { id: 901, customer: { id: '5', isFirstOrder: true } } }));
  await p.fire('checkout_completed', checkout('H', { order: { id: 902, customer: { id: '6', isFirstOrder: false } } }));
  await p.fire('checkout_completed', checkout('I', { order: { id: 903, customer: null } }));
  const [first, again, guest] = p.events('purchase').map((e) => e[2]);
  check('first order is customer_type new', first && first.customer_type === 'new', JSON.stringify(first && first.customer_type));
  check('repeat order is customer_type returning', again && again.customer_type === 'returning', JSON.stringify(again && again.customer_type));
  check('guest order sends no customer_type', guest && !('customer_type' in guest), JSON.stringify(guest));
}

// The first and payment steps count once per checkout too
{
  const p = load();
  p.consent(all);
  const paid = { transactions: [{ gateway: 'shopify_payments', paymentMethod: { name: 'Visa', type: 'creditCard' } }] };
  for (let i = 0; i < 2; i++) {
    await p.fire('checkout_started', checkout('J'));
    await p.fire('payment_info_submitted', checkout('J', paid));
  }
  check('begin_checkout once per checkout', p.events('begin_checkout').length === 1, String(p.events('begin_checkout').length));
  check('add_payment_info once per checkout', p.events('add_payment_info').length === 1, String(p.events('add_payment_info').length));
  const pay = p.events('add_payment_info')[0];
  check('payment_type is the payment method name', pay && pay[2].payment_type === 'Visa', JSON.stringify(pay && pay[2].payment_type));
  await p.fire('checkout_started', checkout('K'));
  check('a new checkout starts again', p.events('begin_checkout').length === 2);
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
