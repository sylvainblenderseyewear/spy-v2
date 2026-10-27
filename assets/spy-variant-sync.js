// SPY product-page blocks that print variant data (Ref/frame/lens summary, stock line,
// lens information) don't listen to Horizon's variant events, so after a size or lens
// pick they kept showing the first variant. Horizon's picker already fetches the page for
// the new variant and hands it out on `shopify:product:select`; swap each block for its
// copy in that page, the same way Horizon's own price block updates itself.
(() => {
  'use strict';

  if (window.__spySyncInit) return;
  window.__spySyncInit = true;

  // A lens-information drawer lives on <body> (spy-drawer.js moves it there), so the fresh
  // copy replaces the old one there too.
  const rehomeDrawers = (block) => {
    block.querySelectorAll('[data-spy-drawer]').forEach((drawer) => {
      document.querySelectorAll('[data-spy-drawer]').forEach((old) => {
        if (old !== drawer && old.id === drawer.id) old.remove();
      });
      drawer.inert = true;
      document.body.appendChild(drawer);
    });
  };

  document.addEventListener(
    'shopify:product:select',
    (event) => {
      const section = event.target instanceof Element ? event.target.closest('.shopify-section') : null;
      if (!section || event.target.closest('product-card')) return;

      event.promise
        ?.then(({ detail }) => {
          const html = detail?.html;
          if (!html) return;
          section.querySelectorAll('[data-spy-variant-sync]').forEach((block) => {
            const fresh = html.querySelector(`[data-spy-variant-sync="${CSS.escape(block.dataset.spyVariantSync)}"]`);
            if (!fresh) return;
            const copy = document.importNode(fresh, true);
            // Their scripts are already running on this page
            copy.querySelectorAll('script').forEach((script) => script.remove());
            block.replaceWith(copy);
            rehomeDrawers(copy);
          });
        })
        .catch(() => {});
    },
    true
  );
})();
