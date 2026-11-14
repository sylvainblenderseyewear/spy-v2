// "Notify me when back in stock" button (blocks/spy-notify-me.liquid).
// One page-level click listener, so the button still works after the colour
// switch redraws the block. With the app on, it opens an AMP Back in Stock popup
// that lists every sold-out colourway of the colour row, with the picked one
// selected. Each frame is its own product, so the app's own page popup only
// knows one frame; we give the app our list instead (data-spy-notify-variants).
// If the app never gets ready, it opens our small email form instead.

const APP_WAIT_MS = 8000;
const FORM_WAIT_MS = 3000;

/** Polls until test() gives a value, or resolves with null after ms. */
function waitFor(test, ms) {
  return new Promise((resolve) => {
    const end = Date.now() + ms;
    const poll = () => {
      let value = null;
      try {
        value = test();
      } catch {
        // the app is still loading
      }
      if (value) resolve(value);
      else if (Date.now() > end) resolve(null);
      else setTimeout(poll, 150);
    };
    poll();
  });
}

/** @param {Element} el */
function readList(el) {
  try {
    const list = JSON.parse(el.getAttribute('data-spy-notify-variants') || '[]');
    return Array.isArray(list) ? list.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
}

/** The colour row's sold-out colourways (and sizes), in row order, plus the button's own. */
function colourways(toggle) {
  const scope = toggle.closest('.shopify-section') || document;
  const byId = new Map();
  scope.querySelectorAll('[data-spy-colourway][data-spy-notify-variants]').forEach((link) => {
    for (const item of readList(link)) if (!byId.has(item.id)) byId.set(item.id, item);
  });
  const list = [...byId.values()];
  const [own] = readList(toggle);
  if (own && !byId.has(own.id)) {
    // The page shows the twin record of a listed colourway: list the page's one instead.
    // No swatch at all (a $0 row, no colour row): put it first. The button can't tell
    // whether the size is in the swatch's label, so a trailing " / size" may differ.
    const same = (a, b) => a === b || a.startsWith(`${b} / `) || b.startsWith(`${a} / `);
    const twin = list.findIndex((item) => same(item.title, own.title));
    if (twin >= 0) list[twin] = own;
    else list.unshift(own);
  }
  return list;
}

/**
 * Loads the app's widget once, and only when a shopper heads for the button.
 * No URL on the button means the app embed is in charge of loading it.
 */
let appRequested = false;
function loadApp(toggle) {
  const src = toggle.getAttribute('data-spy-notify-script');
  if (appRequested || !src || typeof window.BIS?.Popover === 'function') return;
  appRequested = true;
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  // A failed load can be tried again on the next hover or click
  script.addEventListener('error', () => {
    script.remove();
    appRequested = false;
  });
  document.head.append(script);
}

/** Removes a popup we built, frame and all. */
function destroy(popover) {
  if (!popover) return;
  document.removeEventListener('click', popover.triggerHandler);
  popover.spyHost?.remove();
}

/** Builds an app popup for our list. Resolves null if the app can't show it. */
async function build(toggle, list) {
  loadApp(toggle);
  const bis = await waitFor(() => (typeof window.BIS?.Popover === 'function' && window.BIS.Config ? window.BIS : null), APP_WAIT_MS);
  if (!bis || !list.length) return null;

  // The app's web push code takes the first #BIS_frame on the page, so ours goes first
  const host = document.createElement('div');
  const appFrame = document.getElementById('BIS_frame');
  if (appFrame) appFrame.before(host);
  else document.body.append(host);

  let popover = null;
  try {
    const productOf = new Map(list.map((item) => [Number(item.id), Number(item.product_id)]));
    // A copy of the config: BIS.createPopover merges into BIS.Config, whose product
    // is the same object as the page popup's
    popover = new bis.Popover({
      ...bis.Config,
      product: {
        id: Number(toggle.dataset.productId),
        title: toggle.dataset.modelName || '',
        tags: [],
        variants: list.map(({ id, title, available, inventory_management }) => ({ id, title, available, inventory_management })),
      },
      root: host,
      button: { ...bis.Config.button, visible: false },
    });
    popover.spyHost = host;

    // A sign-up carries the popup's product id: a sibling frame's colourway needs its own
    const create = popover.create;
    popover.create = function (email, variantId, productId, attributes) {
      return create.call(this, email, variantId, productId ?? productOf.get(Number(variantId)) ?? null, attributes);
    };

    // ready only resolves when the app sees something sold out in the list
    const ready = await new Promise((resolve) => {
      setTimeout(() => resolve(false), APP_WAIT_MS);
      popover.ready.then(() => resolve(true));
    });
    // The form draws itself once its frame has loaded
    const drawn = ready && (await waitFor(() => popover.form?.frameDoc().getElementById('variants'), FORM_WAIT_MS));
    if (drawn) return popover;
  } catch {
    // The app's script changed under us: our email form takes over
  }
  if (popover) destroy(popover);
  else host.remove();
  return null;
}

/** @type {{key: string, popover: Promise<any>} | null} */
let current = null;

/** One popup at a time, rebuilt only when the list changes. */
function popoverFor(toggle) {
  const list = colourways(toggle);
  const key = list.map((item) => item.id).join(',');
  if (current?.key !== key) {
    current?.popover.then(destroy);
    const entry = { key, popover: build(toggle, list) };
    current = entry;
    // Try again on the next click if the app wasn't there
    entry.popover.then((popover) => {
      if (!popover && current === entry) current = null;
    });
  }
  return current.popover;
}

/** Opens our email form under the button. */
function openForm(toggle, { focus = true } = {}) {
  const panel = toggle.closest('.spy-notify-me')?.querySelector('.spy-notify-me__panel');
  if (!panel) return;
  toggle.setAttribute('aria-expanded', 'true');
  panel.hidden = false;
  if (focus) panel.querySelector('input[type="email"]')?.focus();
}

/** Puts focus back on our button when the app's popup closes. */
function refocusOnClose(toggle, frame) {
  const observer = new MutationObserver(() => {
    if (getComputedStyle(frame).display !== 'none') return;
    observer.disconnect();
    if (toggle.isConnected) toggle.focus();
  });
  observer.observe(frame, { attributes: true, attributeFilter: ['style'] });
}

async function openApp(toggle) {
  if (toggle.getAttribute('aria-busy') === 'true') return; // already waiting for the app
  toggle.setAttribute('aria-busy', 'true');
  const popover = await popoverFor(toggle);
  toggle.removeAttribute('aria-busy');

  // The app drops what it doesn't see as sold out. Any other id would leave
  // its first colourway picked, so use our form then.
  const variantId = Number(toggle.dataset.variantId);
  if (!popover?.variants?.some((variant) => Number(variant.id) === variantId)) {
    openForm(toggle);
    return;
  }
  popover.show({ variantId });
  refocusOnClose(toggle, popover.form.frame);
}

document.addEventListener('click', (event) => {
  const toggle = event.target.closest?.('[data-spy-notify-toggle]');
  if (!toggle) return;
  if (toggle.hasAttribute('data-spy-notify-app')) openApp(toggle);
  else openForm(toggle);
});

// Start building when the shopper heads for the button, so the click opens it at once
const warm = (event) => {
  const toggle = event.target instanceof Element ? event.target.closest('[data-spy-notify-app]') : null;
  if (toggle) popoverFor(toggle);
};
document.addEventListener('pointerover', warm);
document.addEventListener('focusin', warm);
document.addEventListener('touchstart', warm, { passive: true });

// Back from a send (thanks or error): keep the form open
document.querySelectorAll('.spy-notify-me [data-spy-notify-open]').forEach((mark) => {
  const toggle = mark.closest('.spy-notify-me')?.querySelector('[data-spy-notify-toggle]');
  if (toggle) openForm(toggle, { focus: false });
});
