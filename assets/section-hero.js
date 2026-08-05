(() => {
  function initHeroSlider(section) {
    if (!section || section.dataset.sliderInitialized === 'true') return;
    section.dataset.sliderInitialized = 'true';

    const slider = section.querySelector('[data-hero-top-slider]');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(slider.querySelectorAll('[data-hero-dot]'));

    if (slides.length <= 1) return;

    let currentIndex = 0;
    let timer = null;
    const intervalTime = 4500; // 4.5 seconds auto-play

    function goToSlide(index) {
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('is-active');
          slide.removeAttribute('aria-hidden');
        } else {
          slide.classList.remove('is-active');
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('is-active');
          dot.setAttribute('aria-selected', 'true');
        } else {
          dot.classList.remove('is-active');
          dot.setAttribute('aria-selected', 'false');
        }
      });

      currentIndex = index;
    }

    function nextSlide() {
      const nextIndex = (currentIndex + 1) % slides.length;
      goToSlide(nextIndex);
    }

    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(nextSlide, intervalTime);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Dot navigation click events
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const slideIndex = parseInt(dot.dataset.heroDotIndex, 10);
        if (!isNaN(slideIndex)) {
          goToSlide(slideIndex);
          startAutoplay();
        }
      });
    });

    // Pause autoplay on mouse enter, resume on mouse leave
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // Touch Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeDistance = touchEndX - touchStartX;
      if (Math.abs(swipeDistance) > 40) {
        if (swipeDistance < 0) {
          nextSlide();
        } else {
          const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
          goToSlide(prevIndex);
        }
        startAutoplay();
      }
    }

    // Start auto-play loop
    startAutoplay();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-home-hero]').forEach(initHeroSlider);

    // Our Story Smooth Scroll Handler
    document.querySelectorAll('[data-our-story-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const videoSection = document.querySelector('[data-home-video], .section-video, #our-story');
        if (videoSection) {
          e.preventDefault();
          videoSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  });

  // Shopify Theme Editor Section Load Event Support
  document.addEventListener('shopify:section:load', (e) => {
    const heroSection = e.target.querySelector('[data-home-hero]') || e.target;
    if (heroSection && heroSection.matches('[data-home-hero]')) {
      initHeroSlider(heroSection);
    }
  });

  // Fallback direct execution
  document.querySelectorAll('[data-home-hero]').forEach(initHeroSlider);
})();
