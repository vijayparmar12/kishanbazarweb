// Testimonials In-Box Review Message Toggle & Carousel Scroll
(function() {
  let isDragging = false;
  let dragThresholdPassed = false;
  let startX = 0;
  let scrollLeftStart = 0;

  function initCardFlip() {
    document.addEventListener('click', function(e) {
      if (dragThresholdPassed) {
        dragThresholdPassed = false;
        return;
      }

      // Smooth scroll for anchor links
      const anchor = e.target.closest('a[href^="#ProductReviews"], a[href^="#Testimonials"]');
      if (anchor) {
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#' && targetId.startsWith('#')) {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            const stickyHeader = document.querySelector('[data-header-top-sticky], .kb-header-top-sticky, .site-header');
            const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 130;
            const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            window.scrollTo({
              top: Math.max(0, targetTop),
              behavior: 'smooth'
            });
            return;
          }
        }
      }

      // Card Toggle: Triggered by clicking card or arrow button
      const card = e.target.closest('[data-testimonial-card]');
      if (!card) return;

      const track = card.closest('[data-testimonials-track]');
      const wasFlipped = card.classList.contains('is-flipped');

      // Flip back all other cards in the track
      if (track) {
        track.querySelectorAll('[data-testimonial-card].is-flipped').forEach(function(otherCard) {
          if (otherCard !== card) {
            otherCard.classList.remove('is-flipped');
            otherCard.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Toggle current card
      if (wasFlipped) {
        card.classList.remove('is-flipped');
        card.setAttribute('aria-expanded', 'false');
      } else {
        card.classList.add('is-flipped');
        card.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard support (Enter/Space on card)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = document.activeElement ? document.activeElement.closest('[data-testimonial-card]') : null;
        if (card) {
          e.preventDefault();
          card.click();
        }
      }
    });
  }

  function initTestimonialsCarousel() {
    document.querySelectorAll('[data-testimonials-carousel]').forEach(function(container) {
      container.addEventListener('pointerdown', function(e) {
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
    initCardFlip();
    initTestimonialsCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
