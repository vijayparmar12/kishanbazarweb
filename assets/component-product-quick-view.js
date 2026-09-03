/**
 * Product Quick View Drawer Modal Manager (Rosier Foods Style UI)
 */
class ProductQuickViewManager {
  constructor() {
    this.modal = document.getElementById('KbQuickViewModal');
    if (!this.modal) return;

    this.imgEl = this.modal.querySelector('[data-qv-image]');
    this.titleEl = this.modal.querySelector('[data-qv-title]');
    this.priceEl = this.modal.querySelector('[data-qv-price]');
    this.compareEl = this.modal.querySelector('[data-qv-compare]');
    this.variantSelect = this.modal.querySelector('[data-qv-variant-select]');
    this.descEl = this.modal.querySelector('[data-qv-desc]');
    this.qtyCountEl = this.modal.querySelector('[data-qv-qty-count]');
    this.minusBtn = this.modal.querySelector('[data-qv-qty-minus]');
    this.plusBtn = this.modal.querySelector('[data-qv-qty-plus]');
    this.addBtn = this.modal.querySelector('[data-qv-add-btn]');

    this.currentQuantity = 1;
    this.currentVariantId = null;
    this.currentVariantAvailable = true;
    this.productData = null;

    this.bindEvents();
  }

  bindEvents() {
    // Close modal
    this.modal.querySelectorAll('[data-quick-view-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    // Quantity buttons
    if (this.minusBtn) {
      this.minusBtn.addEventListener('click', () => {
        if (this.currentQuantity > 1) {
          this.currentQuantity -= 1;
          this.updateQty();
        }
      });
    }
    if (this.plusBtn) {
      this.plusBtn.addEventListener('click', () => {
        this.currentQuantity += 1;
        this.updateQty();
      });
    }

    // Variant select change
    if (this.variantSelect) {
      this.variantSelect.addEventListener('change', (e) => {
        const varId = e.target.value;
        this.selectVariant(varId);
      });
    }

    // Add to cart click
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.addToCart());
    }

