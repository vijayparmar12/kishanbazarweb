/* ==========================================================================
   Shop By Category Section Script (Dedicated & Precise Category Filtering)
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

            const filterRaw = tab.dataset.categoryFilter ? tab.dataset.categoryFilter.toLowerCase().trim() : 'all';
            const keywords = filterRaw.split(/\s+/).filter(Boolean);

            let visibleCount = 0;

            slides.forEach((slide) => {
              const categories = slide.dataset.productCategories ? slide.dataset.productCategories.toLowerCase() : slide.textContent.toLowerCase();

              if (filterRaw === 'all' || filterRaw === 'all products' || keywords.includes('all')) {
                slide.style.display = 'block';
                visibleCount++;
              } else {
                const matches = keywords.some((kw) => {
                  let stem = kw;
                  if (stem.endsWith('s') && stem.length > 3 && !stem.endsWith('ss')) {
                    stem = stem.slice(0, -1);
                  }
                  return categories.includes(kw) || categories.includes(stem);
                });

                if (matches) {
                  slide.style.display = 'block';
                  visibleCount++;
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
