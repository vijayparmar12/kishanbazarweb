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

    const isAvail = variant.available !== false && (variant.inventory_quantity === undefined || variant.inventory_quantity === null || variant.inventory_policy === 'continue' || variant.inventory_quantity > 0);

    if (this.addBtn) {
      if (!isAvail) {
        this.addBtn.disabled = true;
        this.addBtn.style.opacity = '0.65';
        this.addBtn.style.cursor = 'not-allowed';
        this.addBtn.textContent = 'SOLD OUT';
      } else {
        this.addBtn.disabled = false;
        this.addBtn.style.opacity = '1';
        this.addBtn.style.cursor = 'pointer';
        this.addBtn.textContent = 'Proceed';
      }
    }
  }

  async open(detail) {
    this.currentQuantity = 1;
    this.updateQty();
    this.modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    const { handle, variantId, title, price, comparePrice, image, description } = detail;

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
          const isAvail = v.available !== false && (v.inventory_quantity === undefined || v.inventory_quantity === null || v.inventory_policy === 'continue' || v.inventory_quantity > 0);
          const label = isAvail ? v.title : `${v.title} - (Sold Out)`;
          const isSelected = String(v.id) === String(preferredVariantId) || v === data.variants[0];
          if (isSelected) this.currentVariantId = v.id;
          return `<option value="${v.id}" ${isSelected ? 'selected' : ''} ${!isAvail ? 'disabled data-available="false" style="color: #ef4444;"' : 'data-available="true"'}>${label}</option>`;
        })
        .join('');

      this.selectVariant(this.currentVariantId);
    }
  }

  close() {
    this.modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  async addToCart() {
    if (!this.currentVariantId) return;

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
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      if (this.addBtn) {
        this.addBtn.disabled = false;
        this.addBtn.textContent = 'Add to cart';
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
