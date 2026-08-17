/**
 * Video carousel: scroll, drag, and viewport-aware playback.
 */

const SELECTORS = {
  section: '[data-shoppable-videos]',
  track: '[data-carousel-track]',
  viewport: '[data-carousel-viewport]',
  prev: '[data-carousel-prev]',
  next: '[data-carousel-next]',
  slide: '[data-carousel-slide]',
  card: '[data-shoppable-card]',
  video: '.shoppable-videos__video',
  play: '[data-video-play]',
  add: '[data-add-to-cart]',
  config: '[data-shoppable-config]',
};

const parseConfig = (section) => {
  const node = section.querySelector(SELECTORS.config);
  if (!node) return { cartAddUrl: '/cart/add.js' };
  try {
    return JSON.parse(node.textContent);
  } catch {
    return { cartAddUrl: '/cart/add.js' };
  }
};

const updateHeaderCartCount = async () => {
  try {
    const response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const cart = await response.json();
    document.querySelectorAll('.kb-header__badge--cart').forEach((badge) => {
      badge.textContent = String(cart.item_count);
    });
    document.querySelectorAll('.kb-header__action--cart').forEach((link) => {
      link.setAttribute('aria-label', `Cart, ${cart.item_count} items`);
    });
  } catch {
    /* ignore */
  }
};

class ShoppableVideosSection {
  /** @param {HTMLElement} root */
  constructor(root) {
    this.root = root;
    this.config = parseConfig(root);
    this.track = root.querySelector(SELECTORS.track);
    this.viewport = root.querySelector(SELECTORS.viewport);
    this.prevBtn = root.querySelector(SELECTORS.prev);
    this.nextBtn = root.querySelector(SELECTORS.next);
    this.autoplayEnabled = root.dataset.autoplay === 'true';
    this.infiniteLoop = root.dataset.infiniteLoop === 'true';

    this.isDragging = false;
    this.dragStartX = 0;
    this.scrollStart = 0;
    this.hasMoved = false;

    this.bindCarousel();
    this.bindVideos();
    this.bindAddToCart();
    this.bindModal();
    this.setSlideIndices();
    this.updateArrows();

    if (this.track) {
      this.track.addEventListener('scroll', () => {
        this.updateArrows();
        this.updateActiveSlideOnScroll();
      }, { passive: true });
      window.addEventListener('resize', () => {
        this.updateArrows();
        this.updateActiveSlideOnScroll();
      }, { passive: true });
      this.updateActiveSlideOnScroll();
    }
  }

