(() => {
  const rootUrl = window.Shopify?.routes?.root || '/';

  const formatMoney = (value) => {
    const amount = Number(value || 0) / 100;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: window.Shopify?.currency?.active || 'INR' }).format(amount);
  };

  const setCartCount = (count) => {
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
    });
  };

  const updateDrawer = (cart) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    setCartCount(cart.item_count);
    const title = drawer.querySelector('#CartDrawerTitle');
    if (title) title.textContent = `YOUR CART (${cart.item_count})`;

    const items = drawer.querySelector('[data-cart-drawer-items]');
    if (items) {
      items.innerHTML = cart.items.length
        ? cart.items.map((item, index) => {
            const hasCompare = item.original_line_price > item.final_line_price;
            const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
            return `
          <article class="kb-cart-item kb-cart-item--compact" data-cart-line-item data-cart-line-key="${item.key}" data-cart-line-index="${index + 1}">
            <a class="kb-cart-item__media" href="${item.url}" aria-label="${item.product_title || ''}">
              ${item.image ? `<img class="kb-cart-item__image" src="${item.image.src || item.image}" alt="${item.product_title || ''}" loading="lazy">` : ''}
            </a>
            <div class="kb-cart-item__body">
              <h3 class="kb-cart-item__title"><a href="${item.url}">${item.product_title}</a></h3>
              ${variantTitle ? `<p class="kb-cart-item__variant">${variantTitle}</p>` : ''}
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

      // Re-bind listeners for newly rendered cart items
      items.querySelectorAll('[data-cart-line-item]').forEach(bindCartItem);
    }

    const subtotal = drawer.querySelector('[data-cart-drawer-subtotal]');
    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);
  };

  const updateCheckoutLink = () => {
    const summary = document.querySelector('[data-cart-summary]');
    if (!summary) return;

    const link = summary.querySelector('[data-checkout-link]');
    const couponInput = summary.querySelector('[data-discount-code]');
    if (!link || !couponInput) return;

    const code = couponInput.value.trim();
    const url = new URL(link.href);
    if (code) {
      url.searchParams.set('discount', code);
    } else {
      url.searchParams.delete('discount');
    }
    link.href = url.toString();
  };

  const persistNote = async (summary) => {
    const noteField = summary.querySelector('[data-cart-note]');
    const giftWrapToggle = summary.querySelector('[data-gift-wrap-toggle]');
    if (!noteField) return;

    const note = noteField.value.trim();
    const noteParts = [];
    if (giftWrapToggle?.checked) noteParts.push('Gift wrap requested');
    if (note) noteParts.push(note);

    await fetch(`${rootUrl}cart/update.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ note: noteParts.join('\n') })
    });
  };

  const refreshMainCart = async (sectionId) => {
    const mainCart = document.querySelector('[data-main-cart]');
    if (!mainCart || !sectionId) return;

    const response = await fetch(`${window.location.pathname}?section_id=${sectionId}`);
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const nextSection = parsed.querySelector(`[data-cart-section-id="${sectionId}"]`);
    if (!nextSection) return;

    mainCart.outerHTML = nextSection.outerHTML;
    initCartPage();
  };

  const changeCartLine = async (lineKey, quantity, sectionId) => {
    const response = await fetch(`${rootUrl}cart/change.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ line: Number(lineKey), quantity })
    });

    const cart = await response.json();
    updateDrawer(cart);
    setCartCount(cart.item_count);
    await refreshMainCart(sectionId);
    document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart } }));
  };

  const bindCartItem = (item) => {
    const lineIndex = item.dataset.cartLineIndex;
    const sectionId = document.querySelector('[data-main-cart]')?.dataset.cartSectionId;
    const input = item.querySelector('[data-cart-quantity-input]');

    item.querySelector('[data-cart-qty-minus]')?.addEventListener('click', () => {
      const next = Math.max(1, Number(input?.value || 1) - 1);
      if (input) input.value = next;
      changeCartLine(lineIndex, next, sectionId);
    });

    item.querySelector('[data-cart-qty-plus]')?.addEventListener('click', () => {
      const next = Number(input?.value || 1) + 1;
      if (input) input.value = next;
      changeCartLine(lineIndex, next, sectionId);
    });

    input?.addEventListener('change', () => {
      const next = Math.max(1, Number(input.value || 1));
      input.value = next;
      changeCartLine(lineIndex, next, sectionId);
    });

    item.querySelector('[data-cart-remove]')?.addEventListener('click', () => {
      changeCartLine(lineIndex, 0, sectionId);
    });
  };

  const initRecommendations = () => {
    document.querySelectorAll('[data-cart-recommendations]').forEach(async (section) => {
      if (section.dataset.loaded === 'true') return;
      const productId = section.dataset.productId;
      if (!productId) return;

      const limit = section.dataset.limit || '4';
      try {
        const response = await fetch(`${rootUrl}recommendations/products?section_id=${section.dataset.sectionId}&product_id=${productId}&limit=${limit}`);
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const next = parsed.querySelector('[data-cart-recommendations]');
        if (next) {
          section.outerHTML = next.outerHTML;
          section.dataset.loaded = 'true';
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  const initCartPage = () => {
    document.querySelectorAll('[data-cart-line-item]').forEach((item) => {
      if (item.dataset.initialized === 'true') return;
      item.dataset.initialized = 'true';
      bindCartItem(item);
    });

    const summary = document.querySelector('[data-cart-summary]');
    if (summary && summary.dataset.initialized !== 'true') {
      summary.dataset.initialized = 'true';
      summary.querySelectorAll('[data-cart-note], [data-discount-code]').forEach((field) => {
        field.addEventListener('input', updateCheckoutLink);
      });
      summary.querySelector('[data-apply-discount]')?.addEventListener('click', updateCheckoutLink);
      summary.querySelector('[data-cart-note]')?.addEventListener('change', () => persistNote(summary));
      summary.querySelector('[data-gift-wrap-toggle]')?.addEventListener('change', () => persistNote(summary));
      updateCheckoutLink();
    }
  };

  const openDrawer = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    drawer.hidden = false;
    drawer.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
  };

  const closeDrawer = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    drawer.hidden = true;
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cart-drawer-trigger]');
    if (trigger) {
      event.preventDefault();
      openDrawer();
    }

    if (event.target.closest('[data-cart-drawer-close]')) {
      closeDrawer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  document.addEventListener('kb:cart:updated', (event) => {
    if (event.detail?.cart) updateDrawer(event.detail.cart);
  });

  document.addEventListener('DOMContentLoaded', () => {
    initCartPage();
    initRecommendations();
  });

  if (document.readyState !== 'loading') {
    initCartPage();
    initRecommendations();
  }
})();