(() => {
  class PredictiveSearchDrawer {
    constructor() {
      this.drawer = document.querySelector('[data-predictive-search-drawer]');
      if (!this.drawer) return;

      this.input = this.drawer.querySelector('[data-predictive-search-input]');
      this.clearBtn = this.drawer.querySelector('[data-search-input-clear]');
      this.closeBtns = this.drawer.querySelectorAll('[data-search-close]');
      this.pills = this.drawer.querySelectorAll('[data-search-pill]');
      this.resultsContainer = this.drawer.querySelector('[data-predictive-search-results]');
      this.suggestionList = this.drawer.querySelector('[data-suggestion-list-container]');
      this.pillsContainer = this.drawer.querySelector('.kb-search-drawer__pills');
      this.productsContainer = this.drawer.querySelector('[data-products-container]');
      this.blogsContainer = this.drawer.querySelector('[data-blogs-container]');
      this.viewAllLink = this.drawer.querySelector('[data-view-all-products]');
      
      this.debounceTimer = null;
      this.initialProductsHTML = this.productsContainer ? this.productsContainer.innerHTML : '';
      this.initialBlogsHTML = this.blogsContainer ? this.blogsContainer.innerHTML : '';

      this.bindEvents();
    }

    bindEvents() {
      // Listen for click on header search input or search submit button to open drawer
      document.addEventListener('click', (e) => {
        const searchTrigger = e.target.closest('[data-typing-search], .kb-header__search-icon, .kb-header__search-submit');
        if (searchTrigger) {
          e.preventDefault();
          this.open();
        }
      });

      // Also listen to focus on main header search input
      const mainSearchInput = document.querySelector('[data-typing-search]');
      if (mainSearchInput) {
        mainSearchInput.addEventListener('focus', () => this.open());
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
            this.toggleClearBtn();
            this.resetToInitialState();
            this.input.focus();
          }
        });
      }

      // Suggestion Pill clicks
      this.pills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const query = pill.dataset.searchPill || pill.textContent.trim();
          if (this.input) {
            this.input.value = query;
            this.toggleClearBtn();
            this.fetchResults(query);
            this.input.focus();
          }
        });
      });

      // Input typing event
      if (this.input) {
        this.input.addEventListener('input', () => {
          const query = this.input.value.trim();
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
      if (this.viewAllLink) this.viewAllLink.style.display = 'none';
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
              <div class="kb-search-product-card">
                <a href="${product.url}" class="kb-search-product-card__link" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%;">
                  <div class="kb-search-product-card__img-wrap">
                    <img src="${product.featured_image?.url || product.image || ''}" alt="${product.title}" class="kb-search-product-thumb" loading="lazy">
                  </div>
                  <div class="kb-search-product-card__info" style="margin-top: 0.5rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <h4 class="kb-search-product-title">${this.highlightText(product.title, query)}</h4>
                    <div class="kb-search-product-rating" style="margin-top: 4px;">
                      <span>★ 4.9</span>
                      <span style="color: #64748b; font-weight: 500;">(1279 reviews)</span>
                    </div>
                    <div class="kb-search-product-prices" style="margin-top: 6px;">
                      <span class="kb-search-product-price">${priceFormatted}</span>
                    </div>
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
          this.productsContainer.innerHTML = `<p style="color: #64748b; font-size: 0.95rem; font-weight: 600; padding: 0.5rem 0;">No products found matching "${query}".</p>`;
          if (this.viewAllLink) this.viewAllLink.style.display = 'none';
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
