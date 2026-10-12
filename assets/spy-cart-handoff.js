/**
 * Picks which cart answers the bag: Rebuy Smart Cart or the theme drawer.
 *
 * Rebuy is consent-gated — Pandectes blocks rebuyengine.com until the shopper
 * accepts, and plenty of them never will. So the theme drawer is the default and
 * Rebuy only takes over once Smart Cart is genuinely callable. Nobody loses a cart.
 *
 * Rebuy's own docs: Smart Cart "cannot automatically remove, hide or otherwise
 * override your theme's native cart drawer. Both can and will exist until you take
 * steps to suppress your native cart drawer." This file is that step.
 */

const HTML = document.documentElement;

// Both trigger shapes: the drawer button, and the plain /cart link when
// settings.cart_type is not 'drawer'.
const TRIGGERS = '[data-testid="cart-drawer-trigger"], a.action__cart';

// Rebuy's real names, logged live. rebuy:cart.ready fires before SmartCart
// exists, so it can't be the signal; rebuy:smartcart.ready is.
const READY_EVENTS = ['rebuy:smartcart.ready', 'rebuy.ready', 'rebuy:smartcart.show'];
const POLL_MS = 500;
// Backup only. Rebuy boots 6-15s after load even on a fast line.
const GIVE_UP_MS = 60000;

// Theme drawer until proven otherwise.
HTML.setAttribute('data-cart-engine', 'theme');

/** Smart Cart is only usable once show() actually exists. */
function smartCartReady() {
  const cart = window.Rebuy?.SmartCart;
  return Boolean(cart && typeof cart.show === 'function');
}

/** Hand over to Rebuy, once. Returns true when Rebuy owns the cart. */
function claim() {
  if (!smartCartReady()) return false;
  if (HTML.getAttribute('data-cart-engine') === 'rebuy') return true;

  HTML.setAttribute('data-cart-engine', 'rebuy');

  // Only one engine may auto-open after an add, or the cart opens twice.
  document.querySelector('cart-drawer-component')?.removeAttribute('auto-open');
  customElements.whenDefined('theme-drawer').then(redirectThemeDrawer);
  return true;
}

/**
 * Rebuy boots 6-15s after load, so until then the theme drawer is the cart. An
 * add still in flight at the handover opens it anyway, so from here on every
 * road into the drawer (that add, Shopify.actions.openCart) opens Smart Cart.
 */
function redirectThemeDrawer() {
  const drawer = document.querySelector('theme-drawer#cart-drawer');
  if (!drawer) return;

  const openDrawer = drawer.open.bind(drawer);
  drawer.open = (...args) => (smartCartReady() ? window.Rebuy.SmartCart.show() : openDrawer(...args));
}

// A drawer opened before the handover must not sit under Smart Cart. Closing it
// hands focus back to its trigger, so take focus back to where Rebuy puts it.
document.addEventListener('rebuy:smartcart.show', () => {
  const drawer = document.querySelector('theme-drawer#cart-drawer[open]');
  drawer?.close().then(() => {
    if (!document.querySelector('#rebuy-cart.is-visible')) return;
    document.querySelector('#rebuy-cart .rebuy-cart__flyout-close')?.focus();
  });
});

if (!claim()) {
  // Rebuy loads late, and only after consent. Watch instead of checking once.
  for (const name of READY_EVENTS) {
    document.addEventListener(name, claim);
  }

  const poll = setInterval(() => {
    if (claim()) clearInterval(poll);
  }, POLL_MS);

  // Consent may never come. Stop looking and stay on the theme drawer.
  setTimeout(() => clearInterval(poll), GIVE_UP_MS);
}

/**
 * Keep the bag badge hidden on an empty cart.
 *
 * Rebuy writes the live count into `.cart-bubble__text-count` (its Theme
 * Selector setting), but it does not know about the theme's own hidden classes,
 * so an emptied cart leaves a "0" badge sitting on the icon.
 */
function syncCartBubble() {
  const count = document.querySelector('.cart-bubble__text-count');
  if (!count) return;

  const empty = !count.textContent.trim() || count.textContent.trim() === '0';
  count.classList.toggle('hidden', empty);
  count.closest('.cart-bubble')?.classList.toggle('visually-hidden', empty);
}

syncCartBubble();

const bubble = document.querySelector('.cart-bubble__text-count');
if (bubble) {
  // Rebuy rewrites the number in place, so watch the text, not the element.
  new MutationObserver(syncCartBubble).observe(bubble, {
    characterData: true,
    childList: true,
    subtree: true,
  });
}

// The count also changes on Rebuy's own cart events
for (const name of ['rebuy:cart.change', 'rebuy:smartcart.hide', 'rebuy:cart.ready']) {
  document.addEventListener(name, syncCartBubble);
}

/**
 * One engine answers the bag. Horizon's `on:click="#cart-drawer/toggle"` also
 * listens on document in the capture phase, and it registers first, so
 * stopPropagation() on document can't stop it — both carts opened. Window
 * capture runs before anything on document.
 *
 * The guard is deliberately strict: we only swallow the click when Rebuy can
 * really open. Blenders' build calls preventDefault() before checking, so when
 * Rebuy is blocked their bag does nothing at all.
 */
window.addEventListener(
  'click',
  (event) => {
    if (HTML.getAttribute('data-cart-engine') !== 'rebuy') return;
    if (!event.target.closest?.(TRIGGERS)) return;
    if (!smartCartReady()) return; // half-loaded Rebuy must not eat the click

    event.preventDefault();
    event.stopPropagation();
    window.Rebuy.SmartCart.show();
  },
  true
);

/**
 * The source never locks scroll. From 990px Horizon scrolls .page-wrapper, not
 * the window, and Rebuy's fixed backdrop sits outside it, so a wheel over the
 * backdrop went nowhere. Pass it on to the page.
 */
window.addEventListener(
  'wheel',
  (event) => {
    if (!event.target.closest?.('#rebuy-cart .rebuy-cart__background')) return;

    const page = document.querySelector('.page-wrapper');
    if (!page || page.scrollHeight <= page.clientHeight) return; // below 990px the window scrolls itself

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page.clientHeight : 1;
    page.scrollBy({ top: event.deltaY * unit, behavior: 'instant' });
  },
  { passive: true }
);
