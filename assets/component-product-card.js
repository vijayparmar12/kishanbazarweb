/* Product card progressive enhancements. */
(() => {
  if (document.documentElement.dataset.productCardInitialized) return;
  document.documentElement.dataset.productCardInitialized = 'true';
  document.addEventListener('click', (event) => {
    const wishlist = event.target.closest('[data-wishlist-button]');
    if (wishlist) { wishlist.classList.toggle('is-active'); wishlist.setAttribute('aria-pressed', String(wishlist.classList.contains('is-active'))); return; }
    const quickView = event.target.closest('[data-quick-view]');
    if (quickView) document.dispatchEvent(new CustomEvent('greenbasket:quick-view', { detail: { url: quickView.dataset.productUrl } }));
  });
})();
