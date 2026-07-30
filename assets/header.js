(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const parsePlaceholders = (header) => {
    const source = header.querySelector('[data-placeholder-source]');
    if (!source) return [];

    try {
      const value = JSON.parse(source.textContent || '""');
      return String(value)
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  };

  const startTypingPlaceholder = (input, placeholders) => {
    if (!input || placeholders.length === 0) return;

    if (reduceMotion || placeholders.length === 1) {
      input.setAttribute('placeholder', placeholders[0]);
      return;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timeoutId;

    const typeNext = () => {
      const phrase = placeholders[phraseIndex];
      input.setAttribute('placeholder', phrase.slice(0, characterIndex));

      if (!deleting && characterIndex < phrase.length) {
        characterIndex += 1;
        timeoutId = window.setTimeout(typeNext, 55);
        return;
      }

      if (!deleting && characterIndex === phrase.length) {
        deleting = true;
        timeoutId = window.setTimeout(typeNext, 950);
        return;
      }

      if (deleting && characterIndex > 0) {
        characterIndex -= 1;
        timeoutId = window.setTimeout(typeNext, 32);
        return;
      }

      deleting = false;
      phraseIndex = (phraseIndex + 1) % placeholders.length;
      timeoutId = window.setTimeout(typeNext, 220);
    };

    typeNext();

    document.addEventListener('shopify:section:unload', () => {
      window.clearTimeout(timeoutId);
    });
  };

  const setMobileMenu = (header, open) => {
    const toggle = header.querySelector('[data-menu-toggle]');
    const menu = header.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return;

    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('kb-header-menu-open', open);

    if (open) {
      const focusTarget = menu.querySelector('button, a');
      focusTarget?.focus({ preventScroll: true });
    } else {
      toggle.focus({ preventScroll: true });
    }
  };

  const initHeader = (header) => {
    if (header.dataset.premiumHeaderInitialized === 'true') return;
    header.dataset.premiumHeaderInitialized = 'true';

    const input = header.querySelector('[data-typing-search]');
    startTypingPlaceholder(input, parsePlaceholders(header));

    header.querySelector('[data-search-clear]')?.addEventListener('click', () => {
      if (!input) return;
      input.value = '';
      input.focus();
    });

    header.querySelector('[data-menu-toggle]')?.addEventListener('click', () => {
      const menu = header.querySelector('[data-mobile-menu]');
      setMobileMenu(header, Boolean(menu?.hidden));
    });

    header.querySelectorAll('[data-menu-close]').forEach((closeControl) => {
      closeControl.addEventListener('click', () => setMobileMenu(header, false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const menu = header.querySelector('[data-mobile-menu]');
        if (menu && !menu.hidden) setMobileMenu(header, false);
      }
    });

    const syncStickyState = () => {
      header.classList.toggle('kb-header--scrolled', window.scrollY > 8);
    };

    if (header.classList.contains('kb-header--sticky')) {
      syncStickyState();
      window.addEventListener('scroll', syncStickyState, { passive: true });
    }
  };

  const initAllHeaders = () => {
    document.querySelectorAll('[data-premium-header]').forEach(initHeader);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllHeaders);
  } else {
    initAllHeaders();
  }

  document.addEventListener('shopify:section:load', initAllHeaders);
})();
