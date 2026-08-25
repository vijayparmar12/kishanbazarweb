document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-best-sellers]').forEach((section) => {
    const track = section.querySelector('[data-best-sellers-track]');
    const prevBtn = section.querySelector('[data-best-sellers-prev]');
    const nextBtn = section.querySelector('[data-best-sellers-next]');
    const tabs = section.querySelectorAll('[data-best-sellers-tab]');
    const slides = section.querySelectorAll('[data-best-sellers-slide], .best-sellers__slide');

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

          slides.forEach((slide) => {
            if (slide.classList.contains('best-sellers__slide--more-card')) return;
            const categories = slide.dataset.productCategories ? slide.dataset.productCategories.toLowerCase() : slide.textContent.toLowerCase();

            if (filterRaw === 'all' || filterRaw === 'all products' || keywords.includes('all')) {
              slide.style.display = 'block';
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

  // Variant Select Dropdown Change Handler
  document.addEventListener('change', (e) => {
    const select = e.target.closest('[data-product-card-variant-select]');
    if (!select) return;
    const card = select.closest('.product-card');
    if (!card) return;

    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption) return;

    const price = selectedOption.dataset.price;
    const comparePrice = selectedOption.dataset.compare;

    const priceCurrent = card.querySelector('.product-card__price-current');
    if (priceCurrent && price) priceCurrent.textContent = price;

    const priceCompare = card.querySelector('.product-card__price-compare');
    if (priceCompare) {
      if (comparePrice) {
        priceCompare.textContent = comparePrice;
        priceCompare.style.display = 'inline';
      } else {
        priceCompare.style.display = 'none';
      }
    }

    const badgeText = selectedOption?.dataset.badge;
    let topBar = card.querySelector('.product-card__top-bar');
    if (!topBar) {
      const media = card.querySelector('.product-card__media');
      if (media) {
        topBar = document.createElement('div');
        topBar.className = 'product-card__top-bar';
        media.appendChild(topBar);
      }
    }

    let badgeEl = card.querySelector('.product-card__badge:not(.product-card__badge--sold)');
    if (badgeText && badgeText.trim() !== '') {
      if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'product-card__badge product-card__badge--loved';
        if (topBar) topBar.insertBefore(badgeEl, topBar.firstChild);
      }
      badgeEl.textContent = badgeText;
      badgeEl.style.display = 'inline-flex';
    } else {
      if (badgeEl) {
        badgeEl.style.display = 'none';
      }
    }
  });
});
