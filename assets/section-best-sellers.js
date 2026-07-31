document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-best-sellers]').forEach((section) => {
    const track = section.querySelector('[data-best-sellers-track]');
    const prevBtn = section.querySelector('[data-best-sellers-prev]');
    const nextBtn = section.querySelector('[data-best-sellers-next]');
    const tabs = section.querySelectorAll('[data-best-sellers-tab]');
    const cards = section.querySelectorAll('[data-product-card]');

    if (prevBtn && nextBtn && track) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -320, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: 320, behavior: 'smooth' });
      });
    }

    if (tabs.length > 0 && cards.length > 0) {
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach((t) => t.classList.remove('is-active'));
          tab.classList.add('is-active');

          const category = tab.dataset.categoryFilter ? tab.dataset.categoryFilter.toLowerCase() : 'all';

          cards.forEach((card) => {
            const handle = card.dataset.productHandle ? card.dataset.productHandle.toLowerCase() : '';
            const text = card.textContent.toLowerCase();

            if (category === 'all' || category === 'newly launched') {
              card.style.display = 'flex';
            } else if (text.includes(category) || handle.includes(category)) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    }
  });
});
