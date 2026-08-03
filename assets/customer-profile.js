(() => {
  const STORAGE_KEY_AUTH = 'kb_customer_session';

  window.openProfileModal = () => {
    const modal = document.querySelector('[data-profile-modal]');
    if (!modal) return;
    modal.removeAttribute('hidden');
    modal.hidden = false;
    modal.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
  };

  window.closeProfileModal = () => {
    const modal = document.querySelector('[data-profile-modal]');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
  };

  const switchTab = (tabName) => {
    const dashboard = document.querySelector('[data-profile-dashboard]');
    if (!dashboard) return;

    // 1. Update menu active state
    dashboard.querySelectorAll('[data-profile-tab]').forEach((link) => {
      const isMatch = link.dataset.profileTab === tabName;
      link.classList.toggle('is-active', isMatch);
    });

    // 2. Update panel visibility
    dashboard.querySelectorAll('[data-panel]').forEach((panel) => {
      const isMatch = panel.dataset.panel === tabName;
      panel.style.display = isMatch ? 'block' : 'none';
      panel.classList.toggle('is-active', isMatch);
    });
  };

  const handleHashChange = () => {
    const hash = window.location.hash.replace('#', '') || 'profile';
    switchTab(hash);
  };

  const openLogoutModal = () => {
    const modal = document.querySelector('[data-logout-modal]');
    if (modal) modal.hidden = false;
  };

  const closeLogoutModal = () => {
    const modal = document.querySelector('[data-logout-modal]');
    if (modal) modal.hidden = true;
  };

  const performLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {}
    window.location.href = '/';
  };

  // Profile Edit Form Submit Handler
  document.addEventListener('submit', (event) => {
    if (event.target.matches('[data-profile-edit-form]')) {
      event.preventDefault();
      const form = event.target;
      const successMsg = form.querySelector('[data-profile-success]');

      const firstName = form.querySelector('[name="first_name"]')?.value || '';
      const lastName = form.querySelector('[name="last_name"]')?.value || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = form.querySelector('[name="email"]')?.value || '';
      const phone = form.querySelector('[name="phone"]')?.value || '';

      // Update UI displays
      document.querySelectorAll('[data-user-display-name]').forEach((el) => { el.textContent = fullName; });
      document.querySelectorAll('[data-user-display-email]').forEach((el) => { el.textContent = email; });
      document.querySelectorAll('[data-user-display-phone]').forEach((el) => { el.textContent = phone; });

      // Save in localStorage session
      try {
        const session = JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH) || '{}');
        session.name = fullName;
        session.email = email;
        session.phone = phone;
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
      } catch (e) {}

      if (successMsg) {
        successMsg.style.display = 'block';
        setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
      }
    }
  });

  // Global Clicks
  document.addEventListener('click', (event) => {
    // 1. Sidebar Tab Click
    const tabLink = event.target.closest('[data-profile-tab]');
    if (tabLink) {
      const tabName = tabLink.dataset.profileTab;
      if (tabName) {
        event.preventDefault();
        window.location.hash = tabName;
        switchTab(tabName);
      }
    }

    // 2. Trigger Logout
    if (event.target.closest('[data-trigger-logout]')) {
      openLogoutModal();
    }

    // 3. Close Logout Modal
    if (event.target.closest('[data-close-logout]')) {
      closeLogoutModal();
    }

    // 4. Confirm Logout
    if (event.target.closest('[data-confirm-logout]')) {
      performLogout();
    }

    // 5. Close Profile Modal
    if (event.target.closest('[data-close-profile]')) {
      window.closeProfileModal();
    }
  });

  window.addEventListener('hashchange', handleHashChange);
  document.addEventListener('DOMContentLoaded', () => {
    handleHashChange();
  });
  if (document.readyState !== 'loading') {
    handleHashChange();
  }
})();
