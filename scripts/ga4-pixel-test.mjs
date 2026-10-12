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

// A fresh pixel per test, so state never leaks between them
function load({ cookies = {} } = {}) {
  const handlers = {};
  const privacy = {};
  const store = new Map();
  const ctx = {
    console,
    atob,
    document: { createElement: () => ({}), head: { appendChild() {} } },
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
  vm.runInContext(SOURCE, ctx);

  const calls = () => ctx.dataLayer.map((a) => Array.from(a));
  const events = (name) => calls().filter((c) => c[0] === 'event' && (!name || c[1] === name));
  const fire = async (name, payload) => {
    await handlers[name](payload);
    await tick();
  };
  const consent = (c) => privacy.visitorConsentCollected({ customerPrivacy: c });
  return { fire, consent, calls, events };
}

const doc = { context: { document: { location: { href: 'https://spyoptic.com/checkouts/cn/TOKEN123/en-us' }, title: 'Checkout', referrer: '' } } };
const money = (amount) => ({ amount, currencyCode: 'USD' });
const variant = { id: 1, title: 'Matte Black', price: money(140), product: { title: 'Cyrus', vendor: 'Spy', type: 'Sunglasses' } };

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

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
