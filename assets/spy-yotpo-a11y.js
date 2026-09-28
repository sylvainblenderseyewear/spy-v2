// Repairs Yotpo's own widget markup so it passes WCAG checks (4.1.2 / 1.3.1).
// Yotpo builds its widgets after load, so fix on every change it makes. Loaded by spy-app-embed.
(() => {
  if (window.spyYotpoA11y) return;
  window.spyYotpoA11y = true;

  const fix = () => {
    // "Write a review" is a plain button, not a tab: there is no tablist around it
    document.querySelectorAll('.yotpo [role="tab"]').forEach((el) => {
      if (!el.closest('[role="tablist"]')) el.removeAttribute('role');
    });
    // aria-level only means something on a heading ("1 Review", reviewer names)
    document.querySelectorAll('.yotpo [aria-level]:not([role="heading"])').forEach((el) => el.removeAttribute('aria-level'));
    // "Verified Buyer" is marked as a heading with no level; it is only a label
    document.querySelectorAll('.yotpo [role="heading"]:not([aria-level])').forEach((el) => el.removeAttribute('role'));
    // An empty decorative span announced as a text field
    document.querySelectorAll('.yotpo [role="textbox"]:not([contenteditable]):not([aria-label])').forEach((el) => {
      if (!el.textContent.trim()) el.removeAttribute('role');
    });
  };

  // Batch Yotpo's DOM bursts into one pass per frame; attribute edits don't retrigger childList
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fix();
    });
  }).observe(document.body, { childList: true, subtree: true });
  fix();
})();
