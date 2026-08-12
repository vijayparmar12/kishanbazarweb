// Testimonials Card Flip & Dual Auto/Manual Scroll Script
(function() {
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let dragThresholdPassed = false;

  // Delegate click for Testimonial Cards (Only flip if NOT dragging)
  document.addEventListener('click', function(e) {
    if (dragThresholdPassed) {
      dragThresholdPassed = false;
      return;
    }

    const card = e.target.closest('.testimonials__card, [data-testimonial-card]');
    if (!card) return;

    const section = card.closest('.testimonials-carousel-section, [data-testimonials-section]');

    // Toggle expansion on this card
    const isExpanded = card.classList.contains('is-expanded');

    // Close all other expanded cards in the section
    if (section) {
      section.querySelectorAll('.testimonials__card.is-expanded, [data-testimonial-card].is-expanded').forEach(function(otherCard) {
        if (otherCard !== card) {
          otherCard.classList.remove('is-expanded');
        }
      });
    }

    if (isExpanded) {
      card.classList.remove('is-expanded');
    } else {
      card.classList.add('is-expanded');
    }
  });

  // Hybrid Auto-Scroll & Manual Drag Handler
  function initTestimonialsCarousel() {
    document.querySelectorAll('[data-testimonials-carousel]').forEach(function(container) {
      const track = container.querySelector('[data-testimonials-track]');
      if (!track) return;

      let isPaused = false;
      let animationFrameId = null;
      let resumeTimeout = null;

      function autoScrollStep() {
        if (!isPaused) {
          const anyExpanded = container.querySelector('.is-expanded');
          if (!anyExpanded) {
            container.scrollLeft += 0.8;
            const maxScroll = (container.scrollWidth - container.clientWidth) / 2;
            if (container.scrollLeft >= maxScroll && maxScroll > 0) {
              container.scrollLeft = 0;
            }
          }
        }
        animationFrameId = requestAnimationFrame(autoScrollStep);
      }

      function pauseScroll() {
        isPaused = true;
        if (resumeTimeout) clearTimeout(resumeTimeout);
      }

      function resumeScroll() {
        if (resumeTimeout) clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(function() {
          isPaused = false;
        }, 2200);
      }

      // Start auto scroll
      animationFrameId = requestAnimationFrame(autoScrollStep);

      // Pause on hover or focus
      container.addEventListener('mouseenter', pauseScroll);
      container.addEventListener('mouseleave', function() {
        if (!isDragging) resumeScroll();
      });

      // Mouse Drag-to-Scroll Functionality
      container.addEventListener('pointerdown', function(e) {
        if (e.target.closest('[data-card-toggle]')) return;
        isDragging = true;
        dragThresholdPassed = false;
        startX = e.pageX - container.offsetLeft;
        scrollLeftStart = container.scrollLeft;
        pauseScroll();
      });

      window.addEventListener('pointermove', function(e) {
        if (!isDragging) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 6) {
          dragThresholdPassed = true;
        }
        container.scrollLeft = scrollLeftStart - walk;
      });

      window.addEventListener('pointerup', function() {
        if (isDragging) {
          isDragging = false;
          resumeScroll();
        }
      });

      // Touch events for mobile
      container.addEventListener('touchstart', pauseScroll, { passive: true });
      container.addEventListener('touchend', resumeScroll, { passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsCarousel);
  } else {
    initTestimonialsCarousel();
  }
})();
