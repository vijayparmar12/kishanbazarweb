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

  const renderChooseOptionList = (product, listEl) => {
    if (!product || !product.variants || !listEl) return;

    listEl.innerHTML = product.variants.map((v) => {
      const qty = window._chooseOptionQuantities[v.id] || 0;
      const variantTitle = v.title !== 'Default Title' ? v.title : '';
      const displayTitle = variantTitle ? `${product.title}` : product.title;

      const isAvail = v.available !== false && (v.inventory_quantity === undefined || v.inventory_quantity > 0);
      let actionBtnHtml = '';
      if (!isAvail) {
        actionBtnHtml = `<button type="button" disabled style="background: #94a3b8; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; cursor: not-allowed; opacity: 0.7;">Sold Out</button>`;
      } else if (qty > 0) {
        actionBtnHtml = `<div class="kb-variant-qty-pill" style="display: flex; align-items: center; justify-content: space-between; border: 1.5px solid #0d6840; border-radius: 8px; width: 90px; height: 36px; padding: 0 6px; box-sizing: border-box; background: #ffffff;">
             <button type="button" data-choose-qty-minus="${v.id}" style="border: none; background: transparent; font-weight: 800; font-size: 1.1rem; color: #0d6840; cursor: pointer; padding: 0 4px;">-</button>
             <span style="font-weight: 800; font-size: 0.95rem; color: #0d6840;">${qty}</span>
             <button type="button" data-choose-qty-plus="${v.id}" style="border: none; background: transparent; font-weight: 800; font-size: 1.1rem; color: #0d6840; cursor: pointer; padding: 0 4px;">+</button>
           </div>`;
      } else {
        actionBtnHtml = `<button type="button" class="kb-variant-option-card__add-btn" data-choose-add-variant="${v.id}" style="background: #0d6840; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
             Add
           </button>`;
      }

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

  window.openChooseOptionModal = (handle, defaultVariantId) => {
    if (!handle) return;
    const cleanRoot = rootUrl.replace(/\/$/, '');
    fetch(`${cleanRoot}/products/${handle}.js`)
      .then((res) => res.json())
      .then((product) => {
        if (!product || !product.variants) return;
        window._variantComparePrices = window._variantComparePrices || {};
        product.variants.forEach((v) => {
          window._variantComparePrices[v.id] = v.compare_at_price || v.price;
        });

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

  const updateDrawer = (cart) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    if (!cart || !Array.isArray(cart.items)) {
      updateDrawerFromServer();
      return;
    }

    if (cart.item_count > 0 && cart.items.length === 0) {
      setTimeout(() => {
        updateDrawerFromServer();
      }, 80);
    }

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
            return `
          <article class="kb-cart-item kb-cart-item--compact" data-cart-line-item data-cart-line-key="${item.key}" data-cart-line-index="${index + 1}">
            <div class="kb-cart-item__media-wrap">
              <a class="kb-cart-item__media-link" href="${item.url}" aria-label="${item.product_title || ''}">
                ${item.image ? `<img class="kb-cart-item__image" src="${item.image.src || item.image}" alt="${item.product_title || ''}" loading="lazy">` : ''}
              </a>
            </div>

            <div class="kb-cart-item__content">
              <button class="kb-cart-item__remove-btn" type="button" aria-label="Remove item" data-cart-remove title="Remove item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>

              <h3 class="kb-cart-item__title"><a href="${item.url}">${item.product_title}</a></h3>

              <div class="kb-cart-item__variant-container" data-cart-variant-container="${item.key}">
                ${item.variant_title && item.variant_title !== 'Default Title' ? `<span class="kb-cart-item__variant-pill">${item.variant_title}</span>` : ''}
              </div>

              <div class="kb-cart-item__price-row">
                <span class="kb-cart-item__price" data-cart-line-price>${formatMoney(finalVal)}</span>
                ${hasCompare ? `<s class="kb-cart-item__compare">${formatMoney(compareVal)}</s>` : ''}
              </div>

              <div class="kb-cart-item__actions">
                <div class="kb-cart-item__control-pill">
                  <button class="kb-cart-item__qty-btn" type="button" aria-label="Decrease quantity" data-cart-qty-minus>-</button>
                  <input class="kb-cart-item__qty-input" type="number" min="1" step="1" value="${item.quantity}" inputmode="numeric" data-cart-quantity-input>
                  <button class="kb-cart-item__qty-btn" type="button" aria-label="Increase quantity" data-cart-qty-plus>+</button>
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

    const checkIsVariantSoldOut = (v, optionEl) => {
      if (optionEl && (optionEl.disabled || optionEl.dataset.available === 'false')) {
        return true;
      }
      if (v) {
        if (v.available === false) return true;
        if (v.inventory_management && v.inventory_policy === 'deny' && Number(v.inventory_quantity) <= 0) return true;
        if (v.inventory_quantity !== undefined && v.inventory_quantity !== null && Number(v.inventory_quantity) <= 0 && v.inventory_policy !== 'continue') return true;
      }
      return false;
    };

    // Hydrate cart item variant dropdown select boxes from product JSON
    if (cart.items && cart.items.length) {
      cart.items.forEach((item) => {
        if (!item.handle) return;
        fetch(`${rootUrl}products/${item.handle}.js`)
          .then((res) => (res.ok ? res.json() : null))
          .then((pData) => {
            if (!pData || !pData.variants || pData.variants.length <= 1) return;
            window._productVariantsMap = window._productVariantsMap || {};
            pData.variants.forEach((v) => {
              if (v.compare_at_price) {
                window._variantComparePrices[v.id] = v.compare_at_price;
              }
              window._productVariantsMap[v.id] = v;
            });
            const allVariants = pData.variants;
            const container = drawer.querySelector(`[data-cart-variant-container="${item.key}"]`);
            if (container) {
              const optionsHtml = allVariants
                .map((v) => {
                  const mapV = window._productVariantsMap[v.id] || v;
                  const isSold = checkIsVariantSoldOut(mapV, null);
                  const label = !isSold ? v.title : `${v.title} - (Sold Out)`;
                  const disabledAttr = isSold ? 'disabled data-available="false" style="color: #ef4444; font-weight: 700;"' : 'data-available="true"';
                  return `<option value="${v.id}" ${v.id === item.variant_id ? 'selected' : ''} ${disabledAttr}>${label}</option>`;
                })
                .join('');
              container.innerHTML = `<select class="kb-cart-item__variant-select" data-cart-item-variant-select data-line-key="${item.key}" data-current-qty="${item.quantity}" data-current-variant-id="${item.variant_id}" style="padding: 4px 24px 4px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer;">${optionsHtml}</select>`;
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

    const details = getLineDetails(select);
    if (!details) return;

    const { lineIndex, lineKey } = details;
    const selectedOption = select.selectedOptions[0];
    const oldVariantId = select.dataset.currentVariantId;
    const qty = parseInt(select.dataset.currentQty, 10) || 1;
    const newVariantId = select.value;

    if (!newVariantId || !lineKey || newVariantId === oldVariantId) return;

    select.disabled = true;
    select.style.opacity = '0.5';

    const isOptionDisabled = selectedOption && (selectedOption.disabled || selectedOption.dataset.available === 'false');
    const selectedVariantObj = window._productVariantsMap ? window._productVariantsMap[newVariantId] : null;
    const isObjSoldOut = selectedVariantObj && (selectedVariantObj.available === false || (selectedVariantObj.inventory_quantity !== undefined && Number(selectedVariantObj.inventory_quantity) <= 0 && selectedVariantObj.inventory_policy !== 'continue'));

    const isSoldOut = isOptionDisabled || isObjSoldOut;

    // If selected option or variant object is sold out, remove line item from cart immediately
    if (isSoldOut) {
      const variantTitle = selectedOption ? selectedOption.textContent.replace(/\s*-\s*\(Sold Out\)/i, '').trim() : 'selected variant';
      alert(`Sorry, ${variantTitle} is currently sold out and has been removed from your cart.`);
      await changeCartLine(lineIndex, lineKey, 0);
      return;
    }

    try {
      // 1. Attempt to add new variant FIRST
      const addRes = await fetch(`${rootUrl}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: newVariantId, quantity: qty })
      });

      if (!addRes.ok) {
        const errJson = await addRes.json().catch(() => ({}));
        const errMsg = errJson.description || errJson.message || 'Selected variant is sold out.';
        alert(`Cannot select variant: ${errMsg}. Item has been removed from your cart.`);
        await changeCartLine(lineIndex, lineKey, 0);
        return;
      }

      // 2. Only if add succeeded, remove the old line item
      await changeCartLine(lineIndex, lineKey, 0);
    } catch (err) {
      console.error('Error swapping cart variant:', err);
      if (oldVariantId) select.value = oldVariantId;
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
        const errData = await response.json().catch(() => ({}));
        const msg = errData.description || errData.message || 'Cannot add more of this variant to cart (stock limit reached).';
        alert(msg);
        updateDrawerFromServer();
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

  const formatAndMergeAddedItem = async (addedData, existingCart) => {
    try {
      const freshCartResponse = await fetch(`${rootUrl}cart.js?_t=${Date.now()}_fresh`);
      const freshCart = await freshCartResponse.json();
      if (freshCart && freshCart.items && freshCart.items.length > 0) {
        updateDrawer(freshCart);
        return freshCart;
      }
    } catch (e) {}

    const itemsArray = Array.isArray(addedData?.items) ? addedData.items : (addedData?.id ? [addedData] : []);
    if (itemsArray.length === 0) return existingCart;

    const formattedItems = itemsArray.map((item, idx) => ({
      key: item.key || `${item.id}:${idx}`,
      id: item.id,
      variant_id: item.variant_id || item.id,
      handle: item.handle || '',
      product_title: item.product_title || item.title || 'Product',
      variant_title: item.variant_title || item.title || '',
      price: item.price || item.final_price || 0,
      line_price: item.line_price || item.final_line_price || ((item.price || 0) * (item.quantity || 1)),
      final_line_price: item.final_line_price || item.line_price || ((item.price || 0) * (item.quantity || 1)),
      quantity: item.quantity || 1,
      image: item.image || item.featured_image?.src || item.featured_image || '',
      url: item.url || `/products/${item.handle || ''}`
    }));

    const mergedCart = {
      ...(existingCart || {}),
      item_count: formattedItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
      total_price: formattedItems.reduce((sum, i) => sum + (i.final_line_price || 0), 0),
      items: formattedItems
    };

    updateDrawer(mergedCart);
    return mergedCart;
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
        const addedData = await response.json();
        await new Promise((r) => setTimeout(r, 120));
        let cart = await updateDrawerFromServer();
        if (!cart || !cart.items || cart.items.length === 0) {
          cart = await formatAndMergeAddedItem(addedData, cart);
        }
        openDrawer(cart);
      }
    } catch (err) {
      console.error('Error adding variant to cart:', err);
    }
  };

  const openDrawer = (cartData = null) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    if (cartData && Array.isArray(cartData.items) && cartData.items.length > 0) {
      updateDrawer(cartData);
    } else {
      updateDrawerFromServer();
    }

    drawer.hidden = false;
    drawer.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
    initTrackDragScroll();
  };

  window.openDrawer = openDrawer;

  const updateDrawerFromServer = async () => {
    try {
      const response = await fetch(`${rootUrl}cart.js?_t=${Date.now()}`);
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

      const currentQty = Number(details.input?.value || 1);
      const nextQty = currentQty - 1;

      if (nextQty <= 0) {
        changeCartLine(details.lineIndex, details.lineKey, 0);
      } else {
        if (details.input) details.input.value = nextQty;
        changeCartLine(details.lineIndex, details.lineKey, nextQty);
      }
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
      if (window._isFbtTrackDragging) return;
      event.preventDefault();
      event.stopPropagation();

      const btn = fbtCard.querySelector('.kb-cart-addon-add-btn') || fbtCard;
      const handle = btn.dataset.productHandle || fbtCard.dataset.productHandle;
      const defaultVariantId = btn.dataset.addVariantId || fbtCard.dataset.addVariantId;

      if (handle) {
        window.openChooseOptionModal(handle, defaultVariantId);
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
            window._chooseOptionQuantities = {};
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
        window._chooseOptionQuantities = {};
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
    if (event.target.closest('[data-address-form]')) {
      const form = event.target.closest('[data-address-form]');
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
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
      closeExpressCheckout();
    }
  });

  document.addEventListener('kb:cart:updated', (event) => {
    if (event.detail && event.detail.cart) {
      updateDrawer(event.detail.cart);
    } else {
      updateDrawerFromServer();
    }
  });

  const showCartToast = (cart) => {
    // Disabled as requested ("remove complete view cart mesg")
    const existing = document.querySelector('[data-kb-cart-toast]');
    if (existing) existing.remove();
  };

  window.showCartToast = showCartToast;

  const initAddToCartForms = () => {
    document.querySelectorAll('form[action*="/cart/add"]').forEach((form) => {
      if (form.dataset.ajaxAddInitialized === 'true') return;
      if (form.matches('[data-product-card-form]')) return; // Avoid duplicate submit listener for product cards
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

          const addedData = await addResponse.json();
          await new Promise((r) => setTimeout(r, 120));
          let updatedCart = await updateDrawerFromServer();
          if (!updatedCart || !updatedCart.items || updatedCart.items.length === 0) {
            updatedCart = await formatAndMergeAddedItem(addedData, updatedCart);
          }
          openDrawer(updatedCart);
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

  const initTrackDragScroll = () => {
    document.querySelectorAll('.kb-cart-addons-track').forEach((track) => {
      if (track.dataset.dragScrollInitialized === 'true') return;
      track.dataset.dragScrollInitialized = 'true';

      // 1. Mouse wheel horizontal scroll converter
      track.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          track.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      // 2. Mouse Drag Scroll
      let isDown = false;
      let startX, startY, scrollLeft;

      track.addEventListener('mousedown', (e) => {
        isDown = true;
        window._isFbtTrackDragging = false;
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        track.style.cursor = 'grabbing';
      });

      track.addEventListener('mouseleave', () => {
        isDown = false;
        track.style.cursor = 'grab';
      });

      track.addEventListener('mouseup', () => {
        isDown = false;
        track.style.cursor = 'grab';
        setTimeout(() => { window._isFbtTrackDragging = false; }, 80);
      });

      track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX);
        if (Math.abs(walk) > 4) {
          window._isFbtTrackDragging = true;
          e.preventDefault();
          track.scrollLeft = scrollLeft - walk * 1.5;
        }
      });

      // 3. Mobile touch drag support
      track.addEventListener('touchstart', (e) => {
        window._isFbtTrackDragging = false;
        if (e.touches && e.touches[0]) {
          startX = e.touches[0].pageX - track.offsetLeft;
          startY = e.touches[0].pageY;
          scrollLeft = track.scrollLeft;
        }
      }, { passive: true });

      track.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          const x = e.touches[0].pageX - track.offsetLeft;
          const y = e.touches[0].pageY;
          const walkX = Math.abs(x - startX);
          const walkY = Math.abs(y - startY);
          if (walkX > 6 && walkX > walkY) {
            window._isFbtTrackDragging = true;
          }
        }
      }, { passive: true });

      track.addEventListener('touchend', () => {
        setTimeout(() => { window._isFbtTrackDragging = false; }, 100);
      }, { passive: true });
    });

    // 4. Left / Right Arrow Buttons Click Event
    document.addEventListener('click', (e) => {
      const prevBtn = e.target.closest('[data-fbt-prev]');
      if (prevBtn) {
        const block = prevBtn.closest('.kb-cart-drawer__addons-block');
        const track = block?.querySelector('.kb-cart-addons-track');
        if (track) {
          track.scrollBy({ left: -220, behavior: 'smooth' });
        }
        return;
      }

      const nextBtn = e.target.closest('[data-fbt-next]');
      if (nextBtn) {
        const block = nextBtn.closest('.kb-cart-drawer__addons-block');
        const track = block?.querySelector('.kb-cart-addons-track');
        if (track) {
          track.scrollBy({ left: 220, behavior: 'smooth' });
        }
        return;
      }
    });
  };

  const autoOpenCart = () => {
    initAddToCartForms();
    initTrackDragScroll();
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