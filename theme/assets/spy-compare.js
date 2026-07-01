(() => {
  'use strict';

  const MAX = 4;
  const KEY = 'spy-compare';
  const bar = document.getElementById('spy-compare-bar');
  const slots = document.getElementById('spy-compare-slots');
  const countEl = document.getElementById('spy-compare-count');
  const submitBtn = document.getElementById('spy-compare-submit');
  const clearBtn = document.getElementById('spy-compare-clear');
  const modal = document.getElementById('spy-compare-modal');
  const modalOverlay = document.getElementById('spy-compare-modal-overlay');
  const modalClose = document.getElementById('spy-compare-modal-close');
  const modalBody = document.getElementById('spy-compare-modal-body');

  if (!bar) return;

  // ── State ──────────────────────────────────────────────────────────
  let items = readState();

  function readState() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }

  function saveState() {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  // ── Update UI ──────────────────────────────────────────────────────
  function render() {
    const count = items.length;
    bar.style.transform = count > 0 ? 'translateY(0)' : 'translateY(100%)';
    bar.setAttribute('aria-hidden', count > 0 ? 'false' : 'true');

    countEl.textContent = count > 0 ? `${count} of ${MAX} selected` : '';
    submitBtn.disabled = count < 2;

    slots.innerHTML = items.map(item => `
      <div class="spy-compare-slot flex items-center gap-2 bg-white/10 rounded px-2 py-1">
        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="w-8 h-8 object-cover flex-shrink-0">` : ''}
        <span class="text-xs font-semibold leading-tight max-w-[100px] truncate">${item.title}</span>
        <button
          type="button"
          class="text-white/60 hover:text-white flex-shrink-0 text-sm leading-none ml-1"
          data-spy-compare-remove="${item.handle}"
          aria-label="Remove ${item.title} from comparison"
        >×</button>
      </div>
    `).join('');

    // Sync all compare checkboxes on page
    document.querySelectorAll('[data-spy-compare]').forEach(cb => {
      const checked = items.some(i => i.handle === cb.dataset.spyCompare);
      cb.checked = checked;
      const label = cb.closest('.spy-compare-label');
      const box = label?.querySelector('.spy-compare-box');
      const check = label?.querySelector('.spy-compare-check');
      if (box) box.classList.toggle('border-spy-orange', checked);
      if (check) check.classList.toggle('hidden', !checked);
    });
  }

  // ── Add / Remove ───────────────────────────────────────────────────
  function add(data) {
    if (items.length >= MAX) return;
    if (items.some(i => i.handle === data.handle)) return;
    items.push(data);
    saveState();
    render();
  }

  function remove(handle) {
    items = items.filter(i => i.handle !== handle);
    saveState();
    render();
  }

  function clear() {
    items = [];
    saveState();
    render();
    closeModal();
  }

  // ── Compare Modal ──────────────────────────────────────────────────
  async function openModal() {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    await buildModal();
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async function buildModal() {
    modalBody.innerHTML = '<p class="text-sm text-spy-gray text-center py-8">Loading…</p>';
    const cols = items.length;

    const fetches = items.map(item =>
      fetch(`/products/${item.handle}.js`).then(r => r.json()).catch(() => null)
    );
    const products = await Promise.all(fetches);

    const rows = [
      { label: 'Product',     render: p => `<a href="${p.url}" class="font-bold text-spy-slate text-sm hover:text-spy-orange">${p.title}</a>` },
      { label: 'Price',       render: p => `<span class="font-semibold text-sm">$${(p.price / 100).toFixed(2).replace(/\.00$/, '')}</span>` },
      { label: 'Variants',    render: p => `<span class="text-sm">${p.variants.length} option${p.variants.length !== 1 ? 's' : ''}</span>` },
      { label: '',            render: p => `<a href="${p.url}" class="inline-block bg-spy-orange text-white text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-90">View Product</a>` },
    ];

    modalBody.innerHTML = `
      <table class="w-full border-collapse text-left min-w-[480px]">
        <thead>
          <tr>
            <th class="w-28 pr-4 pb-4 text-xs font-bold uppercase tracking-wide text-spy-gray"></th>
            ${products.map(p => p ? `
              <th class="pb-4 px-3">
                <div class="flex flex-col gap-2">
                  ${items.find(i => i.handle === p.handle)?.image
                    ? `<img src="${items.find(i => i.handle === p.handle).image}" alt="${p.title}" class="w-full max-w-[140px] aspect-square object-cover">`
                    : ''}
                </div>
              </th>
            ` : '<th class="pb-4 px-3"></th>').join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr class="border-t border-spy-border">
              <td class="py-3 pr-4 text-xs font-bold uppercase tracking-wide text-spy-gray whitespace-nowrap align-top">${row.label}</td>
              ${products.map(p => `
                <td class="py-3 px-3 align-top">${p ? row.render(p) : '—'}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ── Event Delegation ───────────────────────────────────────────────
  document.addEventListener('change', e => {
    const cb = e.target.closest('[data-spy-compare]');
    if (!cb) return;
    if (cb.checked) {
      add({
        handle: cb.dataset.spyCompare,
        title: cb.dataset.productTitle || cb.dataset.spyCompare,
        url: cb.dataset.productUrl || `/products/${cb.dataset.spyCompare}`,
        price: cb.dataset.productPrice || '',
        image: cb.dataset.productImage || '',
      });
    } else {
      remove(cb.dataset.spyCompare);
    }
  });

  document.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-spy-compare-remove]');
    if (removeBtn) remove(removeBtn.dataset.spyCompareRemove);
  });

  clearBtn?.addEventListener('click', clear);
  submitBtn?.addEventListener('click', openModal);
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });

  // ── Init ───────────────────────────────────────────────────────────
  render();
})();
