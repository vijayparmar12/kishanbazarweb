// Testimonials Card Flip & Dynamic Sync of Judge.me Imported Reviews
(function() {
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let dragThresholdPassed = false;

  // Sync Judge.me imported reviews into green testimonial cards
  function syncJudgemeToGreenCards() {
    const jgWrapper = document.querySelector('.jdgm-carousel-wrapper, .jdgm-all-reviews-widget, .jdgm-widget');
    if (!jgWrapper) return;

    // Find review elements inside Judge.me widget
    const reviewEls = jgWrapper.querySelectorAll('.jdgm-carousel-item, .jdgm-rev, .jdgm-carousel-slide, [data-review-id]');
    if (!reviewEls || reviewEls.length === 0) return;

    const extractedReviews = [];
    reviewEls.forEach(el => {
      const titleEl = el.querySelector('.jdgm-carousel-item__review-title, .jdgm-rev__title, .jdgm-carousel-item__title, .jdgm-rev-widg__title');
      const bodyEl = el.querySelector('.jdgm-carousel-item__review-body, .jdgm-rev__body, .jdgm-carousel-item__body, .jdgm-rev-widg__body');
      const nameEl = el.querySelector('.jdgm-carousel-item__reviewer-name, .jdgm-rev__author-name, .jdgm-carousel-item__name, .jdgm-rev__author');
      const imgEl = el.querySelector('.jdgm-carousel-item__review-image img, .jdgm-rev__pic img, img[src*="judgeme"]');

      const headline = titleEl ? titleEl.textContent.trim() : '';
      const fullText = bodyEl ? bodyEl.textContent.trim() : '';
      const name = nameEl ? nameEl.textContent.trim() : 'Verified Customer';
      const imgSrc = imgEl ? imgEl.src : '';

      if (headline || fullText) {
        extractedReviews.push({
          headline: headline || fullText.split('. ')[0],
          fullText: fullText || headline,
          name: name,
          imgSrc: imgSrc
        });
      }
    });

    if (extractedReviews.length === 0) return;

    // Hide top default plain Judge.me container widget
    const jgContainer = document.querySelector('.testimonials__judgeme-container');
    if (jgContainer) {
      jgContainer.style.display = 'none';
    }

    // Populate green cards in testimonials track
    const tracks = document.querySelectorAll('[data-testimonials-track]');
    tracks.forEach(track => {
      const cards = track.querySelectorAll('.testimonials__card');
      if (cards.length === 0) return;

      cards.forEach((card, index) => {
        const reviewData = extractedReviews[index % extractedReviews.length];
        if (!reviewData) return;

        // Front view elements
        const frontHeadline = card.querySelector('.testimonials__card-headline');
        const frontMedia = card.querySelector('.testimonials__card-media');
        const frontName = card.querySelector('.testimonials__author-name');
        const frontRole = card.querySelector('.testimonials__author-role');

        // Back view elements
        const backText = card.querySelector('.testimonials__card-full-text');
        const backName = card.querySelectorAll('.testimonials__author-name')[1];
        const backRole = card.querySelectorAll('.testimonials__author-role')[1];

        // Update card data attribute
        card.dataset.fullReview = reviewData.fullText;

        if (frontHeadline) {
          frontHeadline.textContent = `"${reviewData.headline.replace(/^"+|"+$/g, '')}"`;
        }
        if (backText) {
          backText.textContent = `"${reviewData.fullText}"`;
        }
        if (frontName) frontName.textContent = reviewData.name;
        if (backName) backName.textContent = reviewData.name;
        if (frontRole) frontRole.textContent = '✓ Verified Customer';
        if (backRole) backRole.textContent = '✓ Verified Customer';

        if (frontMedia) {
          const initialLetter = (reviewData.name || 'V').charAt(0).toUpperCase();
          if (reviewData.imgSrc) {
            frontMedia.innerHTML = `<img src="${reviewData.imgSrc}" class="testimonials__card-img" alt="${reviewData.name}">`;
          } else {
            frontMedia.innerHTML = `
              <div class="testimonials__card-avatar-fallback">
                <span class="testimonials__avatar-text">${initialLetter}</span>
              </div>
            `;
          }
        }
      });
    });
  }

  function initJudgemeSync() {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      syncJudgemeToGreenCards();
      if (attempts > 15) clearInterval(interval);
    }, 400);
  }

  // Delegate click for Testimonial Cards & Review Anchors
  document.addEventListener('click', function(e) {
    if (dragThresholdPassed) {
      dragThresholdPassed = false;
      return;
    }

    const anchor = e.target.closest('a[href^="#ProductReviews"], a[href^="#Testimonials"]');
    if (anchor) {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#' && targetId.startsWith('#')) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const stickyHeader = document.querySelector('[data-header-top-sticky], .kb-header-top-sticky, .site-header');
          const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 130;
          const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
          });
          return;
        }
      }
    }

    const card = e.target.closest('.testimonials__card, [data-testimonial-card]');
    if (!card) return;

    const section = card.closest('.testimonials-carousel-section, [data-testimonials-section]');

    const isExpanded = card.classList.contains('is-expanded');

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

      setTimeout(function() {
        const stickyHeader = document.querySelector('[data-header-top-sticky], .kb-header-top-sticky, .site-header');
        const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 130;
        const rect = card.getBoundingClientRect();

        if (rect.top < headerHeight + 15 || rect.bottom > window.innerHeight - 15) {
          const targetScroll = window.scrollY + rect.top - headerHeight - 20;
          window.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
          });
        }
      }, 60);
    }
  });

  function initTestimonialsCarousel() {
    initJudgemeSync();

    document.querySelectorAll('[data-testimonials-carousel]').forEach(function(container) {
      const track = container.querySelector('[data-testimonials-track]');
      if (!track) return;

      container.addEventListener('pointerdown', function(e) {
        if (e.target.closest('[data-card-toggle]')) return;
        isDragging = true;
        dragThresholdPassed = false;
        startX = e.pageX - container.offsetLeft;
        scrollLeftStart = container.scrollLeft;
      });

      window.addEventListener('pointermove', function(e) {
        if (!isDragging) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 6) {
          dragThresholdPassed = true;
        }
        container.scrollLeft = scrollLeftStart - walk;
      });

      window.addEventListener('pointerup', function() {
        if (isDragging) {
          isDragging = false;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsCarousel);
  } else {
    initTestimonialsCarousel();
  }
})();
