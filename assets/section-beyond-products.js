document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-beyond-products]').forEach((section) => {
    const track = section.querySelector('[data-beyond-track]');
    const slides = section.querySelectorAll('[data-beyond-slide]');
    if (!track || slides.length === 0) return;

    // Optional dots handling if dots container exists
    const dotsContainer = section.querySelector('[data-beyond-dots]');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `beyond-products__dot${index === 0 ? ' is-active' : ''}`;
        dot.setAttribute('type', 'button');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => {
          const slideWidth = slides[index].offsetWidth;
          track.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
        });
        dotsContainer.appendChild(dot);
      });

      const dots = dotsContainer.querySelectorAll('.beyond-products__dot');
      track.addEventListener('scroll', () => {
        const scrollPosition = track.scrollLeft;
        const slideWidth = slides[0].offsetWidth || 1;
        const activeIndex = Math.round(scrollPosition / slideWidth);
        dots.forEach((dot, index) => {
          dot.classList.toggle('is-active', index === activeIndex);
        });
      }, { passive: true });
    }

    // 1. Mouse Wheel Scroll: convert vertical mouse wheel scroll into horizontal scroll
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll > 0) {
          if ((e.deltaY > 0 && track.scrollLeft < maxScroll - 1) || (e.deltaY < 0 && track.scrollLeft > 1)) {
            e.preventDefault();
            track.scrollLeft += e.deltaY;
          }
        }
      }
    }, { passive: false });

    // 2. Desktop Mouse Click & Drag to Scroll
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    track.style.cursor = 'grab';

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      isDragging = false;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => {
      if (isDown) {
        isDown = false;
        track.style.cursor = 'grab';
      }
    });

    track.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        track.style.cursor = 'grab';
      }
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      if (isDragging) {
        e.preventDefault();
        track.scrollLeft = scrollLeft - walk;
      }
    });

    // Prevent link click when user drags mouse
    track.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          isDragging = false;
        }
      });
    });
  });
});
