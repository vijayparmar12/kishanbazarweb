(() => {
  document.querySelectorAll('[data-announcement-bar]').forEach((bar) => {
    if (bar.dataset.initialized) return;
    bar.dataset.initialized = 'true';
    const dismiss = bar.querySelector('[data-announcement-dismiss]');
    const items = [...bar.querySelectorAll('[data-announcement-item]')];
    if (dismiss) dismiss.addEventListener('click', () => { bar.hidden = true; });
    if (items.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let active = 0;
    window.setInterval(() => { items[active].hidden = true; active = (active + 1) % items.length; items[active].hidden = false; }, 4500);
  });
})();
