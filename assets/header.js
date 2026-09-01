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

    document.addEventListener('shopify:block:select', (event) => {
      const menu = header.querySelector('[data-mobile-menu]');
      if (menu && menu.contains(event.target)) {
        setMobileMenu(header, true);
      } else {
        setMobileMenu(header, false);
      }
    });

    document.addEventListener('shopify:block:deselect', () => {
      setMobileMenu(header, false);
    });

    const isJudgeMeModalActive = () => {
      if (document.body.classList.contains('jdgm-review-modal-active') || document.documentElement.classList.contains('jdgm-review-modal-active') || window.location.search.indexOf('pb=0') !== -1) {
        return true;
      }
      var form = document.querySelector('.jdgm-form-wrapper, .jdgm-form, .jdgm-rev-widg__form-wrapper, .jdgm-rev-widg__form, [class*="jdgm-form"]');
      if (form) {
        var style = window.getComputedStyle(form);
        if (style.display !== 'none' && style.visibility !== 'hidden' && (form.offsetWidth > 0 || form.offsetHeight > 0)) {
          return true;
        }
      }
      return false;
    };

    const syncTopHeaderSticky = () => {
      const topSticky = document.querySelector('[data-header-top-sticky], .kb-header-top-sticky');
      const placeholder = document.querySelector('[data-header-top-placeholder]');

      if (placeholder) {
        placeholder.style.display = 'none';
        placeholder.style.height = '0px';
      }

      if (isJudgeMeModalActive()) {
        document.body.classList.add('jdgm-review-modal-active');
        document.documentElement.classList.add('jdgm-review-modal-active');
        document.querySelectorAll('#shopify-section-header-group, .shopify-section-group-header-group, #shopify-section-header, #shopify-section-announcement-bar, header, .kb-header-top-sticky, [data-header-top-sticky]').forEach((h) => {
          h.classList.remove('kb-header-top--fixed');
          h.style.setProperty('display', 'none', 'important');
          h.style.setProperty('opacity', '0', 'important');
          h.style.setProperty('visibility', 'hidden', 'important');
          h.style.setProperty('pointer-events', 'none', 'important');
        });
        return;
      }

      if (!topSticky) return;

      topSticky.style.removeProperty('display');
      topSticky.style.removeProperty('opacity');
      topSticky.style.removeProperty('visibility');
      topSticky.style.removeProperty('pointer-events');

      if (window.scrollY > 5) {
        if (!topSticky.classList.contains('kb-header-top--fixed')) {
          topSticky.classList.add('kb-header-top--fixed');
        }
      } else {
        if (topSticky.classList.contains('kb-header-top--fixed')) {
          topSticky.classList.remove('kb-header-top--fixed');
        }
      }
    };

    syncTopHeaderSticky();
    window.addEventListener('scroll', syncTopHeaderSticky, { passive: true });
    setInterval(syncTopHeaderSticky, 150);
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
      const rootUrl = window.Shopify?.routes?.root || '/';
      const response = await fetch(`${rootUrl}cart.js?_t=${Date.now()}`);
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

  // Monitor Judge.me Write a Review Modal to 100% Hide Header
  const handleJudgeMeModal = () => {
    const form = document.querySelector('.jdgm-form-wrapper, .jdgm-form, .jdgm-rev-widg__form-wrapper, .jdgm-rev-widg__form');
    const isFormOpen = form && (
      form.offsetWidth > 0 || 
      form.offsetHeight > 0 || 
      window.getComputedStyle(form).display !== 'none' ||
      window.getComputedStyle(form).visibility !== 'hidden'
    );

    const isParamOpen = window.location.search.indexOf('pb=0') !== -1 || window.location.search.indexOf('write') !== -1;

    if (isFormOpen || isParamOpen) {
      document.documentElement.classList.add('jdgm-review-modal-active');
      document.body.classList.add('jdgm-review-modal-active');
      const headerEls = document.querySelectorAll('.kb-header, .kb-header-top-sticky, .kb-header1, .kb-header2, [data-header-top-sticky], [data-premium-header], header');
      headerEls.forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      });
    } else {
      document.documentElement.classList.remove('jdgm-review-modal-active');
      document.body.classList.remove('jdgm-review-modal-active');
      const headerEls = document.querySelectorAll('.kb-header, .kb-header-top-sticky, .kb-header1, .kb-header2, [data-header-top-sticky], [data-premium-header], header');
      headerEls.forEach(el => {
        el.style.removeProperty('display');
        el.style.removeProperty('opacity');
        el.style.removeProperty('visibility');
      });
    }
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('.jdgm-write-rev-btn, .jdgm-btn, .jdgm-all-reviews-rating-actions__write-btn')) {
      setTimeout(handleJudgeMeModal, 10);
      setTimeout(handleJudgeMeModal, 100);
      setTimeout(handleJudgeMeModal, 300);
    }
  });

  setInterval(handleJudgeMeModal, 150);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAllHeaders();
      syncCartState();
      handleJudgeMeModal();
    });
  } else {
    initAllHeaders();
    syncCartState();
    handleJudgeMeModal();
  }

  document.addEventListener('shopify:section:load', initAllHeaders);
})();
