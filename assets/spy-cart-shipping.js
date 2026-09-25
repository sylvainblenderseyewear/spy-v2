import { StandardEvents } from '@shopify/events';
import { formatMoney } from '@theme/money-formatting';

/**
 * Cart page shipping estimate, like the source's "Shipping" select.
 * Asks Shopify for real rates at a known address (customer / theme setting / store),
 * fills the select, and adds the chosen rate to the estimated total.
 * Checkout still owns the final choice — this is an estimate only.
 */

const STORAGE_KEY = 'spy-cart-shipping-method';

/** Rates shared by every instance, so a re-rendered summary paints at once */
/** @type {Array<{name: string, price: string, delivery_days?: number[]}> | null} */
let sharedRates = null;
/** @type {Promise<void> | null} */
let pending = null;

function readChoice() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveChoice(/** @type {string} */ name) {
  try {
    sessionStorage.setItem(STORAGE_KEY, name);
  } catch {
    // private mode: keep it in memory only
  }
}

/** @returns {Array<any> | null} */
function readCache(/** @type {string} */ key) {
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
    // Rates rarely change; half an hour keeps a browsing session snappy
    return hit && Date.now() - hit.at < 30 * 60 * 1000 ? hit.rates : null;
  } catch {
    return null;
  }
}

function writeCache(/** @type {string} */ key, /** @type {Array<any>} */ rates) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), rates }));
  } catch {
    // storage full or blocked: just skip the cache
  }
}

class SpyShippingEstimate extends HTMLElement {
  #painting = false;
  /** @type {MutationObserver | null} */
  #observer = null;
  #frame = 0;
  #retried = false;

  connectedCallback() {
    this.addEventListener('change', this.#onChange);
    document.addEventListener(StandardEvents.cartLinesUpdate, this.#onCartUpdate);

    // Section morphs reset the select and the total; repaint after any outside change
    const scope = this.closest('.cart-summary__inner') || this;
    this.#observer = new MutationObserver(() => {
      if (!this.#painting) this.#schedule();
    });
    this.#observer.observe(scope, { childList: true, subtree: true, characterData: true, attributes: true });

    if (sharedRates) this.#schedule();
    this.#load();
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.#onChange);
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#onCartUpdate);
    this.#observer?.disconnect();
    cancelAnimationFrame(this.#frame);
  }

  get #select() {
    return /** @type {HTMLSelectElement | null} */ (this.querySelector('[data-shipping-select]'));
  }

  #schedule() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#render());
  }

  #onChange = (/** @type {Event} */ event) => {
    const select = this.#select;
    if (event.target !== select || !select) return;
    saveChoice(select.value);
    this.#render();
  };

  #onCartUpdate = async (/** @type {any} */ event) => {
    try {
      await event?.detail?.promise;
    } catch {
      // cart errors are shown elsewhere
    }
    // Rates can change with the cart; keep painting the last ones until fresh ones land
    setTimeout(() => this.#load(), 400);
  };

  #load() {
    if (!this.isConnected) return;
    if (!pending) {
      pending = this.#fetchRates().finally(() => {
        pending = null;
      });
    }
    pending.then(() => {
      if (!this.isConnected) return;
      if (!sharedRates && !this.#retried) {
        this.#retried = true;
        setTimeout(() => this.#load(), 3000);
      }
      this.#schedule();
    });
  }

  async #fetchRates() {
    try {
      const root = window.Shopify?.routes?.root || '/';
      const params = new URLSearchParams();
      params.set('shipping_address[country]', this.dataset.country || '');
      params.set('shipping_address[province]', this.dataset.province || '');
      params.set('shipping_address[zip]', this.dataset.zip || '');
      const query = params.toString();
      const cacheKey = `spy-cart-rates:${query}:${this.dataset.total}`;

      // Same address + same cart total = same rates; paint from the session cache first
      const cached = readCache(cacheKey);
      if (cached) {
        sharedRates = cached;
        return;
      }

      // One-shot endpoint answers in ~1s; the prepare + poll pair can take 10s+
      const quick = await fetch(`${root}cart/shipping_rates.json?${query}`).catch(() => null);
      if (quick?.ok) {
        const rates = (await quick.json().catch(() => null))?.shipping_rates;
        if (Array.isArray(rates)) {
          sharedRates = rates;
          writeCache(cacheKey, rates);
          return;
        }
      }
      if (quick?.status === 422) return;

      // Fallback: async calculation. A failed prepare can still leave rates to poll
      await fetch(`${root}cart/prepare_shipping_rates.json?${query}`, { method: 'POST' }).catch(() => {});
      for (let attempt = 0; attempt < 12; attempt++) {
        const response = await fetch(`${root}cart/async_shipping_rates.json?${query}`);
        const text = await response.text();
        if (response.ok && text && text !== 'null') {
          sharedRates = JSON.parse(text).shipping_rates || [];
          writeCache(cacheKey, sharedRates);
          return;
        }
        if (response.status === 422) return;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch {
      // Keep the editor's fallback text when the estimate fails
    }
  }

  #render() {
    const select = this.#select;
    const rates = sharedRates;
    if (!select || !rates || rates.length === 0) return;

    let choice = readChoice();
    if (!rates.some((rate) => rate.name === choice)) choice = rates[0]?.name ?? '';

    this.#painting = true;
    try {
      const current = [...select.options].map((option) => option.value).join('|');
      const wanted = rates.map((rate) => rate.name).join('|');
      if (current !== wanted || !select.querySelector('option[data-rate]')) {
        select.replaceChildren(
          ...rates.map((rate) => {
            const option = document.createElement('option');
            option.value = rate.name;
            option.dataset.rate = rate.price;
            option.textContent = this.#label(rate);
            return option;
          })
        );
      }
      if (select.value !== choice) select.value = choice;

      const rate = rates.find((item) => item.name === choice);
      const shippingCents = rate ? Math.round(parseFloat(rate.price) * 100) || 0 : 0;

      const cost = this.querySelector('[data-shipping-cost]');
      const costText = this.#money(shippingCents);
      if (cost && cost.textContent !== costText) cost.textContent = costText;

      // Estimated total = cart total + chosen rate, as on the source
      const total = this.closest('.cart-summary__inner')?.querySelector('[data-cart-subtotal]');
      const totalText = this.#money((Number(this.dataset.total) || 0) + shippingCents);
      if (total && total.textContent?.trim() !== totalText) {
        total.textContent = totalText;
        total.setAttribute('value', totalText);
      }
    } finally {
      // Let our own mutations flush before listening again
      queueMicrotask(() => {
        this.#painting = false;
      });
    }
  }

  /** @param {{name: string, delivery_days?: number[]}} rate */
  #label(rate) {
    const days = rate.delivery_days || [];
    if (days.length === 0 || rate.name.includes('(')) return rate.name;
    const [min, max] = [days[0], days[days.length - 1]];
    return min === max ? `${rate.name} (${min} days)` : `${rate.name} (${min} to ${max} days)`;
  }

  #money(/** @type {number} */ cents) {
    return formatMoney(cents, this.dataset.moneyFormat || '${{amount}}', this.dataset.currency || 'USD');
  }
}

if (!customElements.get('spy-shipping-estimate')) {
  customElements.define('spy-shipping-estimate', SpyShippingEstimate);
}
