// Shared slider engine. Arrow clicks keep the pre-update feel (a short, soft
// ease-in-out) but run on the graphics card:
// - the scroll row jumps in one go, then the cards glide back with a transform
//   animation, so a busy page can't freeze the move;
// - one move at a time (extra clicks are ignored);
// - it always stops on a card;
// - swipe stays the browser's own scroll.
// Horizon's slideshow uses glide() too, for sliders marked [data-spy-glide].

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const glides = new WeakMap();

// The pre-update rails' ease-in-out (easeInOutQuad)
const EASE = 'cubic-bezier(0.455, 0.03, 0.515, 0.955)';

/**
 * Animate the scroller's children from where they sat at scroll position `from`
 * to where they sit now. Call it right after an instant scroll.
 * @param {HTMLElement} scroller
 * @param {number} from
 * @param {{ speed?: number, ease?: string, axis?: 'x' | 'y' }} [options]
 * @returns {Promise<void>} resolves once the cards have landed
 */
export function glide(scroller, from, { speed = 300, ease = EASE, axis = 'x' } = {}) {
  finishGlide(scroller);
  const to = axis === 'x' ? scroller.scrollLeft : scroller.scrollTop;
  const d = to - from;
  if (Math.abs(d) < 1 || speed <= 0 || reduced()) return Promise.resolve();

  // Snap treats moving cards as moving snap points and would chase them, which
  // cancels the glide, so it rests until they land
  const snap = [scroller.style.getPropertyValue('scroll-snap-type'), scroller.style.getPropertyPriority('scroll-snap-type')];
  scroller.style.setProperty('scroll-snap-type', 'none', 'important');

  // Not !important: Chrome only runs a transform on the graphics card without it
  const move = axis === 'x' ? 'translateX' : 'translateY';
  const anims = [...scroller.children].map((el) =>
    el.animate([{ transform: `${move}(${d}px)` }, { transform: `${move}(0px)` }], { duration: speed, easing: ease })
  );

  let finish = () => {};
  const done = new Promise((resolve) => {
    const stop = () => finish();
    // A swipe, drag or wheel during the glide takes over at once
    const events = ['pointerdown', 'touchstart', 'wheel'];
    events.forEach((e) => scroller.addEventListener(e, stop, { passive: true }));
    finish = () => {
      finish = () => {};
      events.forEach((e) => scroller.removeEventListener(e, stop));
      anims.forEach((a) => a.cancel());
      if (snap[0]) scroller.style.setProperty('scroll-snap-type', snap[0], snap[1]);
      else scroller.style.removeProperty('scroll-snap-type');
      glides.delete(scroller);
      resolve();
    };
    Promise.all(anims.map((a) => a.finished)).then(stop, stop);
  });
  glides.set(scroller, { finish: () => finish(), done });
  return done;
}

/** @param {HTMLElement} scroller */
export const isGliding = (scroller) => glides.has(scroller);

/** @param {HTMLElement} scroller */
export const finishGlide = (scroller) => glides.get(scroller)?.finish();

/**
 * <spy-slider data-opts='{...}'> with a [data-track] scroll row, optional
 * [data-prev] / [data-next] buttons and a [data-dots] holder.
 *
 * Options, all optional. A value can be one number or a list per screen width,
 * lowest first, cut at `bp` (slick's breakpoints by default: 540 / 720 / 1140):
 *   speed (ms, 300), ease (soft ease-in-out), step (cards per click, 1),
 *   loop (0/1, endless with clones), arrows (0/1, 1), dots (0/1, 0),
 *   autoplay (ms, 0 = off; pauses on hover and focus like slick).
 */
