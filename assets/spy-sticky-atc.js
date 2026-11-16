(() => {
  'use strict';

  if (window.__spyStickyAtcInit) return;
  window.__spyStickyAtcInit = true;

  let queued = false;

  const findAnchor = (bar) => {
    const section = bar.closest('.shopify-section') || document;
    return section.querySelector('.buy-buttons-block');
  };

  const setVisible = (bar, show) => {
    if ((bar.dataset.visible === 'true') === show) return;
    bar.dataset.visible = show ? 'true' : 'false';
    bar.setAttribute('aria-hidden', show ? 'false' : 'true');
  };

  const update = () => {
    queued = false;
    document.querySelectorAll('[data-spy-sticky-atc]').forEach((bar) => {
      const anchor = findAnchor(bar);
      if (!anchor) {
        setVisible(bar, false);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setVisible(bar, rect.bottom < 0);
    });
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  document.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('shopify:section:load', schedule);
  document.addEventListener('shopify:product:select', schedule);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-spy-sticky-atc-button]');
    if (!trigger || trigger.disabled) return;

    const bar = trigger.closest('[data-spy-sticky-atc]');
    const anchor = bar && findAnchor(bar);
    const button = anchor && anchor.querySelector('.add-to-cart-button:not([disabled])');
    if (!button) return;

    event.preventDefault();
    button.click();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
