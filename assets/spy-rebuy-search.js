/**
 * Rebuy Smart Search glue. Rebuy draws the search box and the results page
 * (the PM asked for the Blenders layout); the theme search stays the fallback,
 * because Rebuy boots late and Pandectes blocks it until the shopper accepts.
 *
 * 1. Tiles show the model name over the colourway, like Blenders.
 * 2. /search waits for Rebuy only if Rebuy search ran for this shopper lately,
 *    and gives the page back to the theme results if Rebuy does not show up.
 *
 * The /search decision itself is inline in sections/search-header.liquid, so it
 * lands before the first paint. It reads the same SEEN_KEY.
 */

const HTML = document.documentElement;
const SEEN_KEY = 'spy-rebuy-search';
// Shopify's script-tag loader starts rebuy.js on the window load event, and its
// results page was ready 2-5s after that in live tests. Past this, the theme results.
const RESULTS_TIMEOUT_MS = 10000;

/* ── 1. Model name ──────────────────────────────────────────────────────── */

// Every model name, from the collection:: tags (layout/theme.liquid). Longest first,
// so "CYRUS GAMING" wins over "CYRUS".
const MODELS = (() => {
  try {
    const list = JSON.parse(document.getElementById('spy-search-models')?.textContent || '[]');
    return list.filter((m) => typeof m === 'string' && m.trim()).sort((a, b) => b.length - a.length);
  } catch {
    return [];
  }
})();

/** The model from the collection:: tag, or, when Rebuy sends no tags, from the start of the name. */
function modelOf(product, name) {
  const tags = Array.isArray(product.tags) ? product.tags : String(product.tags || '').split(',');
  const tag = tags.map((t) => String(t).trim()).find((t) => /^collection::/i.test(t));
  if (tag) return tag.slice(tag.indexOf('::') + 2).trim();

  // The box's quick search (lexical mode) returns products without tags
  const lower = name.toLowerCase();
  return MODELS.find((m) => lower.startsWith(m.toLowerCase()) && /^(\s|$)/.test(name.slice(m.length))) || '';
}

/**
 * "Boundless Gaming Matte Black" + tag "collection::BOUNDLESS GAMING" becomes
 * "BOUNDLESS GAMING\nMatte Black". CSS keeps the line break and bolds line one.
 * Changing Rebuy's data, not its DOM, survives every Vue re-render.
 */
function addModel(product) {
  if (!product || typeof product.name !== 'string' || product.spyModel !== undefined) return;

  const name = product.name.trim();
  const model = modelOf(product, name);
  product.spyModel = model;
  if (!model) return;

  const rest = name.toLowerCase().startsWith(model.toLowerCase()) ? name.slice(model.length).trim() : name;
  product.name = rest ? `${model}\n${rest}` : model;
}

const addModels = (products) => Array.isArray(products) && products.forEach(addModel);

document.addEventListener('rebuy:smartsearch.quickview.productsChange', (event) => addModels(event.detail?.products));
document.addEventListener('rebuy:smartsearch.resultsPage.productsChange', (event) => addModels(event.detail?.products));

// The box's empty state ("popular" products) comes from its settings, not a search
function addSuggestedModels() {
  const quickView = window.Rebuy?.SmartSearch?.quickView;
  const setting = quickView?.quickViewSettings?.setting;
  addModels(setting?.suggestedProducts);
  addModels(setting?.noResults?.suggestedProducts);
  addModels(quickView?.view?.suggestedProductsSource);
}

for (const name of ['ready', 'open', 'view']) {
  document.addEventListener(`rebuy:smartsearch.quickview.${name}`, addSuggestedModels);
}

/**
 * The box prints {{product.name}} with its template's own line break and spaces
 * around it. Under pre-line that break becomes an empty first line, and the bold
 * ::first-line lands there instead of on the model. Trim the text Vue renders.
 */
function trimBoxTitles(root) {
  for (const title of root.querySelectorAll('.rebuy-product-title')) {
    for (const node of title.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const text = node.data.trim();
      if (text !== node.data) node.data = text;
    }
  }
}

let boxObserver = null;
function watchBox() {
  const box = document.querySelector('#rebuy-quick-view-dropdown-search');
  if (!box || boxObserver) return;
  trimBoxTitles(box);
  boxObserver = new MutationObserver(() => trimBoxTitles(box));
  boxObserver.observe(box, { childList: true, subtree: true, characterData: true });
}

document.addEventListener('rebuy:smartsearch.quickview.ready', watchBox);
document.addEventListener('rebuy:smartsearch.quickview.open', watchBox);

/* ── 2. Which engine draws /search ──────────────────────────────────────── */

const remember = () => {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {}
};

const forget = () => {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {}
};

// Rebuy search is live for this shopper, so the next /search can wait for it
document.addEventListener('rebuy:smartsearch.quickview.ready', remember);
document.addEventListener('rebuy:smartsearch.resultsPage.ready', remember);

// Rebuy loaded but its search is off (switched off, or the preview ended)
document.addEventListener('rebuy.ready', () => {
  const rebuy = window.Rebuy;
  if (rebuy?.shop && !rebuy.shop.has_smart_search_enabled && !rebuy.AdminBar?.smartSearchPreview) forget();
});

/** Show the theme results. They need the product-only search, so reload once if needed. */
function fallBackToTheme() {
  HTML.dataset.searchEngine = 'theme';
  forget(); // so the reload below does not wait for Rebuy again

  const url = new URL(location.href);
  if (url.searchParams.get('type') === 'product') return;
  url.searchParams.set('type', 'product');
  if (!url.searchParams.has('options[prefix]')) url.searchParams.set('options[prefix]', 'last');
  location.replace(url);
}

if (HTML.dataset.searchEngine === 'rebuy') {
  // Rebuy cannot start before the load event, so the clock starts there
  let timer = 0;
  let ready = false;
  const arm = () => {
    if (!ready) timer = setTimeout(fallBackToTheme, RESULTS_TIMEOUT_MS);
  };
  if (document.readyState === 'complete') arm();
  else window.addEventListener('load', arm, { once: true });
  document.addEventListener(
    'rebuy:smartsearch.resultsPage.ready',
    () => {
      ready = true;
      clearTimeout(timer);
    },
    { once: true }
  );
}

// Rebuy arrived after the theme took the page: keep the page as it is
document.addEventListener('rebuy:smartsearch.resultsPage.ready', () => {
  const resultsPage = window.Rebuy?.SmartSearch?.resultsPage;
  if (HTML.dataset.searchEngine !== 'rebuy' && resultsPage) resultsPage.isVisible = false;
});

/* ── 3. Keyboard ────────────────────────────────────────────────────────── */

// Rebuy's filter panel (768 and below) only closes from its ✕
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document
    .querySelector('.rebuy-smart-search-results-page__flyout.is-visible .rebuy-smart-search-results-page__flyout-close')
    ?.click();
});
