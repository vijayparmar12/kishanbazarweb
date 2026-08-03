(() => {
  const STORAGE_KEY_AUTH = 'kb_customer_session';
  let countdownInterval = null;
  let activePhone = '';

  const getSession = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const saveSession = (sessionData) => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(sessionData));
    } catch (e) {
      console.error(e);
    }
  };

  const openAuthModal = () => {
    const modal = document.querySelector('[data-auth-modal]');
    if (!modal) return;
    modal.hidden = false;
    modal.classList.add('is-open');
    document.documentElement.classList.add('kb-cart-drawer-open');
    showStep('phone');
  };

  const closeAuthModal = () => {
    const modal = document.querySelector('[data-auth-modal]');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('kb-cart-drawer-open');
    clearInterval(countdownInterval);
  };

  const showStep = (stepName) => {
    const modal = document.querySelector('[data-auth-modal]');
    if (!modal) return;
    modal.querySelectorAll('[data-auth-step]').forEach((step) => {
      step.style.display = step.dataset.authStep === stepName ? 'block' : 'none';
    });
  };

  const startCountdown = (seconds = 30) => {
    clearInterval(countdownInterval);
    const timerDisplay = document.querySelector('[data-otp-timer]');
    const resendBtn = document.querySelector('[data-resend-otp]');
    let remaining = seconds;

    if (timerDisplay) timerDisplay.style.display = 'inline';
    if (resendBtn) {
      resendBtn.style.display = 'none';
      resendBtn.disabled = true;
    }

    countdownInterval = setInterval(() => {
      remaining -= 1;
      const formatted = `00:${String(remaining).padStart(2, '0')}`;
      if (timerDisplay) timerDisplay.querySelector('strong').textContent = formatted;

      if (remaining <= 0) {
        clearInterval(countdownInterval);
        if (timerDisplay) timerDisplay.style.display = 'none';
        if (resendBtn) {
          resendBtn.style.display = 'inline';
          resendBtn.disabled = false;
        }
      }
    }, 1000);
  };

  const handlePhoneSubmit = async (phoneValue) => {
    activePhone = phoneValue;
    const sendBtn = document.querySelector('[data-send-otp-btn]');
    const btnText = sendBtn?.querySelector('.btn-text');
    const btnLoader = sendBtn?.querySelector('.btn-loader');

    if (sendBtn) sendBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';

    // Simulate Antigravity OTP Sending API Call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (sendBtn) sendBtn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnLoader) btnLoader.style.display = 'none';

    document.querySelectorAll('[data-display-phone]').forEach((el) => {
      el.textContent = `+91 ${phoneValue}`;
    });

    showStep('otp');
    startCountdown(30);

    // Auto-focus first OTP box
    const firstBox = document.querySelector('[data-otp-box="1"]');
    if (firstBox) firstBox.focus();
  };

  const handleOtpVerify = async (otpCode) => {
    const verifyBtn = document.querySelector('[data-verify-otp-btn]');
    const btnText = verifyBtn?.querySelector('.btn-text');
    const btnLoader = verifyBtn?.querySelector('.btn-loader');

    if (verifyBtn) verifyBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';

    // Simulate Antigravity OTP Verification API Call
    await new Promise((resolve) => setTimeout(resolve, 900));

    const sessionData = {
      isLoggedIn: true,
      phone: `+91 ${activePhone}`,
      name: 'Vaibhavi Anilbhai Raut',
      email: 'vaibhaviraut031@gmail.com',
      memberSince: 'Aug 2026',
      loyaltyPoints: 450
    };
    saveSession(sessionData);

    closeAuthModal();

    if (typeof window.openProfileModal === 'function') {
      window.openProfileModal();
    } else {
      window.location.href = '/pages/account';
    }
  };

  // 6-Digit OTP Box Interactivity (Auto-advance, backspace, paste)
  const initOtpBoxes = () => {
    const otpGrid = document.querySelector('[data-otp-grid]');
    if (!otpGrid) return;
    const boxes = [...otpGrid.querySelectorAll('[data-otp-box]')];
    const verifyBtn = document.querySelector('[data-verify-otp-btn]');

    const checkComplete = () => {
      const code = boxes.map((b) => b.value).join('');
      if (verifyBtn) verifyBtn.disabled = code.length !== 6;
      if (code.length === 6) handleOtpVerify(code);
    };

    boxes.forEach((box, index) => {
      box.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;

        if (val && index < boxes.length - 1) {
          boxes[index + 1].focus();
        }
        checkComplete();
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && index > 0) {
          boxes[index - 1].focus();
        }
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (pasteData) {
          pasteData.split('').forEach((char, i) => {
            if (boxes[i]) boxes[i].value = char;
          });
          boxes[Math.min(pasteData.length, boxes.length - 1)].focus();
          checkComplete();
        }
      });
    });
  };

  // Event Listeners
  document.addEventListener('click', (event) => {
    // 1. Click Profile Icon or Mobile Account Button
    const profileTrigger = event.target.closest('a[href*="/account"], [data-customer-login-trigger]');
    if (profileTrigger) {
      event.preventDefault();
      const session = getSession();
      if (!session || !session.isLoggedIn) {
        openAuthModal();
      } else {
        window.location.href = '/pages/account';
      }
    }

    // 2. Auth Modal Close
    if (event.target.closest('[data-auth-close]')) {
      closeAuthModal();
    }

    // 3. Edit Phone Button
    if (event.target.closest('[data-edit-phone]')) {
      showStep('phone');
    }

    // 4. Resend OTP Button
    if (event.target.closest('[data-resend-otp]')) {
      startCountdown(30);
    }
  });

  document.addEventListener('submit', (event) => {
    // Phone Form Submission
    if (event.target.matches('[data-phone-form]')) {
      event.preventDefault();
      const input = event.target.querySelector('[data-phone-input]');
      const error = event.target.querySelector('[data-phone-error]');
      const val = (input?.value || '').trim().replace(/[^0-9]/g, '');

      if (val.length !== 10) {
        if (error) error.style.display = 'block';
        return;
      }
      if (error) error.style.display = 'none';
      handlePhoneSubmit(val);
    }

    // OTP Form Submission
    if (event.target.matches('[data-otp-form]')) {
      event.preventDefault();
      const boxes = [...event.target.querySelectorAll('[data-otp-box]')];
      const code = boxes.map((b) => b.value).join('');
      if (code.length === 6) handleOtpVerify(code);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    initOtpBoxes();
  });
  if (document.readyState !== 'loading') {
    initOtpBoxes();
  }
})();
