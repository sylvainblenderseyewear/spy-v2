// "Notify me when back in stock" button (blocks/spy-notify-me.liquid).
// One page-level click listener, so the button still works after the colour
// switch redraws the block. With the app on, it opens the AMP Back in Stock
// popup for the picked variant. If the app never gets ready, it opens our
// small email form instead.

const APP_WAIT_MS = 8000;

/** Resolves with the app's popup once it is ready, or null after APP_WAIT_MS. */
function waitForApp() {
  return new Promise((resolve) => {
    let done = false;
    const finish = (popup) => {
      if (done) return;
      done = true;
      resolve(popup);
    };
    setTimeout(() => finish(null), APP_WAIT_MS);
    const poll = () => {
      if (done) return;
      const popup = window.BIS?.popup;
      // ready only resolves when the app has sold-out variants to show
      if (popup?.ready?.then) popup.ready.then(() => finish(popup));
      else setTimeout(poll, 150);
    };
    poll();
  });
}

/** Opens our email form under the button. */
function openForm(toggle, { focus = true } = {}) {
  const panel = toggle.closest('.spy-notify-me')?.querySelector('.spy-notify-me__panel');
  if (!panel) return;
  toggle.setAttribute('aria-expanded', 'true');
  panel.hidden = false;
  if (focus) panel.querySelector('input[type="email"]')?.focus();
}

/** Puts focus back on our button when the app's popup closes. */
function refocusOnClose(toggle) {
  const frame = document.getElementById('BIS_frame');
  if (!frame) return;
  const observer = new MutationObserver(() => {
    if (getComputedStyle(frame).display !== 'none') return;
    observer.disconnect();
    if (toggle.isConnected) toggle.focus();
  });
  observer.observe(frame, { attributes: true, attributeFilter: ['style'] });
}

async function openApp(toggle) {
  if (toggle.getAttribute('aria-busy') === 'true') return; // already waiting for the app
  toggle.setAttribute('aria-busy', 'true');
  const popup = await waitForApp();
  toggle.removeAttribute('aria-busy');

  // The app only lists variants it sees as sold out. Any other id would
  // leave its first lens picked, so use our form then.
  const variantId = Number(toggle.dataset.variantId);
  const listed = popup?.variants?.some((v) => Number(v.id) === variantId);
  if (!popup || !listed) {
    openForm(toggle);
    return;
  }
  popup.show({ variantId });
  refocusOnClose(toggle);
}

document.addEventListener('click', (event) => {
  const toggle = event.target.closest?.('[data-spy-notify-toggle]');
  if (!toggle) return;
  if (toggle.hasAttribute('data-spy-notify-app')) openApp(toggle);
  else openForm(toggle);
});

// Back from a send (thanks or error): keep the form open
document.querySelectorAll('.spy-notify-me [data-spy-notify-open]').forEach((mark) => {
  const toggle = mark.closest('.spy-notify-me')?.querySelector('[data-spy-notify-toggle]');
  if (toggle) openForm(toggle, { focus: false });
});
