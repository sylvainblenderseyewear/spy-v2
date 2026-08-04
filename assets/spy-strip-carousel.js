/**
 * Arrows for the PDP lifestyle strip. Scroll-snap already handles dragging and touch;
 * this only moves the track by one cell per click and hides an arrow at each end.
 */
(function () {
  const SELECTOR = '[data-spy-strip]';

  function cellWidth(track) {
    const first = track.firstElementChild;
    return first ? first.getBoundingClientRect().width : track.clientWidth;
  }

  function syncArrows(track, prev, next) {
    // 1px slack: scrollWidth and the scrolled position can land a fraction apart
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
  }

  function bind(strip) {
    if (strip.dataset.spyStripReady === 'on') return;
    strip.dataset.spyStripReady = 'on';

    const track = strip.querySelector('[data-spy-strip-track]');
    if (!track) return;
    const prev = strip.querySelector('[data-spy-strip-prev]');
    const next = strip.querySelector('[data-spy-strip-next]');

    const step = (dir) => track.scrollBy({ left: dir * cellWidth(track), behavior: 'smooth' });
    if (prev) prev.addEventListener('click', () => step(-1));
    if (next) next.addEventListener('click', () => step(1));

    track.addEventListener('scroll', () => syncArrows(track, prev, next), { passive: true });
    window.addEventListener('resize', () => syncArrows(track, prev, next));
    syncArrows(track, prev, next);
  }

  function bindAll() {
    document.querySelectorAll(SELECTOR).forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }
  // Variant swaps and editor re-renders replace the section markup
  if (window.MutationObserver) {
    new MutationObserver(bindAll).observe(document.body, { childList: true, subtree: true });
  }
})();
