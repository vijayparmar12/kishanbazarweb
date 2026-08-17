/* ==========================================================================
   KISHAN BAZAR - PREMIUM SHOPIFY PRODUCT PAGE INTERACTIVE SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initProductPage();
});

function initProductPage() {
  const container = document.querySelector('[data-kishanbazar-product-page]');
  if (!container) return;

  initGalleryZoomAndThumbnails(container);
  initVariantSelection(container);
  initQuantityStepper(container);
  initProductTabs(container);
  initReviewsAndModal(container);
  initRecommendationSlider(container);
  initShareAndWishlist(container);
  initStickyMobileBar(container);
}

/* ==========================================================================
   1. GALLERY THUMBNAILS & DESKTOP HOVER ZOOM LENS
   ========================================================================== */
function initGalleryZoomAndThumbnails(container) {
  const mainImg = container.querySelector('[data-gallery-main-image]');
  const zoomContainer = container.querySelector('[data-gallery-zoom-container]');
  const lens = container.querySelector('[data-gallery-zoom-lens]');
  const thumbs = container.querySelectorAll('[data-gallery-thumb]');
  const lightboxTrigger = container.querySelector('[data-gallery-lightbox-trigger]');
  const lightbox = container.querySelector('[data-gallery-lightbox]');
  const lightboxImg = container.querySelector('[data-gallery-lightbox-img]');
  const lightboxCloses = container.querySelectorAll('[data-gallery-lightbox-close]');

  if (!mainImg) return;

  // Thumbnail switching
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');

      const newSrc = thumb.getAttribute('data-image-src');
      const newZoom = thumb.getAttribute('data-zoom-src');

      if (newSrc) {
        mainImg.style.opacity = '0.4';
        setTimeout(() => {
          mainImg.src = newSrc;
          if (newZoom) mainImg.setAttribute('data-zoom-src', newZoom);
          mainImg.style.opacity = '1';
        }, 150);
      }
    });
  });

  // Desktop Hover Zoom Lens
  if (zoomContainer && lens) {
    zoomContainer.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 1024) return;

      const rect = zoomContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      lens.style.display = 'block';
      const lensWidth = 140;
      const lensHeight = 140;

      let lensX = x - lensWidth / 2;
      let lensY = y - lensHeight / 2;

      lensX = Math.max(0, Math.min(lensX, rect.width - lensWidth));
      lensY = Math.max(0, Math.min(lensY, rect.height - lensHeight));

      lens.style.left = `${lensX}px`;
      lens.style.top = `${lensY}px`;
      lens.style.width = `${lensWidth}px`;
      lens.style.height = `${lensHeight}px`;

      // Zoom effect scale
      const zoomRatio = 1.6;
      mainImg.style.transformOrigin = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
      mainImg.style.transform = `scale(${zoomRatio})`;
    });

    zoomContainer.addEventListener('mouseleave', () => {
      lens.style.display = 'none';
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transformOrigin = 'center center';
    });
  }

  // Lightbox Modal Trigger
  if (lightboxTrigger && lightbox && lightboxImg) {
    lightboxTrigger.addEventListener('click', () => {
      lightboxImg.src = mainImg.getAttribute('data-zoom-src') || mainImg.src;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
    });

    lightboxCloses.forEach((btn) => {
      btn.addEventListener('click', () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
      });
    });
  }
}

/* ==========================================================================
   2. LIVE WEIGHT VARIANT SWITCHER (250g, 500g, 1kg, 2kg)
   ========================================================================== */
