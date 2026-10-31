// PDP colour swatches link to a colourway: another lens of this frame or a lens of a
// sibling frame (one product per frame, lenses as variants), as `?variant=` URLs. Load
// the pick in place instead of a whole new page, the way Blenders and the old site do:
// one Section Rendering request, Horizon's own morph per section, and the address bar
// moved with replaceState so Back still leaves the product.
import { morphSection } from '@theme/section-renderer';

const LINK = '[data-spy-colourway]';
const FRESH_MS = 60_000;
const MAX_CACHED = 24;
/** @type {Map<string, {at: number, sections: Promise<Record<string, string>>}>} */
const cache = new Map();
let latest = 0;

// Every product section on the page; the quick view shell is the same for any product.
// Its dialog moves to <body>, so spy-quick-view.js marks the section it leaves behind.
const sectionIds = () =>
  [...document.querySelectorAll('main .shopify-section')]
    .filter((section) => !section.matches('[data-spy-qv-shell]') && !section.querySelector('[data-spy-qv-root]'))
    .map((section) => section.id.replace(/^shopify-section-/, ''));

/**
 * Shopify answers at most 5 sections per request
 * @param {string} target - Path plus the `?variant=` query
 */
function fetchSections(target) {
  const ids = sectionIds();
  const batches = [];
  for (let i = 0; i < ids.length; i += 5) batches.push(ids.slice(i, i + 5));
  return Promise.all(
    batches.map((batch) => {
      const url = new URL(target, window.location.origin);
      url.searchParams.set('sections', batch.join(','));
      return fetch(url.pathname + url.search).then((response) => {
        if (!response.ok) throw new Error(`sections ${response.status}`);
        return response.json();
      });
    })
  ).then((parts) => Object.assign({}, ...parts));
}

/** @param {string} target */
function load(target) {
  const now = Date.now();
  const hit = cache.get(target);
  if (hit && now - hit.at < FRESH_MS) return hit.sections;
  // Drop stale answers, then the oldest once the list gets long
  for (const [key, entry] of cache) if (now - entry.at >= FRESH_MS) cache.delete(key);
  while (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value);
  const sections = fetchSections(target);
  sections.catch(() => cache.delete(target));
  cache.set(target, { at: Date.now(), sections });
  return sections;
}

/** @param {HTMLAnchorElement} link */
const targetOf = (link) => {
  const url = new URL(link.href, window.location.href);
  return url.pathname + url.search;
};

// The colourway the page really shows. The swatch outline moves on click, before the swap
// lands, so it can't tell which title is in the tab after two quick picks. A $0 row has
// no swatch of its own, so any swatch of this page's frame gives the title then.
const pageSwatch = () =>
  document.querySelector(`main .spy-swatches ${LINK}[aria-current="true"]`) ||
  [...document.querySelectorAll(`main .spy-swatches ${LINK}`)].find(
    (link) => new URL(link.getAttribute('href') || '', window.location.href).pathname === window.location.pathname
  );
let shownTitle = pageSwatch()?.getAttribute('data-product-title') || '';

// Horizon's own size pick fetches its page too. If that answer came in after a swatch
// switch it would put the old colourway back, so a switch lets it land first.
/** @type {Promise<void> | null} */
let horizonPick = null;
document.addEventListener('shopify:product:select', (event) => {
  const from = event.target instanceof Element ? event.target : null;
  if (!from?.closest('main') || from.closest('product-card, [data-spy-qv-root]')) return;
  // @ts-ignore ProductSelectEvent carries Horizon's fetch as a promise
  const landed = Promise.resolve(event.promise).then(() => {}, () => {});
  horizonPick = landed;
  landed.then(() => {
    if (horizonPick === landed) horizonPick = null;
  });
});

// Horizon's morph can't uncheck a radio the shopper clicked, so after a switch the lens
// row could end up with no pick at all. Copy the server's picks onto the live radios.
function syncRadios(id, html) {
  const section = document.getElementById(`shopify-section-${id}`);
  const served = new DOMParser().parseFromString(html, 'text/html');
  served.querySelectorAll('input[type="radio"][name]').forEach((input) => {
    const radio = /** @type {HTMLInputElement} */ (input);
    const live = section?.querySelector(`input[type="radio"][name="${CSS.escape(radio.name)}"][value="${CSS.escape(radio.value)}"]`);
    if (!(live instanceof HTMLInputElement)) return;
    const on = radio.hasAttribute('checked');
    live.checked = on;
    live.toggleAttribute('checked', on);
    live.dataset.currentChecked = String(on);
    live.dataset.previousChecked = 'false';
  });
}

