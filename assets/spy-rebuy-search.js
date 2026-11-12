/**
 * Rebuy Smart Search glue. Rebuy draws the search box and the results page
 * (the PM asked for the Blenders layout); the theme search stays the fallback,
 * because Rebuy boots late and may not load at all (blockers, an outage).
 *
 * 1. Tiles show the model name over the colourway, like Blenders.
 * 2. /search waits for Rebuy only if Rebuy search ran for this shopper lately,
 *    and gives the page back to the theme results if Rebuy does not show up.
 * 3. More products load on scroll, in the box and on the results page (like Blenders).
 * 4. Filters show names, their lists stay put when a value is ticked, and colours
 *    Rebuy's value cap left out still show.
 * 5. Every new answer starts at page 1, Back and Forward step through the filters,
 *    filters that find nothing say so, and a ticked row stays under the pointer.
 *
 * The /search decision itself is inline in sections/search-header.liquid, so it
 * lands before the first paint. It reads the same SEEN_KEY.
 */

const HTML = document.documentElement;
const SEEN_KEY = 'spy-rebuy-search';
// Shopify's script-tag loader starts rebuy.js on the window load event, and its
// results page was ready 2-5s after that in live tests. Past this, the theme results.
const RESULTS_TIMEOUT_MS = 10000;
// Rebuy's loader is in but its big scripts are slow (6-16s on a cold test page): wait this much more
const RESULTS_GRACE_MS = 15000;

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

let resultsReady = false;
document.addEventListener('rebuy:smartsearch.resultsPage.ready', () => (resultsReady = true), { once: true });

