// Testimonials Card Flip, Expand & Drag Scroll
(function() {
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let dragThresholdPassed = false;

  // Delegate click for Testimonial Cards & Review Anchors
  document.addEventListener('click', function(e) {
    if (dragThresholdPassed) {
      dragThresholdPassed = false;
      return;
    }

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
    const isExpanded = card.classList.contains('is-expanded');

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

      setTimeout(function() {
        const stickyHeader = document.querySelector('[data-header-top-sticky], .kb-header-top-sticky, .site-header');
        const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 130;
        const rect = card.getBoundingClientRect();

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

  function initTestimonialsCarousel() {
    document.querySelectorAll('[data-testimonials-carousel]').forEach(function(container) {
      const track = container.querySelector('[data-testimonials-track]');
      if (!track) return;

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

  const startTestimonials = () => {
    const containers = document.querySelectorAll('.testimonials-section__cards-scroll, [data-testimonials-container], [data-testimonials-carousel]');
    if (!containers.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initTestimonialsCarousel();
            observer.disconnect();
          }
        });
      }, { rootMargin: '300px' });
      containers.forEach((c) => observer.observe(c));
    } else {
      initTestimonialsCarousel();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTestimonials);
  } else {
    startTestimonials();
  }
})();