class SpySlider extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this.track = this.querySelector('[data-track]');
    if (!this.track) return;
    this._ready = true;

    try {
      this.o = JSON.parse(this.dataset.opts || '{}');
    } catch {
      this.o = {};
    }
    this.speed = Number(this.o.speed ?? 300);
    this.ease = this.o.ease || EASE;
    this.bps = Array.isArray(this.o.bp) ? this.o.bp : [540, 720, 1140];

    this.prevBtn = this.querySelector('[data-prev]');
    this.nextBtn = this.querySelector('[data-next]');
    this.dotsEl = this.querySelector('[data-dots]');
    this.reals = [...this.track.children];

    this.prevBtn?.addEventListener('click', () => this.step(-1));
    this.nextBtn?.addEventListener('click', () => this.step(1));
    this.addEventListener('keydown', (e) => this.onKey(e));
    this.track.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.setupDrag();

    this._onResize = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.layout(), 150);
    };
    window.addEventListener('resize', this._onResize);

    this.layout(true);
    this.startAutoplay();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize);
    clearInterval(this._auto);
  }

  // Settings for the current window width
  get cfg() {
    const w = window.innerWidth;
    let i = this.bps.findIndex((max) => w <= max);
    if (i < 0) i = this.bps.length;
    const pick = (key, fallback) => {
      const v = this.o[key];
      if (Array.isArray(v)) return v[Math.min(i, v.length - 1)] ?? fallback;
      return v ?? fallback;
    };
    return {
      step: Number(pick('step', 1)) || 1,
      loop: Boolean(Number(pick('loop', 0))),
      arrows: Boolean(Number(pick('arrows', 1))),
      dots: Boolean(Number(pick('dots', 0))),
    };
  }

  items() {
    return [...this.track.children];
  }

  // Build or drop the clones when the loop setting changes for this width
  layout(first = false) {
    const want = this.cfg.loop && this.reals.length > 1;
    if (want !== Boolean(this.looping)) {
      const keep = first ? 0 : this.realIndex();
      this.setLoop(want);
      this.jumpTo(this.reals[keep] || this.reals[0]);
    }
    this.buildDots();
    this.update();
  }

  setLoop(on) {
    this.track.querySelectorAll(':scope > [data-clone]').forEach((n) => n.remove());
    this.looping = on;
    if (!on) return;
    this.track.prepend(...this.reals.map((el) => this.clone(el)));
    this.track.append(...this.reals.map((el) => this.clone(el)));
  }

  // Clones look and click like the real card, but stay out of the tab order
  clone(el) {
    const c = /** @type {HTMLElement} */ (el.cloneNode(true));
    c.setAttribute('data-clone', '');
    c.setAttribute('aria-hidden', 'true');
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    c.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach((n) => n.setAttribute('tabindex', '-1'));
    return c;
  }

  // The scroll position where the browser would snap this card
  snapOf(el) {
    const t = this.track;
    const cs = getComputedStyle(t);
    const padL = parseFloat(cs.scrollPaddingLeft) || 0;
    const padR = parseFloat(cs.scrollPaddingRight) || 0;
    const box = t.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = box.left + t.clientLeft + padL;
    const width = t.clientWidth - padL - padR;
    const align = getComputedStyle(el).scrollSnapAlign.split(' ').pop();
    let x = t.scrollLeft + r.left - left;
    if (align === 'center') x = t.scrollLeft + r.left + r.width / 2 - (left + width / 2);
    else if (align === 'end') x = t.scrollLeft + r.right - (left + width);
    return Math.max(0, Math.min(Math.round(x), t.scrollWidth - t.clientWidth));
  }

  nearest(items = this.items()) {
    const x = this.track.scrollLeft;
    let best = 0;
    let dist = Infinity;
    items.forEach((el, i) => {
      const d = Math.abs(this.snapOf(el) - x);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  }

  realIndex() {
    const n = this.reals.length;
    if (!n) return 0;
    const i = this.nearest();
    return this.looping ? (((i - n) % n) + n) % n : Math.min(i, n - 1);
  }

  step(dir) {
    if (isGliding(this.track)) return;
    const t = this.track;
    const max = t.scrollWidth - t.clientWidth;
    if (!this.looping) {
      if (dir > 0 && t.scrollLeft >= max - 1) return;
      if (dir < 0 && t.scrollLeft <= 1) return;
    }
    const items = this.items();
    const i = Math.max(0, Math.min(this.nearest(items) + dir * this.cfg.step, items.length - 1));
    this.go(this.snapOf(items[i]));
  }

  go(target) {
    const t = this.track;
    const from = t.scrollLeft;
    if (Math.abs(target - from) < 1) return;
    t.scrollTo({ left: target, behavior: 'instant' });
    this.update();
    glide(t, from, { speed: this.speed, ease: this.ease }).then(() => {
      this.normalize();
      this.update();
    });
  }

  jumpTo(el) {
    if (el) this.track.scrollTo({ left: this.snapOf(el), behavior: 'instant' });
  }

  // In a loop, hop from a clone to its real twin. Same picture, so nobody sees it.
  normalize() {
    if (!this.looping || isGliding(this.track)) return;
    const n = this.reals.length;
    const items = this.items();
    const i = this.nearest(items);
    if (i >= n && i < 2 * n) return;
    const shift = items[n].offsetLeft - items[0].offsetLeft;
    this.track.scrollTo({ left: this.track.scrollLeft + (i < n ? shift : -shift), behavior: 'instant' });
  }

  onScroll() {
    clearTimeout(this._scrollTimer);
    this._scrollTimer = setTimeout(() => {
      // Mid-glide the moving cards stretch the row; the glide updates once it lands
      if (isGliding(this.track)) return;
      this.normalize();
      this.update();
    }, 120);
  }

  // Arrows: hidden when there is nothing to scroll, dimmed at the ends of a row that doesn't loop
  update() {
    const c = this.cfg;
    const t = this.track;
    const max = t.scrollWidth - t.clientWidth;
    const scrollable = this.looping || max > 1;
    const show = c.arrows && scrollable && this.reals.length > 1;
    // Card rails keep 50px margins for the arrows only while the arrows show
    this.toggleAttribute('data-arrows', show);
    const ends = [
      [this.prevBtn, t.scrollLeft <= 1],
      [this.nextBtn, t.scrollLeft >= max - 1],
    ];
    for (const [btn, atEnd] of ends) {
      if (!btn) continue;
      btn.toggleAttribute('data-off', !show);
      btn.setAttribute('aria-disabled', String(!this.looping && atEnd));
    }
    if (this.dotsEl) {
      this.dotsEl.toggleAttribute('data-off', !(c.dots && scrollable));
      const cur = this.realIndex();
      [...this.dotsEl.children].forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
    }
  }

  buildDots() {
    if (!this.dotsEl) return;
    const n = this.reals.length;
    if (this.dotsEl.children.length === n) return;
    const label = this.dotsEl.dataset.dotLabel || 'Slide [i] of [n]';
    this.dotsEl.replaceChildren(
      ...this.reals.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', label.replace('[i]', String(i + 1)).replace('[n]', String(n)));
        b.className = 'h-[10px] w-[10px] rounded-full border-0 bg-spy-ink p-0 opacity-25 transition-opacity aria-[current=true]:opacity-100';
        b.addEventListener('click', () => {
          if (isGliding(this.track)) return;
          this.go(this.snapOf(this.items()[this.looping ? n + i : i]));
        });
        return b;
      })
    );
  }

  onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof Element && e.target.closest('input, select, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.step(1);
    }
  }

  // Mouse drag follows the pointer, then glides onto the nearest card. Touch keeps native scroll.
  setupDrag() {
    const t = this.track;
    let down = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastT = 0;
    let speed = 0;

    t.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
      moved = false;
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      // End a running glide first, so it can't turn snap back on under the drag
      finishGlide(t);
      down = true;
      startX = lastX = e.clientX;
      startScroll = t.scrollLeft;
      lastT = performance.now();
      speed = 0;
      // Utilities compile !important, so inline styles need the priority flag
      t.style.setProperty('scroll-snap-type', 'none', 'important');
      t.style.setProperty('cursor', 'grabbing', 'important');
      // No setPointerCapture: it retargets the click and kills the card links
    });

    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) {
        moved = true;
        t.dataset.dragging = '';
      }
      t.scrollTo({ left: startScroll - dx, behavior: 'instant' });
      const now = performance.now();
      if (now > lastT) speed = (e.clientX - lastX) / (now - lastT);
      lastX = e.clientX;
      lastT = now;
    });

    const end = () => {
      if (!down) return;
      down = false;
      setTimeout(() => delete t.dataset.dragging, 0);
      t.style.removeProperty('cursor');
      if (moved) {
        // Carry the flick a little, then glide onto the nearest card
        const aim = t.scrollLeft - speed * 150;
        const items = this.items();
        let best = items[0];
        let dist = Infinity;
        for (const el of items) {
          const d = Math.abs(this.snapOf(el) - aim);
          if (d < dist) {
            dist = d;
            best = el;
          }
        }
        if (best) this.go(this.snapOf(best));
      }
      // Snap goes back on once the row sits on a card, so it can't jump
      t.style.removeProperty('scroll-snap-type');
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    // Swallow the click after a real mouse drag so the card link doesn't open.
    // Keyboard and screen-reader clicks carry detail 0 and always go through.
    t.addEventListener(
      'click',
      (e) => {
        if (e.detail === 0) return;
        const travelled = Math.hypot(e.clientX - downX, e.clientY - downY);
        if (moved || travelled > 5) {
          e.preventDefault();
          e.stopPropagation();
        }
        moved = false;
      },
      true
    );
    t.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // Like slick: moves on its own, pauses on hover and focus, ping-pongs when it doesn't loop
  startAutoplay() {
    const ms = Number(this.o.autoplay) || 0;
    if (!ms || reduced()) return;
    let dir = 1;
    this._auto = setInterval(() => {
      if (document.hidden || this.matches(':hover') || this.contains(document.activeElement)) return;
      const t = this.track;
      const max = t.scrollWidth - t.clientWidth;
      if (!this.looping) {
        if (dir > 0 && t.scrollLeft >= max - 1) dir = -1;
        else if (dir < 0 && t.scrollLeft <= 1) dir = 1;
      }
      this.step(dir);
    }, ms);
  }
}

if (!customElements.get('spy-slider')) customElements.define('spy-slider', SpySlider);
