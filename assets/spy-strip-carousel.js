/**
 * PDP lifestyle strip.
 *
 * Cell width is CSS's job — `basis: 100% / var(--spy-show)` against a track that already
 * gives up 50px of padding each side, which is exactly slick's `(listWidth - 2 * centerPadding)
 * / slidesToShow`. This file only does what CSS can't: the wrap-around loop the source runs
 * from 769px up, one-cell arrow steps, and hiding an arrow at each end below that.
 *
 * The loop is clones plus a jump. Copies of the tail sit before the real cells and copies of
 * the head after them, the strip rests scrolled past the leading copies, and once the reader
 * drifts into either copy band we shift scrollLeft by one full set. The jump lands on pixels
 * identical to the ones already on screen, so it never shows.
 */
(function () {
  const SELECTOR = '[data-spy-strip]';
  const LOOP_FROM = '(min-width: 770px)'; // slick's mobileFirst is innerWidth > 769
  const SETTLE_MS = 120;

  function cells(track) {
    return track.querySelectorAll('[data-spy-strip-cell]');
  }

  function realCells(track) {
    return track.querySelectorAll('[data-spy-strip-cell]:not([data-spy-strip-clone])');
  }

  function cellWidth(track) {
    const first = cells(track)[0];
    return first ? first.getBoundingClientRect().width : 0;
  }

  function slidesShown(track) {
    return parseFloat(getComputedStyle(track).getPropertyValue('--spy-show')) || 1;
  }

  // How many copies each side: enough to cover the visible cells plus the peek
  function cloneCount(show, total) {
    return Math.min(total, Math.ceil(show) + 1);
  }

  function dropClones(track) {
    track.querySelectorAll('[data-spy-strip-clone]').forEach((el) => el.remove());
  }

  function addClones(track, count) {
    const real = [...realCells(track)];
    if (!real.length) return;

    const copy = (cell) => {
      const clone = cell.cloneNode(true);
      clone.setAttribute('data-spy-strip-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    };

    // Tail copies go in front, head copies behind — reversed so the order survives prepending
    real
      .slice(-count)
      .reverse()
      .forEach((cell) => track.prepend(copy(cell)));
    real.slice(0, count).forEach((cell) => track.append(copy(cell)));
  }

  function syncArrows(state) {
    const { track, prev, next, looping } = state;
    if (looping) {
      // Source never disables these while it loops
      if (prev) prev.disabled = false;
      if (next) next.disabled = false;
      return;
    }
    // 1px slack: scrollWidth and the scrolled position can land a fraction apart
    if (prev) prev.disabled = track.scrollLeft <= 1;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  }

  // Pull the scroll position back into the real cells when it wanders into a copy band
  function rewind(state) {
    if (!state.looping) return;
    const { track, lead, count } = state;
    const step = cellWidth(track);
    if (!step) return;

    const set = count * step;
    const max = track.scrollWidth - track.clientWidth;
    let left = track.scrollLeft;

    // Inclusive on both edges: snapping parks the track exactly on a copy's start,
    // and a strict test would leave it sitting there with nowhere left to scroll
    if (left >= (lead + count) * step - 1) left -= set;
    else if (left <= step + 1) left += set;
    else return;

    if (left < 0 || left > max) return;
    track.scrollTo({ left: left, behavior: 'instant' });
  }

  function layout(state) {
    const { track } = state;
    const show = slidesShown(track);
    const count = realCells(track).length;
    const looping = state.canLoop.matches && count > show;
    const lead = looping ? cloneCount(show, count) : 0;

    // Nothing structural changed — leave the reader's position alone
    if (state.show === show && state.looping === looping) {
      syncArrows(state);
      return;
    }

    state.show = show;
    state.count = count;
    state.looping = looping;
    state.lead = lead;

    dropClones(track);
    if (looping) {
      addClones(track, lead);
      track.scrollTo({ left: lead * cellWidth(track), behavior: 'instant' });
    } else {
      track.scrollTo({ left: 0, behavior: 'instant' });
    }
    syncArrows(state);
  }

  function bind(strip) {
    if (strip.dataset.spyStripReady === 'on') return;
    const track = strip.querySelector('[data-spy-strip-track]');
    if (!track) return;
    strip.dataset.spyStripReady = 'on';

    const state = {
      track: track,
      prev: strip.querySelector('[data-spy-strip-prev]'),
      next: strip.querySelector('[data-spy-strip-next]'),
      canLoop: window.matchMedia(LOOP_FROM),
      show: null,
      count: 0,
      looping: false,
      lead: 0,
    };

    const step = (dir) => {
      // Normalise first, so a click never starts a smooth scroll from inside a copy band
      rewind(state);
      track.scrollBy({ left: dir * cellWidth(track), behavior: 'smooth' });
    };
    if (state.prev) state.prev.addEventListener('click', () => step(-1));
    if (state.next) state.next.addEventListener('click', () => step(1));

    // Waiting for the scroll to settle keeps the jump out of the middle of an animation
    let settle;
    track.addEventListener(
      'scroll',
      () => {
        syncArrows(state);
        clearTimeout(settle);
        settle = setTimeout(() => rewind(state), SETTLE_MS);
      },
      { passive: true }
    );

    let resized;
    window.addEventListener('resize', () => {
      clearTimeout(resized);
      resized = setTimeout(() => layout(state), SETTLE_MS);
    });

    layout(state);
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
