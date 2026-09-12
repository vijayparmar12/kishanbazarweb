/* Clean Shoppable Videos JS — On-demand click play with sound & proper arrows */
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
        const slideWidth = this.viewport.querySelector('.shoppable-videos__slide')?.offsetWidth || 220;
        this.viewport.scrollBy({ left: -(slideWidth * 2), behavior: 'smooth' });
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        const slideWidth = this.viewport.querySelector('.shoppable-videos__slide')?.offsetWidth || 220;
        this.viewport.scrollBy({ left: slideWidth * 2, behavior: 'smooth' });
      });
    }
  }

  bindVideos() {
    const cards = this.root.querySelectorAll('.shoppable-videos__card');

    cards.forEach((card) => {
      const mediaWrap = card.querySelector('.shoppable-videos__media-wrap');
      const video = card.querySelector('.shoppable-videos__video');
      const muteBtn = card.querySelector('.shoppable-videos__mute-btn');
      if (!video || !mediaWrap) return;

      // Unmute by default when clicked to play
      video.muted = false;

      // Handle Play/Pause on Video Click
      mediaWrap.addEventListener('click', (e) => {
        if (e.target.closest('.shoppable-videos__mute-btn')) return;

        // Pause all other videos on the page
        document.querySelectorAll('.shoppable-videos__video').forEach((otherVid) => {
          if (otherVid !== video) {
            otherVid.pause();
            const otherWrap = otherVid.closest('.shoppable-videos__media-wrap');
            if (otherWrap) otherWrap.classList.remove('is-playing');
          }
        });

        if (video.paused) {
          video.play().then(() => {
            mediaWrap.classList.add('is-playing');
          }).catch(() => {
            // Fallback muted play if browser blocks unmuted autoplay on click
            video.muted = true;
            video.play();
            mediaWrap.classList.add('is-playing');
          });
        } else {
          video.pause();
          mediaWrap.classList.remove('is-playing');
        }
      });

      // Handle Mute / Unmute Button Click
      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          video.muted = !video.muted;
          const unmutedIcon = muteBtn.querySelector('.icon-unmuted');
          const mutedIcon = muteBtn.querySelector('.icon-muted');
          if (unmutedIcon && mutedIcon) {
            unmutedIcon.style.display = video.muted ? 'none' : 'block';
            mutedIcon.style.display = video.muted ? 'block' : 'none';
          }
        });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-shoppable-videos]').forEach((el) => {
    new ShoppableVideosSection(el);
  });
});
