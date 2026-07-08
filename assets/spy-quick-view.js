(() => {
  'use strict';
  const wrapper = document.querySelector('.spy-qv-wrapper');
  if (!wrapper) return;
  const overlay  = wrapper.querySelector('.spy-qv-overlay');
  const modal    = wrapper.querySelector('.spy-qv-modal');
  const content  = wrapper.querySelector('.spy-qv-modal__content');
  const closeBtn = wrapper.querySelector('.spy-qv-modal__close');
  let currentHandle = null;

  const open = handle => {
    currentHandle = handle;
    wrapper.dataset.open = '';
    document.body.style.overflow = 'hidden';
    modal.setAttribute('aria-hidden', 'false');
    content.innerHTML = '<p style="padding:48px 24px;text-align:center;font-size:14px;color:#2c393e">Loading…</p>';
    fetch('/products/' + handle + '?section_id=spy-quick-view-content')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const el = doc.querySelector('.shopify-section');
        content.innerHTML = el ? el.innerHTML : html;
        bindEvents();
      })
      .catch(() => {
        content.innerHTML = '<p style="padding:48px 24px;text-align:center;font-size:14px;color:#2c393e">Could not load. <a href="/products/' + handle + '">View details →</a></p>';
      });
  };

  const close = () => {
    delete wrapper.dataset.open;
    document.body.style.overflow = '';
    modal.setAttribute('aria-hidden', 'true');
    currentHandle = null;
  };

  const bindEvents = () => {
    content.querySelectorAll('.spy-qv-content__swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const pos = btn.dataset.optionPosition;
        content.querySelectorAll('.spy-qv-content__swatch[data-option-position="' + pos + '"]')
          .forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        const lbl = content.querySelector('.spy-qv-content__option-selected[data-position="' + pos + '"]');
        if (lbl) lbl.textContent = btn.dataset.optionValue;
        if (currentHandle) syncVariant(currentHandle);
      });
    });
    const form = content.querySelector('#spy-qv-form');
    form && form.addEventListener('submit', async e => {
      e.preventDefault();
      const atc = form.querySelector('.spy-qv-content__atc');
      const orig = atc.textContent;
      atc.disabled = true;
      atc.textContent = 'Adding…';
      try {
        const r = await fetch('/cart/add.js', { method: 'POST', body: new FormData(form) });
        if (!r.ok) throw new Error();
        atc.textContent = 'Added ✓';
        document.dispatchEvent(new CustomEvent('cart:refresh'));
        setTimeout(() => { atc.textContent = orig; atc.disabled = false; }, 1500);
      } catch {
        atc.textContent = 'Error — try again';
        atc.disabled = false;
      }
    });
  };

  const syncVariant = async handle => {
    const sel = {};
    content.querySelectorAll('.spy-qv-content__swatch.is-selected')
      .forEach(b => { sel[b.dataset.optionPosition] = b.dataset.optionValue; });
    try {
      const prod = await fetch('/products/' + handle + '.js').then(r => r.json());
      const vt = prod.variants.find(v =>
        Object.entries(sel).every(([p, val]) => v['option' + p] === val)
      );
      if (!vt) return;
      const inp = content.querySelector('input[name=id]');
      if (inp) inp.value = vt.id;
      const priceEl = content.querySelector('.spy-qv-content__price');
      if (priceEl) {
        const fmt = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');
        priceEl.innerHTML = vt.compare_at_price > vt.price
          ? '<span class="spy-qv-content__price--sale">' + fmt(vt.price) + '</span><s class="spy-qv-content__price--compare">' + fmt(vt.compare_at_price) + '</s>'
          : '<span>' + fmt(vt.price) + '</span>';
      }
      const atc = content.querySelector('.spy-qv-content__atc');
      if (atc) { atc.disabled = !vt.available; atc.textContent = vt.available ? 'Add to Cart' : 'Sold Out'; }
    } catch {}
  };

  overlay && overlay.addEventListener('click', close);
  closeBtn && closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-spy-qv]');
    if (btn) { e.preventDefault(); open(btn.dataset.spyQv); }
  });
})();
