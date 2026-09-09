(() => {
  const STORAGE_KEY = 'kb_wishlist_items';

  function getSavedItems() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function updateBadgesAndButtons() {
    const items = getSavedItems();
    const count = Array.isArray(items) ? items.length : 0;

    document.querySelectorAll('[data-wishlist-count-badge], .kb-header__action--wishlist .kb-header__badge').forEach((badge) => {
      badge.textContent = String(count);
    });

    if (count > 0 && Array.isArray(items)) {
      document.querySelectorAll('[data-wishlist-button]').forEach((btn) => {
        const vId = btn.dataset.variantId;
        const handle = btn.dataset.productHandle;
        const isSaved = items.some((i) => (vId && String(i.variantId) === String(vId)) || (handle && i.handle && i.handle === handle));
        if (isSaved) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    }
  }

  function loadAsset(url, type) {
    return new Promise((resolve) => {
      if (!url) return resolve();
      if (type === 'css') {
        if (document.querySelector('link[href*="component-wishlist.css"]')) return resolve();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      } else if (type === 'js') {
        if (document.querySelector('script[src*="component-wishlist.js"]') || window.KBWishlist) return resolve();
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = resolve;
        document.body.appendChild(script);
      }
    });
  }

  let isFetchingDrawer = false;

  async function ensureWishlistLoaded() {
    let drawer = document.querySelector('[data-wishlist-drawer]');

    if (!drawer && !isFetchingDrawer) {
      isFetchingDrawer = true;
      try {
        const rootPath = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
        const cleanRoot = rootPath.endsWith('/') ? rootPath : rootPath + '/';
        const res = await fetch(`${cleanRoot}?sections=wishlist-drawer`);
        if (res.ok) {
          const data = await res.json();
          const sectionHtml = data['wishlist-drawer'];
          if (sectionHtml) {
            const container = document.createElement('div');
            container.innerHTML = sectionHtml;
            const sectionNode = container.firstElementChild;
            document.body.appendChild(sectionNode);
            drawer = document.querySelector('[data-wishlist-drawer]');
          }
        }
      } catch (e) {
        console.error('Error fetching wishlist section:', e);
      } finally {
        isFetchingDrawer = false;
      }
    }

    const assets = window.KBWishlistAssets || {};
    const cssUrl = assets.css || (drawer && drawer.dataset.cssUrl);
    const jsUrl = assets.js || (drawer && drawer.dataset.jsUrl);

    await Promise.all([
      loadAsset(cssUrl, 'css'),
      loadAsset(jsUrl, 'js')
    ]);

    return drawer;
  }

  document.addEventListener('click', async (event) => {
    const triggerBtn = event.target.closest('[data-wishlist-drawer-trigger], .kb-header__action--wishlist');
    const wishlistCardBtn = event.target.closest('[data-wishlist-button]');

    if (triggerBtn) {
      event.preventDefault();
      await ensureWishlistLoaded();
      if (window.KBWishlist && window.KBWishlist.open) {
        window.KBWishlist.open();
      }
      return;
    }

    if (wishlistCardBtn) {
      if (!window.KBWishlist) {
        event.preventDefault();
        event.stopPropagation();
        await ensureWishlistLoaded();
        if (window.KBWishlist && window.KBWishlist.toggleItem) {
          window.KBWishlist.toggleItem(wishlistCardBtn);
        } else {
          wishlistCardBtn.click();
        }
      }
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateBadgesAndButtons);
  } else {
    updateBadgesAndButtons();
  }

  window.KBWishlistInit = { updateBadgesAndButtons, ensureWishlistLoaded };
})();
