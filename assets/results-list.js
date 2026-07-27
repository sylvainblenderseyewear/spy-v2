import PaginatedList from '@theme/paginated-list';

/**
 * A custom element that renders a pagniated results list
 */
export default class ResultsList extends PaginatedList {
  connectedCallback() {
    super.connectedCallback();

    this.setAttribute('initialized', '');
  }
}

if (!customElements.get('results-list')) {
  customElements.define('results-list', ResultsList);
}