  bindModal() {
    const modal = this.root.querySelector('[data-video-modal]');
    if (!modal) return;

    const modalBody = modal.querySelector('[data-modal-body]');
    const closeBtns = modal.querySelectorAll('[data-modal-close]');

    const closeModal = () => {
      modal.removeAttribute('open');
      document.body.classList.remove('shoppable-video-modal-open');
      if (modalBody) {
        const modalVideo = modalBody.querySelector('video');
        if (modalVideo) modalVideo.pause();
        modalBody.innerHTML = '';
      }
    };

    closeBtns.forEach((btn) => btn.addEventListener('click', closeModal));

    this.root.querySelectorAll(SELECTORS.card).forEach((card) => {
      const mediaWrap = card.querySelector('.shoppable-videos__media-wrap');
      if (!mediaWrap) return;

      mediaWrap.addEventListener('click', (e) => {
        if (this.hasMoved) return;
        if (e.target.closest('.shoppable-videos__product-info-row') || e.target.closest('[data-add-to-cart]') || e.target.closest('[data-video-mute]')) return;

        // Extract Product details for Modal White Box
        const variantId = card.dataset.variantId || '';
        const thumb = card.querySelector('.shoppable-videos__product-thumb')?.src || '';
        const title = card.querySelector('.shoppable-videos__product-name')?.textContent || 'Organic Product';
        const subtitle = card.querySelector('.shoppable-videos__product-subtitle')?.textContent || '';
        const price = card.querySelector('.shoppable-videos__price-current')?.textContent || '₹199.00';
        const comparePrice = card.querySelector('.shoppable-videos__price-compare')?.textContent || '';

        const clone = mediaWrap.cloneNode(true);
        clone.querySelectorAll('.shoppable-videos__product-overlay, .shoppable-videos__top-overlay, .shoppable-videos__play').forEach(el => el.remove());

        // Build Top Left Volume Mute Button
        const topLeftMute = document.createElement('div');
        topLeftMute.className = 'shoppable-videos__modal-top-left';
        topLeftMute.style.cssText = 'position: absolute; top: 14px; left: 14px; z-index: 120;';
        topLeftMute.innerHTML = `
          <button type="button" class="shoppable-videos__modal-ctrl-btn" data-modal-mute-btn aria-label="Mute / Unmute" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); color: #ffffff; border: 1px solid rgba(255,255,255,0.25); cursor: pointer; display: grid; place-items: center;">
            <svg data-unmute-icon width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <svg data-mute-icon width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
          </button>
        `;
        clone.appendChild(topLeftMute);

        // Build Top Right Close Button
        const topRightClose = document.createElement('div');
        topRightClose.className = 'shoppable-videos__modal-top-right';
        topRightClose.style.cssText = 'position: absolute; top: 14px; right: 14px; z-index: 120;';
        topRightClose.innerHTML = `
          <button type="button" class="shoppable-videos__modal-ctrl-btn" data-modal-close aria-label="Close video" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); color: #ffffff; border: 1px solid rgba(255,255,255,0.25); cursor: pointer; display: grid; place-items: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        `;
        clone.appendChild(topRightClose);

        // Build Centered Play / Pause Button Overlay
        const centerPlayBtn = document.createElement('button');
        centerPlayBtn.type = 'button';
        centerPlayBtn.className = 'shoppable-videos__modal-center-play';
        centerPlayBtn.setAttribute('data-modal-play-btn', '');
        centerPlayBtn.setAttribute('aria-label', 'Play or Pause Video');
        centerPlayBtn.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 110; width: 58px; height: 58px; border-radius: 50%; background: rgba(255,255,255,0.92); color: #132d14; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(0,0,0,0.35); transition: transform 200ms ease, opacity 250ms ease;';
        centerPlayBtn.innerHTML = `
          <svg data-play-icon width="24" height="24" viewBox="0 0 24 24" fill="#132d14" style="display: none; margin-left: 2px;"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
          <svg data-pause-icon width="22" height="22" viewBox="0 0 24 24" fill="#132d14" style="display: inline-block;"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
        `;
        clone.appendChild(centerPlayBtn);

        // Build Bottom White Product Box Card
        const whiteProductBox = document.createElement('div');
        whiteProductBox.className = 'shoppable-videos__modal-white-box';
        whiteProductBox.style.cssText = 'position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 100; background: #ffffff; border-radius: 16px; padding: 10px 12px; box-shadow: 0 12px 30px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid rgba(35,66,31,0.12);';
        whiteProductBox.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
            ${thumb ? `<img src="${thumb}" alt="${title}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid #f0f0f0;">` : ''}
            <div style="min-width: 0; flex: 1;">
              <h4 style="margin: 0 0 2px; font-size: 0.86rem; font-weight: 800; color: #132d14; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</h4>
              ${subtitle ? `<p style="margin: 0 0 3px; font-size: 0.75rem; color: #52604d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</p>` : ''}
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.88rem; font-weight: 900; color: #23421f;">
                <span>${price}</span>
                ${comparePrice ? `<s style="font-size: 0.76rem; color: #94a3b8; font-weight: 500;">${comparePrice}</s>` : ''}
              </div>
            </div>
          </div>
          <form method="post" action="/cart/add" data-product-card-form style="margin: 0;">
            <input type="hidden" name="id" value="${variantId || ''}">
            <div style="position: relative; height: 38px;">
              <button type="submit" class="shoppable-videos__modal-add-btn" data-card-add-btn style="background: #23421f; color: #ffffff; border: none; padding: 0.55rem 0.95rem; border-radius: 10px; font-weight: 800; font-size: 0.78rem; cursor: pointer; white-space: nowrap; flex-shrink: 0; box-shadow: 0 4px 12px rgba(35,66,31,0.25);">ADD TO CART</button>
              <div class="shoppable-videos__inline-stepper" data-card-inline-stepper style="display: none; height: 38px; border: 2px solid #23421f; border-radius: 10px; background: #ffffff; align-items: center; justify-content: space-between; padding: 0 8px; box-sizing: border-box; min-width: 95px;">
                <button type="button" data-inline-minus style="border: none; background: transparent; cursor: pointer; font-size: 1.15rem; font-weight: 900; color: #23421f; padding: 0 4px;">-</button>
                <span data-inline-count style="font-size: 0.90rem; font-weight: 900; color: #23421f;">1</span>
                <button type="button" data-inline-plus style="border: none; background: transparent; cursor: pointer; font-size: 1.15rem; font-weight: 900; color: #23421f; padding: 0 4px;">+</button>
              </div>
            </div>
          </form>
        `;
        clone.appendChild(whiteProductBox);

        if (modalBody) {
          modalBody.innerHTML = '';
          modalBody.appendChild(clone);
        }

        const modalVideo = clone.querySelector('video');
        const playBtn = clone.querySelector('[data-modal-play-btn]');
        const playIcon = playBtn?.querySelector('[data-play-icon]');
        const pauseIcon = playBtn?.querySelector('[data-pause-icon]');
        const muteBtn = clone.querySelector('[data-modal-mute-btn]');
        const muteIcon = muteBtn?.querySelector('[data-mute-icon]');
        const unmuteIcon = muteBtn?.querySelector('[data-unmute-icon]');
        const modalCloseBtn = clone.querySelector('[data-modal-close]');

        if (modalCloseBtn) {
          modalCloseBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const modalEl = this.root.querySelector('[data-video-modal]');
            if (modalEl) {
              modalEl.removeAttribute('open');
              document.body.classList.remove('shoppable-video-modal-open');
              if (modalBody) {
                const v = modalBody.querySelector('video');
                if (v) v.pause();
                modalBody.innerHTML = '';
              }
            }
          });
        }

        if (modalVideo) {
          modalVideo.muted = false;
          modalVideo.play().then(() => {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'inline-block';
            setTimeout(() => {
              if (!modalVideo.paused && playBtn) playBtn.style.opacity = '0';
            }, 1200);
          }).catch(() => {});

          const togglePlay = (ev) => {
            if (ev) ev.stopPropagation();
            if (modalVideo.paused) {
              modalVideo.play();
              if (playIcon) playIcon.style.display = 'none';
              if (pauseIcon) pauseIcon.style.display = 'inline-block';
              if (playBtn) playBtn.style.opacity = '1';
              setTimeout(() => {
                if (!modalVideo.paused && playBtn) playBtn.style.opacity = '0';
              }, 1200);
            } else {
              modalVideo.pause();
              if (playIcon) playIcon.style.display = 'inline-block';
              if (pauseIcon) pauseIcon.style.display = 'none';
              if (playBtn) playBtn.style.opacity = '1';
            }
          };

          if (playBtn) playBtn.addEventListener('click', togglePlay);
          modalVideo.addEventListener('click', togglePlay);

          if (muteBtn) {
            muteBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              modalVideo.muted = !modalVideo.muted;
              if (muteIcon && unmuteIcon) {
                muteIcon.style.display = modalVideo.muted ? 'none' : 'inline-block';
                unmuteIcon.style.display = modalVideo.muted ? 'inline-block' : 'none';
              }
            });
          }
        }

        document.dispatchEvent(new CustomEvent('kb:cart:updated'));

        document.body.classList.add('shoppable-video-modal-open');
        modal.setAttribute('open', '');
      });
    });
  }

  updateActiveSlideOnScroll() {
    if (!this.track) return;
    const slides = Array.from(this.root.querySelectorAll(SELECTORS.slide));
    if (!slides.length) return;

    const trackRect = this.track.getBoundingClientRect();
    const trackCenterX = trackRect.left + trackRect.width / 2;

    let closestSlide = slides[0];
    let minDistance = Infinity;

    slides.forEach((slide) => {
      const slideRect = slide.getBoundingClientRect();
      const slideCenterX = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(trackCenterX - slideCenterX);

      if (distance < minDistance) {
        minDistance = distance;
        closestSlide = slide;
      }
    });

    slides.forEach((slide) => {
      const card = slide.querySelector(SELECTORS.card);
      if (card) {
        card.classList.toggle('is-active', slide === closestSlide);
      }
    });
  }

  setSlideIndices() {
    this.root.querySelectorAll(SELECTORS.slide).forEach((slide, index) => {
      slide.style.setProperty('--slide-index', String(index));
    });
  }

  getScrollStep() {
    if (!this.track) return 0;
    const slide = this.track.querySelector(SELECTORS.slide);
    if (!slide) return this.track.clientWidth * 0.8;
    const styles = getComputedStyle(this.track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return slide.offsetWidth + gap;
  }

  bindCarousel() {
    this.prevBtn?.addEventListener('click', () => this.scrollBy(-1));
    this.nextBtn?.addEventListener('click', () => this.scrollBy(1));

    this.viewport?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.scrollBy(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.scrollBy(1);
      }
    });

    if (!this.track || !this.viewport) return;

    this.viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.isDragging = true;
      this.hasMoved = false;
      this.dragStartX = event.clientX;
      this.scrollStart = this.track.scrollLeft;
    });

    this.viewport.addEventListener('pointermove', (event) => {
      if (!this.isDragging || !this.track) return;
      const delta = event.clientX - this.dragStartX;
      if (Math.abs(delta) > 10) {
        this.hasMoved = true;
        this.viewport.classList.add('is-dragging');
      }
      if (this.hasMoved) {
        this.track.scrollLeft = this.scrollStart - delta;
      }
    });

    const endDrag = (event) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.viewport.classList.remove('is-dragging');
      if (this.viewport.hasPointerCapture && this.viewport.hasPointerCapture(event.pointerId)) {
        this.viewport.releasePointerCapture(event.pointerId);
      }
      setTimeout(() => {
        this.hasMoved = false;
      }, 50);
    };

    this.viewport.addEventListener('pointerup', endDrag);
    this.viewport.addEventListener('pointercancel', endDrag);
  }

  scrollBy(direction) {
    if (!this.track) return;
    const step = this.getScrollStep();
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;
    let target = this.track.scrollLeft + direction * step;

    if (this.infiniteLoop && maxScroll > 0) {
      if (target < 0) target = maxScroll;
      if (target > maxScroll) target = 0;
    } else {
      target = Math.max(0, Math.min(maxScroll, target));
    }

    this.track.scrollTo({ left: target, behavior: 'smooth' });
  }

  updateArrows() {
    if (!this.track) return;
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;
    const atStart = this.track.scrollLeft <= 2;
    const atEnd = this.track.scrollLeft >= maxScroll - 2;

    if (this.prevBtn) this.prevBtn.disabled = !this.infiniteLoop && atStart;
    if (this.nextBtn) this.nextBtn.disabled = !this.infiniteLoop && atEnd;
  }

  bindVideos() {
    const cards = this.root.querySelectorAll(SELECTORS.card);
    if (!cards.length) return;

    cards.forEach((card) => {
      const video = card.querySelector(SELECTORS.video);
      const playBtn = card.querySelector(SELECTORS.play);
      if (!(video instanceof HTMLVideoElement) || !playBtn) return;

      video.muted = true;
      video.playsInline = true;

      playBtn.addEventListener('click', () => {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });

      const timeText = card.querySelector('[data-video-time]');
      const progressFill = card.querySelector('[data-video-progress-fill]');
      const muteBtn = card.querySelector('[data-video-mute]');
      const fsBtn = card.querySelector('[data-video-fullscreen]');

      video.addEventListener('timeupdate', () => {
        if (video.duration) {
          const current = Math.floor(video.currentTime);
          const duration = Math.floor(video.duration);
          const currentMin = Math.floor(current / 60);
          const currentSec = String(current % 60).padStart(2, '0');
          const durMin = Math.floor(duration / 60);
          const durSec = String(duration % 60).padStart(2, '0');
          if (timeText) {
            timeText.textContent = `${currentMin}:${currentSec} / ${durMin}:${durSec}`;
          }
          if (progressFill) {
            const percent = (video.currentTime / video.duration) * 100;
            progressFill.style.width = `${percent}%`;
          }
        }
      });

      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          video.muted = !video.muted;
          const mutedIcon = muteBtn.querySelector('.shoppable-videos__icon-muted');
          const unmutedIcon = muteBtn.querySelector('.shoppable-videos__icon-unmuted');
          if (video.muted) {
            if (mutedIcon) mutedIcon.style.display = 'block';
            if (unmutedIcon) unmutedIcon.style.display = 'none';
          } else {
            if (mutedIcon) mutedIcon.style.display = 'none';
            if (unmutedIcon) unmutedIcon.style.display = 'block';
          }
        });
      }

      if (fsBtn) {
        fsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        });
      }

      video.addEventListener('play', () => playBtn.classList.add('is-hidden'));
      video.addEventListener('pause', () => playBtn.classList.remove('is-hidden'));
      video.addEventListener('ended', () => {
        if (this.root.dataset.loop === 'true') return;
        playBtn.classList.remove('is-hidden');
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          const video = card.querySelector(SELECTORS.video);
          if (!(video instanceof HTMLVideoElement)) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            card.classList.add('is-active');
            if (video.preload === 'none' && !video.dataset.loaded) {
              video.load();
              video.dataset.loaded = 'true';
            }
            if (this.autoplayEnabled) {
              video.play().catch(() => {});
            }
          } else {
            card.classList.remove('is-active');
            video.pause();
          }
        });
      },
      { threshold: [0, 0.55, 0.85], rootMargin: '0px -15% 0px -15%' }
    );

    cards.forEach((card) => observer.observe(card));
  }

  bindAddToCart() {
    this.root.querySelectorAll(SELECTORS.add).forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.disabled || button.classList.contains('is-loading')) return;

        const variantId = Number(button.dataset.variantId);
        if (!variantId) return;

        const label = button.querySelector('[data-add-label]');
        const originalText = label?.textContent?.trim() || '';

        button.classList.add('is-loading');
        button.classList.remove('is-success');

        try {
          const response = await fetch(this.config.cartAddUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
          });

          if (!response.ok) throw new Error('Add failed');

          button.classList.remove('is-loading');
          button.classList.add('is-success');
          await updateHeaderCartCount();

          window.setTimeout(() => {
            button.classList.remove('is-success');
            if (label) label.textContent = originalText;
          }, 1600);
        } catch {
          button.classList.remove('is-loading');
          if (label) label.textContent = originalText;
        }
      });
    });
  }
}

const init = () => {
  document.querySelectorAll(SELECTORS.section).forEach((section) => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    new ShoppableVideosSection(section);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.addEventListener('shopify:section:load', (event) => {
  const container = event.target;
  if (!(container instanceof HTMLElement)) return;
  const section = container.matches(SELECTORS.section)
    ? container
    : container.querySelector(SELECTORS.section);
  if (section instanceof HTMLElement && !section.dataset.initialized) {
    section.dataset.initialized = 'true';
    new ShoppableVideosSection(section);
  }
});

export {};
