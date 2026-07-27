(() => {
  'use strict';

  // The block prints this tag on every card, so only wire up once.
  if (window.__spyTechBadgeInit) return;
  window.__spyTechBadgeInit = true;

  const esc = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v);

  function badgeOf(node) {
    return node.closest('product-card')?.querySelector('spy-tech-badge') || null;
  }

  function currentSlot(badge) {
    return badge.querySelector('[data-tech-current]');
  }

  // Remember the resting markup the first time we touch a card.
  function ensureDefault(badge) {
    if (badge.__defaultHTML == null) {
      badge.__defaultHTML = currentSlot(badge)?.innerHTML ?? '';
    }
  }

  // Badge markup stored for one colour swatch. The store lives inside the badge on
  // the variant card and next to the thumbnails on the grouped one, so look card-wide.
  function keyHTML(badge, id) {
    const scope = badge.closest('product-card') || badge;
    const store = scope.querySelector('template[data-tech-store]');
    const node = store?.content.querySelector(`[data-tech-key="${esc(id)}"]`);
    return node ? node.innerHTML : null;
  }

  function preview(badge, id) {
    ensureDefault(badge);
    const html = keyHTML(badge, id);
    const slot = currentSlot(badge);
    if (html != null && slot) slot.innerHTML = html;
  }

  function restore(badge) {
    const slot = currentSlot(badge);
    if (slot && badge.__defaultHTML != null) slot.innerHTML = badge.__defaultHTML;
  }

  // Picking a swatch makes its badges the new resting state.
  function commit(badge, id) {
    ensureDefault(badge);
    const html = keyHTML(badge, id);
    if (html != null) badge.__defaultHTML = html;
    restore(badge);
  }

  function ovId(li) {
    return li.querySelector('input[data-option-value-id]')?.getAttribute('data-option-value-id') || null;
  }

  // Two kinds of swatch: a variant option on the standard card, keyed by its option
  // value, and a colourway thumbnail on the grouped card, keyed by product id.
  function swatchFrom(target) {
    const option = target.closest?.('.variant-option__swatch');
    if (option) return { el: option, id: ovId(option) };

    const thumb = target.closest?.('[data-tech-key]');
    if (thumb) return { el: thumb, id: thumb.getAttribute('data-tech-key') };

    return null;
  }

  document.addEventListener('pointerover', (e) => {
    const swatch = swatchFrom(e.target);
    if (!swatch?.id) return;
    const badge = badgeOf(swatch.el);
    if (badge) preview(badge, swatch.id);
  });

  document.addEventListener('pointerout', (e) => {
    const swatch = swatchFrom(e.target);
    if (!swatch) return;
    // Ignore moves between children of the same swatch
    if (e.relatedTarget && swatch.el.contains(e.relatedTarget)) return;
    const badge = badgeOf(swatch.el);
    if (badge) restore(badge);
  });

  document.addEventListener('change', (e) => {
    const input = e.target.closest?.('input[data-option-value-id]');
    if (!input) return;
    const badge = badgeOf(input);
    const id = input.getAttribute('data-option-value-id');
    if (badge && id) commit(badge, id);
  });
})();
