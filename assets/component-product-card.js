/* Product Card In-Place Morphing Add to Cart & Stepper (- 1 +) JS */
(() => {
  if (document.documentElement.dataset.productCardInitialized === 'true') return;
  document.documentElement.dataset.productCardInitialized = 'true';

  const rootUrl = window.Shopify?.routes?.root || '/';

  // Helper to fetch current cart and sync product card stepper UI across the page
  const syncCartState = async () => {
    try {
      const res = await fetch(`${rootUrl}cart.js`);
      if (!res.ok) return;
      const cart = await res.json();

      // Create map of variantId -> quantity
      const cartVariantQtyMap = {};
      cart.items.forEach((item) => {
        cartVariantQtyMap[item.variant_id] = item.quantity;
      });

      // Update all product forms on page
      document.querySelectorAll('[data-product-card-form]').forEach((form) => {
        const variantInput = form.querySelector('[name="id"]');
        if (!variantInput) return;
        const variantId = parseInt(variantInput.value, 10);
        const qtyInCart = cartVariantQtyMap[variantId] || 0;

        const addBtn = form.querySelector('[data-card-add-btn]');
        const stepper = form.querySelector('[data-card-inline-stepper]');
        const countSpan = form.querySelector('[data-inline-count]');
        const container = form.querySelector('[data-card-btn-container]');

        if (qtyInCart > 0 && stepper && addBtn && countSpan) {
          form.classList.add('is-in-cart');
          if (container) container.classList.add('is-in-cart');
          addBtn.style.setProperty('display', 'none', 'important');
          stepper.style.setProperty('display', 'flex', 'important');
          countSpan.textContent = String(qtyInCart);
        } else if (stepper && addBtn) {
          form.classList.remove('is-in-cart');
          if (container) container.classList.remove('is-in-cart');
          stepper.style.setProperty('display', 'none', 'important');
          addBtn.style.setProperty('display', 'flex', 'important');
        }
      });
    } catch (e) {
      console.error('Cart sync error:', e);
    }
  };

  // 1. Listen for Form Submissions (Clicking ADD TO CART)
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-product-card-form]');
    if (!form) return;

    event.preventDefault();
    const addBtn = form.querySelector('[data-card-add-btn]');
    const stepper = form.querySelector('[data-card-inline-stepper]');
    const countSpan = form.querySelector('[data-inline-count]');
    const container = form.querySelector('[data-card-btn-container]');

    if (addBtn) addBtn.disabled = true;

    try {
      const addUrl = form.action.replace(/\/cart\/add(?:\.js)?$/, '/cart/add.js');
      const response = await fetch(addUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });

      if (!response.ok) throw new Error('Failed to add item to cart');

      // Morph button into [- 1 +] stepper in-place
      if (addBtn && stepper && countSpan) {
        form.classList.add('is-in-cart');
        if (container) container.classList.add('is-in-cart');
        addBtn.style.setProperty('display', 'none', 'important');
        stepper.style.setProperty('display', 'flex', 'important');
        countSpan.textContent = '1';
      }

      // Fetch updated cart and dispatch custom event (triggers floating toast without navigating)
      const cartRes = await fetch(`${rootUrl}cart.js`);
      const updatedCart = await cartRes.json();
      document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart: updatedCart } }));
      if (window.showCartToast) window.showCartToast(updatedCart);
    } catch (err) {
      console.error(err);
    } finally {
      if (addBtn) addBtn.disabled = false;
    }
  });

  // 2. Listen for In-Place Stepper Plus / Minus Clicks
  document.addEventListener('click', async (event) => {
    // Quick view
    const quickView = event.target.closest('[data-quick-view]');
    if (quickView) {
      document.dispatchEvent(new CustomEvent('greenbasket:quick-view', { detail: { url: quickView.dataset.productUrl } }));
    }

    const inlineBtn = event.target.closest('[data-inline-plus], [data-inline-minus]');
    if (!inlineBtn) return;

    event.preventDefault();
    const form = inlineBtn.closest('[data-product-card-form]');
    if (!form) return;

    const variantInput = form.querySelector('[name="id"]');
    if (!variantInput) return;
    const variantId = String(variantInput.value);

    const stepper = form.querySelector('[data-card-inline-stepper]');
    const addBtn = form.querySelector('[data-card-add-btn]');
    const countSpan = form.querySelector('[data-inline-count]');
    const container = form.querySelector('[data-card-btn-container]');
    let currentQty = parseInt(countSpan?.textContent || '1', 10);

    let nextQty = currentQty;
    if (inlineBtn.hasAttribute('data-inline-plus')) {
      nextQty = currentQty + 1;
    } else if (inlineBtn.hasAttribute('data-inline-minus')) {
      nextQty = currentQty - 1;
    }

    if (nextQty <= 0) {
      // Remove item from cart -> Morph back to ADD TO CART button
      form.classList.remove('is-in-cart');
      if (container) container.classList.remove('is-in-cart');
      stepper.style.setProperty('display', 'none', 'important');
      addBtn.style.setProperty('display', 'flex', 'important');

      try {
        const changeRes = await fetch(`${rootUrl}cart/change.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 0 })
        });
        const updatedCart = await changeRes.json();
        document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart: updatedCart } }));
      } catch (err) {
        console.error('Error removing item:', err);
      }
    } else {
      // Update quantity in cart silently
      if (countSpan) countSpan.textContent = String(nextQty);

      try {
        const changeRes = await fetch(`${rootUrl}cart/change.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: nextQty })
        });
        const updatedCart = await changeRes.json();
        document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart: updatedCart } }));
        if (window.showCartToast) window.showCartToast(updatedCart);
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    }
  });

  // 3. Variant Select Change Listener
  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-product-card-variant-select]');
    if (!select) return;

    const card = select.closest('[data-product-card]');
    if (!card) return;

    const option = select.selectedOptions[0];
    const price = card.querySelector('.product-card__price-current');
    const compare = card.querySelector('.product-card__price-compare');
    const add = card.querySelector('[data-card-add-btn]');

    if (price && option?.dataset.price) price.textContent = option.dataset.price;
    if (compare) {
      const compVal = option?.dataset.compare;
      if (compVal && compVal.trim() !== '' && compVal !== option.dataset.price) {
        compare.textContent = compVal;
        compare.style.display = 'block';
      } else {
        compare.style.display = 'none';
      }
    }
    if (add) {
      const disabled = option?.disabled;
      add.disabled = disabled;
      const labelSpan = add.querySelector('span');
      if (labelSpan) labelSpan.textContent = disabled ? 'SOLD OUT' : 'ADD TO CART';
    }

    // Dynamic Variant Badge Update
    const badgeText = option?.dataset.badge;
    let topBar = card.querySelector('.product-card__top-bar');
    if (!topBar) {
      const media = card.querySelector('.product-card__media');
      if (media) {
        topBar = document.createElement('div');
        topBar.className = 'product-card__top-bar';
        media.appendChild(topBar);
      }
    }

    let badgeEl = card.querySelector('.product-card__badge:not(.product-card__badge--sold)');
    if (badgeText && badgeText.trim() !== '') {
      if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'product-card__badge product-card__badge--loved';
        if (topBar) topBar.insertBefore(badgeEl, topBar.firstChild);
      }
      badgeEl.textContent = badgeText;
      badgeEl.style.display = 'inline-flex';
    } else {
      if (badgeEl) {
        badgeEl.style.display = 'none';
      }
    }

    // Sync stepper state for newly selected variant
    syncCartState();
  });

  // Initial cart sync on DOM Ready & Cart Updates
  document.addEventListener('DOMContentLoaded', syncCartState);
  document.addEventListener('kb:cart:updated', syncCartState);
  syncCartState();
})();
