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
      this.viewport.classList.add('is-dragging');
      this.viewport.setPointerCapture(event.pointerId);
    });

    this.viewport.addEventListener('pointermove', (event) => {
      if (!this.isDragging || !this.track) return;
      const delta = event.clientX - this.dragStartX;
      if (Math.abs(delta) > 4) this.hasMoved = true;
      this.track.scrollLeft = this.scrollStart - delta;
    });

    const endDrag = (event) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.viewport.classList.remove('is-dragging');
      if (this.viewport.hasPointerCapture(event.pointerId)) {
        this.viewport.releasePointerCapture(event.pointerId);
      }
    };

    this.viewport.addEventListener('pointerup', endDrag);
    this.viewport.addEventListener('pointercancel', endDrag);

    this.track.addEventListener(
      'click',
      (event) => {
        if (this.hasMoved) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );
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
