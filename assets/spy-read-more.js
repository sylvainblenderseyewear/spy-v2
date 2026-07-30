(() => {
  'use strict';

  // One listener for every intro on the page.
  if (window.__spyReadMoreInit) return;
  window.__spyReadMoreInit = true;

  function toggle(host, open) {
    host.querySelectorAll('[data-preview]').forEach((el) => {
      el.hidden = open;
    });
    host.querySelectorAll('[data-full]').forEach((el) => {
      el.hidden = !open;
    });
    host.querySelectorAll('[data-less]').forEach((el) => {
      el.hidden = !open;
    });
    host.querySelectorAll('[data-more], [data-less]').forEach((btn) => {
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-more], [data-less]');
    if (!btn) return;

    const host = btn.closest('[data-spy-read-more]');
    if (!host) return;

    const open = btn.hasAttribute('data-more');
    toggle(host, open);

    // Keep focus on the control the reader is using
    const next = host.querySelector(open ? '[data-less]' : '[data-more]');
    next?.focus();
  });
})();
