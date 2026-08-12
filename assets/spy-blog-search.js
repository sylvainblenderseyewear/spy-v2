/**
 * Journal keyword search — filters the rendered posts on title, excerpt and tags.
 *
 * The source runs the same search over one AJAX page of 24 posts, so filtering the
 * page we already rendered gives the same result without a round trip. Pagination
 * hides while a keyword is active, because the count no longer describes the list.
 */
(() => {
  'use strict';

  if (window.__spyBlogSearchInit) return;
  window.__spyBlogSearchInit = true;

  const DEBOUNCE_MS = 150;

  function apply(root, query) {
    const term = query.trim().toLowerCase();
    const cards = root.querySelectorAll('[data-spy-blog-card]');
    let shown = 0;

    cards.forEach((card) => {
      const hit = term === '' || (card.dataset.search || '').includes(term);
      card.classList.toggle('hidden', !hit);
      if (hit) shown += 1;
    });

    const empty = root.querySelector('[data-spy-blog-empty]');
    if (empty) empty.classList.toggle('hidden', shown > 0);

    // Page links describe the unfiltered list, so they only make sense at rest
    const pagination = root.querySelector('[data-spy-blog-pagination]');
    if (pagination) pagination.classList.toggle('hidden', term !== '');

    const status = root.querySelector('[data-spy-blog-status]');
    if (status) {
      status.textContent = term === '' ? '' : `${shown} ${shown === 1 ? 'post' : 'posts'} found`;
    }
  }

  // Keep the keyword in the URL so a filtered view can be shared or reloaded
  function syncUrl(query) {
    const url = new URL(window.location.href);
    if (query.trim() === '') {
      url.searchParams.delete('q');
    } else {
      url.searchParams.set('q', query.trim());
    }
    window.history.replaceState({}, '', url);
  }

  function init(root) {
    const input = root.querySelector('[data-spy-blog-search]');
    if (!input || input.dataset.spyBound === 'true') return;
    input.dataset.spyBound = 'true';

    const initial = new URL(window.location.href).searchParams.get('q') || '';
    if (initial) input.value = initial;
    apply(root, input.value);

    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        apply(root, input.value);
        syncUrl(input.value);
      }, DEBOUNCE_MS);
    });

    // The field is not in a form — Enter would otherwise do nothing visible
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(timer);
      apply(root, input.value);
      syncUrl(input.value);
    });
  }

  function initAll() {
    document.querySelectorAll('[data-spy-blog]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Theme editor re-renders the section on every setting change
  document.addEventListener('shopify:section:load', initAll);
})();
