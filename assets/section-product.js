/* ==========================================================================
   KISHAN BAZAR - PREMIUM SHOPIFY PRODUCT PAGE INTERACTIVE SCRIPT
   ========================================================================== */

function initProductPage() {
  const container = document.querySelector('[data-kishanbazar-product-page], .product-info, [data-product-info], .main-product') || document.body;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPage);
} else {
  initProductPage();
}
document.addEventListener('shopify:section:load', initProductPage);

/* ==========================================================================
   1. GALLERY THUMBNAILS & DESKTOP HOVER ZOOM LENS
   ========================================================================== */
function initGalleryZoomAndThumbnails(container) {
  const mainImg = container.querySelector('[data-gallery-main-image]');
  const zoomContainer = container.querySelector('[data-gallery-zoom-container]');
  const lens = container.querySelector('[data-gallery-zoom-lens]');
  const thumbs = Array.from(container.querySelectorAll('[data-gallery-thumb]'));
  const dots = Array.from(container.querySelectorAll('[data-gallery-dot]'));
  const lightboxTrigger = container.querySelector('[data-gallery-lightbox-trigger]');
  const lightbox = container.querySelector('[data-gallery-lightbox]');
  const lightboxImg = container.querySelector('[data-gallery-lightbox-img]');
  const lightboxCloses = container.querySelectorAll('[data-gallery-lightbox-close]');
  const lightboxPrev = container.querySelector('[data-gallery-lightbox-prev]');
  const lightboxNext = container.querySelector('[data-gallery-lightbox-next]');
  const lightboxCounter = container.querySelector('[data-gallery-lightbox-counter]');

  if (!mainImg) return;

  let currentIndex = 0;

  function setActiveImage(index) {
    if (thumbs.length === 0) return;
    if (index < 0) index = thumbs.length - 1;
    if (index >= thumbs.length) index = 0;

    currentIndex = index;

    thumbs.forEach((t, i) => {
      if (i === currentIndex) {
        t.classList.add('is-active');
        t.setAttribute('aria-current', 'true');
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        t.classList.remove('is-active');
        t.removeAttribute('aria-current');
      }
    });

    dots.forEach((d, i) => {
      if (i === currentIndex) {
        d.classList.add('is-active');
      } else {
        d.classList.remove('is-active');
      }
    });

    const activeThumb = thumbs[currentIndex];
    if (activeThumb) {
      const newSrc = activeThumb.getAttribute('data-image-src');
      const newZoom = activeThumb.getAttribute('data-zoom-src');

      if (newSrc) {
        mainImg.style.opacity = '0.4';
        setTimeout(() => {
          mainImg.src = newSrc;
          if (newZoom) mainImg.setAttribute('data-zoom-src', newZoom);
          mainImg.style.opacity = '1';
        }, 120);
      }

      if (lightbox && lightbox.classList.contains('is-open') && lightboxImg) {
        lightboxImg.src = newZoom || newSrc;
        if (lightboxCounter) {
          lightboxCounter.textContent = `${currentIndex + 1} / ${thumbs.length}`;
        }
      }
    }
  }

  // Thumbnail Click Handlers
  thumbs.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => {
      setActiveImage(idx);
    });
  });

  // Dot Indicator Click Handlers
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      setActiveImage(idx);
    });
  });

  // Touch Swipe & Mouse Dragging for Main Image Container
  if (zoomContainer) {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    zoomContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }
    }, { passive: true });

    zoomContainer.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Check if horizontal swipe
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          setActiveImage(currentIndex + 1); // Swipe Left -> Next
        } else {
          setActiveImage(currentIndex - 1); // Swipe Right -> Prev
        }
      } else if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
        // Tap -> Open Lightbox Modal
        openLightbox();
      }
    }, { passive: true });

    // Click Main Image -> Open Lightbox Modal (Desktop)
    zoomContainer.addEventListener('click', (e) => {
      if (window.innerWidth >= 1024 && e.target !== lens) {
        openLightbox();
      }
    });
  }

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

  // Lightbox Modal Implementation
  function openLightbox() {
    if (!lightbox || !lightboxImg) return;
    const activeThumb = thumbs[currentIndex];
    const zoomSrc = activeThumb ? activeThumb.getAttribute('data-zoom-src') : mainImg.getAttribute('data-zoom-src');
    lightboxImg.src = zoomSrc || mainImg.src;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');

    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${thumbs.length || 1}`;
    }
  }

  if (lightboxTrigger) {
    lightboxTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox();
    });
  }

  if (lightbox) {
    lightboxCloses.forEach((btn) => {
      btn.addEventListener('click', () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
      });
    });

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveImage(currentIndex - 1);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveImage(currentIndex + 1);
      });
    }

    // Lightbox Touch Swipe
    let lbStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) lbStartX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].clientX - lbStartX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) setActiveImage(currentIndex + 1);
        else setActiveImage(currentIndex - 1);
      }
    }, { passive: true });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
      } else if (e.key === 'ArrowLeft') {
        setActiveImage(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        setActiveImage(currentIndex + 1);
      }
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
      const isRadioAvail = radio.getAttribute('data-available') === 'true';
      const invQty = radio.getAttribute('data-inventory');
      const invPolicy = radio.getAttribute('data-policy');
      const invMgmt = radio.getAttribute('data-management');
      const img = radio.getAttribute('data-image');

      let available = isRadioAvail;
      if (invMgmt && invPolicy === 'deny' && parseInt(invQty, 10) <= 0) {
        available = false;
      } else if (invQty !== null && invQty !== '' && parseInt(invQty, 10) <= 0 && invPolicy !== 'continue') {
        available = false;
      }

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

      // Update Dynamic Savings Box
      const savingsBanner = container.querySelector('[data-product-savings-banner], [data-product-coins-banner]');
      const savingsText = container.querySelector('[data-product-savings-text], [data-product-coins-text]');
      if (savingsBanner && price) {
        let template = savingsBanner.getAttribute('data-savings-template') || savingsBanner.getAttribute('data-label-template') || 'Save ₹{savings} on this order';
        if (template.includes('{coins}')) {
          template = 'Save ₹{savings} on this order';
        }
        const numericPrice = parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
        const numericCompare = compare ? parseInt(compare.replace(/[^0-9]/g, ''), 10) : 0;
        const savings = numericCompare > numericPrice ? (numericCompare - numericPrice) : 0;

        if (savingsText) {
          if (savings > 0) {
            savingsText.innerHTML = template.replace('{savings}', savings.toLocaleString('en-IN'));
          } else {
            savingsText.innerHTML = 'Special Discount Applied';
          }
        }
      }

      // Update SKU
      if (skuDisplay && sku) {
        skuDisplay.textContent = sku;
      }

      // Update Availability & Buttons for Main Form and Mobile Sticky Bar
      const stickyBtn = container.querySelector('[data-sticky-add-to-cart-btn], [data-sticky-add-to-cart]');
      const stickyBtnText = container.querySelector('[data-sticky-btn-text]');
      const stickyStepper = container.querySelector('[data-sticky-stepper], .sticky-mobile-bar__quantity-stepper');
      const stepper = container.querySelector('[data-card-inline-stepper]');
      const buyNowBtn = container.querySelector('[data-buy-now-button]');
      const cartSvg = addToCartBtn ? addToCartBtn.querySelector('svg') : null;

      if (available) {
        if (availabilityStatus) {
          availabilityStatus.innerHTML = `
            <span class="product-info__stock-dot is-in-stock"></span>
            <span class="product-info__stock-text">In Stock &bull; Ready to Dispatch in 24 Hours</span>
          `;
        }
        if (addToCartBtn) {
          addToCartBtn.removeAttribute('disabled');
          addToCartBtn.disabled = false;
          addToCartBtn.style.setProperty('opacity', '1', 'important');
          addToCartBtn.style.setProperty('cursor', 'pointer', 'important');
          addToCartBtn.style.removeProperty('background-color');
          addToCartBtn.style.removeProperty('color');
        }
        if (addToCartText) addToCartText.textContent = 'ADD TO CART';
        if (cartSvg) cartSvg.style.removeProperty('display');

        if (buyNowBtn) {
          buyNowBtn.removeAttribute('disabled');
          buyNowBtn.disabled = false;
          buyNowBtn.style.setProperty('opacity', '1', 'important');
          buyNowBtn.style.setProperty('cursor', 'pointer', 'important');
          buyNowBtn.style.removeProperty('display');
        }

        if (stickyBtn) {
          stickyBtn.removeAttribute('disabled');
          stickyBtn.disabled = false;
          stickyBtn.textContent = 'ADD TO CART';
          stickyBtn.style.setProperty('opacity', '1', 'important');
          stickyBtn.style.setProperty('cursor', 'pointer', 'important');
          stickyBtn.style.removeProperty('background-color');
        }
        if (stickyBtnText) stickyBtnText.textContent = 'ADD TO CART';
        if (stickyStepper) stickyStepper.style.setProperty('display', 'flex', 'important');
      } else {
        if (availabilityStatus) {
          availabilityStatus.innerHTML = `
            <span class="product-info__stock-dot is-out-of-stock"></span>
            <span class="product-info__stock-text">Temporarily Sold Out</span>
          `;
        }
        if (addToCartBtn) {
          addToCartBtn.setAttribute('disabled', 'disabled');
          addToCartBtn.disabled = true;
          addToCartBtn.style.setProperty('opacity', '0.65', 'important');
          addToCartBtn.style.setProperty('cursor', 'not-allowed', 'important');
          addToCartBtn.style.setProperty('display', 'flex', 'important');
          addToCartBtn.style.setProperty('background-color', '#475569', 'important');
          addToCartBtn.style.setProperty('color', '#ffffff', 'important');
        }
        if (stepper) stepper.style.setProperty('display', 'none', 'important');
        if (addToCartText) addToCartText.textContent = 'SOLD OUT';
        if (cartSvg) cartSvg.style.setProperty('display', 'none', 'important');

        if (buyNowBtn) {
          buyNowBtn.setAttribute('disabled', 'disabled');
          buyNowBtn.disabled = true;
          buyNowBtn.style.setProperty('opacity', '0.65', 'important');
          buyNowBtn.style.setProperty('cursor', 'not-allowed', 'important');
          buyNowBtn.style.setProperty('display', 'none', 'important');
        }

        if (stickyBtn) {
          stickyBtn.setAttribute('disabled', 'disabled');
          stickyBtn.disabled = true;
          stickyBtn.textContent = 'SOLD OUT';
          stickyBtn.style.setProperty('opacity', '0.65', 'important');
          stickyBtn.style.setProperty('cursor', 'not-allowed', 'important');
          stickyBtn.style.setProperty('background-color', '#475569', 'important');
        }
        if (stickyBtnText) stickyBtnText.textContent = 'SOLD OUT';
        if (stickyStepper) stickyStepper.style.setProperty('display', 'none', 'important');
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

  // Attach touch/click listeners to variant pills for mobile devices
  container.querySelectorAll('.product-info__variant-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const radio = pill.querySelector('[data-variant-radio]');
      if (radio && !radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  // Automatically sync initial state of checked variant radio on load
  const checkedRadio = container.querySelector('[data-variant-radio]:checked') || radioButtons[0];
  if (checkedRadio) {
    checkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }
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
   9. STICKY MOBILE BUY BAR (TWO BROTHERS STYLE: ADD TO CART + QUANTITY STEPPER)
   ========================================================================== */
function initStickyMobileBar(container) {
  const stickyBar = container.querySelector('[data-sticky-mobile-bar]');
  const stickyAddBtn = container.querySelector('[data-sticky-add-to-cart-btn]');
  const stickyBuyNowBtn = container.querySelector('[data-sticky-buy-now-btn]');
  const stickyMinusBtn = container.querySelector('[data-sticky-quantity-minus]');
  const stickyPlusBtn = container.querySelector('[data-sticky-quantity-plus]');
  const stickyQtyVal = container.querySelector('[data-sticky-quantity-val]');
  const stickyStepper = container.querySelector('[data-sticky-stepper]');

  const mainForm = container.querySelector('[data-product-main-form]');
  const mainQtyInput = container.querySelector('[data-quantity-input]');
  const mainAddBtn = container.querySelector('[data-add-to-cart-button]');
  const mainBuyNowBtn = container.querySelector('[data-buy-now-button]');
  const mainStepper = container.querySelector('[data-card-inline-stepper]');
  const mainInlineCount = container.querySelector('[data-inline-count]');

  if (!stickyBar || !mainForm) return;

  function updateQuantity(newQty) {
    if (newQty < 1) {
      newQty = 1;
      if (stickyAddBtn) stickyAddBtn.style.setProperty('display', 'flex', 'important');
      if (stickyStepper) stickyStepper.style.setProperty('display', 'none', 'important');
      if (mainAddBtn) mainAddBtn.style.setProperty('display', 'flex', 'important');
      if (mainStepper) mainStepper.style.setProperty('display', 'none', 'important');
    }
    if (newQty > 20) newQty = 20;

    if (stickyQtyVal) stickyQtyVal.textContent = newQty;
    if (mainInlineCount) mainInlineCount.textContent = newQty;
    if (mainQtyInput) {
      mainQtyInput.value = newQty;
      mainQtyInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  if (stickyMinusBtn) {
    stickyMinusBtn.addEventListener('click', () => {
      const currentQty = parseInt(mainQtyInput ? mainQtyInput.value : stickyQtyVal ? stickyQtyVal.textContent : 1) || 1;
      updateQuantity(currentQty - 1);
    });
  }

  if (stickyPlusBtn) {
    stickyPlusBtn.addEventListener('click', () => {
      const currentQty = parseInt(mainQtyInput ? mainQtyInput.value : stickyQtyVal ? stickyQtyVal.textContent : 1) || 1;
      updateQuantity(currentQty + 1);
    });
  }

  if (mainQtyInput) {
    mainQtyInput.addEventListener('change', () => {
      if (stickyQtyVal) stickyQtyVal.textContent = mainQtyInput.value;
      if (mainInlineCount) mainInlineCount.textContent = mainQtyInput.value;
    });
  }

  if (stickyAddBtn) {
    stickyAddBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (stickyAddBtn) stickyAddBtn.style.setProperty('display', 'none', 'important');
      if (stickyStepper) stickyStepper.style.setProperty('display', 'flex', 'important');
      if (mainAddBtn) mainAddBtn.style.setProperty('display', 'none', 'important');
      if (mainStepper) mainStepper.style.setProperty('display', 'flex', 'important');

      if (mainAddBtn) {
        mainAddBtn.click();
      } else {
        mainForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  }

  async function performBuyNow(btn) {
    const variantInput = mainForm.querySelector('[name="id"]');
    const variantId = variantInput ? variantInput.value : null;
    const qty = mainQtyInput ? (parseInt(mainQtyInput.value, 10) || 1) : 1;

    if (!variantId) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'REDIRECTING...';
    }

    try {
      const rootUrl = window.Shopify?.routes?.root || '/';
      await fetch(`${rootUrl}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId, 10), quantity: qty })
      });
      window.location.href = '/checkout';
    } catch (err) {
      window.location.href = '/checkout';
    }
  }

  if (stickyBuyNowBtn) {
    stickyBuyNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performBuyNow(stickyBuyNowBtn);
    });
  }

  if (mainBuyNowBtn) {
    mainBuyNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performBuyNow(mainBuyNowBtn);
    });
  }
}
