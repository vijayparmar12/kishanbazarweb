/* ==========================================================================
   KISHAN BAZAR - ATTRACTIVE VIDEO SECTION INTERACTIVE CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initVideoSection();
});

function initVideoSection() {
  const sections = document.querySelectorAll('[data-home-video]');
  sections.forEach((section) => {
    const trigger = section.querySelector('[data-video-trigger]');
    const mediaContainer = section.querySelector('[data-video-media-container]');
    const modal = section.querySelector('[data-video-modal]');
    const modalBody = section.querySelector('[data-video-modal-body]');
    const modalCloses = section.querySelectorAll('[data-video-modal-close]');

    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const videoEl = section.querySelector('.home-video__media');
      const iframeEl = section.querySelector('[data-video-iframe]');

      // If html5 video tag, play directly
      if (videoEl) {
        trigger.style.display = 'none';
        videoEl.play();
        return;
      }

      // If iframe / modal player
      if (iframeEl && modal && modalBody) {
        modalBody.innerHTML = iframeEl.outerHTML;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      } else {
        // Fallback: hide trigger overlay
        trigger.style.display = 'none';
      }
    });

    modalCloses.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (modal) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
          if (modalBody) modalBody.innerHTML = '';
        }
      });
    });
  });
}
