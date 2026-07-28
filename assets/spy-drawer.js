// Opens the PDP side drawers (lens tech, fit guide). One listener for the page:
// any [data-spy-drawer-open="id"] opens that drawer, the veil / cross / Escape close it.
(() => {
  const openDrawer = (drawer, trigger) => {
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
