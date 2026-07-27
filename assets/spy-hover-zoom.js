/**
 * PDP hover zoom — magnifies the gallery image in place while the pointer is
 * over it, like the source site. No click, no lightbox.
 *
 * The scale comes from the source: a lens that measures 196px tall normally is
 * 362px tall while zoomed, so ~1.85x. The image is clipped by .product-media
 * (see src/tailwind.css), which lets the zoom grow into the 46px inset and stop
 * at the stage edge.
 */
(function () {
  const ZOOM = 1.85;
  const SELECTOR = '[data-testid="product-information"] .product-media';

  // Desktop pointers only — touch has no hover and mobile shows dots instead.
  const canHover = () => window.matchMedia('(hover: hover) and (min-width: 750px)').matches;

  function imageIn(container) {
    // Images only: video and 3D slides keep their own controls.
    if (container.querySelector('deferred-media, product-model')) return null;
    return container.querySelector('img.product-media__image');
  }

  /** Point under the cursor stays put, so origin is the cursor's % of the image box. */
  function trackOrigin(container, img, event) {
    const box = container.getBoundingClientRect();
    const styles = getComputedStyle(container);
    const padLeft = parseFloat(styles.paddingLeft) || 0;
    const padTop = parseFloat(styles.paddingTop) || 0;

    // offsetWidth/Height are layout values, so they ignore the transform we set.
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    if (!w || !h) return;

    const x = Math.min(Math.max(event.clientX - box.left - padLeft, 0), w);
    const y = Math.min(Math.max(event.clientY - box.top - padTop, 0), h);

    img.style.transformOrigin = `${(x / w) * 100}% ${(y / h) * 100}%`;
  }

  function reset(img) {
    img.style.transform = '';
    img.style.transformOrigin = '';
  }

  function bind(container) {
    if (container.dataset.spyHoverZoom === 'on') return;
    container.dataset.spyHoverZoom = 'on';

    container.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || !canHover()) return;
      const img = imageIn(container);
      if (!img) return;
      trackOrigin(container, img, event);
      img.style.transform = `scale(${ZOOM})`;
    });

    // Also applies the scale, not just the origin: the pointer can already be
    // inside when a variant swap replaces the image, and no enter fires then.
    container.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !canHover()) return;
      const img = imageIn(container);
      if (!img) return;
      trackOrigin(container, img, event);
      if (!img.style.transform) img.style.transform = `scale(${ZOOM})`;
    });

    container.addEventListener('pointerleave', () => {
      const img = imageIn(container);
      if (img) reset(img);
    });
  }

  function bindAll(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(bind);
  }

  function start() {
    bindAll();
    // Variant switches and section re-renders swap the slides out.
    const host = document.querySelector('[data-testid="product-information"]');
    if (!host || !window.MutationObserver) return;
    new MutationObserver(() => bindAll()).observe(host, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
