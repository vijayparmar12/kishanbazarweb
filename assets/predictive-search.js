(() => {
  class PredictiveSearchDrawer {
    constructor() {
      this.drawer = document.querySelector('[data-predictive-search-drawer]');
      if (!this.drawer) return;

      this.input = this.drawer.querySelector('[data-predictive-search-input]');
      this.clearBtn = this.drawer.querySelector('[data-search-input-clear]');
      this.closeBtns = this.drawer.querySelectorAll('[data-search-close]');
      this.pills = this.drawer.querySelectorAll('[data-search-pill]');
      this.popularTags = document.querySelectorAll('[data-popular-search]');
      this.resultsContainer = this.drawer.querySelector('[data-predictive-search-results]');
      this.suggestionList = this.drawer.querySelector('[data-suggestion-list-container]');
      this.pillsContainer = this.drawer.querySelector('[data-pills-container]');
      this.productsContainer = this.drawer.querySelector('[data-products-container]');
      this.blogsContainer = this.drawer.querySelector('[data-blogs-container]');
      this.statusText = this.drawer.querySelector('[data-search-status-text]');
      
      this.debounceTimer = null;
      this.initialProductsHTML = this.productsContainer ? this.productsContainer.innerHTML : '';
      this.initialBlogsHTML = this.blogsContainer ? this.blogsContainer.innerHTML : '';

      this.bindEvents();
    }

    bindEvents() {
      // 1. Intercept all header and page search forms to prevent navigation to /search page
      document.querySelectorAll('form.kb-header__search, form[action*="/search"]').forEach((form) => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formInput = form.querySelector('input[type="search"], input[name="q"]');
          const query = formInput ? formInput.value.trim() : '';
          this.open();
          if (query) {
            if (this.input) this.input.value = query;
            this.toggleClearBtn();
            this.fetchResults(query);
          }
        });
      });

      // 2. Listen for click on header search input or search submit button to open drawer
      document.addEventListener('click', (e) => {
        const searchTrigger = e.target.closest('[data-typing-search], .kb-header__search-icon, .kb-header__search-submit');
        if (searchTrigger) {
          e.preventDefault();
          const mainInput = document.querySelector('[data-typing-search]');
          const query = mainInput ? mainInput.value.trim() : '';
          this.open();
          if (query) {
            if (this.input) this.input.value = query;
            this.toggleClearBtn();
            this.fetchResults(query);
          }
        }
      });

      // 3. Popular Searches tags click handlers
      this.popularTags.forEach((tag) => {
        tag.addEventListener('click', (e) => {
          e.preventDefault();
          const query = tag.dataset.popularSearch || tag.textContent.trim();
          const mainInput = document.querySelector('[data-typing-search]');
          if (mainInput) mainInput.value = query;
          if (this.input) this.input.value = query;
          this.toggleClearBtn();
          this.open();
          this.fetchResults(query);
        });
      });

      // 4. Listen to focus and input on main header search input
      const mainSearchInput = document.querySelector('[data-typing-search]');
      if (mainSearchInput) {
        mainSearchInput.addEventListener('focus', () => {
          const query = mainSearchInput.value.trim();
          this.open();
          if (query && this.input) {
            this.input.value = query;
            this.toggleClearBtn();
            this.fetchResults(query);
          }
        });

        mainSearchInput.addEventListener('input', () => {
          const query = mainSearchInput.value.trim();
          this.open();
          if (this.input) {
            this.input.value = query;
            this.toggleClearBtn();
          }
          clearTimeout(this.debounceTimer);
          if (query.length < 2) {
            this.resetToInitialState();
            return;
          }
          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 280);
        });
      }

      // 5. Intercept search form submit inside predictive search drawer
      const drawerForm = this.drawer.querySelector('[data-predictive-search-form]');
      if (drawerForm) {
        drawerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const query = this.input ? this.input.value.trim() : '';
          if (query) {
            this.fetchResults(query);
          }
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

      // Clear button
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => {
          if (this.input) {
            this.input.value = '';
            const mainInput = document.querySelector('[data-typing-search]');
            if (mainInput) mainInput.value = '';
            this.toggleClearBtn();
            this.resetToInitialState();
            this.input.focus();
          }
        });
      }

      // Suggestion Pill clicks inside drawer
      this.pills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const query = pill.dataset.searchPill || pill.textContent.trim();
          if (this.input) {
            this.input.value = query;
            const mainInput = document.querySelector('[data-typing-search]');
            if (mainInput) mainInput.value = query;
            this.toggleClearBtn();
            this.fetchResults(query);
            this.input.focus();
          }
        });
      });

      // Input typing event inside drawer
      if (this.input) {
        this.input.addEventListener('input', () => {
          const query = this.input.value.trim();
          const mainInput = document.querySelector('[data-typing-search]');
          if (mainInput) mainInput.value = query;
          this.toggleClearBtn();

          clearTimeout(this.debounceTimer);
          if (query.length < 2) {
            this.resetToInitialState();
            return;
          }

          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 280);
        });
      }
    }

    open() {
      this.drawer.classList.add('is-active');
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (this.input) this.input.focus();
      }, 150);
    }

    close() {
      this.drawer.classList.remove('is-active');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    isOpen() {
      return this.drawer.classList.contains('is-active');
    }

    toggleClearBtn() {
      if (!this.clearBtn || !this.input) return;
      this.clearBtn.style.display = this.input.value.trim().length > 0 ? 'inline-block' : 'none';
    }

    resetToInitialState() {
      if (this.pillsContainer) this.pillsContainer.style.display = 'flex';
      if (this.suggestionList) {
        this.suggestionList.style.display = 'none';
        this.suggestionList.innerHTML = '';
      }
      if (this.productsContainer) this.productsContainer.innerHTML = this.initialProductsHTML;
      if (this.blogsContainer) this.blogsContainer.innerHTML = this.initialBlogsHTML;
      if (this.statusText) this.statusText.textContent = 'Type to search or pick a popular term above';
    }

    async fetchResults(query) {
      try {
        const response = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,article,page,queries&resources[limit]=6`);
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
      const { products = [], articles = [], queries = [] } = results;

      if (this.statusText) {
        this.statusText.textContent = `Results for "${query}"`;
      }

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
              if (this.input) {
                this.input.value = text;
                const mainInput = document.querySelector('[data-typing-search]');
                if (mainInput) mainInput.value = text;
                this.toggleClearBtn();
                this.fetchResults(text);
              }
            });
          });
        }
      } else {
        if (this.pillsContainer) this.pillsContainer.style.display = 'flex';
        if (this.suggestionList) this.suggestionList.style.display = 'none';
      }

      // 2. Render Products
      if (this.productsContainer) {
        if (products.length > 0) {
          this.productsContainer.innerHTML = products.map((product) => {
            const priceFormatted = product.price ? `₹${parseFloat(product.price).toFixed(2)}` : '';
            return `
              <div class="kb-search-product-row">
                <a href="${product.url}" class="kb-search-product-row__link">
                  <div class="kb-search-product-row__img-wrap">
                    <img src="${product.featured_image?.url || product.image || ''}" alt="${product.title}" class="kb-search-product-thumb" loading="lazy">
                  </div>
                  <div class="kb-search-product-row__info">
                    <h4 class="kb-search-product-title">${this.highlightText(product.title, query)}</h4>
                    <div class="kb-search-product-prices">
                      <span class="kb-search-product-price">${priceFormatted}</span>
                    </div>
                  </div>
                </a>
              </div>
            `;
          }).join('');
        } else {
          this.productsContainer.innerHTML = `<p style="color: #64748b; font-size: 0.90rem; font-weight: 600; padding: 0.5rem 0;">No products found matching "${query}".</p>`;
        }
      }

      // 3. Render Articles / Blogs
      if (this.blogsContainer) {
        if (articles.length > 0) {
          this.blogsContainer.innerHTML = articles.map((article) => {
            return `
              <a href="${article.url}" class="kb-search-blog-card">
                <div class="kb-search-blog-card__content">
                  <h4 class="kb-search-blog-title">${this.highlightText(article.title, query)}</h4>
                  <p class="kb-search-blog-meta">Read article &rarr;</p>
                </div>
              </a>
            `;
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
    document.addEventListener('DOMContentLoaded', () => new PredictiveSearchDrawer());
  } else {
    new PredictiveSearchDrawer();
  }
})();
