(() => {
  const STORAGE_KEY_WISHLIST = 'kb_wishlist_items';

  const getLogoUrl = () => {
    const logoImg = document.querySelector('.kb-header__logo-image');
    return logoImg ? logoImg.src : '';
  };

  const getProductCardImage = (btnElement) => {
    if (!btnElement) return '';
    const card = btnElement.closest('.product-card, .main-product, [data-product-card], article');
    if (card) {
      const img = card.querySelector('.product-card__image, .main-product__media img, img[src*="/cdn/shop/"], img');
      if (img && img.src && !img.src.includes('logo') && !img.src.includes('KISANVEDA')) {
        return img.src;
      }
    }
    return '';
  };

  // Floating Toast Notification Pop-up
  const showWishlistToast = (message) => {
    const drawer = document.querySelector('[data-wishlist-drawer]');
    const enableToast = drawer ? drawer.dataset.enableToast !== 'false' : true;
    if (!enableToast || !message) return;

    // Remove existing toast if present
    const existing = document.querySelector('.kb-wishlist-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'kb-wishlist-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      '<span class="kb-wishlist-toast__msg">' + message + '</span>' +
      '<button type="button" class="kb-wishlist-toast__close" aria-label="Close notification">&times;</button>';

    document.body.appendChild(toast);

    toast.querySelector('.kb-wishlist-toast__close').addEventListener('click', () => {
      toast.classList.add('is-hiding');
      setTimeout(() => toast.remove(), 250);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('is-hiding');
        setTimeout(() => toast.remove(), 250);
      }
    }, 3500);
  };

  // Asynchronously fetch real product images from Shopify Storefront API
  const fetchStoreProducts = async () => {
    try {
      const response = await fetch('/collections/all/products.json?limit=30');
      if (response.ok) {
        const data = await response.json();
        return data.products || [];
      }
    } catch (e) {
      console.warn('Could not fetch store products json');
    }
    return [];
  };

  const getWishlist = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WISHLIST);
      if (stored === null) {
        localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify([]));
        return [];
      }
      return JSON.parse(stored);
    } catch (e) {
      return [];
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

  const syncProductImages = async () => {
    let items = getWishlist();
    if (!items || items.length === 0) return;

    let needsSave = false;
    const storeProducts = await fetchStoreProducts();

    if (storeProducts && storeProducts.length > 0) {
      items.forEach((item) => {
        const found = storeProducts.find((p) => p.handle === item.handle || String(p.id) === String(item.variantId));
        if (found) {
          const imgUrl = (found.images && found.images[0] && found.images[0].src) || found.featured_image;
          if (imgUrl && item.image !== imgUrl) {
            item.image = imgUrl;
            needsSave = true;
          }
        }
      });
    }

    if (needsSave) {
      saveWishlist(items);
    }
  };

  const renderWishlist = async (searchQuery = '') => {
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
    if (footerCount) footerCount.textContent = items.length + (items.length === 1 ? ' Item' : ' Items');

    const filtered = items.filter((item) => {
      if (!searchQuery) return true;
      return (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (grid) {
      grid.innerHTML = filtered.map((item) => {
        const imgSrc = item.image || getLogoUrl();
        const discountHtml = item.discount ? '<span class="kb-wishlist-card__badge-discount">-' + item.discount + '% OFF</span>' : '';
        const compareHtml = item.comparePrice ? '<s class="compare-price">' + item.comparePrice + '</s>' : '';

        return (
          '<article class="kb-wishlist-card" data-wishlist-card data-variant-id="' + item.variantId + '">' +
            '<div class="kb-wishlist-card__image-wrap">' +
              '<a href="/products/' + item.handle + '" class="kb-wishlist-card__image-link">' +
                '<img src="' + imgSrc + '" alt="' + (item.title || 'Product') + '" class="kb-wishlist-card__img" width="150" height="150">' +
              '</a>' +
              discountHtml +
            '</div>' +
            '<div class="kb-wishlist-card__content">' +
              '<button type="button" class="kb-wishlist-card__remove-btn" aria-label="Remove item" data-remove-wishlist data-variant-id="' + item.variantId + '">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<polyline points="3 6 5 6 21 6"></polyline>' +
                  '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                '</svg>' +
              '</button>' +
              '<h3 class="kb-wishlist-card__title">' +
                '<a href="/products/' + item.handle + '">' + item.title + '</a>' +
              '</h3>' +
              '<div class="kb-wishlist-card__price-row">' +
                '<div class="kb-wishlist-card__prices">' +
                  '<strong class="price">' + item.price + '</strong>' +
                  compareHtml +
                '</div>' +
                '<div class="kb-wishlist-card__unit"><span>' + (item.variant || '1 kg') + '</span></div>' +
              '</div>' +
              '<div class="kb-wishlist-card__actions">' +
                '<button type="button" class="kb-wishlist-btn kb-wishlist-btn--move-cart" data-move-to-cart data-variant-id="' + item.variantId + '">' +
                  '<span class="btn-text">MOVE TO CART</span>' +
                  '<span class="btn-loader" style="display: none;">⏳</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</article>'
        );
      }).join('');
    }
  };

  const removeFromWishlist = (variantId) => {
    let items = getWishlist();
    items = items.filter((item) => String(item.variantId) !== String(variantId));
    saveWishlist(items);
    renderWishlist();

    const drawer = document.querySelector('[data-wishlist-drawer]');
    const toastRemovedText = drawer ? drawer.dataset.toastRemoved : 'Item has been successfully removed from your wishlist';
    showWishlistToast(toastRemovedText);
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
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
      });
    } catch (e) {
      console.warn('Simulated Cart Add');
    }

    removeFromWishlist(variantId);

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
      console.warn('Simulated Move All to Cart');
    }

    saveWishlist([]);
    renderWishlist();
    closeWishlistDrawer();

    const cartTrigger = document.querySelector('[data-cart-drawer-trigger]');
    if (cartTrigger) cartTrigger.click();
  };

  // Event Delegation
  document.addEventListener('click', async (event) => {
    // 0. Wishlist Heart Button on Product Card or Product Page
    const wishlistBtn = event.target.closest('[data-wishlist-button]');
    if (wishlistBtn) {
      event.preventDefault();
      const variantId = wishlistBtn.dataset.variantId || (wishlistBtn.dataset.productHandle ? 'var-' + wishlistBtn.dataset.productHandle : 'var-' + Date.now());
      const handle = wishlistBtn.dataset.productHandle || '';
      const title = wishlistBtn.dataset.productTitle || 'Kishan Bazar Item';
      const price = wishlistBtn.dataset.productPrice || '₹1,875.00';
      const comparePrice = wishlistBtn.dataset.productCompare || '';
      const discount = wishlistBtn.dataset.productDiscount || '';
      const variant = wishlistBtn.dataset.productVariant || '1 kg';
      let image = wishlistBtn.dataset.productImage || getProductCardImage(wishlistBtn);

      let items = getWishlist();
      const existingIndex = items.findIndex((i) => {
        if (variantId && i.variantId && String(i.variantId) === String(variantId)) return true;
        if (handle && i.handle && i.handle === handle) return true;
        return false;
      });

      const drawer = document.querySelector('[data-wishlist-drawer]');

      if (existingIndex > -1) {
        items.splice(existingIndex, 1);
        wishlistBtn.classList.remove('is-active');
        wishlistBtn.setAttribute('aria-pressed', 'false');

        const toastRemovedText = drawer ? drawer.dataset.toastRemoved : 'Item has been successfully removed from your wishlist';
        showWishlistToast(toastRemovedText);
      } else {
        items.unshift({
          variantId,
          handle: handle || 'product-' + Date.now(),
          title,
          price,
          comparePrice,
          discount,
          variant,
          image: image || ''
        });
        wishlistBtn.classList.add('is-active');
        wishlistBtn.setAttribute('aria-pressed', 'true');

        const toastAddedText = drawer ? drawer.dataset.toastAdded : 'Item has been successfully added to your wishlist ❤️';
        showWishlistToast(toastAddedText);
        openWishlistDrawer();
      }
      saveWishlist(items);
      await syncProductImages();
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

    // 6. Search Clear Click
    if (event.target.closest('[data-wishlist-search-clear]')) {
      const input = document.querySelector('[data-wishlist-search-input]');
      if (input) {
        input.value = '';
        event.target.closest('[data-wishlist-search-clear]').style.display = 'none';
        renderWishlist('');
      }
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

  document.addEventListener('DOMContentLoaded', async () => {
    await syncProductImages();
    renderWishlist();
  });

  if (document.readyState !== 'loading') {
    syncProductImages().then(renderWishlist);
  }
})();