function initVariantSelection(container) {
  const radioButtons = container.querySelectorAll('[data-variant-radio]');
  const priceSelling = container.querySelector('[data-product-price-selling]');
  const priceMrp = container.querySelector('[data-product-price-mrp]');
  const discountBadge = container.querySelector('[data-product-discount-badge]');
  const skuDisplay = container.querySelector('[data-product-sku-display]');
  const selectedVariantIdInput = container.querySelector('[data-product-selected-variant-id]');
  const selectedTitleLabel = container.querySelector('[data-selected-variant-title]');
  const availabilityStatus = container.querySelector('[data-product-availability-status]');
  const addToCartBtn = container.querySelector('[data-add-to-cart-button]');
  const addToCartText = container.querySelector('[data-add-to-cart-text]');

  // Sticky bar elements
  const stickyPrice = container.querySelector('[data-sticky-bar-price]');
  const stickyVariant = container.querySelector('[data-sticky-bar-variant]');

  radioButtons.forEach((radio) => {
    radio.addEventListener('change', () => {
      // Highlight selected pill
      const pills = container.querySelectorAll('.product-info__variant-pill');
      pills.forEach((p) => p.classList.remove('is-selected'));
      radio.closest('.product-info__variant-pill')?.classList.add('is-selected');

      const variantId = radio.getAttribute('data-variant-id');
      const title = radio.getAttribute('data-variant-title');
      const price = radio.getAttribute('data-price');
      const compare = radio.getAttribute('data-compare');
      const discount = radio.getAttribute('data-discount');
      const sku = radio.getAttribute('data-sku');
      const available = radio.getAttribute('data-available') === 'true';
      const img = radio.getAttribute('data-image');

      // Update hidden input
      if (selectedVariantIdInput && variantId) {
        selectedVariantIdInput.value = variantId;
      }

      // Update label
      if (selectedTitleLabel && title) {
        selectedTitleLabel.textContent = title;
      }

      // Update price
      if (priceSelling && price) {
        priceSelling.textContent = price;
      }

      // Update MRP & Discount
      if (priceMrp) {
        if (compare) {
          priceMrp.textContent = compare;
          priceMrp.style.display = 'inline';
        } else {
          priceMrp.style.display = 'none';
        }
      }

      if (discountBadge) {
        if (discount) {
          discountBadge.textContent = `Save ${discount}% OFF`;
          discountBadge.style.display = 'inline-block';
        } else {
          discountBadge.style.display = 'none';
        }
      }

      // Update SKU
      if (skuDisplay && sku) {
        skuDisplay.textContent = sku;
      }

      // Update Availability & Buttons
      if (availabilityStatus) {
        if (available) {
          availabilityStatus.innerHTML = `
            <span class="product-info__stock-dot is-in-stock"></span>
            <span class="product-info__stock-text">In Stock &bull; Ready to Dispatch in 24 Hours</span>
          `;
          if (addToCartBtn) addToCartBtn.removeAttribute('disabled');
          if (addToCartText) addToCartText.textContent = 'ADD TO CART';
        } else {
          availabilityStatus.innerHTML = `
            <span class="product-info__stock-dot is-out-of-stock"></span>
            <span class="product-info__stock-text">Temporarily Sold Out</span>
          `;
          if (addToCartBtn) addToCartBtn.setAttribute('disabled', 'disabled');
          if (addToCartText) addToCartText.textContent = 'SOLD OUT';
        }
      }

      // Update Sticky Bar
      if (stickyPrice && price) stickyPrice.textContent = price;
      if (stickyVariant && title) stickyVariant.textContent = title;

      // Update image if specified
      if (img) {
        const mainImg = container.querySelector('[data-gallery-main-image]');
        if (mainImg) mainImg.src = img;
      }
    });
  });
}

/* ==========================================================================
   3. QUANTITY STEPPER (+ / -)
   ========================================================================== */
function initQuantityStepper(container) {
  const minusBtn = container.querySelector('[data-quantity-minus]');
  const plusBtn = container.querySelector('[data-quantity-plus]');
  const input = container.querySelector('[data-quantity-input]');

  if (!input) return;

  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(input.value) || 1;
      if (val > 1) {
        input.value = val - 1;
      }
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      let val = parseInt(input.value) || 1;
      if (val < 20) {
        input.value = val + 1;
      }
    });
  }
}



/* ==========================================================================
   5. PRODUCT DETAILS TABS (9 TABS)
   ========================================================================== */
function initProductTabs(container) {
  const tabBtns = container.querySelectorAll('[data-tab-trigger]');
  const tabPanes = container.querySelectorAll('[data-tab-pane]');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab-trigger');

      tabBtns.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });

      tabPanes.forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('hidden', 'hidden');
      });

      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const activePane = container.querySelector(`[data-tab-pane="${target}"]`);
      if (activePane) {
        activePane.classList.add('is-active');
        activePane.removeAttribute('hidden');
      }
    });
  });
}

/* ==========================================================================
   6. CUSTOMER REVIEWS & FORM MODAL
   ========================================================================== */
