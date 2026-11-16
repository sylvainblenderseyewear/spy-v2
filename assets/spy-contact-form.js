(() => {
  'use strict';

  // One delegated setup for every contact form on the page.
  if (window.__spyContactFormInit) return;
  window.__spyContactFormInit = true;

  const FORM = '[data-spy-contact-form]';
  // Shopify's spam check runs before the post. No page change after this long = failed.
  const SEND_WAIT = 12000;
  // A failed post comes back with only these two filled in by Shopify
  const SHOPIFY_KEEPS = ['contact[email]', 'contact[body]'];
  const DRAFT_TTL = 30 * 60 * 1000;

  /* ---------- errors under each field ---------- */

  function errorBox(field) {
    return field.id ? document.getElementById(`${field.id}-error`) : null;
  }

  function describe(field, id, on) {
    const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter((x) => x && x !== id);
    if (on) ids.push(id);
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  function showError(field, text) {
    const box = errorBox(field);
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
    field.setAttribute('aria-invalid', 'true');
    describe(field, box.id, true);
  }

  function clearError(field) {
    const box = errorBox(field);
    if (!box || box.hidden) return;
    box.hidden = true;
    box.textContent = '';
    field.removeAttribute('aria-invalid');
    describe(field, box.id, false);
  }

  function messageFor(host, field) {
    const v = field.validity;
    if (v.valueMissing) return host.dataset.msgRequired || field.validationMessage;
    if (v.typeMismatch || v.patternMismatch) return host.dataset.msgEmail || field.validationMessage;
    return field.validationMessage;
  }

  function headerOffset() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spy-header-offset')) || 0;
  }

  // Focus without leaving the field under the sticky header
  function focusField(field) {
    if (!field || !field.isConnected) return;
    field.focus({ preventScroll: true });
    const r = field.getBoundingClientRect();
    if (r.top < headerOffset() + 8 || r.bottom > window.innerHeight) field.scrollIntoView({ block: 'center' });
  }

  /* ---------- show / hide groups ---------- */

  // Hiding alone is not enough: a hidden `required` field blocks submit, and a
  // hidden value would still post. Disabling takes it out of both.
  function setShown(el, shown) {
    if (!el) return;
    el.hidden = !shown;
    el.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = !shown;
      if (!shown) clearError(field);
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

  /* ---------- sending state ---------- */

  // hCaptcha parks its picture puzzle off-screen until it needs the shopper
  function challengeOpen() {
    return [...document.querySelectorAll('iframe[src*="hcaptcha"]')].some((frame) => {
      if (!frame.src.includes('frame=challenge')) return false;
      const r = frame.getBoundingClientRect();
      return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && getComputedStyle(frame).visibility !== 'hidden';
    });
  }

  function setBusy(host, busy) {
    const button = host.querySelector('[data-spy-submit]');
    if (!button) return;
    const label = button.querySelector('[data-spy-submit-label]');
    if (label && button.dataset.idleLabel === undefined) button.dataset.idleLabel = label.textContent.trim();
    if (busy) {
      button.setAttribute('aria-busy', 'true');
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-busy');
      button.removeAttribute('aria-disabled');
    }
    if (label) label.textContent = busy ? button.dataset.busyLabel || button.dataset.idleLabel : button.dataset.idleLabel;
  }

  function sendError(host, show) {
    const box = host.querySelector('[data-spy-send-error]');
    if (box) box.textContent = show ? host.dataset.msgFailed || '' : '';
  }

  function failSending(host) {
    stopSending(host);
    sendError(host, true);
  }

  function stopSending(host) {
    clearTimeout(host._sendTimer);
    if (host._onLeave) window.removeEventListener('beforeunload', host._onLeave);
    host._onLeave = null;
    delete host.dataset.sending;
    setBusy(host, false);
  }

  function startSending(host) {
    stopSending(host);
    sendError(host, false);
    host.dataset.sending = 'true';
    setBusy(host, true);

    // Page is leaving = the post went out. Still here a minute later = it was stopped.
    // Only added while sending, so the page can still use the back/forward cache.
    host._onLeave = () => {
      clearTimeout(host._sendTimer);
      host._sendTimer = setTimeout(() => failSending(host), 60000);
    };
    window.addEventListener('beforeunload', host._onLeave);

    // Shopify's script only logs a failed check to the console, so time it out here
    const check = () => {
      if (challengeOpen()) {
        host._sendTimer = setTimeout(check, 3000);
        return;
      }
      failSending(host);
    };
    host._sendTimer = setTimeout(check, SEND_WAIT);
  }

  /* ---------- keep the answers through a failed post ---------- */

  function draftStore() {
    try {
      return window.sessionStorage;
    } catch (e) {
      return null; // storage blocked: nothing to keep
    }
  }

  function draftKey(host) {
    const form = host.querySelector('form');
    return form && form.id ? `spy-contact:${form.id}` : '';
  }

  function saveDraft(host) {
    const store = draftStore();
    const key = draftKey(host);
    if (!store || !key) return;
    const fields = {};
    host.querySelectorAll('input, select, textarea').forEach((el) => {
      if (!el.id || el.disabled || el.type === 'hidden' || el.type === 'file') return;
      if (SHOPIFY_KEEPS.includes(el.name)) return;
      fields[el.id] = el.type === 'radio' || el.type === 'checkbox' ? el.checked : el.value;
    });
    try {
      store.setItem(key, JSON.stringify({ at: Date.now(), fields }));
    } catch (e) {
      // storage full or blocked: the form still posts
    }
  }

  function restoreDraft(host) {
    const store = draftStore();
    const key = draftKey(host);
    if (!store || !key) return;
    let draft = null;
    try {
      draft = JSON.parse(store.getItem(key) || 'null');
      store.removeItem(key);
    } catch (e) {
      return;
    }
    if (!draft || !draft.fields || Date.now() - draft.at > DRAFT_TTL) return;
    // Only a failed post comes back with the error box
    if (!host.querySelector('[data-spy-contact-status="error"]')) return;
    Object.entries(draft.fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (!el || !host.contains(el)) return;
      if (el.type === 'radio' || el.type === 'checkbox') el.checked = value === true;
      else el.value = value;
    });
  }

  /* ---------- after Shopify's reply ---------- */

  // The reply lands on the form's #id. When parsing ends, the browser's own jump
  // to that #id moves focus to the page (the form can't take focus), so take it back once.
  function showStatus(host) {
    const box = host.querySelector('[data-spy-contact-status]');
    if (!box) return;
    const form = host.querySelector('form');
    if (form) form.scrollIntoView({ block: 'start' });
    box.focus({ preventScroll: true });
    const until = Date.now() + 3000;
    box.addEventListener(
      'focusout',
      (e) => {
        if (!e.relatedTarget && Date.now() < until) setTimeout(() => box.focus({ preventScroll: true }), 0);
      },
      { once: true }
    );
  }

  /* ---------- events ---------- */

  document.addEventListener('change', (e) => {
    const host = e.target.closest?.(FORM);
    if (!host) return;
    if (e.target.closest('[data-spy-audience], [data-spy-b2b], [data-spy-topic]')) sync(host);
    if (e.target.matches('[data-spy-first], [data-spy-last]')) syncFullName(host);
    if (e.target.validity?.valid) clearError(e.target);
  });

  document.addEventListener('input', (e) => {
    const host = e.target.closest?.(FORM);
    if (!host) return;
    if (e.target.matches('[data-spy-first], [data-spy-last]')) syncFullName(host);
    if (e.target.validity?.valid) clearError(e.target);
  });

  // Show the reason under the field instead of the browser bubble
  document.addEventListener(
    'invalid',
    (e) => {
      const field = e.target;
      const host = field.closest?.(FORM);
      if (!host) return;
      e.preventDefault();
      showError(field, messageFor(host, field));
      // The browser checks every field in one go: focus the first one, after the pass
      if (host._firstInvalid) return;
      host._firstInvalid = field;
      setTimeout(() => {
        const first = host._firstInvalid;
        host._firstInvalid = null;
        focusField(first);
      }, 0);
    },
    true
  );

  // Capture runs before Shopify's own submit handler, so a second click never reaches it
  document.addEventListener(
    'submit',
    (e) => {
      const host = e.target.closest?.(FORM);
      if (!host) return;
      if (host.dataset.sending === 'true') {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      syncFullName(host);
      saveDraft(host);
      startSending(host);
    },
    true
  );

  // Back from the next page: the back/forward cache keeps the "Sending…" state
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.querySelectorAll(FORM).forEach((host) => stopSending(host));
  });

  function init() {
    document.querySelectorAll(FORM).forEach((host) => {
      restoreDraft(host);
      sync(host);
      syncFullName(host);
      showStatus(host);
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
