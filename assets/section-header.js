(() => {
  document.querySelectorAll('[data-site-header]').forEach((header) => {
    if (header.dataset.initialized) return;
    header.dataset.initialized = 'true';
    const toggle = header.querySelector('[data-header-menu-toggle]'); const close = header.querySelector('[data-header-menu-close]'); const menu = header.querySelector('[data-header-mobile-nav]'); const searchToggle = header.querySelector('[data-header-search-toggle]'); const search = header.querySelector('[data-header-search]');
    const setMenu = (open) => { if (!menu || !toggle) return; menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); if (open) menu.querySelector('a, button')?.focus(); };
    toggle?.addEventListener('click', () => setMenu(menu.hidden)); close?.addEventListener('click', () => setMenu(false));
    searchToggle?.addEventListener('click', () => { const open = search.hidden; search.hidden = !open; searchToggle.setAttribute('aria-expanded', String(open)); if (open) search.querySelector('input')?.focus(); });
    header.querySelectorAll('[data-submenu-toggle]').forEach((button) => button.addEventListener('click', () => button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'))));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { setMenu(false); if (search && !search.hidden) { search.hidden = true; searchToggle?.setAttribute('aria-expanded', 'false'); } } });
    if (header.classList.contains('site-header--sticky')) window.addEventListener('scroll', () => header.classList.toggle('site-header--scrolled', window.scrollY > 8), { passive: true });
  });
})();