let liveRegion;
function announce(text) {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = text;
}

/** @param {HTMLAnchorElement} link */
async function switchTo(link) {
  const url = new URL(link.href, window.location.href);
  const target = targetOf(link);
  const ticket = ++latest;
  const picker = link.closest('.spy-swatches');
  const current = picker?.querySelector('[aria-current="true"]');
  const toTitle = link.getAttribute('data-product-title') || '';
  const label = (link.getAttribute('aria-label') || toTitle).trim();
  const hadFocus = !!picker?.contains(document.activeElement);

  // Show the pick straight away; the morph brings the same state from the server
  current?.removeAttribute('aria-current');
  link.setAttribute('aria-current', 'true');
  picker?.setAttribute('aria-busy', 'true');

  try {
    const sections = await load(target);
    if (ticket !== latest) return;
    if (horizonPick) {
      await Promise.race([horizonPick, new Promise((resolve) => setTimeout(resolve, 4000))]);
      // Its listeners update price, gallery and form on the same promise; let them finish
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (ticket !== latest) return;
    }
    const ids = Object.keys(sections);
    // A sibling on another template has other section ids: load it the normal way
    if (!ids.length || ids.some((id) => !sections[id])) throw new Error('section missing');

    for (const id of ids) {
      await morphSection(id, sections[id]);
      syncRadios(id, sections[id]);
    }

    history.replaceState(history.state, '', target + url.hash);
    if (shownTitle && toTitle) document.title = document.title.replace(shownTitle, toTitle);
    shownTitle = toTitle;

    document.dispatchEvent(new CustomEvent('spy:product:switched', { detail: { url: target, title: toTitle } }));
    // @ts-ignore Yotpo's classic widget re-reads the product ids it was given
    window.yotpo?.refreshWidgets?.();

    if (label) announce(label);
    if (hadFocus) /** @type {HTMLElement | null} */ (document.querySelector(`main .spy-swatches ${LINK}[aria-current="true"]`))?.focus();
  } catch (error) {
    if (ticket === latest) window.location.assign(url.href);
  } finally {
    if (ticket === latest) document.querySelectorAll('main .spy-swatches[aria-busy]').forEach((el) => el.removeAttribute('aria-busy'));
  }
}

const isPlainClick = (/** @type {MouseEvent} */ event) =>
  !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const linkFrom = (/** @type {Event} */ event) => {
  const target = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
  const link = /** @type {HTMLAnchorElement | null} */ (target?.closest(LINK));
  if (!link || link.closest('[data-spy-qv-root]') || !link.closest('main')) return null;
  // @ts-ignore The theme editor reloads sections itself
  if (window.Shopify?.designMode) return null;
  return link;
};

document.addEventListener('click', (event) => {
  const link = linkFrom(event);
  if (!link || !isPlainClick(event)) return;
  event.preventDefault();
  if (link.getAttribute('aria-current') === 'true') return;
  switchTo(link);
});

// Start loading on hover, focus or touch, so most picks are already in hand
const warm = (/** @type {Event} */ event) => {
  const link = linkFrom(event);
  if (!link || link.getAttribute('aria-current') === 'true') return;
  load(targetOf(link)).catch(() => {});
};
// A row can hold 15+ colourways: wait for the pointer or the keyboard focus to rest, so
// a sweep across it (or tabbing past it) doesn't fetch every one
let hoverTimer = 0;
document.addEventListener('pointerover', (event) => {
  clearTimeout(hoverTimer);
  if (linkFrom(event)) hoverTimer = window.setTimeout(() => warm(event), 80);
});
document.addEventListener('pointerout', () => clearTimeout(hoverTimer));
let focusTimer = 0;
document.addEventListener('focusin', (event) => {
  clearTimeout(focusTimer);
  if (linkFrom(event)) focusTimer = window.setTimeout(() => warm(event), 250);
});
document.addEventListener('focusout', () => clearTimeout(focusTimer));
document.addEventListener('touchstart', warm, { passive: true });
