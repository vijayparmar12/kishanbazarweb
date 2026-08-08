(() => {
  'use strict';

  function initOurStoryAnimations() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scroll Reveal Observer
    const revealElements = document.querySelectorAll('[data-story-reveal]');
    if (revealElements.length > 0) {
      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((el) => el.classList.add('is-visible'));
      } else {
        const revealObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
              }
            });
          },
          {
            rootMargin: '0px 0px -60px 0px',
            threshold: 0.1,
          }
        );

        revealElements.forEach((el) => revealObserver.observe(el));
      }
    }

    // 2. Animated Counter Numbers
    const counterElements = document.querySelectorAll('[data-story-counter]');
    if (counterElements.length > 0) {
      const counterObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const counter = entry.target;
              animateCounter(counter);
              observer.unobserve(counter);
            }
          });
        },
        { threshold: 0.5 }
      );

      counterElements.forEach((counter) => counterObserver.observe(counter));
    }
  }

  function animateCounter(el) {
    const targetVal = parseInt(el.getAttribute('data-story-counter'), 10);
    if (isNaN(targetVal)) return;

    const duration = 1600; // ms
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easeOut = 1 - (1 - progress) * (1 - progress);
      const currentCount = Math.floor(easeOut * targetVal);

      el.textContent = currentCount.toString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = targetVal.toString();
      }
    }

    requestAnimationFrame(step);
  }

  // DOM Content Loaded Execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOurStoryAnimations);
  } else {
    initOurStoryAnimations();
  }

  // Shopify Theme Editor Support
  document.addEventListener('shopify:section:load', (e) => {
    initOurStoryAnimations();
  });
})();
