/* Product Card Interactivity - Quantity Stepper (- 1 +) & Variant Handler */
(() => {
  if (document.documentElement.dataset.productCardInitialized) return;
  document.documentElement.dataset.productCardInitialized = 'true';

  document.addEventListener('click', (event) => {
    // 1. Quick View
    const quickView = event.target.closest('[data-quick-view]');
    if (quickView) {
      document.dispatchEvent(new CustomEvent('greenbasket:quick-view', { detail: { url: quickView.dataset.productUrl } }));
    }

    // 2. Quantity Stepper (+ / -)
    const qtyBtn = event.target.closest('[data-qty-plus], [data-qty-minus]');
    if (qtyBtn) {
      event.preventDefault();
      const stepper = qtyBtn.closest('[data-product-card-qty-stepper]');
      if (!stepper) return;
      const input = stepper.querySelector('[data-qty-input]');
      if (!input) return;

      let currentVal = parseInt(input.value, 10) || 1;
      if (qtyBtn.hasAttribute('data-qty-plus')) {
        currentVal = Math.min(99, currentVal + 1);
      } else if (qtyBtn.hasAttribute('data-qty-minus')) {
        currentVal = Math.max(1, currentVal - 1);
      }

      input.value = currentVal;
    }
  });

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-product-card-variant-select]');
    if (!select) return;

    const card = select.closest('[data-product-card]');
    if (!card) return;

    const option = select.selectedOptions[0];
    const price = card.querySelector('.product-card__price-current');
    const compare = card.querySelector('.product-card__price-compare');
    const add = card.querySelector('.product-card__add');

    if (price && option?.dataset.price) {
      price.textContent = option.dataset.price;
    }
    if (compare) {
      compare.textContent = option?.dataset.compare || '';
    }
    if (add) {
      const disabled = option?.disabled;
      add.disabled = disabled;
      const labelSpan = add.querySelector('span');
      if (labelSpan) {
        labelSpan.textContent = disabled ? 'SOLD OUT' : 'ADD TO CART';
      }
    }
  });
})();
