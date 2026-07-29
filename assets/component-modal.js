/* Modal open, close, focus management, and scroll locking. */
(() => {
  if (document.documentElement.dataset.modalInitialized) return;
  document.documentElement.dataset.modalInitialized = 'true';
  let activeModal;
  let returnFocus;
  const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const close = () => { if (!activeModal) return; activeModal.hidden = true; activeModal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); returnFocus?.focus(); activeModal = null; };
  const open = (modal, trigger) => { if (!modal) return; returnFocus = trigger; activeModal = modal; modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); requestAnimationFrame(() => modal.querySelector(focusable)?.focus()); };
  document.addEventListener('click', (event) => { const trigger = event.target.closest('[data-modal-open]'); if (trigger) { event.preventDefault(); open(document.getElementById(trigger.dataset.modalOpen), trigger); return; } if (event.target.closest('[data-modal-close]')) close(); });
  document.addEventListener('keydown', (event) => { if (!activeModal) return; if (event.key === 'Escape') { close(); return; } if (event.key !== 'Tab') return; const nodes = [...activeModal.querySelectorAll(focusable)]; if (!nodes.length) return; if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0].focus(); } });
})();
