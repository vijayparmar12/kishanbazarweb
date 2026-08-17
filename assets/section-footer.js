document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-site-footer]').forEach((footer) => {
    if (footer.dataset.initialized) return;
    footer.dataset.initialized = 'true';

    footer.querySelector('[data-back-to-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    footer.querySelectorAll('[data-footer-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.innerWidth >= 768) return;

        const parent = btn.closest('[data-footer-col]');
        if (!parent) return;

        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        parent.classList.toggle('is-open', !isExpanded);
      });
    });
  });
});
