(() => {
  const rootUrl = window.Shopify?.routes?.root || '/';
  const STORAGE_KEY_ADDRESS = 'kb_checkout_address';

  const formatMoney = (value) => {
    const amount = Math.round(Number(value || 0) / 100);
    return 'Rs. ' + amount.toLocaleString('en-IN');
  };

  const setCartCount = (count) => {
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
    });
  };

  const getSavedAddress = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADDRESS);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const saveAddress = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY_ADDRESS, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const updateDrawer = (cart) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    setCartCount(cart.item_count);
    const title = drawer.querySelector('#CartDrawerTitle');
    if (title) title.textContent = `YOUR CART (${cart.item_count})`;

    const status = drawer.querySelector('[data-cart-drawer-status]');
    if (status) {
      if (cart.total_price >= 300000) {
        status.textContent = "🎉 Hurray! You've unlocked 10% OFF + FREE Shipping";
      } else if (cart.total_price >= 149900) {
        const remaining = 300000 - cart.total_price;
        status.textContent = `🎉 Hurray! You've unlocked FREE Shipping! Add ${formatMoney(remaining)} more for 10% OFF`;
      } else {
        const remaining = 149900 - cart.total_price;
        status.textContent = `Add ${formatMoney(remaining)} more for FREE Shipping`;
      }
    }

    const progressFill = drawer.querySelector('[data-cart-drawer-progress] .kb-cart-drawer__progress-fill');
    if (progressFill) {
      let pct = 0;
      if (cart.total_price >= 300000) {
        pct = 100;
      } else if (cart.total_price >= 149900) {
        pct = 50 + ((cart.total_price - 149900) / 150100) * 50;
      } else {
        pct = (cart.total_price / 149900) * 50;
      }
      progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    const marker1 = drawer.querySelector('.kb-cart-drawer__progress-marker--1');
    if (marker1) {
      marker1.classList.toggle('is-active', cart.total_price >= 149900);
    }
    const marker2 = drawer.querySelector('.kb-cart-drawer__progress-marker--2');
    if (marker2) {
      marker2.classList.toggle('is-active', cart.total_price >= 300000);
    }

    const items = drawer.querySelector('[data-cart-drawer-items]');
    if (items) {
      items.innerHTML = cart.items.length
        ? cart.items.map((item, index) => {
            const hasCompare = item.original_line_price > item.final_line_price;
            return `
          <article class="kb-cart-item kb-cart-item--compact" data-cart-line-item data-cart-line-key="${item.key}" data-cart-line-index="${index + 1}">
            <a class="kb-cart-item__media" href="${item.url}" aria-label="${item.product_title || ''}">
              ${item.image ? `<img class="kb-cart-item__image" src="${item.image.src || item.image}" alt="${item.product_title || ''}" loading="lazy">` : ''}
            </a>
            <div class="kb-cart-item__body">
              <h3 class="kb-cart-item__title"><a href="${item.url}">${item.product_title}</a></h3>
              ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="kb-cart-item__variant">${item.variant_title}</p>` : ''}
              <div class="kb-cart-item__pricing">
                <span class="kb-cart-item__price" data-cart-line-price>${formatMoney(item.final_line_price || item.line_price)}</span>
                ${hasCompare ? `<s class="kb-cart-item__compare">${formatMoney(item.original_line_price)}</s>` : ''}
              </div>
              <div class="kb-cart-item__actions">
                <div class="kb-cart-item__control-pill">
                  <button class="kb-cart-item__remove-btn" type="button" aria-label="Remove item" data-cart-remove>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                  <span class="kb-cart-item__pill-divider"></span>
                  <button class="kb-cart-item__qty-btn" type="button" aria-label="Decrease quantity" data-cart-qty-minus>-</button>
                  <input class="kb-cart-item__qty-input" type="number" min="1" step="1" value="${item.quantity}" inputmode="numeric" data-cart-quantity-input>
                  <button class="kb-cart-item__qty-btn" type="button" aria-label="Increase quantity" data-cart-qty-plus>+</button>
                </div>
              </div>
            </div>
          </article>`;
          }).join('')
        : `<div class="kb-cart-drawer__empty" data-cart-drawer-empty>
             <h2 class="kb-cart-drawer__empty-heading">Cart</h2>
             <p class="kb-cart-drawer__empty-text">Your cart is empty</p>
             <a href="/collections/all" class="kb-cart-drawer__empty-btn" data-cart-drawer-close>START SHOPPING</a>
           </div>`;
    }

    const offersBlock = drawer.querySelector('[data-cart-offers-block]');
    const addonsBlock = drawer.querySelector('.kb-cart-drawer__addons-block');
    const footer = drawer.querySelector('.kb-cart-drawer__footer');
    const promo = drawer.querySelector('.kb-cart-drawer__promo');
    const progress = drawer.querySelector('.kb-cart-drawer__progress');

    if (cart.item_count === 0) {
      if (offersBlock) offersBlock.style.display = 'none';
      if (addonsBlock) addonsBlock.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (promo) promo.style.display = 'none';
      if (progress) progress.style.display = 'none';
    } else {
      if (offersBlock) offersBlock.style.display = 'block';
      if (addonsBlock) addonsBlock.style.display = 'block';
      if (footer) footer.style.display = 'flex';
      if (promo) promo.style.display = 'grid';
      if (progress) progress.style.display = 'block';
    }

    const subtotal = drawer.querySelector('[data-cart-drawer-subtotal]');
    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);
  };

  const getLineDetails = (element) => {
    const lineItem = element.closest('[data-cart-line-item]');
    if (!lineItem) return null;

    const itemsContainer = lineItem.closest('[data-cart-drawer-items], .kb-cart-page__items') || lineItem.parentElement;
    const allItems = [...itemsContainer.querySelectorAll('[data-cart-line-item]')];
    const lineIndex = allItems.indexOf(lineItem) + 1; // 1-based index (1, 2, 3...)
    const lineKey = lineItem.dataset.cartLineKey || lineItem.dataset.cartLineIndex || String(lineIndex);
    const input = lineItem.querySelector('[data-cart-quantity-input]');

    return { lineItem, lineIndex, lineKey, input };
  };

  const changeCartLine = async (lineIndex, lineKey, quantity, sectionId) => {
    const payload = {
      line: Number(lineIndex),
      quantity: Number(quantity)
    };
    if (lineKey && String(lineKey).includes(':')) {
      payload.id = String(lineKey);
    }

    try {
      let response = await fetch(`${rootUrl}cart/change.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const formData = new FormData();
        formData.append('line', String(lineIndex));
        formData.append('quantity', String(quantity));
        if (lineKey && String(lineKey).includes(':')) {
          formData.append('id', String(lineKey));
        }

        response = await fetch(`${rootUrl}cart/change.js`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData
        });
      }

      if (!response.ok) {
        console.error('Cart update failed with status:', response.status);
        return;
      }

      const cart = await response.json();
      updateDrawer(cart);
      setCartCount(cart.item_count);
      document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart } }));
    } catch (error) {
      console.error('Error changing cart line:', error);
    }
  const addSingleVariantToCart = async (variantId, quantity = 1) => {
    try {
      const response = await fetch(`${rootUrl}cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          id: Number(variantId),
          quantity: Number(quantity)
        })
      });
      if (response.ok) {
        const cart = await updateDrawerFromServer();
        if (cart) showCartToast(cart);
        openDrawer();
      }
    } catch (err) {
      console.error('Error adding variant to cart:', err);
    }
  };

  const openDrawer = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    drawer.hidden = false;
    drawer.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
    updateDrawerFromServer();
  };

  const updateDrawerFromServer = async () => {
    try {
      const response = await fetch(`${rootUrl}cart.js`);
      const cart = await response.json();
      updateDrawer(cart);
      return cart;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const closeDrawer = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    drawer.hidden = true;
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
  };

  const openExpressCheckout = (step = 'auto') => {
    const modal = document.querySelector('[data-express-checkout]');
    if (!modal) {
      window.location.href = `${rootUrl}checkout`;
      return;
    }
    closeDrawer();

    modal.hidden = false;
    modal.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');

    const address = getSavedAddress();
    if (step === 'address' || (!address && step === 'auto')) {
      showCheckoutStep('address');
    } else {
      populateAddressSummary(address);
      showCheckoutStep('summary');
    }
  };

  const closeExpressCheckout = () => {
    const modal = document.querySelector('[data-express-checkout]');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
  };

  const showCheckoutStep = (stepName) => {
    const modal = document.querySelector('[data-express-checkout]');
    if (!modal) return;

    modal.querySelectorAll('[data-checkout-step]').forEach((el) => {
      el.style.display = el.dataset.checkoutStep === stepName ? 'block' : 'none';
    });
  };

  const populateAddressSummary = (addr) => {
    if (!addr) return;
    document.querySelectorAll('[data-summary-name], [data-display-name]').forEach((el) => {
      el.textContent = addr.name;
    });
    document.querySelectorAll('[data-summary-address], [data-display-address]').forEach((el) => {
      el.textContent = `${addr.flat}, ${addr.city}, ${addr.state}, India, ${addr.pincode}`;
    });
    document.querySelectorAll('[data-summary-contact], [data-display-contact]').forEach((el) => {
      el.textContent = `${addr.phone} • ${addr.email}`;
    });
    document.querySelectorAll('[data-summary-tag], [data-display-tag]').forEach((el) => {
      el.textContent = addr.tag || 'Home';
    });
  };

  // Global Event Delegation for all Cart Actions
  document.addEventListener('click', (event) => {
    // 1. Minus quantity button
    const minusBtn = event.target.closest('[data-cart-qty-minus]');
    if (minusBtn) {
      event.preventDefault();
      event.stopPropagation();
      const details = getLineDetails(minusBtn);
      if (!details) return;

      const currentQty = Math.max(1, Number(details.input?.value || 1));
      const nextQty = Math.max(1, currentQty - 1);
      if (details.input) details.input.value = nextQty;

      changeCartLine(details.lineIndex, details.lineKey, nextQty);
      return;
    }

    // 2. Plus quantity button
    const plusBtn = event.target.closest('[data-cart-qty-plus]');
    if (plusBtn) {
      event.preventDefault();
      event.stopPropagation();
      const details = getLineDetails(plusBtn);
      if (!details) return;

      const currentQty = Math.max(1, Number(details.input?.value || 1));
      const nextQty = currentQty + 1;
      if (details.input) details.input.value = nextQty;

      changeCartLine(details.lineIndex, details.lineKey, nextQty);
      return;
    }

    // 3. Remove / Trash button
    const removeBtn = event.target.closest('[data-cart-remove]');
    if (removeBtn) {
      event.preventDefault();
      event.stopPropagation();
      const details = getLineDetails(removeBtn);
      if (!details) return;

      changeCartLine(details.lineIndex, details.lineKey, 0);
      return;
    }

    // 4. Cart drawer trigger (open cart)
    const trigger = event.target.closest('[data-cart-drawer-trigger], a[href$="/cart"], a[href*="/cart?"]');
    if (trigger) {
      event.preventDefault();
      openDrawer();
      return;
    }

    // 5. Cart drawer close button / backdrop
    if (event.target.closest('[data-cart-drawer-close]')) {
      closeDrawer();
      return;
    }

    // 6. Trigger Express Checkout
    const expressBtn = event.target.closest('[data-trigger-express-checkout]');
    if (expressBtn) {
      window.location.href = '/checkout';
      return;
    }

    // 7. Express checkout close button / backdrop
    if (event.target.closest('[data-express-close]')) {
      closeExpressCheckout();
      return;
    }

    // 8. Go to address step
    if (event.target.closest('[data-goto-address-step]')) {
      showCheckoutStep('address');
      return;
    }

    // 9. Go to summary step
    if (event.target.closest('[data-goto-summary-step]')) {
      const address = getSavedAddress();
      if (!address) {
        const form = document.querySelector('[data-address-form]');
        if (form) form.style.display = 'block';
      } else {
        populateAddressSummary(address);
        showCheckoutStep('summary');
      }
      return;
    }

    // 10. Toggle New Address Form
    if (event.target.closest('[data-toggle-address-form]')) {
      const form = document.querySelector('[data-address-form]');
      if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
      }
      return;
    }

    // 11. Add-ons Tabs switching
    const tabBtn = event.target.closest('[data-cart-tab], [data-express-tab]');
    if (tabBtn) {
      const tabName = tabBtn.dataset.cartTab || tabBtn.dataset.expressTab;
      const container = tabBtn.closest('.kb-cart-drawer__addons-block, .kb-express-addons-block');
      if (container) {
        container.querySelectorAll('.kb-cart-tab-btn').forEach((b) => b.classList.remove('is-active'));
        tabBtn.classList.add('is-active');

        container.querySelectorAll('[data-tab-panel], [data-express-panel]').forEach((p) => {
          const name = p.dataset.tabPanel || p.dataset.expressPanel;
          p.style.display = name === tabName ? 'block' : 'none';
        });
      }
      return;
    }

    // 13. Open Coupons Modal
    const openCouponsBtn = event.target.closest('[data-open-coupons-modal]');
    if (openCouponsBtn) {
      const modal = document.querySelector('[data-coupons-modal]');
      if (modal) {
        modal.hidden = false;
        modal.classList.add('is-open');
      }
      return;
    }

    // 14. Close Coupons Modal
    const closeCouponsBtn = event.target.closest('[data-close-coupons-modal]');
    if (closeCouponsBtn) {
      const modal = document.querySelector('[data-coupons-modal]');
      if (modal) {
        modal.hidden = true;
        modal.classList.remove('is-open');
      }
      return;
    }

    // 15. Apply Coupon Click
    const applyCouponBtn = event.target.closest('[data-cart-apply-coupon]');
    if (applyCouponBtn) {
      const code = applyCouponBtn.dataset.couponCode || document.querySelector('[data-applied-coupon]')?.textContent?.trim() || 'TBOF10';
      sessionStorage.setItem('kb_active_coupon', code);
      fetch(`${rootUrl}discount/${encodeURIComponent(code)}`).catch(() => {});
      
      applyCouponBtn.textContent = 'Applied ✓';
      applyCouponBtn.style.backgroundColor = '#166534';
      applyCouponBtn.style.color = '#ffffff';

      setTimeout(() => {
        const modal = document.querySelector('[data-coupons-modal]');
        if (modal) {
          modal.hidden = true;
          modal.classList.remove('is-open');
        }
      }, 500);
      return;
    }

    // 16. Add-on "+ ADD" button click (Choose Option Modal for multi-variant products)
    const addonAddBtn = event.target.closest('.kb-cart-addon-add-btn');
    if (addonAddBtn) {
      event.preventDefault();
      const variantsCount = Number(addonAddBtn.dataset.variantsCount || 1);
      const handle = addonAddBtn.dataset.productHandle;
      const defaultVariantId = addonAddBtn.dataset.addVariantId;
      const productTitle = addonAddBtn.dataset.productTitle || 'Product';

      if (variantsCount > 1 && handle) {
        // Multi-variant product: fetch variants and open Choose Option modal
        fetch(`${rootUrl}products/${handle}.js`)
          .then((res) => res.json())
          .then((product) => {
            const modal = document.querySelector('[data-choose-option-modal]');
            const titleEl = modal?.querySelector('[data-choose-product-title]');
            const listEl = modal?.querySelector('[data-choose-options-list]');
            if (!modal || !listEl) return;

            if (titleEl) titleEl.textContent = product.title;
            window._activeChooseVariantId = product.variants[0].id;

            listEl.innerHTML = product.variants.map((v, idx) => `
              <div class="kb-variant-option-card ${idx === 0 ? 'is-selected' : ''}" data-choose-variant-card data-variant-id="${v.id}">
                <img src="${v.featured_image?.src || product.featured_image || ''}" alt="${v.title}" class="kb-variant-option-card__media">
                <div class="kb-variant-option-card__info">
                  <div class="kb-variant-option-card__title">${product.title}</div>
                  <div class="kb-variant-option-card__weight">${v.title}</div>
                  <div class="kb-variant-option-card__price">${formatMoney(v.price)}</div>
                </div>
                <button type="button" class="kb-variant-option-card__add-btn" data-choose-select-variant="${v.id}">
                  ${idx === 0 ? 'Add' : 'Add'}
                </button>
              </div>
            `).join('');

            modal.hidden = false;
            modal.classList.add('is-open');
          })
          .catch((err) => {
            console.error('Error fetching product variants:', err);
            if (defaultVariantId) addSingleVariantToCart(defaultVariantId);
          });
      } else if (defaultVariantId) {
        // Single variant product: add directly to cart
        addSingleVariantToCart(defaultVariantId);
      }
      return;
    }

    // 17. Close Choose Option Modal
    if (event.target.closest('[data-close-choose-option]')) {
      const modal = document.querySelector('[data-choose-option-modal]');
      if (modal) {
        modal.hidden = true;
        modal.classList.remove('is-open');
      }
      return;
    }

    // 18. Pick variant inside Choose Option Modal
    const pickVariantCard = event.target.closest('[data-choose-variant-card], [data-choose-select-variant]');
    if (pickVariantCard) {
      const variantId = pickVariantCard.dataset.variantId || pickVariantCard.dataset.chooseSelectVariant;
      if (variantId) {
        window._activeChooseVariantId = variantId;
        const modal = document.querySelector('[data-choose-option-modal]');
        modal?.querySelectorAll('[data-choose-variant-card]').forEach((card) => {
          card.classList.toggle('is-selected', card.dataset.variantId === String(variantId));
        });
      }
      return;
    }

    // 19. Confirm Choose Option Modal selection
    if (event.target.closest('[data-confirm-choose-option]')) {
      const variantId = window._activeChooseVariantId;
      if (variantId) {
        addSingleVariantToCart(variantId);
        const modal = document.querySelector('[data-choose-option-modal]');
        if (modal) {
          modal.hidden = true;
          modal.classList.remove('is-open');
        }
      }
      return;
    }

    // 12. Final Proceed to Pay button click
    if (event.target.closest('[data-final-proceed-to-pay]')) {
      const address = getSavedAddress();
      const activeCoupon = sessionStorage.getItem('kb_active_coupon') || 'TBOF10';
      let checkoutUrl = `${rootUrl}checkout`;
      if (address) {
        const params = new URLSearchParams({
          'checkout[shipping_address][first_name]': address.name.split(' ')[0] || '',
          'checkout[shipping_address][last_name]': address.name.split(' ').slice(1).join(' ') || '',
          'checkout[shipping_address][address1]': address.flat || '',
          'checkout[shipping_address][city]': address.city || '',
          'checkout[shipping_address][province]': address.state || '',
          'checkout[shipping_address][zip]': address.pincode || '',
          'checkout[shipping_address][phone]': address.phone || '',
          'discount': activeCoupon
        });
        checkoutUrl += `?${params.toString()}`;
      } else {
        checkoutUrl += `?discount=${encodeURIComponent(activeCoupon)}`;
      }
      window.location.href = checkoutUrl;
      return;
    }
  });

  // Handle Address Form Submission
  document.addEventListener('submit', (event) => {
    if (event.target.matches('[data-address-form]')) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const addressData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        flat: formData.get('flat'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
        tag: formData.get('tag') || 'Home'
      };
      saveAddress(addressData);
      populateAddressSummary(addressData);

      const list = document.querySelector('[data-address-list]');
      if (list) {
        list.innerHTML = `
          <div class="kb-express-address-card is-selected" data-address-id="saved">
            <div class="kb-express-address-header">
              <label class="kb-express-radio-label">
                <input type="radio" name="selected_address" value="saved" checked class="kb-express-radio">
                <span class="kb-express-tag">${addressData.tag}</span>
              </label>
              <button type="button" class="kb-express-edit-address-btn" data-toggle-address-form>&hellip;</button>
            </div>
            <div class="kb-express-address-content">
              <strong class="kb-express-address-name">${addressData.name}</strong>
              <p class="kb-express-address-text">${addressData.flat}, ${addressData.city}, ${addressData.state}, India, ${addressData.pincode}</p>
              <p class="kb-express-address-contact">${addressData.phone}, ${addressData.email}</p>
            </div>
          </div>`;
      }

      form.style.display = 'none';
      showCheckoutStep('summary');
    }
  });

  // Handle direct text input changes
  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-cart-quantity-input]')) {
      const input = event.target;
      const details = getLineDetails(input);
      if (!details) return;

      const nextQty = Math.max(1, Number(input.value || 1));
      input.value = nextQty;

      changeCartLine(details.lineIndex, details.lineKey, nextQty);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
      closeExpressCheckout();
    }
  });

  document.addEventListener('kb:cart:updated', (event) => {
    if (event.detail?.cart) updateDrawer(event.detail.cart);
  });

  const showCartToast = (cart) => {
    let toast = document.querySelector('[data-kb-cart-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.dataset.kbCartToast = 'true';
      toast.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 99999; background: #1b4317; color: #ffffff; padding: 0.75rem 1.25rem; border-radius: 14px; box-shadow: 0 12px 30px rgba(27, 67, 23, 0.4); display: flex; align-items: center; gap: 1rem; font-family: inherit; font-size: 0.9rem; font-weight: 800; animation: kbToastSlideUp 350ms cubic-bezier(0.16, 1, 0.3, 1);';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.1rem;">🌿</span>
        <span>${cart.item_count} ${cart.item_count === 1 ? 'item' : 'items'} added</span>
      </div>
      <button type="button" data-toast-open-cart style="background: #ffffff; color: #1b4317; border: none; padding: 0.4rem 0.85rem; border-radius: 8px; font-weight: 800; font-size: 0.82rem; cursor: pointer; white-space: nowrap;">View Cart &rarr;</button>
    `;

    const openBtn = toast.querySelector('[data-toast-open-cart]');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        openDrawer();
        toast.remove();
      });
    }

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 300ms ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  };

  window.showCartToast = showCartToast;

  const initAddToCartForms = () => {
    document.querySelectorAll('form[action*="/cart/add"]').forEach((form) => {
      if (form.dataset.ajaxAddInitialized === 'true') return;
      form.dataset.ajaxAddInitialized = 'true';

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('[type="submit"]');
        const originalSpan = submitButton?.querySelector('span');
        const originalText = originalSpan ? originalSpan.textContent : submitButton?.textContent;

        if (submitButton) {
          submitButton.disabled = true;
          if (originalSpan) {
            originalSpan.textContent = 'ADDING...';
          } else {
            submitButton.textContent = 'ADDING...';
          }
        }

        try {
          const addUrl = form.action.replace(/\/cart\/add(?:\.js)?$/, '/cart/add.js');
          const addResponse = await fetch(addUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json'
            },
            body: new FormData(form)
          });

          if (!addResponse.ok) throw new Error('Add to cart failed');

          const updatedCart = await updateDrawerFromServer();
          if (updatedCart) {
            showCartToast(updatedCart);
          }
          openDrawer();
        } catch (error) {
          console.error(error);
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            if (originalSpan) {
              originalSpan.textContent = originalText || 'ADD TO CART';
            } else {
              submitButton.textContent = originalText || 'ADD TO CART';
            }
          }
        }
      });
    });
  };

  const autoOpenCart = () => {
    initAddToCartForms();
    if (window.location.search.includes('open_cart')) {
      window.setTimeout(() => {
        openDrawer();
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.href.replace(/[\?&]open_cart=true/, '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }, 150);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoOpenCart);
  } else {
    autoOpenCart();
  }
})();