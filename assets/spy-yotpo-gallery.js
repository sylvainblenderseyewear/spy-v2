// Fixes for the Yotpo photo gallery pop-up. Loaded only with the gallery block.
(() => {
  if (window.spyYotpoGallery) return; // the block can render more than once
  window.spyYotpoGallery = true;

  // Yotpo shows its 400px "standard" copy in an 850px box, so photos look soft.
  // The 640px "medium" copy is the biggest one Yotpo keeps.
  const STANDARD = /(\/Account\/\d+\/\d+\/)standard(\.jpg)/;

  const sharpen = (img) => {
    const src = img.getAttribute('src') || '';
    if (!STANDARD.test(src) || img.dataset.spyNoMedium === src) return;
    img.dataset.spyStandard = src;
    if (!img.dataset.spyWatch) {
      img.dataset.spyWatch = '1';
      // Our medium copy failed to load: put Yotpo's own one back
      img.addEventListener('error', () => {
        const back = img.dataset.spyStandard;
        if (back && img.getAttribute('src') === back.replace(STANDARD, '$1medium$2')) {
          img.dataset.spyNoMedium = back;
          img.setAttribute('src', back);
        }
      });
    }
    img.setAttribute('src', src.replace(STANDARD, '$1medium$2'));
  };

  const scan = (node) => {
    if (node.nodeType !== 1) return;
    if (node.matches('img.yotpo-lightbox-image')) sharpen(node);
    node.querySelectorAll('img.yotpo-lightbox-image').forEach(sharpen);
  };

  // Follow the pop-up itself: Yotpo builds it in the gallery, then moves it under <body>
  const watch = (lightbox) => {
    if (lightbox.dataset.spyLightbox) return;
    lightbox.dataset.spyLightbox = '1';
    scan(lightbox);
    // Yotpo swaps the photo on every slide
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') scan(record.target);
        else record.addedNodes.forEach(scan);
      }
    }).observe(lightbox, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
  };

  const findLightboxes = () => document.querySelectorAll('.yotpo-lightbox-wrapper').forEach(watch);

  const start = () => {
    findLightboxes();
    const look = new MutationObserver(findLightboxes);
    look.observe(document.body, { childList: true });
    document.querySelectorAll('.yotpo-pictures-widget').forEach((root) => {
      look.observe(root, { childList: true, subtree: true });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
