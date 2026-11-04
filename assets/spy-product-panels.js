// PDP Description / Technical Information panels slide open and shut instead of
// snapping. A <details> can't tween its own height, so we drive the body wrapper's
// height, like the mega menu accordions.
//
// The pinned image stops where the product column ends, so a panel opening or closing
// would push it down or pull it up. The image's bottom margin takes the open panels'
// height instead (--spy-panels-open, src/tailwind.css) and slides in step with them,
// so the image stays put.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const PANEL = 'details[data-spy-panel]';
const MAIN = '[data-testid="product-information"]';

/** @param {Element} details */
const bodyOf = (details) => details.querySelector(':scope > [data-spy-panel-body]');

/**
 * How much a panel adds to the column right now.
 * @param {Element} details
 */
const openHeight = (details) => {
  const body = bodyOf(details);
  return details instanceof HTMLDetailsElement && details.open && body ? body.getBoundingClientRect().height : 0;
};

/** The panels beside the pinned image */
const mainPanels = () => [...document.querySelectorAll(`${MAIN} ${PANEL}`)];

/** @param {number} px */
const setStop = (px) => document.documentElement.style.setProperty('--spy-panels-open', `${Math.round(px)}px`);

const watched = new WeakSet();
const resizeWatch = new ResizeObserver(() => sync());

/** Match the margin to the open panels, unless a slide is already moving it */
function sync() {
  const panels = mainPanels();
  if (panels.some((d) => d instanceof HTMLElement && 'animating' in d.dataset)) return;
  setStop(panels.reduce((sum, d) => sum + openHeight(d), 0));
  // A colour switch can bring new panel bodies; watch those too
  for (const d of panels) {
    const body = bodyOf(d);
    if (body && !watched.has(body)) {
      watched.add(body);
      resizeWatch.observe(body);
    }
  }
}

// Panels also open without a click on their header: the lens "Read more" link, a
// colour switch re-render, the theme editor
document.addEventListener('toggle', (event) => {
  if (event.target instanceof Element && event.target.matches(PANEL)) sync();
}, true);
sync();

/**
 * Step 1 of a slide: show the panel and set its start height. No transition starts
 * yet, the height only moves away from auto.
 * @param {HTMLDetailsElement} details
 * @param {boolean} opening
 */
function prepare(details, opening) {
  const body = bodyOf(details);
  // Opening shows the content first so we can measure it. Closing keeps it shown
  // until the end, so data-closing flips the caret back right away.
  if (opening) details.open = true;
  else details.dataset.closing = '';
  if (!(body instanceof HTMLElement)) return { details, body: null, opening, full: 0 };
  const full = body.scrollHeight;
  body.style.height = `${opening ? 0 : full}px`;
  return { details, body, opening, full };
}

/**
 * Step 2: wait for the slide, then hand the height back to the content.
 * @param {ReturnType<typeof prepare>} slide
 * @returns {Promise<void>}
 */
function settle({ details, body, opening }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      body?.removeEventListener('transitionend', onEnd);
      if (body) body.style.height = '';
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
    if (!body) {
      finish();
      return;
    }
    body.addEventListener('transitionend', onEnd);
    setTimeout(finish, 500); // in case transitionend never comes
  });
}

document.addEventListener('click', (event) => {
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
  const beside = details.closest(MAIN) !== null;

  // No slide: switch at once (the shared name closes the other one) and move the
  // margin in the same frame
  if (reduceMotion.matches) {
    details.open = opening;
    if (beside) sync();
    return;
  }

  const others = opening ? group.filter((d) => d !== details && d instanceof HTMLDetailsElement && d.open) : [];
  // Open panels that stay as they are
  const still = beside
    ? mainPanels()
        .filter((d) => d !== details && !others.includes(d))
        .reduce((sum, d) => sum + openHeight(d), 0)
    : 0;

  // Drop the shared name while they move, or the browser snaps the other one shut
  for (const d of group) {
    if (!(d instanceof HTMLElement)) continue;
    d.dataset.animating = '';
    if (name) {
      d.dataset.panelName = name;
      d.removeAttribute('name');
    }
  }

  const slides = [prepare(details, opening), ...others.map((d) => prepare(/** @type {HTMLDetailsElement} */ (d), false))];
  void document.documentElement.offsetHeight; // commit every start height in one go

  // Every end height and the margin are set together with no layout read in between,
  // so all of them start sliding on the same frame and stay in step (Safari too)
  for (const s of slides) if (s.body) s.body.style.height = `${s.opening ? s.full : 0}px`;
  if (beside) setStop(still + (opening ? slides[0].full : 0));

  Promise.all(slides.map(settle)).then(() => {
    for (const d of group) {
      if (!(d instanceof HTMLElement)) continue;
      delete d.dataset.animating;
      if (d.dataset.panelName) {
        d.setAttribute('name', d.dataset.panelName);
        delete d.dataset.panelName;
      }
    }
    sync();
  });
});
