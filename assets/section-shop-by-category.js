/* ==========================================================================
   Shop By Category Section Script (Dedicated)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const initShopByCategory = () => {
    document.querySelectorAll('[data-shop-by-category]').forEach((section) => {
      const track = section.querySelector('[data-category-track]');
      const prevBtn = section.querySelector('[data-category-prev]');
      const nextBtn = section.querySelector('[data-category-next]');
      const tabs = section.querySelectorAll('[data-category-tab]');
      const slides = section.querySelectorAll('[data-category-slide]');

      if (prevBtn && nextBtn && track) {
        prevBtn.addEventListener('click', () => {
          track.scrollBy({ left: -320, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
          track.scrollBy({ left: 320, behavior: 'smooth' });
        });
      }

      if (tabs.length > 0 && slides.length > 0) {
        tabs.forEach((tab) => {
          tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            const category = tab.dataset.categoryFilter ? tab.dataset.categoryFilter.toLowerCase().trim() : 'all';

            slides.forEach((slide) => {
              const categories = slide.dataset.productCategories ? slide.dataset.productCategories.toLowerCase() : slide.textContent.toLowerCase();

              if (category === 'all' || category === 'all products' || category === 'newly launched') {
                slide.style.display = 'block';
              } else {
                let keyword = category;
                if (keyword.endsWith('s') && keyword.length > 3 && !keyword.endsWith('ss')) {
                  keyword = keyword.slice(0, -1);
                }

                if (categories.includes(category) || (keyword && categories.includes(keyword))) {
                  slide.style.display = 'block';
                } else {
                  slide.style.display = 'none';
                }
              }
            });

            if (track) {
              track.scrollTo({ left: 0, behavior: 'smooth' });
            }
          });
        });
      }
    });
  };

  initShopByCategory();
  document.addEventListener('shopify:section:load', (e) => {
    if (e.target && e.target.querySelector('[data-shop-by-category]')) {
      initShopByCategory();
    }
  });
});
