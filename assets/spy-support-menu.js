(() => {
  'use strict';

  // One delegated setup for every support menu on the page.
  if (window.__spySupportMenuInit) return;
  window.__spySupportMenuInit = true;

  const ROOT = '[data-spy-support-menu]';

  function parts(root) {
    return {
      button: root.querySelector('[data-spy-support-toggle]'),
      panel: root.querySelector('[data-spy-support-panel]'),
    };
  }

  // The panel is hidden with the `hidden` attribute, never a class: Tailwind
  // runs in important mode, so a display utility would win over it.
  function setOpen(root, open) {
    const { button, panel } = parts(root);
    if (!button || !panel) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeAll(except) {
    document.querySelectorAll(ROOT).forEach((root) => {
      if (root !== except) setOpen(root, false);
    });
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-spy-support-toggle]');

    if (toggle) {
      const root = toggle.closest(ROOT);
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      closeAll(root);
      setOpen(root, open);
      return;
    }

    // A click anywhere else — including a row link — closes the menu
    closeAll(null);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const root = event.target.closest(ROOT);
    closeAll(null);
    if (root) {
      const { button } = parts(root);
      if (button) button.focus();
    }
  });

  // Theme editor: open the panel while the editor has the dropdown selected so
  // its settings can be seen live.
  document.addEventListener('shopify:block:select', (event) => {
    const root = event.target.closest(ROOT) || event.target.querySelector?.(ROOT);
    if (root) setOpen(root, true);
  });

  document.addEventListener('shopify:block:deselect', (event) => {
    const root = event.target.closest(ROOT) || event.target.querySelector?.(ROOT);
    if (root) setOpen(root, false);
  });
})();
