// Testimonials Card Flip, Drag Scroll & Dynamic Sync of ALL Judge.me Imported Reviews & Photos
(function() {
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let dragThresholdPassed = false;
  let hasSyncedJudgeme = false;

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function extractJudgemeImage(el) {
    if (!el) return '';

    // 1. Check img tags inside element (excluding rating star SVGs/PNGs)
    const imgs = el.querySelectorAll('img');
    for (let img of imgs) {
      const src = img.getAttribute('data-src') || img.getAttribute('src') || img.getAttribute('data-url') || '';
      if (src && !src.includes('star') && !src.includes('badge') && !src.includes('icon') && !src.endsWith('.svg')) {
        return src;
      }
    }

    // 2. Check picture or link background images
    const picWrap = el.querySelector('.jdgm-rev__pic, .jdgm-rev__pic-link, .jdgm-carousel-item__review-image, .jdgm-temp-picture');
    if (picWrap) {
      const bg = picWrap.style.backgroundImage || window.getComputedStyle(picWrap).backgroundImage;
      if (bg && bg.includes('url(')) {
        const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1] && !match[1].includes('star')) return match[1];
      }
      const dataSrc = picWrap.getAttribute('data-src') || picWrap.getAttribute('data-bg');
      if (dataSrc) return dataSrc;
    }

    return '';
  }

  // Dynamic Sync of ALL Judge.me Imported Reviews into Green Testimonial Cards
  function syncJudgemeToGreenCards() {
    const jgWrapper = document.querySelector('.jdgm-carousel-wrapper, .jdgm-all-reviews-widget, .jdgm-widget, .jdgm-rev-widg');
    if (!jgWrapper) return;

    // Find review elements inside Judge.me widget
    const reviewEls = jgWrapper.querySelectorAll('.jdgm-carousel-item, .jdgm-rev, .jdgm-carousel-slide, [data-review-id]');
    if (!reviewEls || reviewEls.length === 0) return;

    const extractedReviews = [];
    reviewEls.forEach(el => {
      const titleEl = el.querySelector('.jdgm-carousel-item__review-title, .jdgm-rev__title, .jdgm-carousel-item__title, .jdgm-rev-widg__title');
      const bodyEl = el.querySelector('.jdgm-carousel-item__review-body, .jdgm-rev__body, .jdgm-carousel-item__body, .jdgm-rev-widg__body');
      const nameEl = el.querySelector('.jdgm-carousel-item__reviewer-name, .jdgm-rev__author-name, .jdgm-carousel-item__name, .jdgm-rev__author');

      const headline = titleEl ? titleEl.textContent.trim() : '';
      const fullText = bodyEl ? bodyEl.textContent.trim() : '';
      const name = nameEl ? nameEl.textContent.trim() : 'Verified Customer';
      const imgSrc = extractJudgemeImage(el);

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

    // Hide top plain default Judge.me widget container
    const jgContainer = document.querySelector('.testimonials__judgeme-container');
    if (jgContainer) {
      jgContainer.style.display = 'none';
    }

    // Populate green cards for ALL extracted Judge.me reviews
    const tracks = document.querySelectorAll('[data-testimonials-track]');
    tracks.forEach(track => {
      let newCardsHTML = '';

      // Build cards for all imported reviews
      extractedReviews.forEach(review => {
        const headlineClean = escapeHtml(review.headline.replace(/^"+|"+$/g, ''));
        const fullTextClean = escapeHtml(review.fullText);
        const nameClean = escapeHtml(review.name);
        const initialLetter = (review.name || 'V').charAt(0).toUpperCase();

        const mediaHTML = review.imgSrc
          ? `<img src="${review.imgSrc}" class="testimonials__card-img" alt="${nameClean}" loading="lazy">`
          : `<div class="testimonials__card-avatar-fallback"><span class="testimonials__avatar-text">${initialLetter}</span></div>`;

        newCardsHTML += `
          <div class="testimonials__card" data-testimonial-card data-full-review="${fullTextClean}">
            <div class="testimonials__card-front" data-card-front>
              <h3 class="testimonials__card-headline">"${headlineClean}"</h3>
              <div class="testimonials__card-media">${mediaHTML}</div>
              <footer class="testimonials__card-footer">
                <div class="testimonials__author-info">
                  <strong class="testimonials__author-name">${nameClean}</strong>
                  <span class="testimonials__author-role">✓ Verified Customer</span>
                </div>
                <button type="button" class="testimonials__expand-btn" data-card-toggle aria-label="Read full review from ${nameClean}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </footer>
            </div>
            <div class="testimonials__card-back" data-card-back>
              <div class="testimonials__card-full-msg">
                <p class="testimonials__card-full-text">"${fullTextClean}"</p>
              </div>
              <footer class="testimonials__card-footer">
                <div class="testimonials__author-info">
                  <strong class="testimonials__author-name">${nameClean}</strong>
                  <span class="testimonials__author-role">✓ Verified Customer</span>
                </div>
                <button type="button" class="testimonials__expand-btn testimonials__expand-btn--active" data-card-toggle aria-label="Close full review">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
              </footer>
            </div>
          </div>
        `;
      });

      track.innerHTML = newCardsHTML;
    });

    hasSyncedJudgeme = true;
  }

  function initJudgemeSync() {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      syncJudgemeToGreenCards();
      if (hasSyncedJudgeme || attempts > 20) clearInterval(interval);
    }, 350);
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
