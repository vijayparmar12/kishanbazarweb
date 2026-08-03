(() => {
  document.querySelectorAll('[data-checkout-banner]').forEach((section) => {
    if (section.dataset.initialized === 'true') return;
    section.dataset.initialized = 'true';

    section.querySelectorAll('[data-payment-choice-group] button, [data-payment-method]').forEach((button) => {
      button.addEventListener('click', () => {
        const group = button.closest('[data-payment-choice-group]');
        group?.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
      });
    });
  });
})();