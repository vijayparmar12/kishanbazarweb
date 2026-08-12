document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-beyond-products]').forEach((section) => {
    const track = section.querySelector('[data-beyond-track]');
    const slides = section.querySelectorAll('[data-beyond-slide]');
    const dotsContainer = section.querySelector('[data-beyond-dots]');

    if (!track || slides.length === 0 || !dotsContainer) return;

    // Create pagination dots
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

    // Update active dot on scroll
    track.addEventListener('scroll', () => {
      const scrollPosition = track.scrollLeft;
      const slideWidth = slides[0].offsetWidth;
      const activeIndex = Math.round(scrollPosition / slideWidth);

      dots.forEach((dot, index) => {
        if (index === activeIndex) {
          dot.classList.add('is-active');
        } else {
          dot.classList.remove('is-active');
        }
      });
    }, { passive: true });
  });
});
