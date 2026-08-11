// Opens the PDP side drawers (lens tech, fit guide). One listener for the page:
// any [data-spy-drawer-open="id"] opens that drawer, the veil / cross / Escape close it.
(() => {
  // The PDP column is a sticky stacking context, so a fixed drawer left inside it
  // still ranks below the header and gets painted over. Move it to <body>, where
  // its z-index counts page-wide.
  const portal = (drawer) => {
    if (drawer.parentElement === document.body) return;
    // A re-render in the editor would otherwise leave the old copy behind.
    if (drawer.id) {
      document.querySelectorAll('[data-spy-drawer]').forEach((el) => {
        if (el !== drawer && el.id === drawer.id) el.remove();
      });
    }
    document.body.appendChild(drawer);
    // Moving the node drops its pending style, so settle it before the class flips.
    void drawer.offsetWidth;
  };

  const portalAll = () => document.querySelectorAll('[data-spy-drawer]').forEach(portal);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', portalAll);
  } else {
    portalAll();
  }
  document.addEventListener('shopify:section:load', portalAll);

  const openDrawer = (drawer, trigger) => {
    portal(drawer);
    drawer.dataset.open = '';
    drawer.setAttribute('aria-hidden', 'false');
    trigger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    drawer.dataset.opener = trigger?.id || '';
    drawer.querySelector('[data-spy-drawer-close]')?.focus();
  };

  const closeDrawer = (drawer) => {
    delete drawer.dataset.open;
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const opener = drawer.dataset.opener && document.getElementById(drawer.dataset.opener);
    document.querySelectorAll(`[data-spy-drawer-open="${drawer.id}"]`).forEach((t) => t.setAttribute('aria-expanded', 'false'));
    if (opener) opener.focus();
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-spy-drawer-open]');
    if (trigger) {
      const drawer = document.getElementById(trigger.dataset.spyDrawerOpen);
      if (drawer) {
        event.preventDefault();
        openDrawer(drawer, trigger);
      }
      return;
    }

    const closer = event.target.closest('[data-spy-drawer-close]');
    if (closer) {
      const drawer = closer.closest('[data-spy-drawer]');
      if (drawer) closeDrawer(drawer);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('[data-spy-drawer][data-open]').forEach(closeDrawer);
  });
})();
