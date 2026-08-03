(() => {
  window.openMembershipModal = () => {
    const modal = document.querySelector('[data-membership-modal]');
    if (modal) {
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeMembershipModal = () => {
    const modal = document.querySelector('[data-membership-modal]');
    if (modal) {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  };

  // Intercept click on any Join Collective / Membership link
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-membership-trigger], a[href*="/pages/membership"]');
    if (trigger && !event.target.closest('.kb-membership-modal')) {
      event.preventDefault();
      window.openMembershipModal();
      return;
    }

    const closeBtn = event.target.closest('[data-close-membership]');
    if (closeBtn) {
      event.preventDefault();
      window.closeMembershipModal();
      return;
    }

    // Plan Buying Action Trigger
    const buyBtn = event.target.closest('[data-buy-membership]');
    if (buyBtn) {
      event.preventDefault();
      const planName = buyBtn.dataset.buyMembership || 'starter';

      // Open Antigravity OTP Auth Modal if guest, or open cart
      const session = localStorage.getItem('kb_customer_session');
      if (!session) {
        const authTrigger = document.querySelector('[data-customer-login-trigger]');
        if (authTrigger) authTrigger.click();
      } else {
        const cartTrigger = document.querySelector('[data-cart-drawer-trigger]');
        if (cartTrigger) cartTrigger.click();
      }
    }
  });

  // Animated Counter Effect for Hero Trust Badges
  const animateCounters = () => {
    document.querySelectorAll('[data-counter]').forEach((el) => {
      const target = Number(el.dataset.counter || 0);
      if (!target) return;
      let count = 0;
      const step = Math.ceil(target / 40);

      const timer = setInterval(() => {
        count += step;
        if (count >= target) {
          count = target;
          clearInterval(timer);
        }
        el.textContent = count.toLocaleString() + '+';
      }, 30);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    animateCounters();
    if (window.location.pathname.includes('/pages/membership') || window.location.hash.includes('membership')) {
      window.openMembershipModal();
    }
  });
})();
