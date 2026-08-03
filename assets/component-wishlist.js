(() => {
  const STORAGE_KEY_WISHLIST = 'kb_wishlist_items';

  const getLogoUrl = () => {
    const logoImg = document.querySelector('.kb-header__logo-image');
    return logoImg ? logoImg.src : '';
  };

  const DEFAULT_SAMPLE_ITEMS = [
    {
      handle: 'gir-a2-bilona-ghee',
      title: 'Gir A2 Bilona Ghee (1kg Glass Jar)',
      vendor: 'Kishan Bazar',
      variant: '1 kg / Glass Jar',
      price: '₹1,875.00',
      comparePrice: '₹2,100.00',
      discount: '11',
      rating: '4.9',
      reviews: '128',
      image: '',
      variantId: '45812930129'
    },
    {
      handle: 'organic-khapli-wheat-atta',
      title: 'Organic Khapli Wheat Atta (5kg Pack)',
      vendor: 'Kishan Bazar',
      variant: '5 kg / Stone Ground',
      price: '₹1,383.00',
      comparePrice: '₹1,500.00',
      discount: '8',
      rating: '4.8',
      reviews: '94',
      image: '',
      variantId: '45812930130'
    }
  ];

  const getWishlist = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WISHLIST);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(DEFAULT_SAMPLE_ITEMS));
        return DEFAULT_SAMPLE_ITEMS;
      }
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_SAMPLE_ITEMS;
    }
  };

  const saveWishlist = (items) => {
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const openWishlistDrawer = () => {
    const drawer = document.querySelector('[data-wishlist-drawer]');
    if (!drawer) return;
    drawer.removeAttribute('hidden');
    drawer.hidden = false;
    drawer.style.display = 'block';
    drawer.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
    renderWishlist();
  };

  const closeWishlistDrawer = () => {
    const drawer = document.querySelector('[data-wishlist-drawer]');
    if (!drawer) return;
    drawer.setAttribute('hidden', '');
    drawer.hidden = true;
    drawer.style.display = 'none';
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
  };

  const updateBadges = (count) => {
    document.querySelectorAll('[data-wishlist-count-badge], .kb-header__action--wishlist .kb-header__badge').forEach((badge) => {
      badge.textContent = String(count);
    });
  };

  const renderWishlist = (searchQuery = '') => {
    const items = getWishlist();
    const emptyState = document.querySelector('[data-wishlist-empty]');
    const grid = document.querySelector('[data-wishlist-items-grid]');
    const footer = document.querySelector('[data-wishlist-footer]');
    const footerCount = document.querySelector('[data-wishlist-footer-count]');

    updateBadges(items.length);

    if (!items || items.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (grid) grid.style.display = 'none';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (grid) grid.style.display = 'flex';
    if (footer) footer.style.display = 'flex';
    if (footerCount) footerCount.textContent = `${items.length} ${items.length === 1 ? 'Item' : 'Items'}`;

    const filtered = items.filter((item) => {
      if (!searchQuery) return true;
      return (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (grid) {
      grid.innerHTML = filtered.map((item) => {
        const imgSrc = item.image || getLogoUrl();
        return `
        <article class="kb-wishlist-card" data-wishlist-card data-variant-id="${item.variantId}">
          <div class="kb-wishlist-card__image-wrap">
            <a href="/products/${item.handle}" class="kb-wishlist-card__image-link">
              <img src="${imgSrc}" alt="${item.title}" class="kb-wishlist-card__img kb-wishlist-card__img--primary" width="150" height="150">
            </a>
            <button type="button" class="kb-wishlist-card__remove-btn" aria-label="Remove item" data-remove-wishlist data-variant-id="${item.variantId}">&times;</button>
            ${item.discount ? `<span class="kb-wishlist-card__badge-discount">-${item.discount}% OFF</span>` : ''}
          </div>
          <div class="kb-wishlist-card__content">
            <div class="kb-wishlist-card__vendor">${item.vendor || 'Kishan Bazar'}</div>
            <h3 class="kb-wishlist-card__title">
              <a href="/products/${item.handle}">${item.title}</a>
            </h3>
            <div class="kb-wishlist-card__rating">
              <span class="stars">★★★★★</span>
              <span class="rating-num">${item.rating || '4.9'}</span>
              <span class="reviews-count">(${item.reviews || '128'})</span>
            </div>
            <div class="kb-wishlist-card__variant">Unit: <strong>${item.variant || '1 kg'}</strong></div>
            <div class="kb-wishlist-card__price-row">
              <div class="kb-wishlist-card__prices">
                <strong class="price">${item.price}</strong>
                ${item.comparePrice ? `<s class="compare-price">${item.comparePrice}</s>` : ''}
              </div>
              <div class="kb-wishlist-card__stock">
                <span class="stock-badge in-stock">● In Stock</span>
              </div>
            </div>
            <div class="kb-wishlist-card__delivery"><span>🚀 Express Delivery available</span></div>
            <div class="kb-wishlist-card__actions">
              <button type="button" class="kb-wishlist-btn kb-wishlist-btn--move-cart" data-move-to-cart data-variant-id="${item.variantId}">
                <span class="btn-text">🛒 Move to Cart</span>
                <span class="btn-loader" style="display: none;">⏳</span>
              </button>
              <a href="/products/${item.handle}" class="kb-wishlist-btn kb-wishlist-btn--view">View Details</a>
            </div>
          </div>
        </article>
      `).join('');
    }
  };

  const removeFromWishlist = (variantId) => {
    let items = getWishlist();
    items = items.filter((item) => String(item.variantId) !== String(variantId));
    saveWishlist(items);
    renderWishlist();
  };

  const moveToCart = async (variantId, btnElement) => {
    if (btnElement) {
      const btnText = btnElement.querySelector('.btn-text');
      const btnLoader = btnElement.querySelector('.btn-loader');
      if (btnText) btnText.style.display = 'none';
      if (btnLoader) btnLoader.style.display = 'inline';
      btnElement.disabled = true;
    }

    try {
      // Add to Shopify AJAX Cart
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
      });
    } catch (e) {
      console.warn('Simulated AJAX cart add locally');
    }

    removeFromWishlist(variantId);

    // Open Cart Drawer
    const cartTrigger = document.querySelector('[data-cart-drawer-trigger]');
    if (cartTrigger) cartTrigger.click();
  };

  const moveAllToCart = async () => {
    const items = getWishlist();
    if (!items || items.length === 0) return;

    const moveAllBtn = document.querySelector('[data-move-all-to-cart]');
    if (moveAllBtn) {
      const btnText = moveAllBtn.querySelector('.btn-text');
      const btnLoader = moveAllBtn.querySelector('.btn-loader');
      if (btnText) btnText.style.display = 'none';
      if (btnLoader) btnLoader.style.display = 'inline';
      moveAllBtn.disabled = true;
    }

    try {
      const cartItems = items.map((item) => ({ id: item.variantId, quantity: 1 }));
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
      });
    } catch (e) {
      console.warn('Simulated move all to cart locally');
    }

    saveWishlist([]);
    renderWishlist();
    closeWishlistDrawer();

    const cartTrigger = document.querySelector('[data-cart-drawer-trigger]');
    if (cartTrigger) cartTrigger.click();
  };

  // Event Delegation
  document.addEventListener('click', (event) => {
    // 0. Wishlist Heart Button on Product Card or Product Page
    const wishlistBtn = event.target.closest('[data-wishlist-button]');
    if (wishlistBtn) {
      event.preventDefault();
      const variantId = wishlistBtn.dataset.variantId || 'sample-' + Date.now();
      const handle = wishlistBtn.dataset.productHandle || 'gir-a2-bilona-ghee';
      const title = wishlistBtn.dataset.productTitle || 'Gir A2 Bilona Ghee';
      const price = wishlistBtn.dataset.productPrice || '₹1,875.00';
      const comparePrice = wishlistBtn.dataset.productCompare || '';
      const discount = wishlistBtn.dataset.productDiscount || '';
      const variant = wishlistBtn.dataset.productVariant || '1 kg';
      const image = wishlistBtn.dataset.productImage || '';
      const vendor = wishlistBtn.dataset.productVendor || 'Kishan Bazar';

      let items = getWishlist();
      const existingIndex = items.findIndex((i) => String(i.variantId) === String(variantId) || i.handle === handle);

      if (existingIndex > -1) {
        items.splice(existingIndex, 1);
        wishlistBtn.classList.remove('is-active');
        wishlistBtn.setAttribute('aria-pressed', 'false');
      } else {
        items.unshift({
          variantId,
          handle,
          title,
          price,
          comparePrice,
          discount,
          variant,
          image,
          vendor,
          rating: '4.9',
          reviews: '128'
        });
        wishlistBtn.classList.add('is-active');
        wishlistBtn.setAttribute('aria-pressed', 'true');
        openWishlistDrawer();
      }
      saveWishlist(items);
      renderWishlist();
      return;
    }

    // 1. Wishlist Trigger Header Click
    if (event.target.closest('[data-wishlist-drawer-trigger], .kb-header__action--wishlist')) {
      event.preventDefault();
      openWishlistDrawer();
    }

    // 2. Wishlist Close Click
    if (event.target.closest('[data-wishlist-close]')) {
      closeWishlistDrawer();
    }

    // 3. Remove Single Item
    const removeBtn = event.target.closest('[data-remove-wishlist]');
    if (removeBtn) {
      const variantId = removeBtn.dataset.variantId;
      removeFromWishlist(variantId);
    }

    // 4. Move Single Item to Cart
    const moveBtn = event.target.closest('[data-move-to-cart]');
    if (moveBtn) {
      const variantId = moveBtn.dataset.variantId;
      moveToCart(variantId, moveBtn);
    }

    // 5. Move All to Cart
    if (event.target.closest('[data-move-all-to-cart]')) {
      moveAllToCart();
    }
  });

  // Live Search Input
  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-wishlist-search-input]')) {
      const val = event.target.value;
      const clearBtn = document.querySelector('[data-wishlist-search-clear]');
      if (clearBtn) clearBtn.style.display = val ? 'inline' : 'none';
      renderWishlist(val);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWishlistDrawer();
  });

  document.addEventListener('DOMContentLoaded', () => {
    renderWishlist();
  });
  if (document.readyState !== 'loading') {
    renderWishlist();
  }
})();
