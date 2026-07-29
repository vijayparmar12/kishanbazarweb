/* Quantity bounds and controls. */
(() => {
  if (document.documentElement.dataset.quantityInitialized) return;
  document.documentElement.dataset.quantityInitialized = 'true';
  const update = (selector, delta) => { const input = selector.querySelector('[data-quantity-input]'); const min = Number(input.min || 1); const max = input.max ? Number(input.max) : Infinity; const step = Number(input.step || 1); const next = Math.min(max, Math.max(min, (Number(input.value) || min) + delta * step)); input.value = next; input.dispatchEvent(new Event('change', { bubbles: true })); };
  document.addEventListener('click', (event) => { const selector = event.target.closest('[data-quantity-selector]'); if (!selector) return; if (event.target.closest('[data-quantity-minus]')) update(selector, -1); if (event.target.closest('[data-quantity-plus]')) update(selector, 1); });
  document.addEventListener('change', (event) => { const input = event.target.closest('[data-quantity-input]'); if (!input) return; const min = Number(input.min || 1); const max = input.max ? Number(input.max) : Infinity; input.value = Math.min(max, Math.max(min, Number(input.value) || min)); });
})();