// Rebuy loaded but its search is off (switched off, or the preview ended)
document.addEventListener('rebuy.ready', () => {
  const rebuy = window.Rebuy;
  if (!rebuy?.shop || rebuy.shop.has_smart_search_enabled || rebuy.AdminBar?.smartSearchPreview) return;
  forget();
  // This page is waiting for results that will not come
  if (HTML.dataset.searchEngine === 'rebuy' && !resultsReady) fallBackToTheme();
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
  let grace = true;
  const giveUp = () => {
    // rebuy.js sets window.Rebuy as soon as it runs: it is on its way, give it more time once.
    // Blocked or down, it never appears.
    if (grace && window.Rebuy) {
      grace = false;
      timer = setTimeout(giveUp, RESULTS_GRACE_MS);
      return;
    }
    fallBackToTheme();
  };
  const arm = () => {
    if (!resultsReady) timer = setTimeout(giveUp, RESULTS_TIMEOUT_MS);
  };
  if (document.readyState === 'complete') arm();
  else window.addEventListener('load', arm, { once: true });
  document.addEventListener('rebuy:smartsearch.resultsPage.ready', () => clearTimeout(timer), { once: true });
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

/* ── 4. Infinite scroll ─────────────────────────────────────────────────── */

/*
 * Box: Rebuy's quick search returns 12 products (it refuses more than 20) and the
 * box never asks again. So near the end we page through the full search, drop the
 * products already shown and add the rest to Rebuy's own list.
 */
const MORE_PAGE_SIZE = 12;
// Ask for the next page while the last tile is still this far below the fold
const MORE_LEAD_PX = 300;

const more = { term: '', page: 0, done: false, busy: false, seen: new Set() };
const quickView = () => window.Rebuy?.SmartSearch?.quickView?.view;

// A new search (Rebuy's own) starts the paging again
document.addEventListener('rebuy:smartsearch.quickview.productsChange', (event) => {
  more.term = (quickView()?.searchTerm || '').trim();
  more.page = 0;
  more.done = false;
  more.seen = new Set((event.detail?.products || []).map((product) => String(product.id)));
  requestAnimationFrame(checkBoxEnd); // a short list never scrolls, so check now
});

async function loadMore() {
  const rebuy = window.Rebuy;
  const view = quickView();
  const init = rebuy?.util?.initializeSmartSearchProduct;
  const term = (view?.searchTerm || '').trim();
  if (!view || !init || more.busy || more.done || !term || term !== more.term || view.quickViewSearchLoading) return;

  more.busy = true;
  HTML.dataset.spySearchMore = 'loading';
  try {
    const query = { ...view.resultPageSearchQuery, searchTerm: term, pageSize: MORE_PAGE_SIZE, currentPage: more.page + 1, matchingCollectionsEnabled: false };
    const response = await fetch(`https://rebuyengine.com/api/v1/smart-search/search?key=${encodeURIComponent(rebuy.shop.api_key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    const products = (await response.json())?.data?.products;
    if (!Array.isArray(products)) throw new Error(`Rebuy search answered ${response.status}`);
    // The shopper typed on while we waited: this page belongs to an old term
    if (term !== more.term || term !== (view.searchTerm || '').trim()) return;

    more.page += 1;
    if (products.length < MORE_PAGE_SIZE) more.done = true;
    const integrations = view.editorLayout?.integrations || {};
    const fresh = products.filter((product) => !more.seen.has(String(product.id)));
    for (const product of fresh) {
      more.seen.add(String(product.id));
      init(product, integrations, undefined, view.excludedProductOptionNames || []);
    }
    addModels(fresh);
    view.products.push(...fresh);
  } catch (error) {
    more.done = true; // keep the products we have, stop asking
    console.warn('[spy-rebuy-search] more results:', error);
  } finally {
    more.busy = false;
    delete HTML.dataset.spySearchMore;
  }
  // A page of repeats can leave the end in view, so look again
  requestAnimationFrame(checkBoxEnd);
}

function checkBoxEnd() {
  const box = document.querySelector('#rebuy-quick-view-dropdown-search');
  if (!box || more.done || !more.term) return;
  const tiles = [...box.querySelectorAll('.rebuy-quick-view__product')].filter((tile) => tile.getBoundingClientRect().height > 0);
  const last = tiles[tiles.length - 1];
  if (!last) return;
  const panel = document.querySelector('#rebuy-quick-view-overlay');
  const visibleBottom = Math.min(innerHeight, panel ? panel.getBoundingClientRect().bottom : innerHeight);
  if (last.getBoundingClientRect().bottom < visibleBottom + MORE_LEAD_PX) loadMore();
}

/*
 * Results page: Rebuy checks for the next page on window scroll only, and only
 * while the end of the list is on screen. From 990px the theme scrolls
 * .page-wrapper, and a jump past the end (End, a scrollbar drag, a fling into the
 * footer) left the end above the screen, so loading stopped. Check after any
 * scroll, and again when a page lands, in case the end is still near.
 */
const RESULTS_LEAD_PX = 350; // Rebuy's own distance

function checkResultsEnd() {
  const smartSearch = window.Rebuy?.SmartSearch;
  const results = smartSearch?.resultsPage;
  if (!results?.isVisible || results.isLoadingSearchTerm || !results.searchResults?.products?.length) return;
  if (!smartSearch.shouldRenderContinuousScroll?.() || smartSearch.hasReachedLastPage?.()) return;
  const list = document.querySelector('#rebuy-search-result-container .rebuy-smart-search-results-page__main-section');
  if (list && list.getBoundingClientRect().bottom <= innerHeight + RESULTS_LEAD_PX) smartSearch.handleUpdatingPageCount?.('continuous');
}

let scrollCheck = 0;
document.addEventListener(
  'scroll',
  () => {
    if (scrollCheck) return;
    scrollCheck = requestAnimationFrame(() => {
      scrollCheck = 0;
      if (quickView()?.isQuickViewOpen) checkBoxEnd();
      checkResultsEnd();
    });
  },
  { capture: true, passive: true }
);

/* ── 5. Filter labels ───────────────────────────────────────────────────── */

/*
 * Rebuy prints a metafield filter's raw value. Collection reads custom.collection,
 * which holds collection references, so shoppers saw gid://shopify/Collection/….
 * Rebuy prints readableValue first and keeps it for the ticked-filter pills, while
 * the filtering still uses the id. So name each value, after every time Rebuy
 * maps the filters. The names come from sections/search-header.liquid.
 */
let collectionNames = null;
function collectionName(gid) {
  if (!collectionNames) {
    try {
      collectionNames = JSON.parse(document.getElementById('spy-search-collections')?.textContent || '{}');
    } catch {
      collectionNames = {};
    }
  }
  const title = collectionNames[String(gid).split('/').pop()];
  // Titles came over in sentence case ("Region xl"): capitalise, codes in full ("XL", "ANSI", "SS25")
  return title && title.replace(/\S+/g, (word) => (/^([a-z]{1,2}|ansi|spy|bkl|[a-z]*\d+[a-z\d]*)$/i.test(word) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)));
}

// Placeholders the data migration left behind; a shopper should never see them
const PLACEHOLDER = /^\s*(no colou?r reference|n\/a|-)?\s*$/i;

function labelFilters(filters) {
  if (!Array.isArray(filters)) return;
  for (let i = filters.length - 1; i >= 0; i--) {
    const filter = filters[i];
    // Only metafield values are plain text; price, product type and options stay as Rebuy draws them
    if (filter.type !== 'product-metafield' || !Array.isArray(filter.values)) continue;
    if (filter.key === 'collection') {
      for (const value of filter.values) value.readableValue = collectionName(value.value) || value.readableValue;
      // A reference we can't name (an unpublished collection) would show the raw id
      filter.values = filter.values.filter((value) => value.readableValue);
    }
    filter.values = filter.values.filter((value) => typeof value.value !== 'string' || !PLACEHOLDER.test(value.readableValue ?? value.value));
    // Nothing left to tick: drop the group rather than show it empty
    if (filter.values.length === 0) filters.splice(i, 1);
  }
}

function wrapFilterMapping() {
  const smartSearch = window.Rebuy?.SmartSearch;
  wrapTickSwitch(smartSearch);
  wrapExpand(smartSearch);
  wrapStartOver(smartSearch, 'handleRemovingFilter');
  wrapStartOver(smartSearch, 'resetFilters');
  wrapHistory(smartSearch);
  wrapNoResults(smartSearch);
  const map = smartSearch?.mapFilterWithSearchAggregates;
  if (typeof map !== 'function' || smartSearch.spyLabelsFilters) return;
  smartSearch.spyLabelsFilters = true;
  smartSearch.mapFilterWithSearchAggregates = function (...args) {
    const result = map.apply(this, args);
    labelFilters(this.resultsPage?.mappedAggregatedFilters);
    captureSteady(this);
    return result;
  };
  // Filters Rebuy mapped before this ran
  labelFilters(smartSearch.resultsPage?.mappedAggregatedFilters);
  captureSteady(smartSearch);
  smartSearch.resultsPage?.view?.$forceUpdate?.();
}

for (const name of ['rebuy.ready', 'rebuy:smartsearch.resultsPage.ready', 'rebuy:smartsearch.resultsPage.productsChange']) {
  document.addEventListener(name, wrapFilterMapping);
}

/* ── 6. Steady filter lists ─────────────────────────────────────────────── */

/*
 * After a tick, Rebuy rebuilds every list from the filtered results: the ticked
 * group shrinks to that one value and the other groups lose values. Here each
 * list keeps the values it showed before the first tick (values with no results
 * go grey). Category, Collection and Color match ALL ticked values, so two ticks
 * there find nothing and a new tick replaces the group's old one. Size matches
 * ANY ticked size, so its ticks add up. A ticked group counts its values without
 * its own tick: one small extra search, kept per state.
 *
 * Rebuy's answer holds at most 30 metafield values (Collection and Color together),
 * so a value missing from a full answer is not proof of 0. It shows without a
 * count and stays tickable; an open group gets its exact counts, one search each.
 * On a broad search the cap also leaves colours out of the first list, so those
 * (listed in the search header's settings) are counted and added when they have results.
 */
const STEADY_LISTS = { 'product-type': 'categories', 'product-option': 'options', 'product-metafield': 'metafields', 'variant-metafield': 'metafields' };
// Groups where one tick replaces the other (Rebuy ANDs their values)
const TICK_LISTS = { 'product-type': 'categories', 'product-metafield': 'metafields', 'variant-metafield': 'metafields' };
const METAFIELD_CAP = 30;
// Exact counts asked at once for one open group
const EXACT_MAX = 12;
// Values the cap can leave out, offered whenever they have results (sections/search-header.liquid)
const ALWAYS = (() => {
  try {
    const { metafield, values } = JSON.parse(document.getElementById('spy-search-filter-values')?.textContent || '{}');
    const list = String(values || '').split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
    return metafield && list.length ? { [`product.${String(metafield).trim()}.`]: list } : {};
  } catch {
    return {};
  }
})();
const steady = {
  term: null, base: null, baseSig: '', baseFilters: null, baseCapped: false, baseBusy: false, capped: false, priceValues: null,
  present: [], current: new Map(), others: new Map(), shown: new Map(), busy: new Set(), exact: new Map(), exactBusy: new Set(),
};
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const hasListTicks = (filters) => ['tags', 'categories', 'options', 'vendors', 'metafields'].some((list) => (filters?.[list] || []).length > 0);
const enabledFilters = (smartSearch) => (smartSearch.globalData?.settings?.searchResultsSettings?.setting?.filterSettings || []).filter((filter) => filter.enabled);
const isCapped = (aggregates) =>
  ((Array.isArray(aggregates) && aggregates.find((aggregate) => aggregate && 'metafields' in aggregate)?.metafields) || []).reduce((sum, field) => sum + (field.values?.length || 0), 0) >= METAFIELD_CAP;
const isEmptyAnswer = (smartSearch) => !smartSearch.resultsPage?.searchResults?.products?.length;

/**
 * With no products Rebuy drops Price, often the very filter to change. Rebuy shows
 * the group only when it has values (its boxes never read them), so keep the last ones.
 */
function keepPrice(smartSearch, list) {
  const price = enabledFilters(smartSearch).find((filter) => filter.type === 'price');
  if (!price) return;
  if (!Object.keys(price.values || {}).length) price.values = steady.priceValues || [{}];
  if (!list.includes(price)) {
    list.push(price);
    list.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }
}

/** Where a filter's ticks live in the query, and how its entries start there. */
function groupOf(filter) {
  const list = STEADY_LISTS[filter?.type];
  if (!list) return null;
  if (list === 'categories') return { id: 'categories', list, prefix: '' };
  if (list === 'options') {
    const name = String(filter.name || '').toLowerCase();
    return { id: `option:${name}`, list, prefix: `${name} # ` };
  }
  // Rebuy's getMetafieldFilterString: product.<namespace>.<key>.<value>
  const owner = filter.type.includes('variant') ? 'variant' : 'product';
  const prefix = `${owner}.${filter.namespace ? `${filter.namespace}.` : ''}${filter.key}.`;
  return { id: prefix, list, prefix };
}

const ticksOf = (group, filters) => (filters?.[group.list] || []).filter((entry) => typeof entry === 'string' && entry.startsWith(group.prefix));
const keyOf = (group, item) => String(group.list === 'categories' ? item.categories : item.value);

/** The filters with one group's ticks taken out. */
function withoutGroup(filters, group) {
  const copy = clone(filters) || {};
  copy[group.list] = (copy[group.list] || []).filter((entry) => !(typeof entry === 'string' && entry.startsWith(group.prefix)));
  return copy;
}

function signatureOf(filters) {
  const copy = clone(filters) || {};
  for (const list of ['tags', 'categories', 'options', 'vendors', 'metafields']) if (Array.isArray(copy[list])) copy[list].sort();
  return JSON.stringify(copy);
}

function countsOf(group, values) {
  const counts = new Map();
  if (group.list === 'options') for (const [key, value] of Object.entries(values || {})) counts.set(key, Number(value?.numProducts) || 0);
  else if (Array.isArray(values)) for (const item of values) counts.set(keyOf(group, item), Number(item.numProducts) || 0);
  return counts;
}

/**
 * The first list in its order with today's counts, then values it never had, then a
 * tick it never had. missing(key) gives the count of a value the answer left out:
 * 0, an exact count, or null when not known yet (shown without a number).
 */
function steadyValues(group, baseValues, liveValues, picks, missing = () => 0) {
  const counts = countsOf(group, liveValues);
  const countOf = (key) => (counts.has(key) ? counts.get(key) : missing(key));
  if (group.list === 'options') {
    const out = {};
    for (const [key, value] of Object.entries(baseValues || {})) out[key] = { ...value, numProducts: countOf(key) };
    for (const [key, value] of Object.entries(liveValues || {})) if (!(key in out)) out[key] = value;
    for (const key of picks) if (!(key in out)) out[key] = { numProducts: countOf(key) };
    return out;
  }
  const out = (baseValues || []).map((item) => ({ ...item, numProducts: countOf(keyOf(group, item)) }));
  const listed = new Set(out.map((item) => keyOf(group, item)));
  for (const item of Array.isArray(liveValues) ? liveValues : []) {
    if (listed.has(keyOf(group, item))) continue;
    out.push(item);
    listed.add(keyOf(group, item));
  }
  for (const key of picks) if (!listed.has(key)) out.push(group.list === 'categories' ? { categories: key, numProducts: countOf(key) } : { value: key, numProducts: countOf(key) });
  return out;
}

/** Values in the order of an earlier list; values it did not have go last. */
function inOrder(group, values, previous) {
  if (group.list === 'options') {
    const out = {};
    for (const key of Object.keys(previous || {})) if (values && key in values) out[key] = values[key];
    for (const [key, value] of Object.entries(values || {})) if (!(key in out)) out[key] = value;
    return out;
  }
  const rank = new Map((Array.isArray(previous) ? previous : []).map((item, i) => [keyOf(group, item), i]));
  const last = Number.MAX_SAFE_INTEGER;
  return [...(values || [])].sort((a, b) => (rank.get(keyOf(group, a)) ?? last) - (rank.get(keyOf(group, b)) ?? last));
}

/** A group's values from a raw search answer, shaped the way Rebuy maps them. */
function valuesFrom(aggregates, filter) {
  const find = (name) => aggregates.find((aggregate) => aggregate && name in aggregate)?.[name];
  if (filter.type === 'product-type') return find('categories') || [];
  if (filter.type === 'product-option') {
    const name = String(filter.name || '').toLowerCase();
    const values = (find('options') || []).find((option) => String(option.option).toLowerCase() === name)?.values || {};
    // Rebuy shows size values in capitals
    return name === 'size' ? Object.fromEntries(Object.entries(values).map(([key, value]) => [key.toUpperCase(), value])) : values;
  }
  const owner = filter.type.includes('variant') ? 'variant' : 'product';
  const key = String(filter.key).toLowerCase();
  return (find('metafields') || []).find((field) => field.metafieldType === owner && String(field.key).toLowerCase() === key)?.values || [];
}

function labelled(filter, values) {
  const temp = [{ type: filter.type, key: filter.key, values }];
  labelFilters(temp);
  return temp[0]?.values ?? [];
}

/** A currency's decimals (2 for USD). */
function currencyDigits(currency) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currency || 'USD' }).resolvedOptions().maximumFractionDigits;
  } catch {
    return 2;
  }
}