function initReviewsAndModal(container) {
  const modalTrigger = container.querySelector('[data-review-modal-trigger]');
  const modal = container.querySelector('[data-review-modal]');
  const modalCloses = container.querySelectorAll('[data-review-modal-close]');
  const form = container.querySelector('[data-review-form]');
  const successMsg = container.querySelector('[data-review-success]');
  const starIcons = container.querySelectorAll('[data-star-picker] .star-picker-icon');
  const ratingInput = container.querySelector('[data-star-rating-val]');

  if (modalTrigger && modal) {
    modalTrigger.addEventListener('click', () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });

    modalCloses.forEach((btn) => {
      btn.addEventListener('click', () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // Star Picker
  starIcons.forEach((star) => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.getAttribute('data-star-num')) || 5;
      if (ratingInput) ratingInput.value = rating;

      starIcons.forEach((s) => {
        const sNum = parseInt(s.getAttribute('data-star-num'));
        if (sNum <= rating) {
          s.classList.add('is-selected');
        } else {
          s.classList.remove('is-selected');
        }
      });
    });
  });

  // Image Upload File Preview Handling
  const fileInput = container.querySelector('[data-review-file-input]');
  const previewGrid = container.querySelector('[data-image-preview-grid]');
  const dropzone = container.querySelector('[data-image-upload-dropzone]');

  if (fileInput && previewGrid) {
    fileInput.addEventListener('change', (e) => {
      previewGrid.innerHTML = '';
      const files = Array.from(e.target.files).slice(0, 5);
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const item = document.createElement('div');
          item.className = 'product-reviews__preview-item';
          item.innerHTML = `<img src="${event.target.result}" alt="Uploaded review photo">`;
          previewGrid.appendChild(item);
        };
        reader.readAsDataURL(file);
      });
    });

    if (dropzone) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('is-dragover');
        });
      });
      ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('is-dragover');
        });
      });
    }
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (successMsg) successMsg.style.display = 'block';

      setTimeout(() => {
        if (modal) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
        form.reset();
        if (previewGrid) previewGrid.innerHTML = '';
        if (successMsg) successMsg.style.display = 'none';
      }, 2000);
    });
  }

  // Helpful buttons
  const helpfulBtns = container.querySelectorAll('[data-helpful-btn]');
  helpfulBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      let text = btn.textContent.trim();
      let match = text.match(/\d+/);
      if (match) {
        let count = parseInt(match[0]) + 1;
        btn.textContent = `👍 Helpful (${count})`;
        btn.style.color = '#2e7d32';
        btn.disabled = true;
      }
    });
  });
}

/* ==========================================================================
   7. RECOMMENDED PRODUCTS SLIDER TRACK
   ========================================================================== */
function initRecommendationSlider(container) {
  const track = container.querySelector('[data-slider-track]');
  const prevBtn = container.querySelector('[data-slider-prev]');
  const nextBtn = container.querySelector('[data-slider-next]');

  if (!track) return;

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -300, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 300, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   8. SHARE & WISHLIST BUTTON TOGGLES
   ========================================================================== */
function initShareAndWishlist(container) {
  const shareBtn = container.querySelector('[data-share-button]');

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const title = shareBtn.getAttribute('data-share-title') || document.title;
      const url = shareBtn.getAttribute('data-share-url') || window.location.href;

      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          alert('Product link copied to clipboard!');
        });
      }
    });
  }
}

/* ==========================================================================
   9. STICKY MOBILE ADD TO CART BAR
   ========================================================================== */
function initStickyMobileBar(container) {
  const stickyBar = container.querySelector('[data-sticky-mobile-bar]');
  const mainAddBtn = container.querySelector('[data-add-to-cart-button]');
  const stickyAddBtn = container.querySelector('[data-sticky-add-to-cart-btn]');
  const mainForm = container.querySelector('[data-product-main-form]');

  if (!stickyBar || !mainAddBtn) return;

  window.addEventListener('scroll', () => {
    if (window.innerWidth >= 1024) {
      stickyBar.classList.remove('is-visible');
      stickyBar.setAttribute('aria-hidden', 'true');
      return;
    }

    const rect = mainAddBtn.getBoundingClientRect();
    if (rect.bottom < 0) {
      stickyBar.classList.add('is-visible');
      stickyBar.setAttribute('aria-hidden', 'false');
    } else {
      stickyBar.classList.remove('is-visible');
      stickyBar.setAttribute('aria-hidden', 'true');
    }
  });

  if (stickyAddBtn && mainForm) {
    stickyAddBtn.addEventListener('click', () => {
      mainForm.requestSubmit ? mainForm.requestSubmit() : mainForm.submit();
    });
  }
}
