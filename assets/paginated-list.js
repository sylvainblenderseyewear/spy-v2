import { Component } from '@theme/component';
import { sectionRenderer } from '@theme/section-renderer';
import { requestIdleCallback, viewTransition, yieldToMainThread } from '@theme/utilities';
import { PaginatedListAspectRatioHelper } from '@theme/paginated-list-aspect-ratio';
import { StandardEvents } from '@shopify/events';
import { getScrollTop, scrollTo } from '@theme/scroll-container';

/**
 * Ceiling on how many earlier pages a `?page=N` deep link may pull in, so a
 * crafted URL can't fan out into dozens of section requests.
 */
const MAX_BACKFILL_PAGES = 20;

/**
 * A custom element that renders a paginated list of items.
 *
 * @typedef {object} Refs
 * @property {HTMLUListElement} [grid] - The grid element.
 * @property {HTMLSpanElement} [viewMorePrevious] - The view more previous button.
 * @property {HTMLSpanElement} [viewMoreNext] - The view more next button.
 * @property {HTMLAnchorElement} [moreResults] - The "more results" button.
 * @property {HTMLElement[]} [cards] - The cards elements.
 *
 * @extends Component<Refs>
 */
export default class PaginatedList extends Component {
  /**
   * @type {Map<number, string>}
   */
  pages = new Map();

  /** @type {IntersectionObserver | undefined} */
  infinityScrollObserver;

  /** @type {((value: void) => void) | null} */
  #resolveNextPagePromise = null;

  /** @type {((value: void) => void) | null} */
  #resolvePreviousPagePromise = null;

  /** @type {PaginatedListAspectRatioHelper} */
  #aspectRatioHelper;

