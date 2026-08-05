// Cart promo code — hands the typed code to /discount/{code}, which applies it and
// redirects back to the cart. Shopify has no cart-page discount API, so this is the
// route that works without an app.
(() => {
  const EMPTY_MESSAGE = 'No coupon code entered';

  document.addEventListener('submit', (event) => {
    const form = event.target.closest?.('[data-spy-cart-promo]');
    if (!form) return;

    event.preventDefault();

    const input = form.querySelector('.spy-cart-promo__input');
    const error = form.querySelector('.spy-cart-promo__error');
    const code = (input?.value || '').trim();

    if (!code) {
      if (error) {
        error.textContent = EMPTY_MESSAGE;
        error.hidden = false;
      }
      input?.focus();
      return;
    }

    if (error) error.hidden = true;

    // encodeURIComponent so a stray slash or space can't break out of the path
    const target = `${window.Shopify?.routes?.root || '/'}discount/${encodeURIComponent(code)}`;
    window.location.href = `${target}?redirect=/cart`;
  });

  // Clear the error as soon as they start typing again
  document.addEventListener('input', (event) => {
    const input = event.target.closest?.('.spy-cart-promo__input');
    if (!input) return;
    const error = input.closest('[data-spy-cart-promo]')?.querySelector('.spy-cart-promo__error');
    if (error) error.hidden = true;
  });
})();
