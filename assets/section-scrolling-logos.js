(() => {
  function initScrollingLogos() {
    const scrollers = document.querySelectorAll('.kb-scrolling-logos__scroller');
    scrollers.forEach((scroller) => {
      if (scroller.dataset.initialized) return;
      scroller.dataset.initialized = 'true';

      const section = scroller.closest('.kb-scrolling-logos');
      const pauseOnHover = section && section.dataset.pauseOnHover === 'true';

      // Mobile touch pause & resume
      if (pauseOnHover) {
        let resumeTimeout = null;
        scroller.addEventListener(
          'touchstart',
          () => {
            clearTimeout(resumeTimeout);
            scroller.querySelectorAll('.kb-scrolling-logos__track--animate').forEach((track) => {
              track.style.animationPlayState = 'paused';
            });
          },
          { passive: true }
        );

        scroller.addEventListener(
          'touchend',
          () => {
            resumeTimeout = setTimeout(() => {
              scroller.querySelectorAll('.kb-scrolling-logos__track--animate').forEach((track) => {
                track.style.animationPlayState = 'running';
              });
            }, 1200);
          },
          { passive: true }
        );
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollingLogos);
  } else {
    initScrollingLogos();
  }

  // Shopify theme editor support
  document.addEventListener('shopify:section:load', (event) => {
    if (event.target.classList.contains('section-scrolling-logos')) {
      initScrollingLogos();
    }
  });
})();
