import { Component } from '@theme/component';

/** Word/Docs bullet glyphs, plus the nbsp run each one is padded with. */
const WORD_BULLET = /^[\s ]*[•●▪◦‣·][\s ]*/;

/** A faked indent: padding, then any marker the paste left behind as plain text. */
const FAKE_INDENT = /^[\s ]{2,}(?:[•●▪◦‣·]|\d+\.|[a-z]\.)?[\s ]*/;

/**
 * A custom element that formats rte content for easier styling
 */
class RTEFormatter extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.querySelectorAll('table').forEach(this.#formatTable);

    // Opt-in: pasted legal copy that lost its list markup and indents
    if (this.hasAttribute('word-bullets')) {
      this.#splitAtBreaks();
      this.#formatWordBullets();
      this.#collapsePadding();
      // Indent widths depend on the real font, so wait for it
      document.fonts.ready.then(() => this.#hangFakeIndents());
    }
  }

  /**
   * The paste packed several faked list items into one paragraph, split by line
   * breaks. Each of those lines carries its own indent, so give each one its own
   * paragraph before anything tries to read that indent.
   */
  #splitAtBreaks() {
    for (const paragraph of this.#textBlocks()) {
      // Blank paragraphs are the spacing between blocks — leave them alone
      if (!paragraph.textContent?.trim()) continue;

      let current = paragraph;

      for (let br = current.querySelector('br'); br; br = current.querySelector('br')) {
        if (!current.lastChild) break;

        const range = document.createRange();
        range.setStartAfter(br);
        range.setEndAfter(current.lastChild);
        const tail = range.extractContents();
        br.remove();

        if (!tail.textContent?.trim()) break;

        const next = document.createElement(current.tagName);
        next.className = current.className;
        const style = current.getAttribute('style');
        if (style) next.setAttribute('style', style);
        next.appendChild(tail);
        current.after(next);
        current = next;
      }
    }
  }

  /**
   * The paste used long runs of non-breaking spaces to line copy up in columns.
   * They never collapse, so they fling whatever follows out to the right margin.
   * Cut them back to a single space — the leading run stays, since it is the
   * indent and #hangFakeIndents still has to measure it.
   */
  #collapsePadding() {
    for (const block of this.#textBlocks()) {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      let first = true;
      let node;

      while ((node = /** @type {Text} */ (walker.nextNode()))) {
        const value = node.nodeValue ?? '';
        const lead = first ? (value.match(/^[\s ]+/)?.[0] ?? '') : '';
        first = false;

        const rest = value.slice(lead.length).replace(/[\s ]{3,}/g, ' ');
        if (lead + rest !== value) node.nodeValue = lead + rest;
      }
    }
  }

  /**
   * Blocks that hold copy rather than layout. The paste dropped some of its lines
   * into bare divs instead of paragraphs, so a div counts too as long as it holds
   * no block of its own.
   * @returns {Element[]}
   */
  #textBlocks() {
    return [...this.querySelectorAll('p, div')].filter(
      (el) => !el.querySelector('p, div, ul, ol, li, table, tr, td, h1, h2, h3, h4')
    );
  }

  /**
   * Formats a table for easier styling
   * @param {HTMLTableElement} table
   */
  #formatTable(table) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('rte-table-wrapper');
    const parent = table.parentNode;
    if (parent) {
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  }

  /**
   * Turns paragraphs that only fake a bullet ("&nbsp;&nbsp;● item") into a real
   * list. Word and Docs pastes lose the list markup, so the glyph ends up as
   * copy: the marker sits at a random indent and wrapped lines snap back to the
   * left edge. A real ul/li gets the hanging indent and the theme's list styling.
   */
  #formatWordBullets() {
    /** @type {Element[]} */
    let run = [];

    const flush = () => {
      if (run.length) this.#listFromRun(run);
      run = [];
    };

    for (const paragraph of this.#textBlocks()) {
      if (!WORD_BULLET.test(paragraph.textContent ?? '')) {
        flush();
      } else if (run.length && run[run.length - 1].nextElementSibling !== paragraph) {
        // Something sits between them, so they are two separate lists
        flush();
        run.push(paragraph);
      } else {
        run.push(paragraph);
      }
    }

    flush();
  }

  /**
   * Replaces a run of consecutive bullet paragraphs with one list.
   * @param {Element[]} run
   */
  #listFromRun(run) {
    const rows = run.map((paragraph) => this.#itemsFrom(paragraph));
    const width = rows[0].length;

    // The paste also flattened the source's two-column bullet tables onto one
    // line ("● name <nbsp run> ● surveys"). When every row split the same way it
    // really was a table, so read back down the columns the way the source did.
    const byColumn = width > 1 && rows.every((row) => row.length === width);

    const list = document.createElement('ul');

    if (byColumn) {
      for (let column = 0; column < width; column++) {
        for (const row of rows) list.append(row[column]);
      }
    } else {
      for (const row of rows) list.append(...row);
    }

    run[0].parentNode?.insertBefore(list, run[0]);
    for (const paragraph of run) paragraph.remove();
  }

  /**
   * Splits one pasted paragraph into a list item per bullet glyph.
   * @param {Element} paragraph
   * @returns {HTMLLIElement[]}
   */
  #itemsFrom(paragraph) {
    this.#dropBulletGlyph(paragraph);

    const first = document.createElement('li');
    while (paragraph.firstChild) first.appendChild(paragraph.firstChild);

    const items = [first];
    let current = first;

    for (let tail = this.#splitAtBullet(current); tail; tail = this.#splitAtBullet(current)) {
      this.#trimTrailingSpace(current);

      current = document.createElement('li');
      current.appendChild(tail);
      this.#dropBulletGlyph(current);
      items.push(current);
    }

    this.#trimTrailingSpace(current);

    // A cell that was nothing but padding leaves an empty bullet behind
    return items.filter((item) => item.textContent?.trim());
  }

  /**
   * Cuts everything from the next bullet glyph onwards out of `item` and hands it
   * back. Uses a range so partly-covered spans keep their markup on both sides.
   * @param {Element} item
   * @returns {DocumentFragment | null}
   */
  #splitAtBullet(item) {
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = /** @type {Text} */ (walker.nextNode()))) {
      const at = (node.nodeValue ?? '').search(/[•●▪◦‣·]/);
      if (at === -1 || !item.lastChild) continue;

      const range = document.createRange();
      range.setStart(node, at);
      range.setEndAfter(item.lastChild);
      return range.extractContents();
    }

    return null;
  }

  /**
   * Drops the nbsp run the paste used to pad a row out to the next column.
   * @param {Element} item
   */
  #trimTrailingSpace(item) {
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    /** @type {Text[]} */
    const nodes = [];
    let next;
    while ((next = /** @type {Text} */ (walker.nextNode()))) nodes.push(next);

    for (const node of nodes.reverse()) {
      const value = (node.nodeValue ?? '').replace(/[\s ]+$/, '');
      node.nodeValue = value;
      if (value) return;
    }
  }

  /**
   * The paste fakes its indents with runs of non-breaking spaces, so the first
   * line sits in from the edge while every wrapped line snaps back to it. Measure
   * that run and re-cut it as real padding with a matching hanging indent, so the
   * whole block lines up under its own first word.
   */
  #hangFakeIndents() {
    for (const paragraph of this.#textBlocks()) {
      const node = /** @type {Text | null} */ (
        document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT).nextNode()
      );
      const lead = node?.nodeValue?.match(FAKE_INDENT);
      if (!node || !lead) continue;

      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, lead[0].length);
      const width = range.getBoundingClientRect().width;

      // Keep it in em so the indent still holds if the type scale changes
      const size = parseFloat(getComputedStyle(paragraph).fontSize) || 16;
      const indent = width / size;
      if (indent < 0.25) continue;

      // Inline important, because the page styles pin text-indent for pasted copy
      paragraph.style.setProperty('padding-left', `${indent.toFixed(3)}em`, 'important');
      paragraph.style.setProperty('text-indent', `-${indent.toFixed(3)}em`, 'important');
    }
  }

  /**
   * Removes the leading glyph and its spacer run. The glyph is usually buried in
   * its own span, so this walks the text nodes instead of touching innerHTML.
   * @param {Element} paragraph
   */
  #dropBulletGlyph(paragraph) {
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    /** @type {Text[]} */
    const nodes = [];
    let next;
    while ((next = /** @type {Text} */ (walker.nextNode()))) nodes.push(next);

    let cut = false;

    for (const node of nodes) {
      const value = node.nodeValue ?? '';

      if (!cut) {
        const match = value.match(WORD_BULLET);
        if (match) {
          node.nodeValue = value.slice(match[0].length);
          cut = true;
          if (node.nodeValue.trim()) return;
          continue;
        }
        // Skip the padding that sits ahead of the glyph in its own node
        if (!value.trim()) {
          node.nodeValue = '';
          continue;
        }
        return;
      }

      // Word can split the spacer run off after the glyph — trim that too
      node.nodeValue = value.replace(/^[\s ]+/, '');
      if (node.nodeValue) return;
    }
  }
}

if (!customElements.get('rte-formatter')) {
  customElements.define('rte-formatter', RTEFormatter);
}
