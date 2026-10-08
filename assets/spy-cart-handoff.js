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

const READY_EVENTS = ['rebuy:ready', 'rebuy:cart.ready', 'rebuy:smartcart.show'];
const POLL_MS = 500;
const GIVE_UP_MS = 20000;

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
  return true;
}

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
 * One engine answers the bag. Capture phase so we land before Horizon's own
 * `on:click="#cart-drawer/toggle"` handler.
 *
 * The guard is deliberately strict: we only swallow the click when Rebuy can
 * really open. Blenders' build calls preventDefault() before checking, so when
 * Rebuy is blocked their bag does nothing at all.
 */
document.addEventListener(
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
