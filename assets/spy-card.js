(() => {
  'use strict';

  // Wire the delegated listeners a single time.
  if (window.__spyCardInit) return;
  window.__spyCardInit = true;

  const mainImg = (card) => card.querySelector('.card-gallery img');

  function saveOriginal(img) {
    if (img.dataset.spySaved) return;
    img.dataset.spySaved = '1';
    img.dataset.spySrc = img.getAttribute('src') || '';
    img.dataset.spySrcset = img.getAttribute('srcset') || '';
  }

  function restoreImage(card) {
    const img = mainImg(card);
    if (!img || !img.dataset.spySaved) return;
    if (img.dataset.spySrcset) img.setAttribute('srcset', img.dataset.spySrcset);
    else img.removeAttribute('srcset');
    if (img.dataset.spySrc) img.setAttribute('src', img.dataset.spySrc);
  }

  function swapImage(card, url) {
    const img = mainImg(card);
    if (!img || !url) return;
    // Already showing it — skip, so moving within a thumb doesn't re-fetch
    if (img.getAttribute('src') === url) return;
    saveOriginal(img);
    img.setAttribute('srcset', url);
    img.setAttribute('src', url);
  }

  // Hovering or focusing a colour thumbnail previews that colour on the main image.
  function preview(e) {
    const item = e.target.closest?.('.spy-swatches__item');
    if (!item) return;
    const card = item.closest('product-card');
    if (card) swapImage(card, item.getAttribute('data-full'));
  }

  // The preview lasts while the pointer or focus is anywhere in the thumbnail ROW —
  // the 8px gaps and the arrow count as the row — and ends when it leaves the row.
  // spy-tech-badge.js uses the same rule, so the photo and the stickers change together.
  function leave(e) {
    const row = e.target.closest?.('.spy-swatches');
    if (!row || row.contains(e.relatedTarget)) return;
    const card = row.closest('product-card');
    if (card) restoreImage(card);
  }

  document.addEventListener('pointerover', preview);
  document.addEventListener('focusin', preview);
  document.addEventListener('pointerout', leave);
  document.addEventListener('focusout', leave);
})();
