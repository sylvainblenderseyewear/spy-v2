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

  // Yotpo still tags these photos with the old site's 2020 products, so each one
  // shows a placeholder and links to the old site. Send it to the model's page here,
  // or hide it when we don't sell that model. Drop this once Yotpo is re-tagged.
  const ROOT = window.Shopify?.routes?.root || '/';
  const models = new Map();
  let productsOn = false;

  // "Marauder Snow Goggle" -> "marauder", the model collection's handle
  const toHandle = (name) =>
    name
      .toLowerCase()
      .replace(/\b(?:snow|mx|moto)?\s*goggles?\b/g, ' ')
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // First product of the model collection, or null when there is none
  const findModel = (handle) => {
    if (!models.has(handle)) {
      const lookup = fetch(`${ROOT}collections/${handle}/products.json?limit=1`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const product = data?.products?.[0];
          if (!product) return null;
          const image = product.images?.[0]?.src || '';
          return {
            url: `${ROOT}products/${product.handle}`,
            image: image && `${image}${image.includes('?') ? '&' : '?'}width=360`,
          };
        })
        .catch(() => null);
      models.set(handle, lookup);
    }
    return models.get(handle);
  };

  // Cards being looked up. Not an attribute: a clone made mid-lookup must get its own turn
  const busy = new WeakSet();

  const fixProduct = async (card) => {
    if (card.dataset.spyProduct || busy.has(card)) return;
    busy.add(card);
    const name = card.querySelector('.yotpo-lightbox-product-name')?.textContent.trim() || '';
    const handle = toHandle(name);
    const model = handle ? await findModel(handle) : null;
    if (!model) {
      card.dataset.spyProduct = 'none'; // stays hidden by CSS
      return;
    }
    // Yotpo clones these cards into the visible pop-up, so keep everything in attributes
    card.dataset.spyUrl = model.url;
    card.querySelectorAll('a').forEach((link) => {
      link.href = model.url;
      link.removeAttribute('target');
    });
    card.querySelector('.yotpo-lightbox-product-button')?.removeAttribute('onclick');
    const img = card.querySelector('.yotpo-lightbox-product-main-image');
    if (img && model.image) {
      img.setAttribute('data-src', model.image);
      img.setAttribute('src', model.image);
      img.alt = name;
    }
    card.dataset.spyProduct = 'ok';
  };

  const fixProducts = (node) => {
    if (!productsOn || node.nodeType !== 1) return;
    if (node.matches('.yotpo-lightbox-product')) fixProduct(node);
    node.querySelectorAll('.yotpo-lightbox-product').forEach(fixProduct);
  };

  const scan = (node) => {
    if (node.nodeType !== 1) return;
    if (node.matches('img.yotpo-lightbox-image')) sharpen(node);
    node.querySelectorAll('img.yotpo-lightbox-image').forEach(sharpen);
    fixProducts(node);
  };

  // Look products up only once a shopper reaches for the gallery, not on every page view
  const productsWanted = () => {
    if (productsOn) return;
    productsOn = true;
    document.querySelectorAll('.yotpo-lightbox-wrapper').forEach(fixProducts);
  };

  // Cloned cards lose their listeners, so one listener serves every Buy Now
  document.addEventListener(
    'click',
    (event) => {
      const url = event.target.closest?.('.yotpo-lightbox-product-button')?.closest('[data-spy-url]')?.dataset.spyUrl;
      if (!url) return;
      // Keep Yotpo's own handlers from opening the old site as well
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = url;
    },
    true
  );

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
      ['pointerover', 'focusin', 'touchstart'].forEach((type) =>
        root.addEventListener(type, productsWanted, { once: true, passive: true })
      );
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
