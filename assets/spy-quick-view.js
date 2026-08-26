// Quick View dialog: any [data-spy-qv="handle"] opens the shell in
// spy-quick-view.liquid and fills it with the spy-quick-view-content section.
// The gallery arrows and the colour picker are wired after each fetch.
(() => {
  const SECTION = 'spy-quick-view-content';

  const root = document.querySelector('[data-spy-qv-root]');
  if (!root) return;

  const layer = root.querySelector('[data-spy-qv-layer]');
  const body = root.querySelector('[data-spy-qv-body]');
  const pdpLink = root.querySelector('[data-spy-qv-pdp-link]');

  // The PLP sits inside stacking contexts (sticky header, card hover layers), so a
  // fixed dialog left in place can end up painted under them. Move it to <body>.
  if (root.parentElement !== document.body) {
    document.body.appendChild(root);
    void root.offsetWidth;
  }

  let lastTrigger = null;
  const cache = new Map();

  const message = (text) =>
    `<p class="py-12 text-center text-[14px] text-[color:var(--color-spy-text-2)]">${text}</p>`;

  /* ── gallery ─────────────────────────────────────────────────────────── */

  const bindGallery = () => {
    const gallery = body.querySelector('[data-spy-qv-gallery]');
    if (!gallery) return;

    const track = gallery.querySelector('[data-spy-qv-track]');
    const slides = [...gallery.querySelectorAll('[data-spy-qv-slide]')];
    if (!track || slides.length < 2) return;

    // Arrows only — the source dialog has no thumbnail rail. Swipe handles touch.
    const goTo = (index) => {
      const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
      if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };

    const current = () => Math.round(track.scrollLeft / track.clientWidth);

    gallery.querySelector('[data-spy-qv-prev]')?.addEventListener('click', () => goTo(current() - 1));
    gallery.querySelector('[data-spy-qv-next]')?.addEventListener('click', () => goTo(current() + 1));
  };

  /* ── colourways ──────────────────────────────────────────────────────── */

  // Staging keeps one product per colourway, so a swatch points at another PDP.
  // Swap the dialog content instead of leaving the page.
  const bindColorPicker = () => {
    body.querySelectorAll('.spy-swatches a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const handle = link.getAttribute('href')?.match(/\/products\/([^/?#]+)/)?.[1];
        if (!handle) return;
        event.preventDefault();
        load(handle);
      });
    });
  };

  /* ── panels that ship their own script ───────────────────────────────── */

  // innerHTML never runs a <script>, and the fit guide carries its own (it reads
  // document.currentScript.previousElementSibling, so the copy has to land in the
  // same spot). Swapping each inert tag for a live one keeps that lookup valid.
  const runScripts = () => {
    body.querySelectorAll('script').forEach((inert) => {
      const live = document.createElement('script');
      for (const attr of inert.attributes) live.setAttribute(attr.name, attr.value);
      live.textContent = inert.textContent;
      inert.replaceWith(live);
    });
  };

  const panelOpen = () =>
    Boolean(document.querySelector('[data-spy-fit-guide-modal][data-open], [data-spy-drawer][data-open]'));

  // Those panels clear the body lock when they close. Put it back if we are still up.
  const keepScrollLocked = () =>
    requestAnimationFrame(() => {
      if ('open' in root.dataset) document.body.style.overflow = 'hidden';
    });

  /* ── open / close ────────────────────────────────────────────────────── */

  const load = (handle) => {
    pdpLink?.setAttribute('href', `/products/${handle}`);

    const render = (html) => {
      body.innerHTML = html;
      runScripts();
      bindGallery();
      bindColorPicker();
      // A colourway swap can swap in a taller panel — start it from the top again
      if (layer) layer.scrollTop = 0;
    };

    if (cache.has(handle)) {
      render(cache.get(handle));
      return;
    }

    body.innerHTML = message('Loading&hellip;');

    fetch(`/products/${handle}?section_id=${SECTION}`)
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.text();
      })
      .then((html) => {
        const section = new DOMParser().parseFromString(html, 'text/html').querySelector('.shopify-section');
        const markup = section ? section.innerHTML : html;
        cache.set(handle, markup);
        render(markup);
      })
      .catch(() => {
        body.innerHTML = message(
          `Could not load this product. <a class="text-[color:var(--color-spy-orange-ui)] underline" href="/products/${handle}">View full details</a>`
        );
      });
  };

  const open = (handle, trigger) => {
    lastTrigger = trigger || null;
    root.dataset.open = '';
    layer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    load(handle);
    root.querySelector('[data-spy-qv-close]')?.focus();
  };

  const close = () => {
    if (!('open' in root.dataset)) return;
    delete root.dataset.open;
    layer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastTrigger?.focus();
    lastTrigger = null;
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-spy-qv]');
    if (trigger) {
      event.preventDefault();
      open(trigger.dataset.spyQv, trigger);
      return;
    }
    if (event.target.closest('[data-spy-qv-close]')) close();
    keepScrollLocked();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    // Escape belongs to the topmost panel — the Size Chart closes before we do
    if (!panelOpen()) close();
    keepScrollLocked();
  });
})();
