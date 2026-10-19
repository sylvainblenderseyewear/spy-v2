/**
 * Rebuy Smart Search glue. Rebuy draws the search box and the results page
 * (the PM asked for the Blenders layout); the theme search stays the fallback,
 * because Rebuy boots late and may not load at all (blockers, an outage).
 *
 * 1. Tiles show the model name over the colourway, like Blenders.
 * 2. /search waits for Rebuy only if Rebuy search ran for this shopper lately,
 *    and gives the page back to the theme results if Rebuy does not show up.
 * 3. More products load on scroll, in the box and on the results page (like Blenders).
 * 4. Filters show names, and their lists stay put when a value is ticked.
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

let boxCheck = 0;
document.addEventListener(
  'scroll',
  () => {
    if (boxCheck || !quickView()?.isQuickViewOpen) return;
    boxCheck = requestAnimationFrame(() => {
      boxCheck = 0;
      checkBoxEnd();
    });
  },
  { capture: true, passive: true }
);

/*
 * Results page: Rebuy's continuous scroll listens to window only, but from 990px
 * the theme scrolls .page-wrapper, so page 2 never came. Run Rebuy's own check
 * when that wrapper scrolls; Rebuy still decides and fetches.
 */
let pageCheck = 0;
document.querySelector('.page-wrapper')?.addEventListener(
  'scroll',
  () => {
    if (pageCheck) return;
    pageCheck = requestAnimationFrame(() => {
      pageCheck = 0;
      const smartSearch = window.Rebuy?.SmartSearch;
      if (smartSearch?.resultsPage?.isVisible) smartSearch.handleContinuousScrollProductFetching?.();
    });
  },
  { passive: true }
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
 * group shrinks to that one value and the other groups lose values. Rebuy has no
 * "or" inside a group either, so two ticks in one group find nothing. Here each
 * list keeps the values it showed before the first tick (values with no results
 * go grey), and a tick in a group replaces that group's old tick. A ticked group
 * counts its values without its own tick: one small extra search, kept per state.
 */
const STEADY_LISTS = { 'product-type': 'categories', 'product-option': 'options', 'product-metafield': 'metafields', 'variant-metafield': 'metafields' };
const TICK_LISTS = { 'product-type': 'categories', 'product-options': 'options', 'product-metafield': 'metafields', 'variant-metafield': 'metafields' };
const steady = { term: null, base: null, baseSig: '', baseBusy: false, present: [], current: new Map(), others: new Map(), shown: new Map(), busy: new Set() };
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const hasListTicks = (filters) => ['tags', 'categories', 'options', 'vendors', 'metafields'].some((list) => (filters?.[list] || []).length > 0);
const enabledFilters = (smartSearch) => (smartSearch.globalData?.settings?.searchResultsSettings?.setting?.filterSettings || []).filter((filter) => filter.enabled);

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

function signatureOf(filters, group) {
  const copy = clone(filters) || {};
  if (group) copy[group.list] = (copy[group.list] || []).filter((entry) => !(typeof entry === 'string' && entry.startsWith(group.prefix)));
  for (const list of ['tags', 'categories', 'options', 'vendors', 'metafields']) if (Array.isArray(copy[list])) copy[list].sort();
  return JSON.stringify(copy);
}

function countsOf(group, values) {
  const counts = new Map();
  if (group.list === 'options') for (const [key, value] of Object.entries(values || {})) counts.set(key, Number(value?.numProducts) || 0);
  else if (Array.isArray(values)) for (const item of values) counts.set(keyOf(group, item), Number(item.numProducts) || 0);
  return counts;
}

/** The first list in its order with today's counts, then values it never had, then a tick it never had. */
function steadyValues(group, baseValues, liveValues, picks) {
  const counts = countsOf(group, liveValues);
  if (group.list === 'options') {
    const out = {};
    for (const [key, value] of Object.entries(baseValues || {})) out[key] = { ...value, numProducts: counts.get(key) ?? 0 };
    for (const [key, value] of Object.entries(liveValues || {})) if (!(key in out)) out[key] = value;
    for (const key of picks) if (!(key in out)) out[key] = { numProducts: 0 };
    return out;
  }
  const out = (baseValues || []).map((item) => ({ ...item, numProducts: counts.get(keyOf(group, item)) ?? 0 }));
  const listed = new Set(out.map((item) => keyOf(group, item)));
  for (const item of Array.isArray(liveValues) ? liveValues : []) {
    if (listed.has(keyOf(group, item))) continue;
    out.push(item);
    listed.add(keyOf(group, item));
  }
  for (const key of picks) if (!listed.has(key)) out.push(group.list === 'categories' ? { categories: key, numProducts: 0 } : { value: key, numProducts: 0 });
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

/** A one-product search that only brings back the counts for these filters. */
async function countSearch(smartSearch, filters) {
  const rebuy = window.Rebuy;
  const query = clone(smartSearch.resultsPage.searchQuery);
  Object.assign(query, { filters, sortBy: {}, fields: ['product_id'], pageSize: 1, currentPage: 1 });
  // Rebuy's own search sends the price range converted, so do the same
  const toInteger = rebuy.util?.convertBackToInteger;
  for (const end of ['min', 'max']) {
    if (!filters.price?.[end]) continue;
    if (typeof toInteger !== 'function') throw new Error('no price converter');
    query.filters.price[end] = toInteger(filters.price[end], rebuy.shop.currency);
  }
  // Same endpoint as §4 (Rebuy's own searchUrls are paths its API helper prefixes)
  const response = await fetch(`https://rebuyengine.com/api/v1/smart-search/search?key=${encodeURIComponent(rebuy.shop.api_key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  const aggregates = (await response.json())?.data?.aggregates;
  if (!Array.isArray(aggregates)) throw new Error(`Rebuy search answered ${response.status}`);
  return aggregates;
}

/** After every Rebuy search: remember what it drew, then put the steady lists in. */
function captureSteady(smartSearch) {
  const query = smartSearch?.resultsPage?.searchQuery;
  const filters = smartSearch?.resultsPage?.mappedAggregatedFilters;
  if (!query || !Array.isArray(filters)) return;

  const term = String(query.searchTerm || '').trim().toLowerCase();
  if (term !== steady.term) {
    Object.assign(steady, { term, base: null, baseSig: '' });
    steady.others.clear();
    steady.shown.clear();
  }
  steady.present = filters.slice();

  if (!hasListTicks(query.filters)) {
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
    steady.current = new Map();
    steady.baseSig = signatureOf(query.filters);
    steady.others.clear();
    steady.shown.clear();
    return;
  }
  steady.current = new Map(steady.present.filter(groupOf).map((filter) => [groupOf(filter).id, filter.values]));
  // Landed with ticks in the address: fetch the untouched lists first
  if (!steady.base) loadBase(smartSearch);
  else applySteady(smartSearch);
}

function applySteady(smartSearch) {
  const query = smartSearch?.resultsPage?.searchQuery;
  const filters = smartSearch?.resultsPage?.mappedAggregatedFilters;
  if (!query || !Array.isArray(filters) || !steady.base) return;

  // A group Rebuy dropped (no value left) comes back from the first lists, greyed
  const shown = steady.present.slice();
  for (const { filter } of steady.base.values()) if (!shown.includes(filter)) shown.push(filter);
  shown.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (const filter of shown) {
    const group = groupOf(filter);
    const entry = group && steady.base.get(group.id);
    if (!entry) continue;
    const picks = ticksOf(group, query.filters).map((tick) => tick.slice(group.prefix.length));
    let live = steady.current.get(group.id);
    if (picks.length) {
      // A ticked group counts what each of its values would give instead
      const sig = signatureOf(query.filters, group);
      const other = steady.others.get(group.id);
      if (other?.sig === sig) live = other.values;
      else if (sig === steady.baseSig) live = entry.values;
      else {
        loadOthers(smartSearch, filter, group, sig);
        const before = steady.shown.get(group.id);
        if (before) {
          filter.values = before; // keep what is on screen until the counts come
          continue;
        }
        live = entry.values;
      }
    }
    filter.values = steadyValues(group, entry.values, live, picks);
    steady.shown.set(group.id, filter.values);
  }
  filters.splice(0, filters.length, ...shown);
}

async function loadBase(smartSearch) {
  if (steady.baseBusy) return;
  steady.baseBusy = true;
  const term = steady.term;
  try {
    const filters = { ...clone(smartSearch.resultsPage.searchQuery.filters), tags: [], categories: [], options: [], vendors: [], metafields: [] };
    const aggregates = await countSearch(smartSearch, filters);
    if (term !== steady.term || steady.base) return;
    const base = new Map();
    for (const filter of enabledFilters(smartSearch)) {
      const group = groupOf(filter);
      const values = group && labelled(filter, valuesFrom(aggregates, filter));
      if (values && Object.keys(values).length) base.set(group.id, { filter, values });
    }
    Object.assign(steady, { base, baseSig: signatureOf(filters) });
    applySteady(smartSearch);
    smartSearch.resultsPage.view?.$forceUpdate?.();
  } catch (error) {
    console.warn('[spy-rebuy-search] steady filters:', error); // Rebuy's own lists stay
  } finally {
    steady.baseBusy = false;
  }
}

async function loadOthers(smartSearch, filter, group, sig) {
  const ask = `${group.id}|${sig}`;
  if (steady.busy.has(ask)) return;
  steady.busy.add(ask);
  const term = steady.term;
  try {
    const filters = clone(smartSearch.resultsPage.searchQuery.filters);
    filters[group.list] = (filters[group.list] || []).filter((entry) => !(typeof entry === 'string' && entry.startsWith(group.prefix)));
    const aggregates = await countSearch(smartSearch, filters);
    if (term !== steady.term) return;
    steady.others.set(group.id, { sig, values: labelled(filter, valuesFrom(aggregates, filter)) });
    applySteady(smartSearch);
    smartSearch.resultsPage.view?.$forceUpdate?.();
  } catch (error) {
    console.warn('[spy-rebuy-search] steady filters:', error);
  } finally {
    steady.busy.delete(ask);
  }
}

/*
 * A second tick in a group would find nothing, so it replaces the first. The
 * template calls the view's copy of handleUpdateSearchQuery (bound when the view
 * was made), so the switch wraps that copy, not Rebuy.SmartSearch's.
 */
function wrapTickSwitch(smartSearch) {
  const view = smartSearch?.resultsPage?.view;
  const update = view?.handleUpdateSearchQuery;
  if (typeof update !== 'function' || update.spySwitches) return;
  const switching = function (type, value, ...rest) {
    const list = TICK_LISTS[type];
    const filters = smartSearch.resultsPage?.searchQuery?.filters;
    if (list && typeof value === 'string' && Array.isArray(filters?.[list]) && !filters[list].includes(value)) {
      let prefix = null;
      if (list === 'categories') prefix = '';
      else if (list === 'options') prefix = value.includes(' # ') ? value.slice(0, value.indexOf(' # ') + 3) : null;
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
    return update.call(this, type, value, ...rest);
  };
  switching.spySwitches = true;
  view.handleUpdateSearchQuery = switching;
}

// A value with no results under the other ticks stays listed, greyed and not tickable
function markEmpty() {
  const inputs = document.querySelectorAll(
    '#rebuy-search-result-container input.rebuy-checkbox[id^="rebuy-metafield-"], #rebuy-search-result-container input.rebuy-checkbox[id^="rebuy-option-product-type-"]'
  );
  for (const input of inputs) {
    const row = input.closest('li');
    const count = row?.querySelector('.rebuy-smart-search-results-page__filter-label')?.textContent.match(/\((\d+)\)/);
    const empty = Boolean(count) && Number(count[1]) === 0 && !input.checked;
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
