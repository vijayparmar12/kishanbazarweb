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
      
      this.debounceTimer = null;
      this.bindEvents();
      this.checkUrlSearch();
    }

    bindEvents() {
      // 1. Prevent form submit navigation on Enter key or Search button
      document.addEventListener('submit', (e) => {
        const form = e.target.closest('form[action*="/search"], form.kb-header__search, form.search-page__form, form.kb-search-drawer__form');
        if (form) {
          e.preventDefault();
          const formInput = form.querySelector('input[type="search"], input[name="q"]');
          const query = formInput ? formInput.value.trim() : (this.input ? this.input.value.trim() : '');
          if (query) {
            this.syncInputs(query);
            this.open();
            this.toggleClearBtn();
            this.fetchResults(query);
          }
        }
      });

      // 2. Intercept click on search submit button
      document.addEventListener('click', (e) => {
        const submitBtn = e.target.closest('.kb-header__search-submit, .search-page__submit, .kb-search-drawer__submit');
        if (submitBtn) {
          const form = submitBtn.closest('form');
          if (form) {
            e.preventDefault();
            const formInput = form.querySelector('input[type="search"], input[name="q"]');
            const query = formInput ? formInput.value.trim() : '';
            if (query) {
              this.syncInputs(query);
              this.open();
              this.toggleClearBtn();
              this.fetchResults(query);
            }
          }
        }
      });

      // 3. Header Search Input typing & focus
      const mainSearchInput = document.querySelector('[data-typing-search], .search-page__input');

      if (mainSearchInput) {
        mainSearchInput.addEventListener('focus', () => {
          const query = mainSearchInput.value.trim();
          if (query.length >= 1) {
            this.open();
            this.syncInputs(query);
            this.toggleClearBtn();
            this.fetchResults(query);
          }
        });

        mainSearchInput.addEventListener('input', () => {
          const query = mainSearchInput.value.trim();
          this.syncInputs(query);

          if (query.length < 1) {
            this.close();
            return;
          }

          this.open();
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 200);
        });
      }

      // 4. Drawer search input typing
      if (this.input) {
        this.input.addEventListener('input', () => {
          const query = this.input.value.trim();
          this.syncInputs(query);

          if (query.length < 1) {
            this.close();
            return;
          }

          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            this.fetchResults(query);
          }, 200);
        });
      }

      // Close handlers (close button x, backdrop, ESC key)
      this.closeBtns.forEach((btn) => btn.addEventListener('click', () => this.close()));

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Header clear buttons
      document.querySelectorAll('[data-search-clear]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.close();
        });
      });

      // Drawer Clear button
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => {
          this.close();
        });
      }
    }

    checkUrlSearch() {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q');
      if (query && query.trim().length > 0) {
        this.syncInputs(query.trim());
        this.open();
        this.toggleClearBtn();
        this.fetchResults(query.trim());
      }
    }

    syncInputs(val) {
      if (this.input) this.input.value = val;
      document.querySelectorAll('[data-typing-search], .search-page__input').forEach(inp => {
        inp.value = val;
      });
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
      this.syncInputs('');
      this.toggleClearBtn();
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
        // Step 1: Query Shopify predictive search API
        const suggestUrl = `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,article,queries&resources[limit]=10`;
        const response = await fetch(suggestUrl);
        let products = [];
        let queries = [];

        if (response.ok) {
          const data = await response.json();
          const predictiveResults = data.resources?.results;
          if (predictiveResults) {
            products = predictiveResults.products || [];
            queries = predictiveResults.queries || [];
          }
        }

        // Step 2: Fallback to full search page HTML parsing if predictive search returned 0 products!
        if (products.length === 0) {
          const searchPageUrl = `/search?q=${encodeURIComponent(query)}&type=product`;
          const htmlRes = await fetch(searchPageUrl);
          if (htmlRes.ok) {
            const htmlText = await htmlRes.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const cardElements = doc.querySelectorAll('.product-card, .search-result-card, [role="listitem"]');
            const parsedProducts = [];
            const seenUrls = new Set();

            cardElements.forEach(card => {
              const link = card.querySelector('a[href*="/products/"]');
              if (!link) return;
              const url = link.getAttribute('href');
              if (!url || seenUrls.has(url)) return;
              seenUrls.add(url);

              const img = card.querySelector('img');
              const titleEl = card.querySelector('.product-card__title, .card__heading, h3, h4, .search-result-card__content') || link;
              const priceEl = card.querySelector('.price, .product-card__price, .price-item');

              const title = titleEl ? titleEl.textContent.trim() : 'Product';
              const imgUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
              const price = priceEl ? priceEl.textContent.trim() : '';

              parsedProducts.push({
                url,
                title,
                price,
                image: imgUrl
              });
            });

            if (parsedProducts.length > 0) {
              products = parsedProducts;
            }
          }
        }

        this.renderResults(query, { products, queries });
      } catch (err) {
        console.error('Predictive search error:', err);
      }
    }

    formatProductPrice(product) {
      let compareAtPrice = '';
      let price = '';

      if (product.compare_at_price || product.compare_at_price_min) {
        const rawCompare = parseFloat(product.compare_at_price || product.compare_at_price_min);
        const rawPrice = parseFloat(product.price);
        if (!isNaN(rawCompare) && rawCompare > rawPrice) {
          compareAtPrice = `₹${rawCompare.toFixed(2)}`;
        }
      }

      if (typeof product.price === 'number') {
        price = `₹${parseFloat(product.price).toFixed(2)}`;
      } else if (typeof product.price === 'string') {
        const matches = product.price.match(/(?:₹|Rs\.?|INR)?\s*[\d,]+(?:\.\d+)?/gi);
        if (matches && matches.length >= 2) {
          const p1 = parseFloat(matches[0].replace(/[^0-9.]/g, ''));
          const p2 = parseFloat(matches[1].replace(/[^0-9.]/g, ''));
          if (!isNaN(p1) && !isNaN(p2)) {
            if (p1 > p2) {
              compareAtPrice = `₹${p1.toFixed(2)}`;
              price = `₹${p2.toFixed(2)}`;
            } else if (p2 > p1) {
              compareAtPrice = `₹${p2.toFixed(2)}`;
              price = `₹${p1.toFixed(2)}`;
            } else {
              price = `₹${p1.toFixed(2)}`;
            }
          } else {
            price = matches[1].includes('₹') ? matches[1].trim() : `₹${matches[1].trim()}`;
          }
        } else if (matches && matches.length === 1) {
          const num = parseFloat(matches[0].replace(/[^0-9.]/g, ''));
          price = !isNaN(num) ? `₹${num.toFixed(2)}` : matches[0].trim();
        } else {
          price = product.price;
        }
      }

      if (compareAtPrice && compareAtPrice !== price) {
        return `<s class="kb-search-product-row__compare-price">${compareAtPrice}</s><span class="kb-search-product-row__price">${price}</span>`;
      }
      return `<span class="kb-search-product-row__price">${price}</span>`;
    }

    renderResults(query, results) {
      const { products = [], queries = [] } = results;

      // 1. Render Suggestions List (Left Column)
      if (this.suggestionList) {
        let suggestionItems = [];
        
        if (queries.length > 0) {
          suggestionItems = queries.map(q => q.text);
        } else {
          const set = new Set();
          set.add(query);
          products.forEach(p => {
            const words = p.title.split(' ');
            words.forEach(w => {
              if (w.toLowerCase().includes(query.toLowerCase()) && w.length > 2) {
                set.add(w.toLowerCase());
              }
            });
          });
          suggestionItems = Array.from(set).slice(0, 6);
        }

        this.suggestionList.innerHTML = suggestionItems.map((item) => {
          const highlighted = this.highlightText(item, query);
          return `
            <li class="kb-search-suggestion-item" data-suggestion-text="${item}">
              <svg class="kb-search-suggestion-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>${highlighted}</span>
            </li>
          `;
        }).join('');

        // Click handler on suggestions
        this.suggestionList.querySelectorAll('.kb-search-suggestion-item').forEach((li) => {
          li.addEventListener('click', () => {
            const text = li.dataset.suggestionText;
            this.syncInputs(text);
            this.toggleClearBtn();
            this.fetchResults(text);
          });
        });
      }

      // 2. Render Products (Right Column - Premium Kisanveda / Rosier Card Layout)
      if (this.productsContainer) {
        if (products.length > 0) {
          this.productsContainer.innerHTML = products.map((product) => {
            const priceHtml = this.formatProductPrice(product);
            const imgUrl = product.featured_image?.url || product.image || '';
            return `
              <div class="kb-search-product-row">
                <a href="${product.url}" class="kb-search-product-row__link">
                  <div class="kb-search-product-row__img-wrap">
                    ${imgUrl ? `<img src="${imgUrl}" alt="${product.title}" class="kb-search-product-row__img" loading="lazy">` : `<div class="kb-search-product-row__img-placeholder"></div>`}
                  </div>
                  <div class="kb-search-product-row__info">
                    <h4 class="kb-search-product-row__title">${this.highlightText(product.title, query)}</h4>
                    <div class="kb-search-product-row__meta">
                      ${priceHtml}
                    </div>
                  </div>
                  <span class="kb-search-product-row__arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            `;
          }).join('');
        } else {
          this.productsContainer.innerHTML = `<p style="color: #64748b; font-size: 0.9rem; padding: 0.5rem 0;">No products found matching "${query}".</p>`;
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
