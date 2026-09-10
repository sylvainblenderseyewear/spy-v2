/*
  Promo banners have no Shopify standard event, so the theme announces them itself.

  <spy-promotion> watches its parent element and publishes once when the banner
  scrolls into view, then again if someone clicks it. The pixel maps these to
  GA4 view_promotion / select_promotion.
*/
(function () {
  if (customElements.get('spy-promotion')) return;

  class SpyPromotion extends HTMLElement {
    connectedCallback() {
      const banner = this.parentElement;
      if (!banner || this.observer) return;

      // Quarter visible is enough — heroes can be taller than the viewport.
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.publish('custom_view_promotion');
            this.stopWatching();
          }
        },
        { threshold: 0.25 }
      );
      this.observer.observe(banner);

      // Most banners are a link, so a click means the promo did its job.
      this.handleClick = () => this.publish('custom_select_promotion');
      banner.addEventListener('click', this.handleClick);
    }

    disconnectedCallback() {
      this.stopWatching();
      if (this.handleClick && this.parentElement) {
        this.parentElement.removeEventListener('click', this.handleClick);
      }
    }

    stopWatching() {
      if (!this.observer) return;
      this.observer.disconnect();
      this.observer = null;
    }

    publish(eventName) {
      const analytics = window.Shopify && window.Shopify.analytics;
      if (!analytics || typeof analytics.publish !== 'function') return;

      analytics.publish(eventName, {
        promotion_id: this.dataset.promotionId || '',
        promotion_name: this.dataset.promotionName || '',
        creative_slot: this.dataset.creativeSlot || '',
        location_id: window.location.pathname,
      });
    }
  }

  customElements.define('spy-promotion', SpyPromotion);
})();
