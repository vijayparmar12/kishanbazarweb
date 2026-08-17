// Testimonials Card Flip & Manual User Scroll Only (Auto-scroll Completely Removed)
(function() {
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let dragThresholdPassed = false;

  // Delegate click for Testimonial Cards (Only flip if NOT dragging) & Review Anchors
  document.addEventListener('click', function(e) {
    if (dragThresholdPassed) {
      dragThresholdPassed = false;
      return;
    }

    // Smooth scroll for anchor links pointing to reviews
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

      // Keep expanded card stable and clear of the top sticky header
      setTimeout(function() {
        const stickyHeader = document.querySelector('[data-header-top-sticky], .kb-header-top-sticky, .site-header');
        const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 130;
        const rect = card.getBoundingClientRect();

        // If top of card is behind sticky header or bottom is past viewport
        if (rect.top < headerHeight + 15 || rect.bottom > window.innerHeight - 15) {
          const targetScroll = window.scrollY + rect.top - headerHeight - 20;
          window.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
          });
        }
      }, 60);
    }
  });

  // Manual Drag & Touch Scroll Handler ONLY (No Auto-Scroll)
  function initTestimonialsCarousel() {
    document.querySelectorAll('[data-testimonials-carousel]').forEach(function(container) {
      const track = container.querySelector('[data-testimonials-track]');
      if (!track) return;

      // Mouse Drag-to-Scroll Functionality for Desktop
      container.addEventListener('pointerdown', function(e) {
        if (e.target.closest('[data-card-toggle]')) return;
        isDragging = true;
        dragThresholdPassed = false;
        startX = e.pageX - container.offsetLeft;
        scrollLeftStart = container.scrollLeft;
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
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsCarousel);
  } else {
    initTestimonialsCarousel();
  }
})();
