// Quick View dialog: any [data-spy-qv="handle"] opens the shell in
// spy-quick-view.liquid and fills it with the spy-quick-view-content section.
// The gallery arrows, the colour picker and the size/lens buttons are wired after each fetch.
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
  let loadId = 0;
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

  // Staging keeps one product per frame with lenses as variants, so a swatch points at
  // a variant of this or another PDP. Swap the dialog content instead of leaving the page.
  const bindColorPicker = () => {
    body.querySelectorAll('.spy-swatches a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const url = new URL(link.href, window.location.href);
        const handle = url.pathname.match(/\/products\/([^/?#]+)/)?.[1];
        if (!handle) return;
        event.preventDefault();
        if (link.getAttribute('aria-current') === 'true') return;
        load(handle, url.searchParams.get('variant') || undefined);
      });
    });
  };

  /* ── size / lens ─────────────────────────────────────────────────────── */

  // A pick reloads the dialog for the matching variant, so price, stock, the
  // colour details and the buy button all follow it. A combination that doesn't
  // exist falls back to a variant that has the value just picked.
  const bindOptions = (handle) => {
    const box = body.querySelector('[data-spy-qv-options]');
    if (!box) return;

    let variants = [];
    try {
      variants = JSON.parse(box.querySelector('[data-spy-qv-variants]')?.textContent || '[]');
    } catch {
      return;
    }

    box.addEventListener('change', (event) => {
      const input = event.target.closest('input[data-spy-qv-option]');
      if (!input) return;

      const picked = [...box.querySelectorAll('input[data-spy-qv-option]:checked')].map((el) => [
        Number(el.dataset.spyQvOption) - 1,
        el.value,
      ]);
      const position = Number(input.dataset.spyQvOption) - 1;
      const hasValue = (variant) => variant.options[position] === input.value;

      const variant =
        variants.find((v) => picked.every(([index, value]) => v.options[index] === value)) ||
        variants.find((v) => hasValue(v) && v.available) ||
        variants.find(hasValue);

      if (variant) load(handle, variant.id, { option: input.dataset.spyQvOption, value: input.value });
    });
  };

  /* ── panels that ship their own script ───────────────────────────────── */

  // innerHTML never runs a <script>, and the fit guide carries its own (it reads
  // document.currentScript.previousElementSibling, so the copy has to land in the
  // same spot). Swapping each inert tag for a live one keeps that lookup valid.
  const runScripts = () => {
    body.querySelectorAll('script:not([type="application/json"])').forEach((inert) => {
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

  // `picked` is set when a size/lens button asked for this load: the dialog keeps its
  // scroll position and focus goes back to that button once the new markup is in.
  const load = (handle, variantId, picked) => {
    const query = variantId ? `variant=${variantId}` : '';
    const key = `${handle}?${query}`;
    const id = ++loadId;

    pdpLink?.setAttribute('href', `/products/${handle}${query ? `?${query}` : ''}`);

    const render = (html) => {
      // A slower, older request must not overwrite a newer pick
      if (id !== loadId) return;
      body.innerHTML = html;
      runScripts();
      bindGallery();
      bindColorPicker();
      bindOptions(handle);
      if (picked) {
        const selector = `input[data-spy-qv-option="${picked.option}"][value="${CSS.escape(picked.value)}"]`;
        body.querySelector(selector)?.focus();
      } else if (layer) {
        // A colourway swap can swap in a taller panel — start it from the top again
        layer.scrollTop = 0;
      }
    };

    if (cache.has(key)) {
      render(cache.get(key));
      return;
    }

    // A size/lens pick keeps the current content up until the new one arrives
    if (!picked) body.innerHTML = message('Loading&hellip;');

    fetch(`/products/${handle}?${query ? `${query}&` : ''}section_id=${SECTION}`)
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.text();
      })
      .then((html) => {
        const section = new DOMParser().parseFromString(html, 'text/html').querySelector('.shopify-section');
        const markup = section ? section.innerHTML : html;
        cache.set(key, markup);
        render(markup);
      })
      .catch(() => {
        if (id !== loadId) return;
        body.innerHTML = message(
          `Could not load this product. <a class="text-[color:var(--color-spy-orange-ui)] underline" href="/products/${handle}">View full details</a>`
        );
      });
  };

  // Quick View sits on <body>, so an inert page keeps Tab inside it (a drawer may still be open on top)
  const syncPageInert = () => {
    const on = !!document.querySelector('[data-spy-drawer][data-open], [data-spy-qv-root][data-open], #spy-compare-modal[data-open], [data-spy-fit-guide-modal][data-open]');
    document.querySelectorAll('.page-wrapper, .skip-to-content-link, access-widget-ui, pandectes-cmp').forEach((el) => { el.inert = on; });
  };

  const open = (handle, trigger) => {
    lastTrigger = trigger || null;
    root.dataset.open = '';
    syncPageInert();
    layer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    load(handle);
    // Into the dialog: the × button. The backdrop shares the close hook but is a div,
    // and a div can't take focus, so focus used to stay on the page.
    root.querySelector('button[data-spy-qv-close]')?.focus();
  };

  const close = () => {
    if (!('open' in root.dataset)) return;
    delete root.dataset.open;
    syncPageInert();
    layer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Back to the Quick View button. It is hidden again once its card loses hover,
    // so go through the card link: keyboard focus on it shows the button again.
    const trigger = lastTrigger;
    lastTrigger = null;
    if (!trigger) return;
    trigger.focus();
    if (document.activeElement === trigger) return;
    trigger.closest('product-card')?.querySelector('a.product-card__link')?.focus();
    trigger.focus();
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
