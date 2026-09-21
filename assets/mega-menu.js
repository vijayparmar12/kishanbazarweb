(() => {
  const closeItem = (item) => {
    const trigger = item.querySelector('[data-mega-trigger]');
    item.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
  };

  const openItem = (item) => {
    const header = item.closest('[data-premium-header]');
    header?.querySelectorAll('[data-mega-item].is-open').forEach((openMega) => {
      if (openMega !== item) closeItem(openMega);
    });

    const trigger = item.querySelector('[data-mega-trigger]');
    item.classList.add('is-open');
    trigger?.setAttribute('aria-expanded', 'true');
  };

  const initMegaMenus = (root = document) => {
    root.querySelectorAll('[data-premium-header]').forEach((header) => {
      if (header.dataset.megaMenuInitialized === 'true') return;
      header.dataset.megaMenuInitialized = 'true';

      header.querySelectorAll('[data-mega-item]').forEach((item) => {
        const trigger = item.querySelector('[data-mega-trigger]');

        item.addEventListener('mouseenter', () => openItem(item));
        item.addEventListener('mouseleave', () => closeItem(item));

        trigger?.addEventListener('click', (event) => {
          event.preventDefault();

          if (item.classList.contains('is-open')) {
            closeItem(item);
          } else {
            openItem(item);
          }
        });

        trigger?.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            openItem(item);
            item.querySelector('[data-mega-panel] a')?.focus();
          }
        });
      });

      header.querySelectorAll('[data-mega-mobile]').forEach((details) => {
        details.addEventListener('toggle', () => {
          if (!details.open) return;

          header.querySelectorAll('[data-mega-mobile][open]').forEach((openDetails) => {
            if (openDetails !== details) openDetails.open = false;
          });
        });
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        header.querySelectorAll('[data-mega-item].is-open').forEach(closeItem);
      });

      document.addEventListener('click', (event) => {
        if (header.contains(event.target)) return;
        header.querySelectorAll('[data-mega-item].is-open').forEach(closeItem);
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initMegaMenus());
  } else {
    initMegaMenus();
  }

  document.addEventListener('shopify:section:load', (event) => initMegaMenus(event.target));
})();
