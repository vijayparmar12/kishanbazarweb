/* Removes a visible error once the customer changes a field. */
(() => {
  if (document.documentElement.dataset.inputInitialized) return;
  document.documentElement.dataset.inputInitialized = 'true';
  document.addEventListener('input', (event) => {
    const field = event.target.closest('.form-field--error');
    if (!field) return;
    field.classList.remove('form-field--error');
    event.target.removeAttribute('aria-invalid');
  });
})();
