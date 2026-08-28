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
   * The source puts the results heading between the filter row and the list.
   * We can't render it there — Stockist owns that DOM — so move it in once the
   * widget exists. In shadow-DOM mode the panel is unreachable and the heading
   * simply stays where the section rendered it.
   */
  function placeHeading(root) {
    const heading = root.querySelector('.spy-locator__heading');
    if (!heading) return;
    const panel = root.querySelector('.stockist-result-panel');
    if (!panel || heading.parentElement === panel) return;
    panel.insertBefore(heading, panel.firstChild);
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
      placeHeading(root);
      size(root);
      syncSwitcher(root);
    });
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

  // Widget tells us when it has drawn — re-measure once it has real height.
  const prevLoaded = window.__stockist_widget_domloaded;
  window.__stockist_widget_domloaded = function (...args) {
    refresh();
    if (typeof prevLoaded === 'function') return prevLoaded.apply(this, args);
  };
})();