/** Rebuy's search takes prices in cents (minor units), like its own toSearchMinorUnits. */
const minorUnits = (amount, currency) => Math.round(Number(amount) * 10 ** currencyDigits(currency));

/** A one-product search that only brings back the counts and the total for these filters. */
async function countSearch(smartSearch, filters) {
  const rebuy = window.Rebuy;
  const query = clone(smartSearch.resultsPage.searchQuery);
  // A copy: the price conversion below must not change the caller's filters
  Object.assign(query, { filters: clone(filters), sortBy: {}, fields: ['product_id'], pageSize: 1, currentPage: 1 });
  // The query keeps the price range in dollars; Rebuy converts it when it searches, so do the same
  for (const end of ['min', 'max']) {
    if (filters.price?.[end]) query.filters.price[end] = minorUnits(filters.price[end], rebuy.shop.currency);
  }
  // Same endpoint as §4 (Rebuy's own searchUrls are paths its API helper prefixes)
  const response = await fetch(`https://rebuyengine.com/api/v1/smart-search/search?key=${encodeURIComponent(rebuy.shop.api_key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  const data = (await response.json())?.data;
  // The total is pageInfo.serverSize: an answer with no results has no Search-Size-Total header
  const header = response.headers.get('search-size-total');
  const total = Number.isFinite(data?.pageInfo?.serverSize) ? data.pageInfo.serverSize : header ? Number(header) : NaN;
  const aggregates = Array.isArray(data?.aggregates) ? data.aggregates : null;
  if (!aggregates || !Number.isFinite(total)) throw new Error(`Rebuy search answered ${response.status}`);
  return { aggregates, total };
}

/** After every Rebuy search: remember what it drew, then put the steady lists in. */
function captureSteady(smartSearch) {
  const query = smartSearch?.resultsPage?.searchQuery;
  const filters = smartSearch?.resultsPage?.mappedAggregatedFilters;
  if (!query || !Array.isArray(filters)) return;

  const term = String(query.searchTerm || '').trim().toLowerCase();
  if (term !== steady.term) {
    Object.assign(steady, { term, base: null, baseSig: '', baseFilters: null, baseCapped: false });
    steady.others.clear();
    steady.shown.clear();
    steady.exact.clear();
  }
  steady.present = filters.slice();
  // An answer with no products has no counts: Rebuy drops some groups and leaves old counts on others
  const empty = isEmptyAnswer(smartSearch);
  const price = filters.find((filter) => filter.type === 'price');
  if (!empty && Object.keys(price?.values || {}).length) steady.priceValues = price.values;
  // Rebuy keeps the answer it just mapped; a full one may have left values out
  const capped = !empty && isCapped(smartSearch.resultsPage.searchResults?.aggregates);

  if (!hasListTicks(query.filters) && !(empty && steady.base)) {
    // Nothing ticked: these are the lists every later tick keeps. Rebuy returns
    // values in a different order each time, so keep the order first seen.
    const before = steady.base;
    steady.base = new Map();
    for (const filter of steady.present) {
      const group = groupOf(filter);
      if (!group) continue;
      if (before?.has(group.id)) filter.values = inOrder(group, filter.values, before.get(group.id).values);
      steady.base.set(group.id, { filter, values: filter.values });
    }
    Object.assign(steady, { current: new Map(), baseSig: signatureOf(query.filters), baseFilters: clone(query.filters), baseCapped: capped });
    steady.others.clear();
    steady.shown.clear();
    addLeftOut(smartSearch);
    if (empty) keepPrice(smartSearch, filters);
    return;
  }
  steady.capped = capped;
  steady.current = empty ? new Map() : new Map(steady.present.filter(groupOf).map((filter) => [groupOf(filter).id, filter.values]));
  // Landed with ticks in the address: fetch the untouched lists first
  if (!steady.base) loadBase(smartSearch);
  else applySteady(smartSearch);
}

/**
 * Values from the search header's list that the cap kept out of the first lists:
 * each is counted once (one small search) and joins the list when it has results.
 */
function addLeftOut(smartSearch) {
  const query = smartSearch.resultsPage.searchQuery;
  const filters = smartSearch.resultsPage.mappedAggregatedFilters;
  // An answer under the cap already lists every value with results
  if (!steady.base || !steady.baseCapped || !steady.baseFilters) return;
  const drawn = !hasListTicks(query.filters); // with ticks, applySteady draws the lists
  for (const filter of enabledFilters(smartSearch)) {
    const group = groupOf(filter);
    const wanted = group && ALWAYS[group.prefix];
    if (!wanted) continue;
    const entry = steady.base.get(group.id);
    const values = entry?.values || [];
    const listed = new Set(values.map((item) => keyOf(group, item).toLowerCase()));
    const added = [];
    const unknown = [];
    for (const key of wanted) {
      if (listed.has(key.toLowerCase())) continue;
      const count = steady.exact.get(`${group.id}|${steady.baseSig}|${key}`);
      if (count === undefined) unknown.push(key);
      else if (count > 0) added.push({ value: key, numProducts: count });
    }
    if (unknown.length) loadExact(smartSearch, group, steady.baseFilters, steady.baseSig, unknown);
    if (!added.length) continue;
    const next = [...values, ...added];
    if (entry) entry.values = next;
    else steady.base.set(group.id, { filter, values: next });
    if (!drawn) continue;
    filter.values = next;
    // Rebuy drops a group with no values, and the cap can empty this one
    if (!filters.includes(filter)) {
      filters.push(filter);
      filters.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    }
  }
}

function applySteady(smartSearch) {
  const query = smartSearch?.resultsPage?.searchQuery;
  const filters = smartSearch?.resultsPage?.mappedAggregatedFilters;
  if (!query || !Array.isArray(filters) || !steady.base) return;
  addLeftOut(smartSearch);
  const empty = isEmptyAnswer(smartSearch);
  // With nothing ticked Rebuy's own lists are right (and no current counts are kept)
  if (!hasListTicks(query.filters) && !empty) return;

  // A group Rebuy dropped (no value left) comes back from the first lists, greyed
  const shown = steady.present.slice();
  for (const { filter } of steady.base.values()) if (!shown.includes(filter)) shown.push(filter);
  if (empty) keepPrice(smartSearch, shown);
  shown.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (const filter of shown) {
    const group = groupOf(filter);
    const entry = group && steady.base.get(group.id);
    if (!entry) continue;
    const picks = ticksOf(group, query.filters).map((tick) => tick.slice(group.prefix.length));
    // Counts for the current ticks; a ticked group counts without its own tick
    let counted = query.filters;
    let live = steady.current.get(group.id);
    let capped = steady.capped;
    if (picks.length) {
      counted = withoutGroup(query.filters, group);
      const othersSig = signatureOf(counted);
      const other = steady.others.get(group.id);
      if (other?.sig === othersSig) ({ values: live, capped } = other);
      else if (othersSig === steady.baseSig) [live, capped] = [entry.values, steady.baseCapped];
      else {
        loadOthers(smartSearch, filter, group, othersSig);
        const before = steady.shown.get(group.id);
        if (before) {
          filter.values = before; // keep what is on screen until the counts come
          continue;
        }
        [live, capped] = [entry.values, steady.baseCapped];
      }
    }
    // A value a full answer left out is not known to be 0 (see the note on top)
    const sig = signatureOf(counted);
    const unknown = [];
    const missing = (key) => {
      if (!capped || group.list !== 'metafields') return 0;
      const exact = steady.exact.get(`${group.id}|${sig}|${key}`);
      if (exact === undefined) unknown.push(key);
      return exact ?? null;
    };
    filter.values = steadyValues(group, entry.values, live, picks, missing);
    steady.shown.set(group.id, filter.values);
    if (unknown.length && filter.isExpanded) loadExact(smartSearch, group, counted, sig, unknown);
  }
  filters.splice(0, filters.length, ...shown);
}

async function loadBase(smartSearch) {
  if (steady.baseBusy) return;
  steady.baseBusy = true;
  const term = steady.term;
  try {
    const filters = { ...clone(smartSearch.resultsPage.searchQuery.filters), tags: [], categories: [], options: [], vendors: [], metafields: [] };
    const { aggregates } = await countSearch(smartSearch, filters);
    if (term !== steady.term || steady.base) return;
    const base = new Map();
    for (const filter of enabledFilters(smartSearch)) {
      const group = groupOf(filter);
      const values = group && labelled(filter, valuesFrom(aggregates, filter));
      if (values && Object.keys(values).length) base.set(group.id, { filter, values });
    }
    Object.assign(steady, { base, baseSig: signatureOf(filters), baseFilters: filters, baseCapped: isCapped(aggregates) });
    applySteady(smartSearch);
    smartSearch.resultsPage.view?.$forceUpdate?.();
  } catch (error) {
    console.warn('[spy-rebuy-search] steady filters:', error); // Rebuy's own lists stay
  } finally {
    steady.baseBusy = false;
    // The search term changed while we waited: ask again for the new one
    if (!steady.base && term !== steady.term && hasListTicks(smartSearch.resultsPage?.searchQuery?.filters)) loadBase(smartSearch);
  }
}

async function loadOthers(smartSearch, filter, group, sig) {
  const ask = `${group.id}|${sig}`;
  if (steady.busy.has(ask)) return;
  steady.busy.add(ask);
  const term = steady.term;
  try {
    const { aggregates } = await countSearch(smartSearch, withoutGroup(smartSearch.resultsPage.searchQuery.filters, group));
    if (term !== steady.term) return;
    steady.others.set(group.id, { sig, values: labelled(filter, valuesFrom(aggregates, filter)), capped: isCapped(aggregates) });
    applySteady(smartSearch);
    smartSearch.resultsPage.view?.$forceUpdate?.();
  } catch (error) {
    console.warn('[spy-rebuy-search] steady filters:', error);
  } finally {
    steady.busy.delete(ask);
  }
}

/** Exact counts for values a full answer left out, in an open group: one small search each. */
async function loadExact(smartSearch, group, counted, sig, keys) {
  const term = steady.term;
  const ask = keys.map((key) => [key, `${group.id}|${sig}|${key}`]).filter(([, id]) => !steady.exactBusy.has(id)).slice(0, EXACT_MAX);
  if (!ask.length) return;
  await Promise.all(
    ask.map(async ([key, id]) => {
      steady.exactBusy.add(id);
      try {
        const filters = clone(counted);
        filters[group.list] = [...(filters[group.list] || []), `${group.prefix}${key}`];
        const { total } = await countSearch(smartSearch, filters);
        if (term === steady.term) steady.exact.set(id, total);
      } catch (error) {
        // Stays without a number for this state, so a failing search is not asked again
        if (term === steady.term) steady.exact.set(id, null);
        console.warn('[spy-rebuy-search] steady filters:', error);
      } finally {
        steady.exactBusy.delete(id);
      }
    })
  );
  if (term !== steady.term) return;
  applySteady(smartSearch);
  smartSearch.resultsPage.view?.$forceUpdate?.();
}

/*
 * The template calls the view's copy of handleUpdateSearchQuery (bound when the
 * view was made), so this wraps that copy, not Rebuy.SmartSearch's:
 * - in a group that matches ALL ticked values a second tick would find nothing, so
 *   it replaces the first (Size matches ANY, so it keeps them all);
 * - every change but a page turn is a new answer from page 1 (§7);
 * - the sort menu closes once a sort is picked;
 * - a price range typed the wrong way round is turned around.
 */
function wrapTickSwitch(smartSearch) {
  const view = smartSearch?.resultsPage?.view;
  const update = view?.handleUpdateSearchQuery;
  if (typeof update !== 'function' || update.spySwitches) return;
  const switching = function (type, value, ...rest) {
    if (type !== 'page') startOver(smartSearch);
    if (type === 'sort_by') smartSearch.resultsPage.sortFiltersVisible = false;
    const turned = type === 'price' && turnPrice(smartSearch, value, rest);
    const list = TICK_LISTS[type];
    const filters = smartSearch.resultsPage?.searchQuery?.filters;
    if (list && typeof value === 'string' && Array.isArray(filters?.[list]) && !filters[list].includes(value)) {
      let prefix = null;
      if (list === 'categories') prefix = '';
      else {
        for (const filter of enabledFilters(smartSearch)) {
          const group = groupOf(filter);
          if (group?.list === 'metafields' && value.startsWith(group.prefix) && group.prefix.length > (prefix?.length ?? -1)) prefix = group.prefix;
        }
      }
      if (prefix !== null) {
        for (const old of filters[list].filter((entry) => typeof entry === 'string' && entry.startsWith(prefix))) {
          filters[list].splice(filters[list].indexOf(old), 1);
          delete smartSearch.resultsPage.filterReadableValueHash?.[old];
        }
      }
    }
    const result = update.call(this, type, value, ...rest);
    if (turned) view.$nextTick?.(() => showPriceBoxes(smartSearch));
    return result;
  };
  switching.spySwitches = true;
  view.handleUpdateSearchQuery = switching;
}

/** "From" above "To" finds nothing: swap the two ends. rest[0].price is the typed value. */
function turnPrice(smartSearch, end, rest) {
  const boxes = smartSearch.resultsPage.filterPrice;
  const typed = Number(rest[0]?.price);
  // An empty box is undefined or NaN; an untouched From box holds "0.00"
  const other = Number(end === 'min' ? boxes?.max : boxes?.min);
  if (!boxes || !Number.isFinite(typed) || !Number.isFinite(other) || (end === 'min' ? typed <= other : typed >= other)) return false;
  if (end === 'min') boxes.max = typed;
  else boxes.min = typed;
  rest[0] = { ...rest[0], price: other };
  return true;
}

/** Vue leaves a focused box as it was typed, so write both ends back after a swap. */
function showPriceBoxes(smartSearch) {
  const { min, max } = smartSearch.resultsPage.filterPrice || {};
  for (const [id, value] of [['rebuy-option-price-from', min], ['rebuy-option-price-to', max]]) {
    for (const input of document.querySelectorAll(`#rebuy-search-result-container [id="${id}"]`)) input.value = Number.isFinite(Number(value ?? NaN)) ? value : '';
  }
}

