/* Lightweight Shoppable Videos JS */
class ShoppableVideosSection {
  constructor(root) {
    this.root = root;
    this.viewport = root.querySelector('.shoppable-videos__viewport');
    this.prevBtn = root.querySelector('.shoppable-videos__arrow--prev');
    this.nextBtn = root.querySelector('.shoppable-videos__arrow--next');

    this.bindArrows();
    this.bindVideos();
  }

  bindArrows() {
    if (!this.viewport) return;
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.viewport.scrollBy({ left: -320, behavior: 'smooth' });
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.viewport.scrollBy({ left: 320, behavior: 'smooth' });
      });
    }
  }

  bindVideos() {
    const cards = this.root.querySelectorAll('.shoppable-videos__card');

    cards.forEach((card) => {
      const video = card.querySelector('.shoppable-videos__video');
      const muteBtn = card.querySelector('.shoppable-videos__mute-btn');
      if (!video) return;

      // Handle Mute / Unmute Button
      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          video.muted = !video.muted;
          const mutedIcon = muteBtn.querySelector('.icon-muted');
          const unmutedIcon = muteBtn.querySelector('.icon-unmuted');
          if (mutedIcon && unmutedIcon) {
            mutedIcon.style.display = video.muted ? 'block' : 'none';
            unmutedIcon.style.display = video.muted ? 'none' : 'block';
          }
        });
      }

      // Intersection Observer for viewport playback
      if ('IntersectionObserver' in window) {
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
          { threshold: 0.5 }
        );
        observer.observe(card);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-shoppable-videos]').forEach((el) => {
    new ShoppableVideosSection(el);
  });
});