  connectedCallback() {
    super.connectedCallback();

    /** @type {HTMLElement | null} */
    const templateCard = this.querySelector('[ref="cardGallery"]');
    if (templateCard) {
      this.#aspectRatioHelper = new PaginatedListAspectRatioHelper({
        templateCard,
      });
    }

    this.#backfillPreviousPages();
    this.#fetchPage('next');
    // The backfill covers every earlier page, so skip the prefetch that would
    // otherwise request the page right before this one a second time.
    if (!this.#shouldBackfill()) this.#fetchPage('previous');
    this.#observeViewMore();

    // Listen for filter updates to clear cached pages
    document.addEventListener(StandardEvents.searchUpdate, this.#handleFilterUpdate);
    document.addEventListener(StandardEvents.collectionUpdate, this.#handleFilterUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.infinityScrollObserver) {
      this.infinityScrollObserver.disconnect();
    }
    // Remove the filter update listeners
    document.removeEventListener(StandardEvents.searchUpdate, this.#handleFilterUpdate);
    document.removeEventListener(StandardEvents.collectionUpdate, this.#handleFilterUpdate);
  }

  #observeViewMore() {
    const { viewMorePrevious, viewMoreNext } = this.refs;

    // Return if neither element exists
    if (!viewMorePrevious && !viewMoreNext) return;

    // Create observer if it doesn't exist
    if (!this.infinityScrollObserver) {
      this.infinityScrollObserver = new IntersectionObserver(
        async (entries) => {
          // Wait for any in-progress view transitions to finish
          if (viewTransition.current) await viewTransition.current;

          for (const entry of entries) {
            if (entry.isIntersecting) {
              // Use current refs to check which element triggered
              const { viewMorePrevious, viewMoreNext } = this.refs;

              if (entry.target === viewMorePrevious) {
                this.#renderPreviousPage();
              } else if (entry.target === viewMoreNext) {
                this.#renderNextPage();
              }
            }
          }
        },
        {
          rootMargin: '100px',
        }
      );
    }

    // Observe the view more elements
    if (viewMorePrevious) {
      this.infinityScrollObserver.observe(viewMorePrevious);
    }

    if (viewMoreNext) {
      this.infinityScrollObserver.observe(viewMoreNext);
    }
  }

  /**
   * @param {{ page: number, url?: URL } | undefined} pageInfo - The page info
   * @returns {boolean} Whether to use the page
   */
  #shouldUsePage(pageInfo) {
    if (!pageInfo) return false;

    const { grid } = this.refs;
    const lastPage = grid?.dataset.lastPage;

    if (!lastPage || pageInfo.page < 1 || pageInfo.page > Number(lastPage)) return false;

    return true;
  }

  /**
   * @param {"previous" | "next"} type
   */
  async #fetchPage(type) {
    const page = this.#getPage(type);

    // Always resolve the promise, even if we can't fetch the page
    const resolvePromise = () => {
      if (type === 'next') {
        this.#resolveNextPagePromise?.();
        this.#resolveNextPagePromise = null;
      } else {
        this.#resolvePreviousPagePromise?.();
        this.#resolvePreviousPagePromise = null;
      }
    };

    if (!page || !this.#shouldUsePage(page)) {
      // Resolve the promise even if we can't fetch
      resolvePromise();
      return;
    }

    await this.#fetchSpecificPage(page.page, page.url);
    resolvePromise();
  }

  /**
   * @param {number} pageNumber - The page number to fetch
   * @param {URL} [url] - Optional URL, will be constructed if not provided
   */
  async #fetchSpecificPage(pageNumber, url = undefined) {
    const pageInfo = { page: pageNumber, url };

    if (!url) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('page', pageNumber.toString());
      newUrl.hash = '';
      pageInfo.url = newUrl;
    }

    if (!this.#shouldUsePage(pageInfo)) return;
    const pageContent = await sectionRenderer.getSectionHTML(this.sectionId, true, pageInfo.url);
    this.pages.set(pageNumber, pageContent);
  }

  async #renderNextPage() {
    const { grid } = this.refs;

    if (!grid) return;

    const nextPage = this.#getPage('next');

    if (!nextPage || !this.#shouldUsePage(nextPage)) return;
    let nextPageItemElements = this.#getGridForPage(nextPage.page);

    if (!nextPageItemElements) {
      const promise = new Promise((res) => {
        this.#resolveNextPagePromise = res;
      });

      // Trigger the fetch for this page
      this.#fetchPage('next');

      await promise;
      nextPageItemElements = this.#getGridForPage(nextPage.page);
      if (!nextPageItemElements) return;
    }

    grid.append(...nextPageItemElements);

    // Cards without a gallery ref (grouped PLP) never build the helper
    this.#aspectRatioHelper?.processNewElements();

    await yieldToMainThread();

    history.pushState('', '', nextPage.url.toString());

    requestIdleCallback(() => {
      this.#fetchPage('next');
    });
  }

  async #renderPreviousPage() {
    const { grid } = this.refs;

    if (!grid) return;

    const previousPage = this.#getPage('previous');
    if (!previousPage || !this.#shouldUsePage(previousPage)) return;

    let previousPageItemElements = this.#getGridForPage(previousPage.page);
    if (!previousPageItemElements) {
      const promise = new Promise((res) => {
        this.#resolvePreviousPagePromise = res;
      });

      // Trigger the fetch for this page
      this.#fetchPage('previous');

      await promise;
      previousPageItemElements = this.#getGridForPage(previousPage.page);
      if (!previousPageItemElements) return;
    }

    // Store the current scroll position and height of the first element
    const currentScrollTop = getScrollTop();
    const firstElement = grid.firstElementChild;
    const oldHeight = firstElement ? firstElement.getBoundingClientRect().top + currentScrollTop : 0;

    // Prepend the new elements
    grid.prepend(...previousPageItemElements);

    this.#aspectRatioHelper?.processNewElements();

    // Calculate and adjust scroll position to maintain the same view
    if (firstElement) {
      const newHeight = firstElement.getBoundingClientRect().top + getScrollTop();
      const heightDiff = newHeight - oldHeight;
      scrollTo({
        top: currentScrollTop + heightDiff,
        behavior: 'instant',
      });
    }

    await yieldToMainThread();

    history.pushState('', '', previousPage.url.toString());

    requestIdleCallback(() => {
      this.#fetchPage('previous');
    });
  }

  /**
   * Opt-in via the `backfill-pages` attribute, because a list with numbered
   * pagination wants page 3 to mean page 3 only. Infinite scroll opts out too — it
   * already prepends earlier pages lazily when you scroll up.
   *
   * @returns {boolean} Whether this list backfills earlier pages on load.
   */
  #shouldBackfill() {
    return this.hasAttribute('backfill-pages') && !this.refs.viewMorePrevious;
  }

  /**
   * A `?page=3` deep link only renders page 3, because Liquid hands a template one
   * page at a time — and never more than 50 products, so pages 1-3 can't come from
   * a single request however the section is set up. Fetch the earlier pages and
   * prepend them, so the grid ends up holding pages 1..N: the same list a shopper
   * would have after clicking "More results" their way there. That's what makes the
   * URL "More results" pushes shareable, and lets it survive a reload or a trip to
   * a PDP and back.
   */
  async #backfillPreviousPages() {
    if (!this.#shouldBackfill()) return;

    const { grid, cards } = this.refs;
    if (!grid || !Array.isArray(cards)) return;

    const currentPage = Number(cards[0]?.dataset.page ?? 1);
    const missing = currentPage - 1;
    if (missing < 1) return;

    if (missing > MAX_BACKFILL_PAGES) {
      console.warn(
        `[paginated-list] Skipping backfill of ${missing} pages (max ${MAX_BACKFILL_PAGES}); showing page ${currentPage} only`
      );
      return;
    }

    const pageNumbers = Array.from({ length: missing }, (_, index) => index + 1);
    await Promise.all(pageNumbers.map((page) => this.#fetchSpecificPage(page)));

    // One prepend of the whole run, ascending, so page 1 lands first
    const earlierCards = pageNumbers.flatMap((page) => Array.from(this.#getGridForPage(page) ?? []));
    if (!earlierCards.length) return;

    const scrollTopBefore = getScrollTop();
    const anchor = grid.firstElementChild;
    const anchorTopBefore = anchor ? anchor.getBoundingClientRect().top + scrollTopBefore : 0;

    grid.prepend(...earlierCards);

    this.#aspectRatioHelper?.processNewElements();

    // Only hold the shopper's place if they already had one — a freshly typed
    // `?page=3` stays at the top, so the list reads from the first product.
    if (scrollTopBefore > 0 && anchor) {
      const anchorTopAfter = anchor.getBoundingClientRect().top + getScrollTop();
      scrollTo({ top: scrollTopBefore + (anchorTopAfter - anchorTopBefore), behavior: 'instant' });
    }

    // The section's inline hash scroll ran before these cards existed, so a card
    // anchor from an earlier page had nothing to find. Retry it now.
    const targetId = window.location.hash.slice(1);
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant' });
    }
  }

  /**
   * Appends the next page. Public so a "more results" button can reuse the same
   * path as the infinite-scroll observer.
   */
  async renderNextPage() {
    await this.#renderNextPage();
  }

  /**
   * Click handler for the "more results" button. Loads the next page and drops
   * the button once the last page is on screen. Without JS the button is a plain
   * link to the next page, so it still works.
   *
   * @param {Event} [event]
   */
  async loadMore(event) {
    event?.preventDefault();

    const button = this.refs.moreResults;

    if (!(button instanceof HTMLElement) || button.getAttribute('aria-busy') === 'true') return;

    button.setAttribute('aria-busy', 'true');
    await this.renderNextPage();
    button.removeAttribute('aria-busy');

    // refs can still be pre-append at this point, so count off the grid itself
    const { grid } = this.refs;
    const cards = grid?.querySelectorAll(':scope > [ref="cards[]"]');
    const shown = Number(cards?.[cards.length - 1]?.getAttribute('data-page') ?? 0);
    const lastPage = Number(grid?.dataset.lastPage ?? 0);

    if (shown >= lastPage) {
      // Drop the wrapper too, so its spacing goes with it
      (button.closest('[data-more-results]') ?? button).remove();
    } else if (button instanceof HTMLAnchorElement) {
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(shown + 1));
      url.hash = '';
      button.href = url.toString();
    }
  }

  /**
   * @param {"previous" | "next"} type
   * @returns {{ page: number, url: URL } | undefined}
   */
  #getPage(type) {
    const { cards } = this.refs;
    const isPrevious = type === 'previous';

    if (!Array.isArray(cards)) return;

    const targetCard = cards[isPrevious ? 0 : cards.length - 1];

    if (!targetCard) return;

    const currentCardPage = Number(targetCard.dataset.page);
    const page = isPrevious ? currentCardPage - 1 : currentCardPage + 1;

    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    url.hash = '';

    return {
      page,
      url,
    };
  }

  /**
   * @param {number} page
   * @returns {NodeListOf<Element> | undefined}
   */
  #getGridForPage(page) {
    const pageHTML = this.pages.get(page);

    if (!pageHTML) return;

    const parsedPage = new DOMParser().parseFromString(pageHTML, 'text/html');
    const gridElement = parsedPage.querySelector('[ref="grid"]');
    if (!gridElement) return;
    return gridElement.querySelectorAll(':scope > [ref="cards[]"]');
  }

  get sectionId() {
    const id = this.getAttribute('section-id');

    if (!id) throw new Error('The section-id attribute is required');

    return id;
  }

  /**
   * Handle filter updates by clearing cached pages.
   * Only reacts to events from the same section (ignores e.g. predictive search in the header).
   * @param {Event} event
   */
  #handleFilterUpdate = (event) => {
    const eventSection = /** @type {Element | null} */ (event.target)?.closest('[id^="shopify-section-"]');
    if (eventSection && eventSection.id !== `shopify-section-${this.sectionId}`) return;
    this.pages.clear();

    // Resolve any pending promises to unblock waiting renders
    this.#resolveNextPagePromise?.();
    this.#resolvePreviousPagePromise?.();

    this.#resolveNextPagePromise = null;
    this.#resolvePreviousPagePromise = null;

    // Store the current lastPage value to detect when it changes
    const currentLastPage = this.refs.grid?.dataset.lastPage;

    // We need to wait for the DOM to be updated with the new filtered content
    // Using mutation observer to detect when the grid actually updates
    const observer = new MutationObserver(() => {
      // Check if data-last-page changed
      const newLastPage = this.refs.grid?.dataset.lastPage;

      if (newLastPage !== currentLastPage) {
        observer.disconnect();

        // Check if component is still connected
        if (!this.isConnected) {
          return;
        }

        // Now the DOM has been updated with the new filtered content
        this.#observeViewMore();

        // Fetch the next page
        this.#fetchPage('next');
      }
    });

    // Observe the grid for changes
    const { grid } = this.refs;
    if (grid) {
      observer.observe(grid, {
        attributes: true,
        attributeFilter: ['data-last-page'],
        childList: true, // Also watch for child changes in case the whole grid is replaced
      });

      // Set a timeout as a fallback in case the mutation never fires
      setTimeout(() => {
        if (observer) {
          observer.disconnect();
        }
      }, 3000);
    }
  };
}
