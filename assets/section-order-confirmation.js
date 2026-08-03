(() => {
  document.querySelectorAll('[data-order-confirmation]').forEach((section) => {
    if (section.dataset.initialized === 'true') return;
    section.dataset.initialized = 'true';

    const links = section.querySelectorAll('[href="#"]');
    links.forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
  });
})();