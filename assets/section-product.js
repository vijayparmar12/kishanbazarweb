(() => {
  document.querySelectorAll('[data-main-product]').forEach((section) => {
    if (section.dataset.initialized) return;

    section.dataset.initialized = 'true';

    const slides = [...section.querySelectorAll('[data-product-media]')];
    section.querySelectorAll('[data-product-thumb]').forEach((button) => {
      button.addEventListener('click', () => {
        slides.forEach((slide, index) => {
          slide.hidden = index !== Number(button.dataset.productThumb);
        });
      });
    });

    section.querySelectorAll('[data-product-description]').forEach((description) => {
      const content = description.querySelector('[data-product-description-content]');
      const toggle = description.querySelector('[data-product-description-toggle]');

      if (!content || !toggle) return;

      requestAnimationFrame(() => {
        if (content.scrollHeight <= content.clientHeight + 2) {
          toggle.hidden = true;
        }
      });

      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        content.classList.toggle('is-collapsed', expanded);
        toggle.textContent = expanded ? 'Read more' : 'Show less';
      });
    });
  });

  document.querySelectorAll('[data-product-recommendations]').forEach((container) => {
    const url = `${window.Shopify?.routes?.root || '/'}recommendations/products?section_id=product-recommendations&product_id=${container.dataset.productId}&limit=${container.dataset.limit}`;
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const section = doc.querySelector('.product-recommendations');
        if (section) container.innerHTML = section.innerHTML;
      })
      .catch(() => {});
  });
})();
