// PDP Description / Technical Information panels slide open and shut instead of
// snapping. A <details> can't tween its own height, so we drive the body wrapper's
// height, like the mega menu accordions. Reduced motion keeps the instant toggle.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const PANEL = 'details[data-spy-panel]';

/**
 * Slides one panel open or shut.
 * @param {HTMLDetailsElement} details
 * @param {boolean} opening
 * @returns {Promise<void>}
 */
function slide(details, opening) {
  return new Promise((resolve) => {
    const body = details.querySelector(':scope > [data-spy-panel-body]');
    if (!(body instanceof HTMLElement)) {
      details.open = opening;
      resolve();
      return;
    }

    // Opening shows the content first so we can measure it. Closing keeps it shown
    // until the end, so data-closing flips the caret back right away.
    if (opening) details.open = true;
    else details.dataset.closing = '';

    const full = body.scrollHeight;
    body.style.height = `${opening ? 0 : full}px`;
    void body.offsetHeight; // commit the start height, so the next one transitions
    body.style.height = `${opening ? full : 0}px`;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      body.removeEventListener('transitionend', onEnd);
      body.style.height = '';
      if (!opening) {
        details.open = false;
        delete details.dataset.closing;
      }
      resolve();
    };
    /** @param {TransitionEvent} event */
    const onEnd = (event) => {
      if (event.target === body && event.propertyName === 'height') finish();
    };
    body.addEventListener('transitionend', onEnd);
    setTimeout(finish, 500); // in case transitionend never comes
  });
}

document.addEventListener('click', (event) => {
  if (reduceMotion.matches) return;
  const summary = event.target instanceof Element ? event.target.closest(`${PANEL} > summary`) : null;
  const details = summary?.parentElement;
  if (!(details instanceof HTMLDetailsElement)) return;
  event.preventDefault();

  // Panels that share a name are one accordion: opening one closes the other
  const name = details.getAttribute('name') || details.dataset.panelName || '';
  const group = name
    ? [...document.querySelectorAll(PANEL)].filter((d) => (d.getAttribute('name') || d.dataset.panelName) === name)
    : [details];
  if (group.some((d) => 'animating' in d.dataset)) return;

  const opening = !details.open;
  const others = opening ? group.filter((d) => d !== details && d instanceof HTMLDetailsElement && d.open) : [];

  // Drop the shared name while they move, or the browser snaps the other one shut
  for (const d of group) {
    if (!(d instanceof HTMLElement)) continue;
    d.dataset.animating = '';
    if (name) {
      d.dataset.panelName = name;
      d.removeAttribute('name');
    }
  }

  const moves = [slide(details, opening), ...others.map((d) => slide(/** @type {HTMLDetailsElement} */ (d), false))];
  Promise.all(moves).then(() => {
    for (const d of group) {
      if (!(d instanceof HTMLElement)) continue;
      delete d.dataset.animating;
      if (d.dataset.panelName) {
        d.setAttribute('name', d.dataset.panelName);
        delete d.dataset.panelName;
      }
    }
  });
});
