(() => {
  const rootUrl = window.Shopify?.routes?.root || '/';
  const STORAGE_KEY_ADDRESS = 'kb_checkout_address';

  const formatMoney = (value) => {
    const amount = Math.round(Number(value || 0) / 100);
    return '₹' + amount.toLocaleString('en-IN');
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
  window._chooseOptionQuantities = {};

  window.openChooseOptionModal = (handle, defaultVariantId) => {
    if (!handle) return;
    const cleanRoot = rootUrl.replace(/\/$/, '');
    fetch(`${cleanRoot}/products/${handle}.js`)
      .then((res) => res.json())
      .then((product) => {
        window._variantComparePrices = window._variantComparePrices || {};
        if (product && product.variants) {
          product.variants.forEach((v) => {
            window._variantComparePrices[v.id] = v.compare_at_price || v.price;
          });
        }

        const modal = document.querySelector('[data-choose-option-modal]');
        const titleEl = modal?.querySelector('[data-choose-product-title]');
        const listEl = modal?.querySelector('[data-choose-options-list]');
        if (!modal || !listEl) return;

        if (titleEl) titleEl.textContent = product.title;
        window._chooseOptionCurrentProduct = product;
        window._chooseOptionQuantities = {};

        if (product.variants && product.variants.length) {
          window._chooseOptionQuantities[product.variants[0].id] = 1;
        }

        renderChooseOptionList(product, listEl);

        modal.hidden = false;
        modal.classList.add('is-open');
      })
      .catch((err) => {
        console.error('Error fetching product variants:', err);
      });
  };

  document.addEventListener('kb:open:choose-option', (ev) => {
    const { handle, defaultVariantId } = ev.detail || {};
    if (handle && window.openChooseOptionModal) {
      window.openChooseOptionModal(handle, defaultVariantId);
    }
  });

  const renderChooseOptionList = (product, listEl) => {
    if (!product || !product.variants || !listEl) return;

    listEl.innerHTML = product.variants.map((v) => {
      const qty = window._chooseOptionQuantities[v.id] || 0;
      const variantTitle = v.title !== 'Default Title' ? v.title : '';
      const displayTitle = variantTitle ? `${product.title}` : product.title;

      const actionBtnHtml = qty > 0
        ? `<div class="kb-variant-qty-pill" style="display: flex; align-items: center; justify-content: space-between; border: 1.5px solid #0d6840; border-radius: 8px; width: 90px; height: 36px; padding: 0 6px; box-sizing: border-box; background: #ffffff;">
             <button type="button" data-choose-qty-minus="${v.id}" style="border: none; background: transparent; font-weight: 800; font-size: 1.1rem; color: #0d6840; cursor: pointer; padding: 0 4px;">-</button>
             <span style="font-weight: 800; font-size: 0.95rem; color: #0d6840;">${qty}</span>
             <button type="button" data-choose-qty-plus="${v.id}" style="border: none; background: transparent; font-weight: 800; font-size: 1.1rem; color: #0d6840; cursor: pointer; padding: 0 4px;">+</button>
           </div>`
        : `<button type="button" class="kb-variant-option-card__add-btn" data-choose-add-variant="${v.id}" style="background: #0d6840; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
             Add
           </button>`;

      return `
        <div class="kb-variant-option-card ${qty > 0 ? 'is-selected' : ''}" data-choose-variant-card data-variant-id="${v.id}">
          <img src="${v.featured_image?.src || product.featured_image || ''}" alt="${v.title}" class="kb-variant-option-card__media">
          <div class="kb-variant-option-card__info">
            <div class="kb-variant-option-card__title" style="font-weight: 700; font-size: 0.88rem; color: #1e293b; line-height: 1.3;">${displayTitle}</div>
            ${variantTitle ? `<div class="kb-variant-option-card__weight" style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">${variantTitle}</div>` : ''}
            <div class="kb-variant-option-card__price" style="font-weight: 800; font-size: 0.95rem; color: #1e293b; margin-top: 4px;">${formatMoney(v.price)}</div>
          </div>
          ${actionBtnHtml}
        </div>
      `;
    }).join('');
  };

  const updateDrawer = (cart) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    setCartCount(cart.item_count);
    const title = drawer.querySelector('#CartDrawerTitle');
    if (title) title.textContent = `YOUR CART (${cart.item_count})`;

    const status = drawer.querySelector('[data-cart-drawer-status]');
    if (status) {
      if (cart.total_price >= 149900) {
        status.textContent = "Hurray! You've unlocked FREE Shipping";
      } else {
        const remaining = 149900 - cart.total_price;
        status.textContent = `Add ${formatMoney(remaining)} more for FREE Shipping`;
      }
    }

    const progressFill = drawer.querySelector('[data-cart-drawer-progress] .kb-cart-drawer__progress-fill');
    if (progressFill) {
      let pct = (cart.total_price / 149900) * 100;
      progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    const marker1 = drawer.querySelector('.kb-cart-drawer__progress-marker--1');
    if (marker1) {
      marker1.classList.toggle('is-active', cart.total_price >= 149900);
    }

    const items = drawer.querySelector('[data-cart-drawer-items]');
    if (items) {
      items.innerHTML = cart.items.length
        ? cart.items.map((item, index) => {
            const compareUnit = window._variantComparePrices[item.variant_id] || (item.variant && item.variant.compare_at_price) || 0;
            const compareVal = (compareUnit > 0 ? compareUnit * item.quantity : 0) || item.original_line_price;
            const finalVal = item.final_line_price || item.line_price;
            const hasCompare = compareVal > finalVal;
            let saveBadgeHtml = '';
            if (hasCompare) {
              const itemSaved = compareVal - finalVal;
              const savePct = Math.round((itemSaved / compareVal) * 100);
              if (savePct > 0) {
                saveBadgeHtml = `<span class="kb-cart-item__save-badge">(${savePct}% OFF)</span>`;
              }
            }
            return `
          <article class="kb-cart-item kb-cart-item--compact" data-cart-line-item data-cart-line-key="${item.key}" data-cart-line-index="${index + 1}">
            <div class="kb-cart-item__top-row">
              <a class="kb-cart-item__media" href="${item.url}" aria-label="${item.product_title || ''}">
                ${item.image ? `<img class="kb-cart-item__image" src="${item.image.src || item.image}" alt="${item.product_title || ''}" loading="lazy">` : ''}
              </a>
              <div class="kb-cart-item__details">
                <h3 class="kb-cart-item__title"><a href="${item.url}">${item.product_title}</a></h3>
                <div class="kb-cart-item__variant-container" data-cart-variant-container="${item.key}">
                  ${item.variant_title && item.variant_title !== 'Default Title' ? `<span class="kb-cart-item__variant-pill">${item.variant_title}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="kb-cart-item__bottom-block">
              <div class="kb-cart-item__pricing">
                <span class="kb-cart-item__price" data-cart-line-price>${formatMoney(finalVal)}</span>
                ${hasCompare ? `<s class="kb-cart-item__compare">${formatMoney(compareVal)}</s>` : ''}
                ${saveBadgeHtml}
              </div>
              <div class="kb-cart-item__actions">
                <div class="kb-cart-item__control-pill">
                  <button class="kb-cart-item__qty-btn" type="button" aria-label="Decrease quantity" data-cart-qty-minus>-</button>
                  <input class="kb-cart-item__qty-input" type="number" min="1" step="1" value="${item.quantity}" inputmode="numeric" data-cart-quantity-input>
                  <button class="kb-cart-item__qty-btn" type="button" aria-label="Increase quantity" data-cart-qty-plus>+</button>
                  <span class="kb-cart-item__pill-divider"></span>
                  <button class="kb-cart-item__remove-btn" type="button" aria-label="Remove item" data-cart-remove title="Remove item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>
        `;
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
      drawer.classList.add('is-empty');
      if (offersBlock) offersBlock.style.setProperty('display', 'none', 'important');
      if (addonsBlock) addonsBlock.style.setProperty('display', 'none', 'important');
      if (footer) {
        footer.classList.add('is-empty');
        footer.style.setProperty('display', 'none', 'important');
      }
      if (promo) promo.style.setProperty('display', 'none', 'important');
      if (progress) progress.style.setProperty('display', 'none', 'important');
    } else {
      drawer.classList.remove('is-empty');
      if (offersBlock) offersBlock.style.setProperty('display', 'block', 'important');
      if (addonsBlock) addonsBlock.style.setProperty('display', 'block', 'important');
      if (footer) {
        footer.classList.remove('is-empty');
        footer.style.setProperty('display', 'flex', 'important');
      }
      if (promo) promo.style.setProperty('display', 'grid', 'important');
      if (progress) progress.style.setProperty('display', 'block', 'important');
    }
    const subtotal = drawer.querySelector('[data-cart-drawer-subtotal]');
    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);

    // Calculate dynamic savings across all line items (Rosier Foods Style)
    let totalCompare = 0;
    window._variantComparePrices = window._variantComparePrices || {};

    if (cart.items && cart.items.length) {
      cart.items.forEach((item) => {
        const cachedCompareUnit = window._variantComparePrices[item.variant_id] || item.variant?.compare_at_price;
        let itemCompare = 0;
        if (cachedCompareUnit && cachedCompareUnit > item.price) {
          itemCompare = cachedCompareUnit * item.quantity;
        } else if (item.original_line_price > item.final_line_price) {
          itemCompare = item.original_line_price;
        } else {
          itemCompare = item.final_line_price;
        }
        totalCompare += itemCompare;
      });
    }

    // Also check DOM elements for rendered data-compare-line-price
    if (totalCompare <= cart.total_price && drawer) {
      let domCompareSum = 0;
      drawer.querySelectorAll('[data-cart-line-item]').forEach((el) => {
        const cPrice = Number(el.dataset.compareLinePrice || 0);
        if (cPrice > 0) domCompareSum += cPrice;
      });
      if (domCompareSum > totalCompare) {
        totalCompare = domCompareSum;
      }
    }

    if (totalCompare <= cart.total_price && cart.original_total_price > cart.total_price) {
      totalCompare = cart.original_total_price;
    }

    const totalSaved = Math.max(0, totalCompare - cart.total_price);

    const ribbon = drawer.querySelector('[data-cart-savings-ribbon]');
    if (ribbon) {
      if (totalSaved > 0) {
        ribbon.style.display = 'flex';
        ribbon.innerHTML = `<span><strong>${formatMoney(totalSaved)}</strong> Saved so far!</span>`;
      } else {
        ribbon.style.display = 'none';
      }
    }

    const origPriceEl = drawer.querySelector('[data-cart-drawer-original-total]');
    const badgeEl = drawer.querySelector('[data-cart-drawer-save-badge]');
    if (origPriceEl) {
      if (totalSaved > 0) {
        origPriceEl.style.display = 'inline';
        origPriceEl.textContent = formatMoney(totalCompare);
      } else {
        origPriceEl.style.display = 'none';
      }
    }

    if (badgeEl) {
      badgeEl.style.display = 'none';
    }

    // Hydrate cart item variant dropdown select boxes
    if (cart.items && cart.items.length) {
      cart.items.forEach((item) => {
        if (!item.handle) return;
        fetch(`${rootUrl}products/${item.handle}.js`)
          .then((res) => (res.ok ? res.json() : null))
          .then((pData) => {
            if (!pData || !pData.variants) return;
            pData.variants.forEach((v) => {
              if (v.compare_at_price) {
                window._variantComparePrices[v.id] = v.compare_at_price;
              }
            });
            if (pData.variants.length <= 1) return;
            const container = drawer.querySelector(`[data-cart-variant-container="${item.key}"]`);
            if (container) {
              const optionsHtml = pData.variants
                .map((v) => `<option value="${v.id}" ${v.id === item.variant_id ? 'selected' : ''}>${v.title}</option>`)
                .join('');
              container.innerHTML = `<select class="kb-cart-item__variant-select" data-cart-item-variant-select data-line-key="${item.key}" data-current-qty="${item.quantity}">${optionsHtml}</select>`;
            }
          })
          .catch(() => {});
      });
    }
  };

  // Swapping cart item variant via dropdown
  document.addEventListener('change', async (e) => {
    const select = e.target.closest('[data-cart-item-variant-select]');
    if (!select) return;

    const newVariantId = select.value;
    const oldKey = select.dataset.lineKey;
    const qty = parseInt(select.dataset.currentQty, 10) || 1;

    if (!newVariantId || !oldKey) return;

    select.disabled = true;
    select.style.opacity = '0.5';

    try {
      // 1. Set old line item quantity to 0
      await fetch(`${rootUrl}cart/change.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: oldKey, quantity: 0 })
      });

      // 2. Add new variant with same quantity
      await fetch(`${rootUrl}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: newVariantId, quantity: qty })
      });

      // 3. Re-fetch cart & update drawer
      const cartRes = await fetch(`${rootUrl}cart.js`);
      const updatedCart = await cartRes.json();
      updateDrawer(updatedCart);
      document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart: updatedCart } }));
    } catch (err) {
      console.error('Error swapping cart variant:', err);
      select.disabled = false;
      select.style.opacity = '1';
    }
  });

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
  };

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

    // 16. FBT Card / "+ ADD" button click (Always open Choose Option Modal with variants & quantities)
    const fbtCard = event.target.closest('[data-fbt-card], .kb-cart-addon-add-btn');
    if (fbtCard) {
      event.preventDefault();
      event.stopPropagation();

      const btn = fbtCard.querySelector('.kb-cart-addon-add-btn') || fbtCard;
      const handle = btn.dataset.productHandle || fbtCard.dataset.productHandle;
      const defaultVariantId = btn.dataset.addVariantId || fbtCard.dataset.addVariantId;

      if (handle) {
        const cleanRoot = rootUrl.replace(/\/$/, '');
        fetch(`${cleanRoot}/products/${handle}.js`)
          .then((res) => res.json())
          .then((product) => {
            window._variantComparePrices = window._variantComparePrices || {};
            if (product && product.variants) {
              product.variants.forEach((v) => {
                window._variantComparePrices[v.id] = v.compare_at_price || v.price;
              });
            }

            const modal = document.querySelector('[data-choose-option-modal]');
            const titleEl = modal?.querySelector('[data-choose-product-title]');
            const listEl = modal?.querySelector('[data-choose-options-list]');
            if (!modal || !listEl) return;

            if (titleEl) titleEl.textContent = product.title;
            window._chooseOptionCurrentProduct = product;
            window._chooseOptionQuantities = {};

            if (product.variants && product.variants.length) {
              window._chooseOptionQuantities[product.variants[0].id] = 1;
            }

            renderChooseOptionList(product, listEl);

            modal.hidden = false;
            modal.classList.add('is-open');
          })
          .catch((err) => {
            console.error('Error fetching product variants:', err);
            if (defaultVariantId) addSingleVariantToCart(defaultVariantId);
          });
      } else if (defaultVariantId) {
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

    // 18. Add variant in Choose Option Modal
    const addVariantBtn = event.target.closest('[data-choose-add-variant]');
    if (addVariantBtn) {
      const varId = Number(addVariantBtn.dataset.chooseAddVariant);
      window._chooseOptionQuantities[varId] = 1;
      const modal = document.querySelector('[data-choose-option-modal]');
      const listEl = modal?.querySelector('[data-choose-options-list]');
      if (window._chooseOptionCurrentProduct && listEl) {
        renderChooseOptionList(window._chooseOptionCurrentProduct, listEl);
      }
      return;
    }

    // 19. Minus qty in Choose Option Modal
    const minusVariantBtn = event.target.closest('[data-choose-qty-minus]');
    if (minusVariantBtn) {
      const varId = Number(minusVariantBtn.dataset.chooseQtyMinus);
      const currentQty = window._chooseOptionQuantities[varId] || 0;
      window._chooseOptionQuantities[varId] = Math.max(0, currentQty - 1);
      const modal = document.querySelector('[data-choose-option-modal]');
      const listEl = modal?.querySelector('[data-choose-options-list]');
      if (window._chooseOptionCurrentProduct && listEl) {
        renderChooseOptionList(window._chooseOptionCurrentProduct, listEl);
      }
      return;
    }

    // 20. Plus qty in Choose Option Modal
    const plusVariantBtn = event.target.closest('[data-choose-qty-plus]');
    if (plusVariantBtn) {
      const varId = Number(plusVariantBtn.dataset.chooseQtyPlus);
      const currentQty = window._chooseOptionQuantities[varId] || 0;
      window._chooseOptionQuantities[varId] = currentQty + 1;
      const modal = document.querySelector('[data-choose-option-modal]');
      const listEl = modal?.querySelector('[data-choose-options-list]');
      if (window._chooseOptionCurrentProduct && listEl) {
        renderChooseOptionList(window._chooseOptionCurrentProduct, listEl);
      }
      return;
    }

    // 21. Confirm Choose Option Modal selection
    if (event.target.closest('[data-confirm-choose-option]')) {
      const itemsToAdd = [];
      Object.keys(window._chooseOptionQuantities || {}).forEach((varId) => {
        const q = window._chooseOptionQuantities[varId];
        if (q > 0) {
          itemsToAdd.push({ id: Number(varId), quantity: q });
        }
      });

      if (itemsToAdd.length > 0) {
        const cleanRoot = rootUrl.replace(/\/$/, '');
        fetch(`${cleanRoot}/cart/add.js`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ items: itemsToAdd })
        })
          .then((res) => res.json())
          .then(async () => {
            const modal = document.querySelector('[data-choose-option-modal]');
            if (modal) {
              modal.hidden = true;
              modal.classList.remove('is-open');
            }
            const updatedCart = await updateDrawerFromServer();
            if (updatedCart) showCartToast(updatedCart);
            openDrawer();
          })
          .catch((err) => console.error('Error adding selected variants to cart:', err));
      } else {
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