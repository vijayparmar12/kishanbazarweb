/* Button busy-state enhancement. */
(() => {
  if (document.documentElement.dataset.buttonInitialized) return;
  document.documentElement.dataset.buttonInitialized = 'true';
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-button-loading]');
    if (button) button.setAttribute('aria-busy', 'true');
  });
})();
