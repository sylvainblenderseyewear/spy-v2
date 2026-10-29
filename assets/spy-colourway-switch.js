// PDP colour swatches link to sibling products (one product per colourway). Load the
// picked colourway in place instead of a whole new page, the way Blenders and the old
// site do: one Section Rendering request, Horizon's own morph per section, and the
// address bar moved with replaceState so Back still leaves the product.
import { morphSection } from '@theme/section-renderer';

const LINK = '[data-spy-colourway]';
const FRESH_MS = 60_000;
/** @type {Map<string, {at: number, sections: Promise<Record<string, string>>}>} */
const cache = new Map();
let latest = 0;

// Every product section on the page; the quick view shell is the same for any product
const sectionIds = () =>
  [...document.querySelectorAll('main .shopify-section')]
    .filter((section) => !section.querySelector('[data-spy-qv-root]'))
    .map((section) => section.id.replace(/^shopify-section-/, ''));

/** Shopify answers at most 5 sections per request */
function fetchSections(path) {
  const ids = sectionIds();
  const batches = [];
  for (let i = 0; i < ids.length; i += 5) batches.push(ids.slice(i, i + 5));
  return Promise.all(
    batches.map((batch) =>
      fetch(`${path}?sections=${batch.join(',')}`).then((response) => {
        if (!response.ok) throw new Error(`sections ${response.status}`);
        return response.json();
      })
    )
  ).then((parts) => Object.assign({}, ...parts));
}

function load(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.sections;
  const sections = fetchSections(path);
  sections.catch(() => cache.delete(path));
  cache.set(path, { at: Date.now(), sections });
  return sections;
}

// The colourway the page really shows. The swatch outline moves on click, before the swap
// lands, so it can't tell which title is in the tab after two quick picks.
let shownTitle = document.querySelector(`main .spy-swatches ${LINK}[aria-current="true"]`)?.getAttribute('data-product-title') || '';

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
  const ticket = ++latest;
  const picker = link.closest('.spy-swatches');
  const current = picker?.querySelector('[aria-current="true"]');
  const toTitle = link.getAttribute('data-product-title') || '';
  const hadFocus = !!picker?.contains(document.activeElement);

  // Show the pick straight away; the morph brings the same state from the server
  current?.removeAttribute('aria-current');
  link.setAttribute('aria-current', 'true');
  picker?.setAttribute('aria-busy', 'true');

  try {
    const sections = await load(url.pathname);
    if (ticket !== latest) return;
    const ids = Object.keys(sections);
    // A sibling on another template has other section ids: load it the normal way
    if (!ids.length || ids.some((id) => !sections[id])) throw new Error('section missing');

    for (const id of ids) await morphSection(id, sections[id]);

    history.replaceState(history.state, '', url.pathname + url.hash);
    if (shownTitle && toTitle) document.title = document.title.replace(shownTitle, toTitle);
    shownTitle = toTitle;

    document.dispatchEvent(new CustomEvent('spy:product:switched', { detail: { url: url.pathname, title: toTitle } }));
    // @ts-ignore Yotpo's classic widget re-reads the product ids it was given
    window.yotpo?.refreshWidgets?.();

    if (toTitle) announce(toTitle);
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
  load(new URL(link.href, window.location.href).pathname).catch(() => {});
};
document.addEventListener('pointerover', warm);
document.addEventListener('focusin', warm);
document.addEventListener('touchstart', warm, { passive: true });
