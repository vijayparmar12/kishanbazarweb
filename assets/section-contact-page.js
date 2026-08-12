/* Kisan Bazar Contact Page JS - FAQ Accordion Toggle */
(function() {
  function initContactPage() {
    // Accordion Toggle
    document.querySelectorAll('[data-faq-accordion]').forEach(function(item) {
      const trigger = item.querySelector('[data-faq-trigger]');
      if (!trigger) return;

      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const isOpen = item.classList.contains('is-open');

        // Close other accordion items in the same container
        const container = item.closest('[data-faq-container]');
        if (container) {
          container.querySelectorAll('[data-faq-accordion].is-open').forEach(function(otherItem) {
            if (otherItem !== item) {
              otherItem.classList.remove('is-open');
            }
          });
        }

        item.classList.toggle('is-open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactPage);
  } else {
    initContactPage();
  }
})();
