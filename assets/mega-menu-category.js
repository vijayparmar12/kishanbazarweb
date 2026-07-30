(() => {
  const initCategoryMega = (root = document) => {
    root.querySelectorAll('[data-category-slider]').forEach((slider) => {
      if (slider.dataset.categorySliderInitialized === 'true') return;
      slider.dataset.categorySliderInitialized = 'true';

      slider.addEventListener('wheel', (event) => {
        if (window.innerWidth > 1023 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        event.preventDefault();
        slider.scrollLeft += event.deltaY;
      }, { passive: false });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCategoryMega());
  } else {
    initCategoryMega();
  }

  document.addEventListener('shopify:section:load', (event) => initCategoryMega(event.target));
})();
