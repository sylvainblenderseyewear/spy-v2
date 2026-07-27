/**
 * PDP hover zoom — magnifies the gallery image in place while the pointer is
 * over it, like the source site. No click, no lightbox.
 *
 * Magnification follows the source instead of a fixed factor: it loads a zoom
 * image at sw=1340 and paints it 1:1, so the zoom is always 1340px wide and the
 * factor falls as the viewport grows (~2.4x at 1440, ~1.6x at 1920). The image is
 * clipped by .product-media (see src/tailwind.css), which lets the zoom grow into
 * the inset and stop at the stage edge.
 */
(function () {
  const ZOOM_TARGET_PX = 1340;
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

  /** Scale that brings the displayed image up to the source's 1340px zoom layer. */
  function scaleFor(img) {
    const w = img.offsetWidth;
    if (!w) return null;
    return Math.max(1, ZOOM_TARGET_PX / w);
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
      const scale = scaleFor(img);
      if (scale) img.style.transform = `scale(${scale})`;
    });

    // Also applies the scale, not just the origin: the pointer can already be
    // inside when a variant swap replaces the image, and no enter fires then.
    container.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !canHover()) return;
      const img = imageIn(container);
      if (!img) return;
      trackOrigin(container, img, event);
      if (!img.style.transform) {
        const scale = scaleFor(img);
        if (scale) img.style.transform = `scale(${scale})`;
      }
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
