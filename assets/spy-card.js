(() => {
  'use strict';

  // Printed once per card; wire the delegated listeners a single time.
  if (window.__spyCardInit) return;
  window.__spyCardInit = true;

  const mainImg = (card) => card.querySelector('.card-gallery img');

  // Top of the title, in viewport coords — used to tell "above" vs "below" the title.
  // The title link is display:contents (no box), so measure its inner text node.
  const titleTop = (card) => {
    const t =
      card.querySelector('[ref="productTitleLink"] p, [ref="productTitleLink"] *') ||
      card.querySelector('.spy-color-count');
    const rect = t && t.getBoundingClientRect();
    return rect && rect.height ? rect.top : card.getBoundingClientRect().bottom;
  };

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
    saveOriginal(img);
    img.setAttribute('srcset', url);
    img.setAttribute('src', url);
  }

  document.addEventListener('pointerover', (e) => {
    const card = e.target.closest?.('product-card');
    if (!card) return;
    card.classList.add('spy-hover');
    card.classList.toggle('spy-above', e.clientY < titleTop(card));
    const item = e.target.closest?.('.spy-swatches__item');
    if (item) swapImage(card, item.getAttribute('data-full'));
  });

  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('product-card');
    if (!card) return;
    card.classList.toggle('spy-above', e.clientY < titleTop(card));
  });

  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('product-card');
    if (!card) return;

    // Left a thumbnail (and not landing on another) → back to the default image
    const item = e.target.closest?.('.spy-swatches__item');
    if (item && !e.relatedTarget?.closest?.('.spy-swatches__item')) {
      restoreImage(card);
    }

    // Left the whole card → reset everything
    if (e.relatedTarget?.closest?.('product-card') !== card) {
      card.classList.remove('spy-hover', 'spy-above');
      restoreImage(card);
    }
  });
})();
