(() => {
  class PredictiveSearchDropdown {
    constructor() {
      this.drawer = document.querySelector('[data-predictive-search-drawer]');
      if (!this.drawer) return;

      this.input = document.querySelector('[data-typing-search]') || this.drawer.querySelector('[data-predictive-search-input]');
      this.clearBtn = document.querySelector('[data-search-clear]') || this.drawer.querySelector('[data-search-input-clear]');
      this.closeBtns = this.drawer.querySelectorAll('[data-search-close]');
      this.pills = this.drawer.querySelectorAll('[data-search-pill]');
      this.suggestionList = this.drawer.querySelector('[data-suggestion-list-container]');
      this.pillsContainer = this.drawer.querySelector('[data-search-pills-container]');
      this.productsContainer = this.drawer.querySelector('[data-products-container]');
      this.blogsContainer = this.drawer.querySelector('[data-blogs-container]');
      this.footerQuery = this.drawer.querySelector('[data-search-footer-query]');
      
      this.debounceTimer = null;
      this.initialProductsHTML = this.productsContainer ? this.productsContainer.innerHTML : '';
      this.initialBlogsHTML = this.blogsContainer ? this.blogsContainer.innerHTML : '';

      this.bindEvents();
    }

    bindEvents() {
      // 1. Intercept all search form submissions to prevent navigation to /search page
      document.querySelectorAll('form.kb-header__search, form[action*="/search"]').forEach((form) => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formInput = form.querySelector('input[type="search"], input[name="q"]');
          const query = formInput ? formInput.value.trim() : '';
          this.open();
          if (query) {
            this.updateFooterQuery(query);
            this.fetchResults(query);
          }
        });
      });

      // 2. Listen for click or focus on header search input to open dropdown
      document.addEventListener('click', (e) => {
        const searchTrigger = e.target.closest('[data-typing-search], .kb-header__search-icon, .kb-header__search-submit');
        if (searchTrigger) {
          const mainInput = document.querySelector('[data-typing-search]');
          const query = mainInput ? mainInput.value.trim() : '';
          this.open();
          if (query) {
            this.updateFooterQuery(query);
            this.fetchResults(query);
          }
        } else if (!e.target.closest('.kb-header__search, [data-predictive-search-drawer]')) {
          this.close();
        }
      });

      // 3. Listen to input events on main search input
      const mainSearchInput = document.querySelector('[data-typing-search]');
      if (mainSearchInput) {
        mainSearchInput.addEventListener('focus', () => {
          const query = mainSearchInput.value.trim();
          this.open();
          if (query) {
            this.updateFooterQuery(query);
            this.fetchResults(query);
          }
        });

        mainSearchInput.addEventListener('input', () => {
          const query = mainSearchInput.value.trim();
          this.open();
          this.updateFooterQuery(query);

          clearTimeout(this.debounceTimer);
          if (query.length < 2) {
            this.resetToInitialState();
            return;
          }

          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 260);
        });
      }

      // Close handlers
      this.closeBtns.forEach((btn) => btn.addEventListener('click', () => this.close()));

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Suggestion Pill clicks
      this.pills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const query = pill.dataset.searchPill || pill.textContent.trim();
          if (mainSearchInput) {
            mainSearchInput.value = query;
          }
          this.updateFooterQuery(query);
          this.fetchResults(query);
        });
      });
    }

    open() {
      this.drawer.classList.add('is-active');
      this.drawer.setAttribute('aria-hidden', 'false');
    }

    close() {
      this.drawer.classList.remove('is-active');
      this.drawer.setAttribute('aria-hidden', 'true');
    }

    isOpen() {
      return this.drawer.classList.contains('is-active');
    }

    updateFooterQuery(query) {
      if (this.footerQuery) {
        this.footerQuery.textContent = query || 'search';
      }
    }

    resetToInitialState() {
      if (this.pillsContainer) this.pillsContainer.style.display = 'flex';
      if (this.suggestionList) {
        this.suggestionList.style.display = 'none';
        this.suggestionList.innerHTML = '';
      }
      if (this.productsContainer) this.productsContainer.innerHTML = this.initialProductsHTML;
      if (this.blogsContainer) this.blogsContainer.innerHTML = this.initialBlogsHTML;
    }

    async fetchResults(query) {
      try {
        const suggestUrl = `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,article,page,query&resources[limit]=6`;
        const response = await fetch(suggestUrl);
        
        if (response.ok) {
          const data = await response.json();
          const predictiveResults = data.resources?.results;
          if (predictiveResults) {
            this.renderResults(query, predictiveResults);
            return;
          }
        }
      } catch (err) {
        console.error('Predictive search error:', err);
      }
    }

    renderResults(query, results) {
      const { products = [], articles = [], queries = [] } = results;

      // 1. Render Suggestion List with Rosier Yellow Highlight
      if (queries.length > 0) {
        if (this.pillsContainer) this.pillsContainer.style.display = 'none';
        if (this.suggestionList) {
          this.suggestionList.style.display = 'flex';
          this.suggestionList.innerHTML = queries.map((item) => {
            const highlightedText = this.highlightText(item.text, query);
            return `<li class="kb-search-suggestion-item" data-suggestion-text="${item.text}">${highlightedText}</li>`;
          }).join('');

          // Bind click on suggestions
          this.suggestionList.querySelectorAll('.kb-search-suggestion-item').forEach((li) => {
            li.addEventListener('click', () => {
              const text = li.dataset.suggestionText;
              const mainInput = document.querySelector('[data-typing-search]');
              if (mainInput) mainInput.value = text;
              this.updateFooterQuery(text);
              this.fetchResults(text);
            });
          });
        }
      } else {
        if (this.pillsContainer) this.pillsContainer.style.display = 'flex';
        if (this.suggestionList) this.suggestionList.style.display = 'none';
      }

      // 2. Render Products as Rosier Row Cards
      if (this.productsContainer) {
        if (products.length > 0) {
          this.productsContainer.innerHTML = products.map((product) => {
            const priceFormatted = product.price ? `₹ ${parseFloat(product.price).toFixed(2)}` : '';
            return `
              <a href="${product.url}" class="kb-search-product-row">
                <div class="kb-search-product-row__img-wrap">
                  <img src="${product.featured_image?.url || product.image || ''}" alt="${product.title}" class="kb-search-product-row__img" loading="lazy">
                </div>
                <div class="kb-search-product-row__details">
                  <h4 class="kb-search-product-row__title">${this.highlightText(product.title, query)}</h4>
                  <div class="kb-search-product-row__meta">
                    <span class="kb-search-product-row__price">${priceFormatted}</span>
                    <span class="kb-search-product-row__rating">★ 4.9 <small style="color: #64748b; font-weight: 500;">(1279)</small></span>
                  </div>
                </div>
              </a>
            `;
          }).join('');
        } else {
          this.productsContainer.innerHTML = `<p style="color: #64748b; font-size: 0.90rem; font-weight: 600; padding: 0.5rem 0;">No products found matching "${query}".</p>`;
        }
      }

      // 3. Render Articles / Pages
      if (this.blogsContainer) {
        if (articles.length > 0) {
          this.blogsContainer.innerHTML = articles.map((article) => {
            return `<a href="${article.url}" class="kb-search-article-link">${this.highlightText(article.title, query)}</a>`;
          }).join('');
        } else {
          this.blogsContainer.innerHTML = this.initialBlogsHTML;
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
    document.addEventListener('DOMContentLoaded', () => new PredictiveSearchDropdown());
  } else {
    new PredictiveSearchDropdown();
  }
})();
