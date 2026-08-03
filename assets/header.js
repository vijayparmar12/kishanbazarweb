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

    const syncHeader1Sticky = () => {
      const header1 = document.querySelector('[data-header1]');
      const placeholder = document.querySelector('[data-header1-placeholder]');
      const announcement = document.querySelector('.kb-header__announcement');
      if (!header1) return;

      const threshold = announcement ? announcement.offsetHeight : 0;
      if (window.scrollY > threshold) {
        if (!header1.classList.contains('kb-header1--fixed')) {
          header1.classList.add('kb-header1--fixed');
          if (placeholder) {
            placeholder.style.height = header1.offsetHeight + 'px';
            placeholder.style.display = 'block';
          }
        }
      } else {
        if (header1.classList.contains('kb-header1--fixed')) {
          header1.classList.remove('kb-header1--fixed');
          if (placeholder) placeholder.style.display = 'none';
        }
      }
    };

    syncHeader1Sticky();
    window.addEventListener('scroll', syncHeader1Sticky, { passive: true });
  };

  const initAllHeaders = () => {
    document.querySelectorAll('[data-premium-header]').forEach(initHeader);
  };

  const formatMoney = (value) => {
    const amount = Number(value || 0) / 100;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: window.Shopify?.currency?.active || 'INR' }).format(amount);
  };

  const updateDrawer = (cart) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(cart.item_count);
    });

    const title = drawer.querySelector('#CartDrawerTitle');
    if (title) title.textContent = `Your cart (${cart.item_count})`;

    const subtotal = drawer.querySelector('[data-cart-drawer-subtotal]');
    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);
  };

  const syncCartState = async () => {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      updateDrawer(cart);
    } catch (error) {
      console.error(error);
    }
  };

  const openCartDrawer = async () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    const trigger = document.querySelector('[data-cart-drawer-trigger]');
    if (!drawer) return;

    drawer.dataset.cartDrawerMode = 'full';
    drawer.hidden = false;
    drawer.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
    trigger?.classList.add('is-open');
    await syncCartState();
  };

  const closeCartDrawer = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    const trigger = document.querySelector('[data-cart-drawer-trigger]');
    if (!drawer) return;

    drawer.hidden = true;
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
    trigger?.classList.remove('is-open');
  };

  document.addEventListener('kb:cart:updated', (event) => {
    if (event.detail?.cart) updateDrawer(event.detail.cart);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-cart-drawer-trigger]')) return;
    event.preventDefault();
    openCartDrawer();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-cart-drawer-close]')) return;
    closeCartDrawer();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllHeaders);
    document.addEventListener('DOMContentLoaded', syncCartState);
  } else {
    initAllHeaders();
    syncCartState();
  }

  document.addEventListener('shopify:section:load', initAllHeaders);
})();
