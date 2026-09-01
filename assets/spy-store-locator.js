/**
 * Store locator shell — sizing and the mobile List / Map switcher.
 *
 * The Stockist widget owns its own markup, so this file only handles the
 * things around it: fitting the locator to the viewport under the sticky
 * header, and swapping list for map on small screens.
 *
 * The switcher only sets data-view on the wrapper; the show/hide and the grid
 * tracks live in src/tailwind.css, so we never reach into the widget's DOM.
 * See audit/stockist-feasibility.md.
 */
(() => {
  'use strict';

  if (window.__spyStoreLocatorInit) return;
  window.__spyStoreLocatorInit = true;

  function scrollContainer() {
    // html has overflow:hidden in this theme — .page-wrapper does the scrolling.
    return document.querySelector('.page-wrapper') || document.scrollingElement || document.documentElement;
  }

  function breakpoint() {
    // Mirrors __stockist_desktop_breakpoint so both sides agree on "mobile".
    const bp = Number(window.__stockist_desktop_breakpoint);
    return Number.isFinite(bp) && bp > 0 ? bp : 1024;
  }

  function size(root) {
    if (root.dataset.fullHeight !== 'true') return;
    // Measure our own distance from the top of the page rather than hunting for
    // the header — that covers the announcement bar and any padding above us too.
    const sc = scrollContainer();
    const top = Math.max(0, Math.round(root.getBoundingClientRect().top + (sc.scrollTop || 0)));
    root.style.setProperty('--spy-locator-offset', top + 'px');
  }

  function isMobile() {
    return window.innerWidth < breakpoint();
  }

  /**
   * Let the map zoom out until the whole world fits, as the source does.
   *
   * Stockist's minimum stops one step too high for a wide, short panel: the
   * Web Mercator world is 1024px tall at that zoom inside an ~807px map, so the
   * southern latitudes are cut off and cannot be reached. The world is 256px at
   * zoom 0 and doubles each step, so log2(height / 256) is the zoom at which it
   * exactly fills the container height.
   *
   * Leaflet and Mapbox GL both expose setMinZoom; Leaflet also snaps to whole
   * zoom levels by default, which would round the fit away.
   */
  let mapRef = null;
  let widgetLoaded = false;

  function fitMinZoom() {
    const map = mapRef;
    if (!map || typeof map.setMinZoom !== 'function') return;
    const el = typeof map.getContainer === 'function' ? map.getContainer() : null;
    const h = el ? el.getBoundingClientRect().height : 0;
    if (!h) return;
    try {
      if (map.options && 'zoomSnap' in map.options) map.options.zoomSnap = 0;
      map.setMinZoom(Math.max(0, Math.log2(h / 256)));
    } catch (e) { /* map not ready, next resize will retry */ }
  }

  function setView(root, view) {
    root.dataset.view = view;
    root.querySelectorAll('[data-spy-locator-view]').forEach((btn) => {
      const on = btn.dataset.spyLocatorView === view;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    // Stockist sizes its map on resize, so nudge it after the swap.
    window.dispatchEvent(new Event('resize'));
  }

  function syncSwitcher(root) {
    // CSS keys off this rather than a media query, so the breakpoint setting
    // and the stacking rules can't drift apart.
    const mobile = isMobile();
    root.dataset.mobile = String(mobile);

    const bar = root.querySelector('[data-spy-locator-switcher]');
    if (!bar) return;
    bar.hidden = !mobile;
    if (!mobile) {
      delete root.dataset.view;
      return;
    }
    if (!root.dataset.view) setView(root, 'list');
  }

  /**
   * Two headings, and the source shows one at a time:
   * - "Find a Spy Optic dealer" above the list, only once there are results
   * - "Search for a location" titling the empty state, above Stockist's message
   *
   * Both live in DOM Stockist owns, so we move them in. It rebuilds the results
   * panel on every query, which tears them out of the document — but a node held
   * in a variable survives removal, so the same elements go straight back.
   * Re-querying the DOM would find nothing after the first rebuild.
   */
  const owned = new WeakMap();

  function ours(root) {
    let refs = owned.get(root);
    if (!refs) {
      refs = {
        heading: root.querySelector('[data-spy-locator-results-heading]'),
        title: root.querySelector('[data-spy-locator-empty-title]'),
        geo: root.querySelector('[data-spy-locator-geo]'),
      };
      owned.set(root, refs);
    }
    return refs;
  }

  function placeHeadings(root) {
    const panel = root.querySelector('.stockist-result-panel');
    // With css_isolation on, the widget is in a closed shadow root and the panel
    // is unreachable. Nothing can be placed, so nothing may be shown — Stockist
    // draws its own empty state in there instead. Without this the title and
    // button escape the panel and stretch the full page width.
    root.dataset.placed = String(!!panel);
    if (!panel) return;

    const { heading, title, geo } = ours(root);
    if (heading && heading.parentElement !== panel) {
      panel.insertBefore(heading, panel.firstChild);
    }

    const message = root.querySelector('.stockist-result-message');
    const messageText = root.querySelector('.stockist-result-message-text');
    if (title && message && messageText && title.parentElement !== message) {
      message.insertBefore(title, messageText);
    }
    if (geo && message && geo.parentElement !== message) message.appendChild(geo);
  }

  /** Our empty-state geolocate button drives the widget's own trigger. */
  function wireGeolocate(root) {
    const { geo } = ours(root);
    if (!geo || geo.dataset.spyLocatorWired) return;
    geo.dataset.spyLocatorWired = 'true';
    geo.addEventListener('click', () => {
      if (typeof window.__stockist_trigger_geolocation === 'function') {
        window.__stockist_trigger_geolocation();
      }
    });
  }

  function syncResultState(root) {
    const hasResults = !!root.querySelector('.stockist-result');
    const placed = root.dataset.placed === 'true';
    // Stockist labels the panel: .stockist-instructions before anything is
    // searched, .stockist-no-results after a search came back empty. Only the
    // first is the source's "Search for a location" state — pairing that title
    // with "no dealers found" would contradict itself.
    const initial = !!root.querySelector('.stockist-results.stockist-instructions');
    root.dataset.hasResults = String(hasResults);

    const { title, geo } = ours(root);
    if (title) title.hidden = !placed || !initial;

    // Only offer geolocate while the panel is empty, and only if it can work.
    if (geo) {
      const usable = typeof window.__stockist_trigger_geolocation === 'function'
        && 'geolocation' in navigator;
      geo.hidden = !placed || !initial || hasResults || !usable;
    }
  }

  /** Stockist rebuilds the list on every query, so re-place and re-check after each. */
  function watchResults(root) {
    const panel = root.querySelector('.stockist-result-panel');
    if (!panel || panel.dataset.spyLocatorWatched) return;
    panel.dataset.spyLocatorWatched = 'true';
    new MutationObserver(() => {
      placeHeadings(root);
      syncResultState(root);
    }).observe(panel, { childList: true, subtree: true });
  }

  function init(root) {
    if (root.dataset.spyLocatorReady) return;
    root.dataset.spyLocatorReady = 'true';

    root.querySelectorAll('[data-spy-locator-view]').forEach((btn) => {
      btn.addEventListener('click', () => setView(root, btn.dataset.spyLocatorView));
    });

    size(root);
    syncSwitcher(root);
  }

  function refresh() {
    document.querySelectorAll('[data-spy-locator]').forEach((root) => {
      init(root);
      placeHeadings(root);
      wireGeolocate(root);
      syncResultState(root);
      watchResults(root);
      size(root);
      syncSwitcher(root);
      // With css_isolation on we cannot size the widget, so it keeps its own
      // account height inside our full-viewport shell and leaves dead space
      // below. Shrink to it — but only after it has drawn, so the normal
      // (reachable) case never sees a height jump.
      root.dataset.collapsed = String(widgetLoaded && root.dataset.placed !== 'true');
    });
    fitMinZoom();
  }

  let raf = 0;
  function onResize() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(refresh);
  }

  document.addEventListener('DOMContentLoaded', refresh);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  refresh();

  // Header height settles after fonts and the sticky header script run.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  // Theme editor re-renders the section on every setting change.
  document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('[data-spy-locator]')) refresh();
  });

  // Widget hands us its map instance here — Leaflet or Mapbox, same call.
  const prevMapCreated = window.__stockist_widget_mapcreated;
  window.__stockist_widget_mapcreated = function (ctx) {
    mapRef = ctx && ctx.map;
    fitMinZoom();
    if (typeof prevMapCreated === 'function') return prevMapCreated.apply(this, arguments);
  };

  // Widget tells us when it has drawn — re-measure once it has real height.
  const prevLoaded = window.__stockist_widget_domloaded;
  window.__stockist_widget_domloaded = function (...args) {
    widgetLoaded = true;
    refresh();
    if (typeof prevLoaded === 'function') return prevLoaded.apply(this, args);
  };
})();
