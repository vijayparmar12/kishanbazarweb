document.addEventListener('DOMContentLoaded', () => {
  function initBestSellersSection(section) {
    const track = section.querySelector('[data-best-sellers-track]');
    const prevBtn = section.querySelector('[data-best-sellers-prev]');
    const nextBtn = section.querySelector('[data-best-sellers-next]');
    const tabs = section.querySelectorAll('[data-best-sellers-tab]');
    const slides = section.querySelectorAll('[data-best-sellers-slide], .best-sellers__slide');
    const maxProducts = parseInt(section.dataset.maxProducts || '4', 10);

    if (prevBtn && nextBtn && track && !prevBtn.dataset.bound) {
      prevBtn.dataset.bound = 'true';
      prevBtn.addEventListener('click', () => {
        const scrollAmount = track.clientWidth;
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        const scrollAmount = track.clientWidth;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }

    function filterSlides(filterRaw) {
      const keywords = filterRaw ? filterRaw.toLowerCase().trim().split(/\s+/).filter(Boolean) : ['all'];
      let visibleCount = 0;

      slides.forEach((slide) => {
        if (slide.classList.contains('best-sellers__slide--more-card')) return;
        const categories = slide.dataset.productCategories ? slide.dataset.productCategories.toLowerCase() : slide.textContent.toLowerCase();

        let isMatch = false;
        if (!filterRaw || filterRaw === 'all' || filterRaw === 'all products' || keywords.includes('all')) {
          isMatch = true;
        } else {
          isMatch = keywords.some((kw) => {
            let stem = kw;
            if (stem.endsWith('s') && stem.length > 3 && !stem.endsWith('ss')) {
              stem = stem.slice(0, -1);
            }
            return categories.includes(kw) || categories.includes(stem);
          });
        }

        if (isMatch && visibleCount < maxProducts) {
          slide.style.display = 'block';
          visibleCount++;
        } else {
          slide.style.display = 'none';
        }
      });

      if (track) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }

    if (tabs.length > 0) {
      tabs.forEach((tab) => {
        if (!tab.dataset.bound) {
          tab.dataset.bound = 'true';
          tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('is-active'));
            tab.classList.add('is-active');
            const filterRaw = tab.dataset.categoryFilter ? tab.dataset.categoryFilter.toLowerCase().trim() : 'all';
            filterSlides(filterRaw);
          });
        }
      });

      let activeTab = section.querySelector('[data-best-sellers-tab].is-active');
      if (!activeTab && tabs.length > 0) {
        activeTab = Array.from(tabs).find((t) => (t.textContent || '').toLowerCase().includes('all')) || tabs[0];
        if (activeTab) {
          activeTab.classList.add('is-active');
        }
      }
      if (activeTab) {
        const initialFilter = activeTab.dataset.categoryFilter ? activeTab.dataset.categoryFilter.toLowerCase().trim() : 'all';
        filterSlides(initialFilter);
      }
    } else {
      filterSlides('all');
    }
  }

  // Init all best sellers sections present on load
  document.querySelectorAll('.product-card__top-bar .product-card__badge:not(.product-card__badge--sold), .product-card__media .product-card__badge:not(.product-card__badge--sold)').forEach((el) => el.remove());
  document.querySelectorAll('[data-best-sellers]').forEach(initBestSellersSection);

  // Re-init on Shopify Theme Editor section load/change
  document.addEventListener('shopify:section:load', (e) => {
    document.querySelectorAll('.product-card__top-bar .product-card__badge:not(.product-card__badge--sold), .product-card__media .product-card__badge:not(.product-card__badge--sold)').forEach((el) => el.remove());
    const sec = e.target.querySelector('[data-best-sellers]') || e.target;
    if (sec && sec.matches && sec.matches('[data-best-sellers]')) {
      initBestSellersSection(sec);
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

    const form = card.querySelector('[data-product-card-form]');
    if (form) {
      let variantInput = form.querySelector('[name="id"]');
      if (!variantInput) {
        variantInput = document.createElement('input');
        variantInput.type = 'hidden';
        variantInput.name = 'id';
        form.appendChild(variantInput);
      }
      variantInput.value = select.value;
    }

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
    let badgeEl = card.querySelector('.product-card__title-badge');
    let badgeWrap = card.querySelector('[data-card-badge-container]');
    if (badgeText && badgeText.trim() !== '') {
      if (!badgeEl) {
        if (!badgeWrap) {
          badgeWrap = document.createElement('div');
          badgeWrap.className = 'product-card__title-badge-wrap';
          badgeWrap.setAttribute('data-card-badge-container', '');
          const titleRow = card.querySelector('.product-card__title-row');
          if (titleRow) {
            titleRow.parentNode.insertBefore(badgeWrap, titleRow.nextSibling);
          } else {
            const content = card.querySelector('.product-card__content');
            if (content) content.insertBefore(badgeWrap, content.firstChild);
          }
        }
        badgeEl = document.createElement('span');
        badgeEl.className = 'product-card__title-badge';
        badgeWrap.appendChild(badgeEl);
      }
      badgeEl.textContent = badgeText.trim();
      if (badgeWrap) badgeWrap.style.setProperty('display', 'flex', 'important');
      badgeEl.style.setProperty('display', 'inline-flex', 'important');
    } else {
      if (badgeEl) {
        badgeEl.style.setProperty('display', 'none', 'important');
        badgeEl.textContent = '';
      }
      if (badgeWrap) {
        badgeWrap.style.setProperty('display', 'none', 'important');
      }
    }

    // Ensure any promotional badge above product image is removed
    const topPromoBadge = card.querySelector('.product-card__top-bar .product-card__badge:not(.product-card__badge--sold), .product-card__media .product-card__badge:not(.product-card__badge--sold)');
    if (topPromoBadge) topPromoBadge.remove();
  });
});
