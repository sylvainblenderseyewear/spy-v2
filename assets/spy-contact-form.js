(() => {
  'use strict';

  // One delegated setup for every contact form on the page.
  if (window.__spyContactFormInit) return;
  window.__spyContactFormInit = true;

  const FORM = '[data-spy-contact-form]';

  // Hiding alone is not enough: a hidden `required` field blocks submit, and a
  // hidden value would still post. Disabling takes it out of both.
  function setShown(el, shown) {
    if (!el) return;
    el.hidden = !shown;
    el.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = !shown;
      if (field.hasAttribute('data-spy-require-when-shown')) {
        if (shown) {
          field.setAttribute('required', '');
          field.setAttribute('aria-required', 'true');
        } else {
          field.removeAttribute('required');
          field.removeAttribute('aria-required');
        }
      }
    });
  }

  function checkedValue(host, selector) {
    const hit = host.querySelector(`${selector}:checked`);
    return hit ? hit.dataset : null;
  }

  function sync(host) {
    const audience = checkedValue(host, '[data-spy-audience]');
    const isBusiness = audience ? audience.spyAudience === 'business' : false;

    const accountGroup = host.querySelector('[data-spy-b2b-account]');
    setShown(accountGroup, isBusiness);

    // Radios only mean anything once the group is visible
    const account = isBusiness ? checkedValue(host, '[data-spy-b2b]') : null;
    const hasAccount = account ? account.spyB2b === 'yes' : false;

    setShown(host.querySelector('[data-spy-b2b-message]'), hasAccount);
    setShown(host.querySelector('[data-spy-fields]'), !hasAccount);

    // Company and country belong to the business path only
    host.querySelectorAll('[data-spy-b2b-only]').forEach((el) => {
      setShown(el, isBusiness && !hasAccount);
    });

    if (hasAccount) return;

    const topic = host.querySelector('[data-spy-topic]');
    const picked = topic && topic.selectedIndex >= 0 ? topic.options[topic.selectedIndex] : null;
    const subId = picked ? picked.dataset.sub : null;

    host.querySelectorAll('[data-spy-sub]').forEach((panel) => {
      setShown(panel, Boolean(subId) && panel.dataset.spySub === subId);
    });

    setShown(host.querySelector('[data-spy-order]'), Boolean(picked) && picked.dataset.showOrder === 'true');
  }

  // Shopify names the sender from contact[name]
  function syncFullName(host) {
    const target = host.querySelector('[data-spy-fullname]');
    if (!target) return;
    const first = host.querySelector('[data-spy-first]');
    const last = host.querySelector('[data-spy-last]');
    target.value = [first && first.value, last && last.value].filter(Boolean).join(' ').trim();
  }

  document.addEventListener('change', (e) => {
    const host = e.target.closest?.(FORM);
    if (!host) return;
    if (e.target.closest('[data-spy-audience], [data-spy-b2b], [data-spy-topic]')) sync(host);
    if (e.target.matches('[data-spy-first], [data-spy-last]')) syncFullName(host);
  });

  document.addEventListener('input', (e) => {
    if (!e.target.matches?.('[data-spy-first], [data-spy-last]')) return;
    const host = e.target.closest(FORM);
    if (host) syncFullName(host);
  });

  document.addEventListener('submit', (e) => {
    const host = e.target.closest?.(FORM);
    if (host) syncFullName(host);
  });

  function init() {
    document.querySelectorAll(FORM).forEach((host) => {
      sync(host);
      syncFullName(host);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Theme editor re-renders blocks without a page load
  document.addEventListener('shopify:section:load', init);
  document.addEventListener('shopify:block:select', init);
})();
