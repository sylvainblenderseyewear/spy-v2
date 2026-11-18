import { morphSection } from '@theme/section-renderer';
import { fetchConfig } from '@theme/utilities';
import { CartDiscountUpdateEvent, CartErrorEvent } from '@shopify/events';

const FORM = '[data-spy-cart-promo]';

const parts = (form) => ({
  input: form.querySelector('.spy-cart-promo__input'),
  button: form.querySelector('.spy-cart-promo__apply'),
  error: form.querySelector('.spy-cart-promo__error'),
});

const showError = (form, message) => {
  const { input, error } = parts(form);
  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
  input?.setAttribute('aria-invalid', 'true');
};

const clearError = (form) => {
  const { input, error } = parts(form);
  if (error) error.hidden = true;
  input?.removeAttribute('aria-invalid');
};

const setBusy = (form, busy) => {
  const { button } = parts(form);
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('aria-busy');
  }
};

const appliedCodes = (form) =>
  (form.dataset.appliedCodes || '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);

const rejected = (data, code) =>
  (data.discount_codes || []).some(
    (discount) => discount.code.toLowerCase() === code.toLowerCase() && discount.applicable === false
  );

const apply = async (form) => {
  const { input } = parts(form);
  const code = (input?.value || '').trim();

  if (!code) {
    showError(form, form.dataset.emptyMessage || '');
    input?.focus();
    return;
  }

  clearError(form);
  setBusy(form, true);

  const sectionId = form.dataset.sectionId;
  const existing = appliedCodes(form);
  const codes = existing.includes(code) ? existing : [...existing, code];
  const deferred = CartDiscountUpdateEvent.createPromise();

  form.dispatchEvent(
    new CartDiscountUpdateEvent({
      discountCodes: codes.map((value) => ({ code: value })),
      promise: deferred.promise,
    })
  );

  try {
    const body = { discount: codes.join(',') };
    if (sectionId) body.sections = [sectionId];

    const response = await fetch(Theme.routes.cart_update_url, fetchConfig('json', { body: JSON.stringify(body) }));
    const data = await response.json();

    deferred.resolve({ cart: CartDiscountUpdateEvent.createCartFromAjaxResponse(data) });

    if (!response.ok || rejected(data, code)) {
      showError(form, form.dataset.errorMessage || '');
      input?.select();
      form.dispatchEvent(
        new CartErrorEvent({ error: form.dataset.errorMessage || '', code: 'VALIDATION_CUSTOM' })
      );
      return;
    }

    if (input) input.value = '';

    const html = sectionId && data.sections ? data.sections[sectionId] : null;
    if (html) {
      morphSection(sectionId, html);
    } else {
      window.location.reload();
    }
  } catch (error) {
    deferred.reject(error);
    showError(form, form.dataset.errorMessage || '');
    form.dispatchEvent(
      new CartErrorEvent({ error: error?.message || form.dataset.errorMessage || '', code: 'SERVICE_UNAVAILABLE' })
    );
  } finally {
    setBusy(form, false);
  }
};

document.addEventListener('submit', (event) => {
  const form = event.target.closest?.(FORM);
  if (!form) return;
  event.preventDefault();
  apply(form);
});

document.addEventListener('input', (event) => {
  const input = event.target.closest?.('.spy-cart-promo__input');
  const form = input?.closest(FORM);
  if (form) clearError(form);
});