/** Opening a group is when the counts a full answer left out are worth asking for. */
function wrapExpand(smartSearch) {
  const view = smartSearch?.resultsPage?.view;
  const toggle = view?.handleToggleFilterExpansion;
  if (typeof toggle !== 'function' || toggle.spyCounts) return;
  const opening = function (...args) {
    const result = toggle.apply(this, args);
    applySteady(smartSearch);
    return result;
  };
  opening.spyCounts = true;
  view.handleToggleFilterExpansion = opening;
}

// A value with no results under the other ticks stays listed, greyed and not tickable.
// "()" is a value not counted yet: no number, still tickable.
function markEmpty() {
  const inputs = document.querySelectorAll(
    '#rebuy-search-result-container input.rebuy-checkbox[id^="rebuy-metafield-"], #rebuy-search-result-container input.rebuy-checkbox[id^="rebuy-option-product-type-"]'
  );
  for (const input of inputs) {
    const row = input.closest('li');
    const label = row?.querySelector('.rebuy-smart-search-results-page__filter-label');
    const count = label?.textContent.match(/\((\d*)\)/);
    if (label) label.hidden = Boolean(count) && count[1] === '';
    const empty = Boolean(count?.[1]) && Number(count[1]) === 0 && !input.checked;
    input.disabled = empty;
    row?.toggleAttribute('data-spy-empty', empty);
  }
}

