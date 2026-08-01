(() => {
  'use strict';

  // One delegated setup for every picker on the page.
  if (window.__spyLensOptionsInit) return;
  window.__spyLensOptionsInit = true;

  const HOST = '[data-spy-lens-options]';

  // Slider split lives in one variable; the clip and the handle both read it.
  function setSplit(frame, value) {
    if (frame) frame.style.setProperty('--cs', String(value));
  }

  function panels(host) {
    return host.querySelectorAll('[data-lens-panel]');
  }

  function activate(host, index) {
    host.querySelectorAll('[data-lens-swatch]').forEach((btn) => {
      const on = Number(btn.dataset.lensIndex) === index;
      btn.setAttribute('aria-pressed', String(on));
      const check = btn.querySelector('[data-lens-check]');
      if (check) check.hidden = !on;
    });

    let shown = null;
    panels(host).forEach((panel) => {
      const on = Number(panel.dataset.lensIndex) === index;
      panel.hidden = !on;
      if (on) shown = panel;
    });

    // A newly shown pair starts centred, like the source.
    if (!shown) return;
    const range = shown.querySelector('[data-lens-range]');
    if (range) range.value = '50';
    setSplit(shown.querySelector('[data-lens-frame]'), 50);
  }

  // Shared wording lives on the host — a child block can't read its parent.
  function applyLabels(host) {
    const d = host.dataset;
    const put = (sel, val) => {
      host.querySelectorAll(sel).forEach((el) => {
        el.textContent = val || '';
      });
    };
    put('[data-lens-label-before]', d.labelBefore);
    put('[data-lens-label-after]', d.labelAfter);
    put('[data-lens-vlt-suffix]', d.vltSuffix);
    if (d.sliderLabel) {
      host.querySelectorAll('[data-lens-range]').forEach((r) => {
        r.setAttribute('aria-label', d.sliderLabel);
      });
    }
  }

  function init(host) {
    if (host.dataset.lensReady) return;
    host.dataset.lensReady = '1';

    // Pair each swatch with the panel from the same child, then lift the panels
    // out so the swatches read as one row and tab order follows the layout.
    const stage = host.querySelector('[data-lens-stage]');
    host.querySelectorAll('[data-lens-swatch]').forEach((swatch, i) => {
      swatch.dataset.lensIndex = String(i);
      const panel = swatch.parentElement?.querySelector('[data-lens-panel]');
      if (!panel) return;
      panel.dataset.lensIndex = String(i);
      if (stage) stage.appendChild(panel);
    });

    applyLabels(host);
    if (host.querySelector('[data-lens-swatch]')) activate(host, 0);
  }

  function initAll() {
    document.querySelectorAll(HOST).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }

  // Re-run after a theme-editor block edit re-renders the section.
  document.addEventListener('shopify:section:load', initAll);

  document.addEventListener('click', (e) => {
    const swatch = e.target.closest?.('[data-lens-swatch]');
    if (!swatch) return;
    const host = swatch.closest(HOST);
    if (host) activate(host, Number(swatch.dataset.lensIndex));
  });

  // The range input carries drag, touch and keyboard on its own.
  document.addEventListener('input', (e) => {
    const range = e.target.closest?.('[data-lens-range]');
    if (!range) return;
    setSplit(range.closest('[data-lens-frame]'), range.value);
  });
})();
