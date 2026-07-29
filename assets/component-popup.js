/* Notification auto-dismiss behavior. */
(() => {
  if (document.documentElement.dataset.popupInitialized) return;
  document.documentElement.dataset.popupInitialized = 'true';
  const dismiss = (popup) => { popup.hidden = true; };
  document.addEventListener('click', (event) => { const close = event.target.closest('[data-popup-close]'); if (close) dismiss(close.closest('[data-popup]')); });
  document.querySelectorAll('[data-popup]').forEach((popup) => { const duration = Number(popup.dataset.popupDuration); if (duration > 0 && !popup.hidden) window.setTimeout(() => dismiss(popup), duration); });
})();