const resultsRoot = document.getElementById('rebuy-search-result-container');
if (resultsRoot) {
  let emptyCheck = 0;
  new MutationObserver(() => {
    if (emptyCheck) return;
    emptyCheck = requestAnimationFrame(() => {
      emptyCheck = 0;
      markEmpty();
    });
  }).observe(resultsRoot, { childList: true, subtree: true, characterData: true });
}

/* ── 7. New answers, Back and Forward ───────────────────────────────────── */

/*
 * Rebuy keeps the page number continuous scroll reached, so a tick, a chip ✕ or a
 * sort after three pages asked for page 3 of the new answer: "No results", or the
 * first 30 products skipped. Every new answer starts at page 1, and when the
 * shopper is below the top of the list, the list comes back into view.
 */
const LIST_GAP_PX = 20; // the filter column's sticky gap under the header (src/tailwind.css)
let showTop = false;

function startOver(smartSearch) {
  smartSearch.resultsPage.searchQuery.currentPage = 1;
  showTop = true;
}

/** Same as the template's other buttons: a new answer from page 1. */
function wrapStartOver(smartSearch, name) {
  const view = smartSearch?.resultsPage?.view;
  const method = view?.[name];
  if (typeof method !== 'function' || method.spyStartsOver) return;
  const wrapped = function (...args) {
    startOver(smartSearch);
    return method.apply(this, args);
  };
  wrapped.spyStartsOver = true;
  view[name] = wrapped;
}

