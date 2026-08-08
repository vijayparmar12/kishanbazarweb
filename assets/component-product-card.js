/* Product card progressive enhancements. */
(() => {
  if (document.documentElement.dataset.productCardInitialized) return;
  document.documentElement.dataset.productCardInitialized = 'true';

  document.addEventListener('click', (event) => {
    const quickView = event.target.closest('[data-quick-view]');
    if (quickView) document.dispatchEvent(new CustomEvent('greenbasket:quick-view', { detail: { url: quickView.dataset.productUrl } }));
  });

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-product-card-variant-select]');
    if (!select) return;

    const card = select.closest('[data-product-card]');
    const option = select.selectedOptions[0];
    const price = card?.querySelector('.product-card__price-current');
    const compare = card?.querySelector('.product-card__price-compare');
    const add = card?.querySelector('.product-card__add');

    if (price && option?.dataset.price) price.textContent = option.dataset.price;
    if (compare) compare.textContent = option?.dataset.compare || '';
    if (add) {
      const available = option?.dataset.available === 'true';
      add.disabled = !available;
      add.textContent = available ? 'ADD TO CART' : 'SOLD OUT';
    }
  });
})();




