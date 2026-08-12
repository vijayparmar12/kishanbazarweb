// Testimonials Card Flip & Interactive Section Script
(function() {
  // Delegate click for Testimonial Cards
  document.addEventListener('click', function(e) {
    const card = e.target.closest('.testimonials__card, [data-testimonial-card]');
    if (!card) return;

    const section = card.closest('.testimonials-carousel-section, [data-testimonials-section]');
    const track = section ? section.querySelector('.testimonials__track, [data-testimonials-track]') : null;

    // Toggle expansion on this card
    const isExpanded = card.classList.contains('is-expanded');

    // Close all other expanded cards in the section
    if (section) {
      section.querySelectorAll('.testimonials__card.is-expanded, [data-testimonial-card].is-expanded').forEach(function(otherCard) {
        if (otherCard !== card) {
          otherCard.classList.remove('is-expanded');
        }
      });
    }

    if (isExpanded) {
      card.classList.remove('is-expanded');
    } else {
      card.classList.add('is-expanded');
    }

    // Pause/resume infinite marquee scroll while a card is expanded
    if (track) {
      const anyExpanded = section.querySelector('.testimonials__card.is-expanded, [data-testimonial-card].is-expanded');
      if (anyExpanded) {
        track.classList.add('is-paused');
      } else {
        track.classList.remove('is-paused');
      }
    }
  });

  // Handle optional product feedback form
  function initFeedbackForms() {
    document.querySelectorAll('[data-feedback-form]').forEach(function(form) {
      const ratingSelector = form.querySelector('[data-rating-selector]');
      const ratingValueInput = form.querySelector('[data-rating-value]');
      const imageInput = form.querySelector('[data-image-input]');
      const imagePreview = form.querySelector('[data-image-preview]');
      const previewImg = form.querySelector('[data-preview-img]');
      const removeImgBtn = form.querySelector('[data-remove-img]');
      const successMsg = form.querySelector('[data-feedback-success]');

      let uploadedImageDataUrl = '';

      if (ratingSelector) {
        const starBtns = ratingSelector.querySelectorAll('[data-star]');
        starBtns.forEach(function(btn) {
          btn.addEventListener('click', function() {
            const val = parseInt(btn.dataset.star, 10);
            if (ratingValueInput) ratingValueInput.value = val;
            starBtns.forEach(function(s) {
              const sVal = parseInt(s.dataset.star, 10);
              if (sVal <= val) {
                s.classList.add('is-active');
              } else {
                s.classList.remove('is-active');
              }
            });
          });
        });
      }

      if (imageInput) {
        imageInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
              uploadedImageDataUrl = evt.target.result;
              if (previewImg) previewImg.src = uploadedImageDataUrl;
              if (imagePreview) imagePreview.style.display = 'inline-flex';
            };
            reader.readAsDataURL(file);
          }
        });
      }

      if (removeImgBtn) {
        removeImgBtn.addEventListener('click', function() {
          uploadedImageDataUrl = '';
          if (imageInput) imageInput.value = '';
          if (imagePreview) imagePreview.style.display = 'none';
          if (previewImg) previewImg.src = '';
        });
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nameInput = form.querySelector('[name="name"]');
        const msgInput = form.querySelector('[name="message"]');
        if (!nameInput || !msgInput) return;
        const name = nameInput.value.trim();
        const message = msgInput.value.trim();
        if (!name || !message) return;

        form.reset();
        uploadedImageDataUrl = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (successMsg) {
          successMsg.style.display = 'block';
          setTimeout(function() { successMsg.style.display = 'none'; }, 4500);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedbackForms);
  } else {
    initFeedbackForms();
  }
})();