// From 990px the page scrolls inside .page-wrapper, below that the window does
function pageScroller() {
  const wrapper = document.querySelector('.page-wrapper');
  return wrapper && /auto|scroll/.test(getComputedStyle(wrapper).overflowY) ? wrapper : document.scrollingElement || HTML;
}

function showListTop() {
  const list = document.querySelector('#rebuy-search-result-container .rebuy-smart-search-results-page__main-section');
  if (!list) return;
  const header = parseFloat(getComputedStyle(HTML).getPropertyValue('--spy-header-offset')) || 0;
  const above = list.getBoundingClientRect().top - header - LIST_GAP_PX;
  if (above >= 0) return;
  held = null; // the jump is ours; holding the row now would pull the page back
  pageScroller().scrollBy({ top: above, behavior: 'instant' });
}

document.addEventListener('rebuy:smartsearch.resultsPage.productsChange', () => {
  // Vue draws the new products before the next frame
  requestAnimationFrame(() => {
    const results = window.Rebuy?.SmartSearch?.resultsPage;
    if (showTop) {
      showTop = false;
      // A later page means the new answer never came (a failed search): leave the scroll alone
      if (results?.searchQuery?.currentPage === 1) showListTop();
    }
    checkResultsEnd();
  });
});

/*
 * Rebuy adds a history entry after every search, continuous scroll pages too (same
 * address), and never listens for Back: Back changed the address and left the
 * results as they were. Pages of one answer now add no entry, and Back or
 * Forward search again with the filters, price and sort the address holds.
 */
