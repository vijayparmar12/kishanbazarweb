/* Clean Shoppable Videos JS — Autoplay sharp background previews & modal player on click */
class ShoppableVideosSection {
  constructor(root) {
    this.root = root;
    this.viewport = root.querySelector('.shoppable-videos__viewport');
    this.prevBtn = root.querySelector('.shoppable-videos__arrow--prev');
    this.nextBtn = root.querySelector('.shoppable-videos__arrow--next');

    this.modal = document.getElementById('ShoppableVideoModal');
    this.modalVideo = this.modal?.querySelector('.shoppable-videos__modal-video');
    this.modalProductPill = this.modal?.querySelector('.shoppable-videos__modal-product-pill');
    this.modalProductThumb = this.modal?.querySelector('.shoppable-videos__modal-product-thumb');
    this.modalProductTitle = this.modal?.querySelector('.shoppable-videos__modal-product-title');
    this.modalProductPrice = this.modal?.querySelector('.shoppable-videos__modal-product-price');

    this.bindArrows();
    this.bindVideoCards();
    this.bindModalEvents();
  }

  bindArrows() {
    if (!this.viewport) return;
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        const slideWidth = this.viewport.querySelector('.shoppable-videos__slide')?.offsetWidth || 220;
        this.viewport.scrollBy({ left: -(slideWidth * 2.2), behavior: 'smooth' });
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        const slideWidth = this.viewport.querySelector('.shoppable-videos__slide')?.offsetWidth || 220;
        this.viewport.scrollBy({ left: slideWidth * 2.2, behavior: 'smooth' });
      });
    }
  }

  bindVideoCards() {
    const cards = this.root.querySelectorAll('.shoppable-videos__card');

    cards.forEach((card) => {
      const video = card.querySelector('.shoppable-videos__video');
      const openModalBtn = card.querySelector('[data-open-modal]');

      // Autoplay silently in background when in viewport
      if (video && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            });
          },
          { threshold: 0.25 }
        );
        observer.observe(card);
      }

      if (!openModalBtn) return;

      openModalBtn.addEventListener('click', (e) => {
        // If clicking product pill overlay directly, let link navigate natively
        if (e.target.closest('.shoppable-videos__product-pill')) return;

        const videoSrc = card.dataset.videoSrc || card.querySelector('source')?.src || card.querySelector('video')?.src;
        const productUrl = card.dataset.productUrl || '';
        const productTitle = card.dataset.productTitle || '';
        const productPrice = card.dataset.productPrice || '';
        const productThumb = card.dataset.productThumb || '';

        this.openModal({ videoSrc, productUrl, productTitle, productPrice, productThumb });
      });
    });
  }

  openModal({ videoSrc, productUrl, productTitle, productPrice, productThumb }) {
    if (!this.modal || !this.modalVideo) return;

    // Set video src
    this.modalVideo.src = videoSrc;
    this.modalVideo.muted = false;

    // Set product info
    if (this.modalProductPill) {
      if (productUrl) {
        this.modalProductPill.href = productUrl;
        this.modalProductPill.style.display = 'flex';
      } else {
        this.modalProductPill.style.display = 'none';
      }
    }

    if (this.modalProductThumb) {
      if (productThumb) {
        this.modalProductThumb.src = productThumb;
        this.modalProductThumb.style.display = 'block';
      } else {
        this.modalProductThumb.style.display = 'none';
      }
    }

    if (this.modalProductTitle) {
      this.modalProductTitle.textContent = productTitle;
    }

    if (this.modalProductPrice) {
      this.modalProductPrice.textContent = productPrice;
    }

    // Show modal
    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('shoppable-modal-active');

    // Play video with audio
    this.modalVideo.play().catch(() => {
      // Fallback muted if browser blocks unmuted play
      this.modalVideo.muted = true;
      this.modalVideo.play();
    });
  }

  closeModal() {
    if (!this.modal || !this.modalVideo) return;

    this.modalVideo.pause();
    this.modalVideo.src = '';
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('shoppable-modal-active');
  }

  bindModalEvents() {
    if (!this.modal) return;

    this.modal.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', () => this.closeModal());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
        this.closeModal();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-shoppable-videos]').forEach((el) => {
    new ShoppableVideosSection(el);
  });
});