    // Global listener for quick view event
    document.addEventListener('greenbasket:quick-view', (e) => {
      if (e.detail) {
        this.open(e.detail);
      }
    });
  }

  updateQty() {
    if (this.qtyCountEl) this.qtyCountEl.textContent = String(this.currentQuantity);
  }

  formatMoney(cents) {
    if (typeof cents !== 'number') return '₹0.00';
    return `₹${(cents / 100).toFixed(2)}`;
  }

  isVariantAvailable(variant) {
    if (!variant) return false;

    // Check boolean, string, or numeric false
    const isAvailProp = variant.available;
    if (isAvailProp === false || isAvailProp === 'false' || isAvailProp === 0 || isAvailProp === '0') {
      return false;
    }

    const titleLower = String(variant.title || '').toLowerCase();
    if (titleLower.includes('sold out') || titleLower.includes('out of stock')) {
      return false;
    }

    if (variant.inventory_management && variant.inventory_policy === 'deny' && variant.inventory_quantity !== undefined && Number(variant.inventory_quantity) <= 0) {
      return false;
    }

    if (variant.inventory_quantity !== undefined && variant.inventory_quantity !== null && variant.inventory_policy !== 'continue' && Number(variant.inventory_quantity) <= 0) {
      return false;
    }

    return Boolean(isAvailProp);
  }

  setAddButtonState(isAvailable) {
    this.currentVariantAvailable = isAvailable;
    if (!this.addBtn) return;

    const qtyPill = this.modal.querySelector('.kb-quick-view__qty-pill');
    if (isAvailable) {
      this.addBtn.disabled = false;
      this.addBtn.removeAttribute('disabled');
      this.addBtn.style.setProperty('background-color', '#23421f', 'important');
      this.addBtn.style.setProperty('color', '#ffffff', 'important');
      this.addBtn.style.setProperty('opacity', '1', 'important');
      this.addBtn.style.setProperty('cursor', 'pointer', 'important');
      this.addBtn.textContent = 'ADD TO CART';
      if (qtyPill) {
        qtyPill.style.setProperty('display', 'flex', 'important');
        qtyPill.style.setProperty('opacity', '1', 'important');
        qtyPill.style.setProperty('pointer-events', 'auto', 'important');
      }
    } else {
      this.addBtn.disabled = true;
      this.addBtn.setAttribute('disabled', 'disabled');
      this.addBtn.style.setProperty('background-color', '#64748b', 'important');
      this.addBtn.style.setProperty('color', '#ffffff', 'important');
      this.addBtn.style.setProperty('opacity', '0.75', 'important');
      this.addBtn.style.setProperty('cursor', 'not-allowed', 'important');
      this.addBtn.textContent = 'SOLD OUT';
      if (qtyPill) {
        qtyPill.style.setProperty('display', 'none', 'important');
      }
    }
  }

  selectVariant(variantId) {
    if (!this.productData || !this.productData.variants) return;
    const variant = this.productData.variants.find((v) => String(v.id) === String(variantId));
    if (!variant) return;

    this.currentVariantId = variant.id;

    if (this.priceEl) {
      this.priceEl.textContent = this.formatMoney(variant.price);
    }
    if (this.compareEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        this.compareEl.textContent = this.formatMoney(variant.compare_at_price);
        this.compareEl.style.display = 'inline-block';
      } else {
        this.compareEl.style.display = 'none';
      }
    }
    if (variant.featured_image && variant.featured_image.src && this.imgEl) {
      this.imgEl.src = variant.featured_image.src;
    }

    const isAvail = this.isVariantAvailable(variant);
    this.setAddButtonState(isAvail);
  }

  async open(detail) {
    this.currentQuantity = 1;
    this.updateQty();
    this.productData = null;
    this.setAddButtonState(true);
    this.modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    const { handle, variantId, title, price, comparePrice, image, description, variantAvailable } = detail;
    if (variantAvailable === false || variantAvailable === 'false' || variantAvailable === 0 || variantAvailable === '0') {
      this.setAddButtonState(false);
    }

    // Prefill quick values if provided
    if (this.titleEl) this.titleEl.textContent = title || 'Product';
    if (this.priceEl) this.priceEl.textContent = price || '₹0';
    if (this.compareEl) {
      if (comparePrice) {
        this.compareEl.textContent = comparePrice;
        this.compareEl.style.display = 'inline-block';
      } else {
        this.compareEl.style.display = 'none';
      }
    }
    if (this.imgEl && image) this.imgEl.src = image;
    if (this.descEl && description) this.descEl.innerHTML = description;
    this.currentVariantId = variantId || null;

    // Fetch full product JSON if handle exists
    if (handle) {
      try {
        const res = await fetch(`/products/${handle}.js`);
        if (res.ok) {
          const data = await res.json();
          this.productData = data;
          this.populateProduct(data, variantId);
        }
      } catch (err) {
        console.warn('Quick view product fetch failed:', err);
      }
    }
  }

  populateProduct(data, preferredVariantId) {
    if (this.titleEl) this.titleEl.textContent = data.title;
    if (this.descEl && data.description) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.description;
      this.descEl.textContent = tempDiv.textContent.slice(0, 260) + '...';
    }
    if (this.imgEl && data.featured_image) {
      this.imgEl.src = data.featured_image;
    }

    // Populate variant select dropdown
    if (this.variantSelect && data.variants && data.variants.length > 0) {
      this.variantSelect.innerHTML = data.variants
        .map((v) => {
          const isAvail = this.isVariantAvailable(v);
          const label = isAvail ? v.title : `${v.title} - (Sold Out)`;
          return `<option value="${v.id}" data-available="${isAvail}" ${!isAvail ? 'data-sold-out="true" style="color: #ef4444; font-weight: 700;"' : ''}>${label}</option>`;
        })
        .join('');

      const preferredVariant = data.variants.find((v) => String(v.id) === String(preferredVariantId));
      const fallbackVariant = data.variants.find((v) => this.isVariantAvailable(v)) || data.variants[0];
      const selectedVariant = preferredVariant || fallbackVariant;

      if (selectedVariant) {
        this.variantSelect.value = String(selectedVariant.id);
        this.selectVariant(selectedVariant.id);
      }
    }
  }

  close() {
    this.modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  async addToCart() {
    if (!this.currentVariantId) return;
    if (!this.currentVariantAvailable) {
      this.setAddButtonState(false);
      return;
    }

    if (this.addBtn) {
      this.addBtn.disabled = true;
      this.addBtn.textContent = 'Adding...';
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: this.currentVariantId,
          quantity: this.currentQuantity,
        }),
      });

      if (response.ok) {
        const rootUrl = window.Shopify?.routes?.root || '/';
        const cartRes = await fetch(`${rootUrl}cart.js?_t=${Date.now()}`);
        const updatedCart = await cartRes.json();
        document.dispatchEvent(new CustomEvent('kb:cart:updated', { detail: { cart: updatedCart } }));
        if (window.openDrawer) {
          window.openDrawer(updatedCart);
        } else {
          const drawer = document.getElementById('CartDrawer');
          if (drawer) {
            drawer.removeAttribute('hidden');
            drawer.classList.add('is-open');
          }
        }
        this.close();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.description || errorData.message || 'This variant is unavailable.';
        if (/sold|stock|inventory|unavailable/i.test(message)) {
          this.setAddButtonState(false);
        }
        alert(message);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      if (this.addBtn && this.currentVariantAvailable) {
        this.addBtn.disabled = false;
        this.addBtn.textContent = 'ADD TO CART';
      }
    }
  }
}

const initQuickView = () => {
  if (!window.kbQuickView) {
    window.kbQuickView = new ProductQuickViewManager();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuickView);
} else {
  initQuickView();
}
