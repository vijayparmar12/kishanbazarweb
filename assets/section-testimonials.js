// Testimonials Lightbox Review Modal & Horizontal Carousel
(function() {
  let isDragging = false;
  let dragThresholdPassed = false;
  let startX = 0;
  let scrollLeftStart = 0;

  function initTestimonialsModal() {
    const modal = document.querySelector('[data-review-modal]');
    if (!modal) return;

    const modalMediaWrap = modal.querySelector('[data-modal-media-wrap]');
    const modalImg = modal.querySelector('[data-modal-img]');
    const modalStars = modal.querySelector('[data-modal-stars]');
    const modalHeadline = modal.querySelector('[data-modal-headline]');
    const modalText = modal.querySelector('[data-modal-text]');
    const modalName = modal.querySelector('[data-modal-name]');
    const modalRole = modal.querySelector('[data-modal-role]');

    function openModal(data) {
      if (!data) return;

      if (modalHeadline) {
        modalHeadline.textContent = data.headline ? `"${data.headline}"` : '';
      }
      if (modalText) {
        modalText.textContent = data.fullReview || '';
      }
      if (modalName) {
        modalName.textContent = data.name || 'Verified Customer';
      }
      if (modalRole) {
        modalRole.textContent = data.role || '';
        modalRole.style.display = data.role ? 'block' : 'none';
      }
      if (modalStars) {
        const rating = parseInt(data.rating, 10) || 5;
        modalStars.textContent = '⭐'.repeat(Math.max(1, Math.min(5, rating)));
      }
      if (modalImg && modalMediaWrap) {
        if (data.imageUrl && data.imageUrl.trim() !== '') {
          modalImg.src = data.imageUrl;
          modalImg.alt = data.name || 'Customer review image';
          modalMediaWrap.style.display = 'block';
        } else {
          modalMediaWrap.style.display = 'none';
          modalImg.src = '';
        }
      }

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.addEventListener('click', function(e) {
      if (dragThresholdPassed) {
        dragThresholdPassed = false;
        return;
      }

      const trigger = e.target.closest('[data-review-modal-trigger]');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        openModal({
          name: trigger.getAttribute('data-author-name'),
          role: trigger.getAttribute('data-author-role'),
          headline: trigger.getAttribute('data-headline'),
          fullReview: trigger.getAttribute('data-full-review'),
          rating: trigger.getAttribute('data-rating'),
          imageUrl: trigger.getAttribute('data-image-url')
        });
        return;
      }

      const card = e.target.closest('[data-testimonial-card]');
      if (card && !isDragging) {
        const btn = card.querySelector('[data-review-modal-trigger]');
        if (btn) {
          openModal({
            name: btn.getAttribute('data-author-name'),
            role: btn.getAttribute('data-author-role'),
            headline: btn.getAttribute('data-headline'),
            fullReview: btn.getAttribute('data-full-review'),
            rating: btn.getAttribute('data-rating'),
            imageUrl: btn.getAttribute('data-image-url')
          });
          return;
        }
      }

      if (e.target.closest('[data-review-modal-close]')) {
        e.preventDefault();
        closeModal();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  function initTestimonialsCarousel() {
    document.querySelectorAll('[data-testimonials-carousel]').forEach(function(container) {
      container.addEventListener('pointerdown', function(e) {
        if (e.target.closest('[data-review-modal-trigger]')) return;
        isDragging = true;
        dragThresholdPassed = false;
        startX = e.pageX - container.offsetLeft;
        scrollLeftStart = container.scrollLeft;
      });

      window.addEventListener('pointermove', function(e) {
        if (!isDragging) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.3;
        if (Math.abs(walk) > 6) {
          dragThresholdPassed = true;
        }
        container.scrollLeft = scrollLeftStart - walk;
      });

      window.addEventListener('pointerup', function() {
        if (isDragging) {
          isDragging = false;
          setTimeout(function() {
            dragThresholdPassed = false;
          }, 60);
        }
      });
    });
  }

  function start() {
    initTestimonialsModal();
    initTestimonialsCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
