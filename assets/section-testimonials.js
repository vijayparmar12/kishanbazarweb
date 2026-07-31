document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('[data-testimonials-track]');

  function createCardElement(reviewData) {
    const card = document.createElement('figure');
    card.className = 'testimonials__card testimonials__card--user-added';

    const starsCount = parseInt(reviewData.rating || 5, 10);
    const starsHtml = '&#9733;'.repeat(starsCount);
    const firstLetter = (reviewData.name || 'C').charAt(0).toUpperCase();

    let imageHtml = '';
    if (reviewData.image) {
      imageHtml = `
        <div class="testimonials__card-image">
          <img src="${reviewData.image}" alt="Customer review photo" loading="lazy">
        </div>
      `;
    }

    card.innerHTML = `
      <div class="testimonials__card-avatar">
        <span class="testimonials__avatar-text">${firstLetter}</span>
      </div>
      <blockquote class="testimonials__quote">"${reviewData.review}"</blockquote>
      ${imageHtml}
      <div class="testimonials__rating" aria-label="${starsCount} out of 5 stars">
        ${starsHtml}
      </div>
      <figcaption class="testimonials__author">
        <strong class="testimonials__author-name">${reviewData.name}</strong>
        <span class="testimonials__author-location">- ${reviewData.location || 'Verified Customer'}</span>
      </figcaption>
    `;
    return card;
  }

  function loadUserReviews() {
    try {
      const saved = localStorage.getItem('kb_user_reviews');
      if (saved && track) {
        const reviews = JSON.parse(saved);
        reviews.forEach((r) => {
          const card = createCardElement(r);
          track.appendChild(card);
        });
      }
    } catch (e) {
      console.error('Error loading user reviews', e);
    }
  }

  loadUserReviews();

  if (track) {
    const originalCards = Array.from(track.children);
    if (originalCards.length > 0) {
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.classList.add('testimonials__card--clone');
        track.appendChild(clone);
      });
    }

    let isHovered = false;
    track.addEventListener('mouseenter', () => { isHovered = true; });
    track.addEventListener('mouseleave', () => { isHovered = false; });

    let scrollSpeed = 1.2;
    function autoScrollStep() {
      if (!isHovered && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += scrollSpeed;
        const maxScroll = (track.scrollWidth - track.clientWidth) / 2;
        if (track.scrollLeft >= maxScroll) {
          track.scrollLeft = 0;
        }
      }
      requestAnimationFrame(autoScrollStep);
    }
    requestAnimationFrame(autoScrollStep);
  }

  document.querySelectorAll('[data-feedback-form]').forEach((form) => {
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
      starBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.star, 10);
          if (ratingValueInput) ratingValueInput.value = val;

          starBtns.forEach((s) => {
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
      imageInput.addEventListener('change', (e) => {
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
      removeImgBtn.addEventListener('click', () => {
        uploadedImageDataUrl = '';
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (previewImg) previewImg.src = '';
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]').value.trim();
      const contact = form.querySelector('[name="contact"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const message = form.querySelector('[name="message"]').value.trim();
      const rating = parseInt(ratingValueInput ? ratingValueInput.value : 5, 10);
      const productTitle = form.dataset.productTitle || '';

      if (!name || !message) return;

      const newReview = {
        name: name,
        location: contact || 'Verified Customer',
        email: email,
        review: message,
        rating: rating,
        image: uploadedImageDataUrl,
        product: productTitle,
        date: new Date().toISOString()
      };

      try {
        const existing = JSON.parse(localStorage.getItem('kb_user_reviews') || '[]');
        existing.push(newReview);
        localStorage.setItem('kb_user_reviews', JSON.stringify(existing));
      } catch (err) {
        console.error(err);
      }

      if (track) {
        const newCard = createCardElement(newReview);
        track.insertBefore(newCard, track.firstChild);
      }

      form.reset();
      uploadedImageDataUrl = '';
      if (imagePreview) imagePreview.style.display = 'none';

      if (successMsg) {
        successMsg.style.display = 'block';
        setTimeout(() => { successMsg.style.display = 'none'; }, 4500);
      }
    });
  });
});
