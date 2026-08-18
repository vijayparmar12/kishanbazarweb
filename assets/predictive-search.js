(() => {
  class PredictiveSearchDrawer {
    constructor() {
      this.drawer = document.querySelector('[data-predictive-search-drawer]');
      if (!this.drawer) return;

      this.input = this.drawer.querySelector('[data-predictive-search-input]');
      this.clearBtn = this.drawer.querySelector('[data-search-input-clear]');
      this.closeBtns = this.drawer.querySelectorAll('[data-search-close]');
      this.resultsContainer = this.drawer.querySelector('[data-predictive-search-results]');
      this.suggestionList = this.drawer.querySelector('[data-suggestion-list-container]');
      this.productsContainer = this.drawer.querySelector('[data-products-container]');
      this.viewAllLink = this.drawer.querySelector('[data-view-all-products]');
      
      this.debounceTimer = null;
      this.bindEvents();
    }

    bindEvents() {
      const mainSearchInput = document.querySelector('[data-typing-search]');

      if (mainSearchInput) {
        // 1. On focus: only open search drawer if query is NOT empty
        mainSearchInput.addEventListener('focus', () => {
          const query = mainSearchInput.value.trim();
          if (query.length >= 1) {
            this.open();
            if (this.input) this.input.value = query;
            this.toggleClearBtn();
            this.fetchResults(query);
          } else {
            // Nothing typed -> nothing visible!
            this.close();
          }
        });

        // 2. On typing in header search:
        mainSearchInput.addEventListener('input', () => {
          const query = mainSearchInput.value.trim();
          if (this.input) {
            this.input.value = query;
            this.toggleClearBtn();
          }
          
          if (query.length < 1) {
            // Nothing typed -> close search drawer immediately!
            this.close();
            return;
          }

          this.open();
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 250);
        });
      }

      // 3. On typing in drawer search input:
      if (this.input) {
        this.input.addEventListener('input', () => {
          const query = this.input.value.trim();
          if (mainSearchInput) mainSearchInput.value = query;
          this.toggleClearBtn();

          if (query.length < 1) {
            this.close();
            return;
          }

          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 250);
        });
      }

      // Close handlers
      this.closeBtns.forEach((btn) => btn.addEventListener('click', () => this.close()));

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Clear button
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => {
          if (this.input) this.input.value = '';
          if (mainSearchInput) mainSearchInput.value = '';
          this.toggleClearBtn();
          this.close();
        });
      }
    }

    open() {
      this.drawer.classList.add('is-active');
      this.drawer.setAttribute('aria-hidden', 'false');
      if (this.resultsContainer) this.resultsContainer.style.display = 'grid';
    }

    close() {
      this.drawer.classList.remove('is-active');
      this.drawer.setAttribute('aria-hidden', 'true');
      if (this.resultsContainer) this.resultsContainer.style.display = 'none';
    }

    isOpen() {
      return this.drawer.classList.contains('is-active');
    }

    toggleClearBtn() {
      if (!this.clearBtn || !this.input) return;
      this.clearBtn.style.display = this.input.value.trim().length > 0 ? 'inline-block' : 'none';
    }

    async fetchResults(query) {
      try {
        const response = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,article,queries&resources[limit]=8`);
        if (!response.ok) return;

        const data = await response.json();
        const predictiveResults = data.resources?.results;
        if (!predictiveResults) return;

        this.renderResults(query, predictiveResults);
      } catch (err) {
        console.error('Predictive search error:', err);
      }
    }

    renderResults(query, results) {
      const { products = [], queries = [] } = results;

      // 1. Suggestions List (Left Column)
      if (this.suggestionList) {
        let suggestionItems = [];
        
        if (queries.length > 0) {
          suggestionItems = queries.map(q => q.text);
        } else if (products.length > 0) {
          const set = new Set();
          set.add(query);
          products.forEach(p => {
            const words = p.title.split(' ');
            words.forEach(w => {
              if (w.toLowerCase().includes(query.toLowerCase())) {
                set.add(w.toLowerCase());
              }
            });
            if (p.product_type) set.add(p.product_type);
          });
          suggestionItems = Array.from(set).slice(0, 6);
        }

        if (suggestionItems.length > 0) {
          this.suggestionList.innerHTML = suggestionItems.map((item) => {
            const highlighted = this.highlightText(item, query);
            return `<li class="kb-search-suggestion-item" data-suggestion-text="${item}">${highlighted}</li>`;
          }).join('');

          // Click handler for suggestion items
          this.suggestionList.querySelectorAll('.kb-search-suggestion-item').forEach((li) => {
            li.addEventListener('click', () => {
              const text = li.dataset.suggestionText;
              const mainSearchInput = document.querySelector('[data-typing-search]');
              if (this.input) this.input.value = text;
              if (mainSearchInput) mainSearchInput.value = text;
              this.toggleClearBtn();
              this.fetchResults(text);
            });
          });
        } else {
          this.suggestionList.innerHTML = `<li class="kb-search-suggestion-item">${this.highlightText(query, query)}</li>`;
        }
      }

      // 2. Products List (Right Column - Rosier Foods Row Layout)
      if (this.productsContainer) {
        if (products.length > 0) {
          this.productsContainer.innerHTML = products.map((product) => {
            const priceFormatted = product.price ? `₹${parseFloat(product.price).toFixed(2)}` : (product.price_min ? `₹${parseFloat(product.price_min).toFixed(2)}` : '');
            const imgUrl = product.featured_image?.url || product.image || '';
            return `
              <div class="kb-search-product-row">
                <a href="${product.url}" class="kb-search-product-row__link">
                  <div class="kb-search-product-row__img-wrap">
                    ${imgUrl ? `<img src="${imgUrl}" alt="${product.title}" class="kb-search-product-row__img" loading="lazy">` : `<div class="kb-search-product-row__img-placeholder"></div>`}
                  </div>
                  <div class="kb-search-product-row__info">
                    <h4 class="kb-search-product-row__title">${this.highlightText(product.title, query)}</h4>
                    <div class="kb-search-product-row__price">${priceFormatted}</div>
                  </div>
                </a>
              </div>
            `;
          }).join('');

          if (this.viewAllLink) {
            this.viewAllLink.href = `/search?q=${encodeURIComponent(query)}`;
            this.viewAllLink.style.display = 'inline-block';
          }
        } else {
          this.productsContainer.innerHTML = `<p style="color: #64748b; font-size: 0.9rem; padding: 0.5rem 0;">No products found for "${query}".</p>`;
          if (this.viewAllLink) this.viewAllLink.style.display = 'none';
        }
      }
    }

    highlightText(text, query) {
      if (!query || !text) return text;
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<span class="kb-search-highlight">$1</span>');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PredictiveSearchDrawer());
  } else {
    new PredictiveSearchDrawer();
  }
})();