let shownAddress = location.search;

function wrapHistory(smartSearch) {
  const update = smartSearch?.updateUrlQuery;
  if (typeof update !== 'function' || update.spyHistory) return;
  const wrapped = function (...args) {
    // Still true while a continuous scroll page lands (Rebuy clears it after this call)
    const paging = Boolean(this.resultsPage?._continuousScrollFetching);
    const own = Object.prototype.hasOwnProperty.call(history, 'pushState');
    const push = history.pushState;
    history.pushState = function (state, title, url) {
      // A scroll page only adds the sort to the address: update it, no Back step (keep the theme's state)
      if (paging) history.replaceState({ ...(typeof history.state === 'object' ? history.state : {}), ...state }, title, url);
      else if (new URL(url, location.href).search !== location.search) push.call(history, state, title, url);
    };
    try {
      return update.apply(this, args);
    } finally {
      if (own) history.pushState = push;
      else delete history.pushState;
      shownAddress = location.search;
    }
  };
  wrapped.spyHistory = true;
  smartSearch.updateUrlQuery = wrapped;
}

window.addEventListener(
  'popstate',
  () => {
    const smartSearch = window.Rebuy?.SmartSearch;
    if (HTML.dataset.searchEngine !== 'rebuy' || !smartSearch?.resultsPage?.isVisible) return;
    // A #link step: same search
    if (location.search === shownAddress) return;
    shownAddress = location.search;
    // The theme puts back the old scroll spot (scroll-container.js), but only page 1 comes back: drop it
    if (history.state && typeof history.state === 'object' && 'scrollTop' in history.state) {
      const state = { ...history.state };
      delete state.scrollTop;
      history.replaceState(state, '');
    }
    showAddress(smartSearch);
  },
  true // before the theme's own listener
);

/** The address as Rebuy reads it when it starts (its getSmartSearchParameters). */
function addressParams() {
  const params = {};
  for (const part of location.search.slice(1).split('&')) {
    let [key, value] = part.split('=');
    if (!key) continue;
    key = decodeURIComponent(key);
    if (value) value = decodeURIComponent(value).replace(/\+/g, ' ');
    params[key] = value && value.includes(',') ? value.split(',').map((item) => item.trim()) : value;
  }
  return params;
}

