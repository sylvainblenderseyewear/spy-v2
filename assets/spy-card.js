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

  // Hovering a colour thumbnail previews that colour on the main image.
  document.addEventListener('pointerover', (e) => {
    const item = e.target.closest?.('.spy-swatches__item');
    if (!item) return;
    const card = item.closest('product-card');
    if (card) swapImage(card, item.getAttribute('data-full'));
  });

  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('product-card');
    if (!card) return;

    // Left the thumbnail ROW → back to the default image.
    // Testing the row, not the individual thumb, on purpose: the thumbs sit 8px
    // apart, and that gap is not a thumb. Testing `.spy-swatches__item` here made
    // every move between two colours restore-then-swap, so the image flashed back
    // to the default between each one.
    const item = e.target.closest?.('.spy-swatches__item');
    if (item && !e.relatedTarget?.closest?.('.spy-swatches')) {
      restoreImage(card);
    }

    // Left the whole card → reset
    if (e.relatedTarget?.closest?.('product-card') !== card) {
      restoreImage(card);
    }
  });
})();