/** Rebuy's own start-up steps: default query and sort, then the address on top, page 1. */
function showAddress(smartSearch) {
  const results = smartSearch.resultsPage;
  if (typeof smartSearch.handleDefaultSearchQueryState !== 'function' || typeof smartSearch.decodeQueryAndUpdateData !== 'function') {
    location.reload();
    return;
  }
  const custom = results.searchQuery.responseCustomization;
  results.searchQuery = smartSearch.handleDefaultSearchQueryState();
  if (custom) results.searchQuery.responseCustomization = custom;
  const sorts = [...(smartSearch.globalData?.settings?.searchResultsSettings?.setting?.sortSettings || [])].sort((a, b) => a.index - b.index);
  const sort = sorts.find((item) => item.enabled)?.key;
  if (sort) results.searchQuery.sortBy.field = sort;
  results.hasAdjustedPriceFilter = false;
  results.selectedAvailabilityFilter = '';
  const digits = currencyDigits(window.Rebuy?.shop?.currency);
  results.filterPrice = { max: undefined, min: new Intl.NumberFormat(navigator.language, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(0) };
  smartSearch.decodeQueryAndUpdateData(addressParams());
  showTop = true;
  smartSearch.searchData({ currentPage: 1 });
}

/* ── 8. No products, and names ──────────────────────────────────────────── */

// Copy from the search header's settings (sections/search-header.liquid)
const TEXT = (() => {
  try {
    return JSON.parse(document.getElementById('spy-search-texts')?.textContent || '{}');
  } catch {
    return {};
  }
})();
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const COLLECTION_GID = /^gid:\/\/shopify\/Collection\/\d+$/;

function wrapNoResults(smartSearch) {
  const view = smartSearch?.resultsPage?.view;
  if (!view || view.spyNoResults) return;
  view.spyNoResults = true;

  // Rebuy's message blames the spelling; with filters on, the filters found nothing
  const notFound = view.notFoundMessage;
  if (typeof notFound === 'function') {
    view.notFoundMessage = function (...args) {
      return TEXT.noFilterResults && smartSearch.hasSelectedFilters?.() ? escapeHtml(TEXT.noFilterResults) : notFound.apply(this, args);
    };
  }

  // With no products Rebuy hides the bar that holds the phone's "Filter and sort" button,
  // and that panel's filter list: keep both while filters are on, so they can be changed
  const sortBar = view.shouldShowSortBy;
  if (typeof sortBar === 'function') {
    view.shouldShowSortBy = function (...args) {
      return sortBar.apply(this, args) || Boolean(smartSearch.resultsPage.hasLoadedInitialSearchResults && smartSearch.hasSelectedFilters?.());
    };
  }
  const filterList = view.shouldShowAggregatedFilters;
  if (typeof filterList === 'function') {
    view.shouldShowAggregatedFilters = function (...args) {
      return filterList.apply(this, args) || Boolean(smartSearch.hasSelectedFilters?.() && smartSearch.resultsPage.mappedAggregatedFilters?.length);
    };
  }

  // A collection read back from the address (Back, a shared link) has only its id
  const readable = view.getReadableFilterValue;
  if (typeof readable === 'function') {
    view.getReadableFilterValue = function (...args) {
      const text = readable.apply(this, args);
      const name = COLLECTION_GID.test(String(text)) && collectionName(text);
      return name ? escapeHtml(name) : text;
    };
  }

  // Rebuy names no ✕ on the Collection, Color and Size chips
  const removeLabel = view.handleRemovingFilterLabel;
  if (typeof removeLabel === 'function') {
    view.handleRemovingFilterLabel = function (type, value, ...rest) {
      if (!TEXT.removeFilter || (type !== 'metafields' && type !== 'option')) return removeLabel.call(this, type, value, ...rest);
      const doc = new DOMParser().parseFromString(String(view.getReadableFilterValue(value)), 'text/html');
      return TEXT.removeFilter.replace('[value]', doc.body.textContent.trim());
    };
  }
}

/* ── 9. A ticked row stays put ──────────────────────────────────────────── */

/*
 * The first tick adds the "Selected filter" block above the lists and pushed every
 * row down about 110px, so a quick second click hit another value. Hold the
 * changed row where it was by scrolling its list (or the page) by as much, until
 * the shopper scrolls, types or clicks again. Checked every frame: the block's ✕
 * icons grow it a little later, with no DOM change to tell.
 */
const HOLD_MS = 4000;
let held = null;
let holding = 0;

document.addEventListener(
  'change',
  (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !/^(checkbox|number)$/.test(input.type) || !input.closest('#rebuy-search-result-container')) return;
    const column = input.closest('.rebuy-smart-search-results-page-sidebar__filter-section');
    // Its height before the tick: a box still held from the last tick can be taller than its content
    const columnHeight = column && Math.min(column.clientHeight, contentHeight(column));
    held = { input, top: input.getBoundingClientRect().top, until: performance.now() + HOLD_MS, column, columnHeight };
    if (!holding) holding = requestAnimationFrame(holdRow);
  },
  true
);

function holdRow() {
  holding = 0;
  keepHeld();
  if (held) holding = requestAnimationFrame(holdRow);
}
for (const name of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
  document.addEventListener(name, () => (held = null), { capture: true, passive: true });
}

// The list's own scroller first (the filter column, the phone panel), then the page
function scrollersOf(element) {
  const list = [];
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(node).overflowY)) list.push(node);
  }
  const page = pageScroller();
  if (!list.includes(page)) list.push(page);
  return list;
}

const PANEL_BODY = '.rebuy-smart-search-results-page__flyout-body';
const panelPadding = new WeakMap();

// The column is sticky, so it is its children's offsetParent
function contentHeight(box) {
  const last = box.lastElementChild;
  return last ? last.offsetTop + last.offsetHeight + (parseFloat(getComputedStyle(box).paddingBottom) || 0) : box.clientHeight;
}

/**
 * A list too short to scroll gets the room it needs. The filter column keeps its
 * height from before the tick while the pointer is on it, so the new block overflows
 * it (a stuck column can't move with the page); the phone panel gets space at its end.
 */
function makeRoom(scroller, shift) {
  const need = scroller.scrollTop + shift - (scroller.scrollHeight - scroller.clientHeight);
  if (shift <= 0 || need < 1) return;
  if (scroller === held.column && held.columnHeight) {
    if (!scroller.style.height) scroller.addEventListener('pointerleave', () => scroller.style.removeProperty('height'), { once: true });
    scroller.style.height = `${held.columnHeight}px`;
  } else if (scroller.matches(PANEL_BODY)) {
    if (!panelPadding.has(scroller)) panelPadding.set(scroller, parseFloat(getComputedStyle(scroller).paddingBottom) || 0);
    const extra = (parseFloat(scroller.style.paddingBottom) || panelPadding.get(scroller)) - panelPadding.get(scroller);
    scroller.style.paddingBottom = `${panelPadding.get(scroller) + extra + need}px`;
  }
}

function keepHeld() {
  if (!held) return;
  if (!held.input.isConnected || performance.now() > held.until) {
    held = null;
    return;
  }
  const rowTop = () => held.input.getBoundingClientRect().top - held.top;
  let shift = rowTop();
  if (Math.abs(shift) < 1) return;
  for (const scroller of scrollersOf(held.input)) {
    if (Math.abs(shift) < 1) break;
    if (held.skip?.has(scroller)) continue;
    makeRoom(scroller, shift);
    const before = scroller.scrollTop;
    scroller.scrollBy({ top: shift, behavior: 'instant' });
    const next = rowTop();
    // The page moved but the row didn't (the column is stuck): undo, and leave that scroller alone
    if (scroller.scrollTop !== before && Math.abs(next - shift) < 1) {
      scroller.scrollTo({ top: before, behavior: 'instant' });
      (held.skip ||= new Set()).add(scroller);
      continue;
    }
    shift = next;
  }
}
