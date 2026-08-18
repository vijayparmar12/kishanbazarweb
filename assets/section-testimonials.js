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

    // 1. Check anchor tag links containing review image URLs (Judge.me modal / photo links)
    const links = el.querySelectorAll('a[data-mfp-src], a.jdgm-carousel-item__review-image-link, a.jdgm-rev__pic-link, a.jdgm-carousel-item__product-image-link, .jdgm-carousel-item__review-image a, .jdgm-rev__pic a, .jdgm-carousel-item__product-image a');
    for (let a of links) {
      let url = a.getAttribute('data-mfp-src') || a.getAttribute('data-src') || a.getAttribute('href') || '';
      if (url && !url.includes('javascript:') && !url.includes('#') && !url.endsWith('.svg')) {
        if (url.includes('cdn.judge.me') || url.includes('judge.me') || url.includes('shopify') || url.match(/\.(jpg|jpeg|png|webp)/i)) {
          if (url.startsWith('//')) url = 'https:' + url;
          return url;
        }
      }
    }

    // 2. Check img tags directly (including img tags with classes like .jdgm-carousel-item__review-image)
    const imgs = el.querySelectorAll('img');
    for (let img of imgs) {
      let src = img.getAttribute('data-src') || img.getAttribute('src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-mfp-src') || img.getAttribute('srcset') || '';
      if (src.includes(' ')) src = src.split(' ')[0];
      if (src && !src.includes('star') && !src.includes('badge') && !src.includes('icon') && !src.endsWith('.svg') && !src.startsWith('data:image/svg')) {
        if (src.startsWith('//')) src = 'https:' + src;
        return src;
      }
    }

    // 3. Check containers with data-src or background-image
    const bgNodes = el.querySelectorAll('.jdgm-rev__pic, .jdgm-carousel-item__review-image, .jdgm-carousel-item__product-image, .jdgm-temp-picture, [data-src]');
    for (let node of bgNodes) {
      let dataSrc = node.getAttribute('data-src') || node.getAttribute('data-bg') || node.getAttribute('data-mfp-src') || '';
      if (dataSrc) {
        if (dataSrc.startsWith('//')) dataSrc = 'https:' + dataSrc;
        return dataSrc;
      }
      const bg = node.style.backgroundImage || (window.getComputedStyle ? window.getComputedStyle(node).backgroundImage : '');
      if (bg && bg.includes('url(')) {
        const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1] && !match[1].includes('star') && !match[1].endsWith('.svg')) {
          let src = match[1];
          if (src.startsWith('//')) src = 'https:' + src;
          return src;
        }
      }
    }

    return '';
  }

  // Fetch reviews directly from Judge.me API for instant updates after edits
  async function fetchJudgemeReviewsApi() {
    try {
      const shop = (window.Shopify && window.Shopify.shop) ? window.Shopify.shop : window.location.hostname;
      const res = await fetch(`https://judge.me/api/v1/reviews?shop_domain=${shop}&platform=shopify&per_page=50`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.reviews || data.reviews.length === 0) return null;

      const apiReviews = [];
      const seenKeys = new Set();

      data.reviews.forEach(r => {
        let imgSrc = '';
        if (r.pictures && r.pictures.length > 0 && r.pictures[0].urls) {
          imgSrc = r.pictures[0].urls.original || r.pictures[0].urls.huge || r.pictures[0].urls.compact || '';
        }
        if (!imgSrc && r.featured_image) {
          imgSrc = typeof r.featured_image === 'string' ? r.featured_image : (r.featured_image.url || '');
        }
        if (!imgSrc && r.product_image) {
          imgSrc = typeof r.product_image === 'string' ? r.product_image : (r.product_image.url || '');
        }
        if (imgSrc && imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;

        const headline = r.title || (r.body ? r.body.split('. ')[0] : 'Customer Review');
        const fullText = r.body || r.title || '';
        const name = (r.reviewer && r.reviewer.name) ? r.reviewer.name : (r.user && r.user.name ? r.user.name : 'Verified Customer');

        const uniqueKey = `${name}_${headline}_${fullText}`;
        if ((headline || fullText) && !seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          apiReviews.push({
            headline: headline,
            fullText: fullText,
            name: name,
            imgSrc: imgSrc
          });
        }
      });

      return apiReviews.length > 0 ? apiReviews : null;
    } catch (err) {
      return null;
    }
  }

  // Dynamic Sync of ALL Judge.me Imported Reviews into Green Testimonial Cards
  async function syncJudgemeToGreenCards() {
    const sections = document.querySelectorAll('.testimonials-carousel-section, [data-testimonials-section]');
    let extractedReviews = [];

    // 1. Try direct API fetch for real-time fresh updates after editing
    const apiData = await fetchJudgemeReviewsApi();
    if (apiData && apiData.length > 0) {
      extractedReviews = apiData;
    } else {
      // 2. DOM Parsing Fallback
      const jgWrapper = document.querySelector('.jdgm-carousel-wrapper, .jdgm-all-reviews-widget, .jdgm-widget, .jdgm-rev-widg');
      const reviewEls = jgWrapper ? jgWrapper.querySelectorAll('.jdgm-carousel-item, .jdgm-rev, .jdgm-carousel-slide, [data-review-id]') : [];
      const seenKeys = new Set();

      if (reviewEls && reviewEls.length > 0) {
        reviewEls.forEach(el => {
          if (el.classList.contains('jdgm--hidden') || el.style.display === 'none') return;

          const titleEl = el.querySelector('.jdgm-carousel-item__review-title, .jdgm-rev__title, .jdgm-carousel-item__title, .jdgm-rev-widg__title');
          const bodyEl = el.querySelector('.jdgm-carousel-item__review-body, .jdgm-rev__body, .jdgm-carousel-item__body, .jdgm-rev-widg__body');
          const nameEl = el.querySelector('.jdgm-carousel-item__reviewer-name, .jdgm-rev__author-name, .jdgm-carousel-item__name, .jdgm-rev__author');

          const headline = titleEl ? titleEl.textContent.trim() : '';
          const fullText = bodyEl ? bodyEl.textContent.trim() : '';
          const name = nameEl ? nameEl.textContent.trim() : 'Verified Customer';
          const imgSrc = extractJudgemeImage(el);

          const uniqueKey = `${name}_${headline}_${fullText}`;
          if ((headline || fullText) && !seenKeys.has(uniqueKey)) {
            seenKeys.add(uniqueKey);
            extractedReviews.push({
              headline: headline || fullText.split('. ')[0],
              fullText: fullText || headline,
              name: name,
              imgSrc: imgSrc
            });
          }
        });
      }
    }

    // Hide top plain default Judge.me widget container safely
    const jgContainer = document.querySelector('.testimonials__judgeme-container');
    if (jgContainer) {
      jgContainer.style.opacity = '0';
      jgContainer.style.position = 'absolute';
      jgContainer.style.left = '-9999px';
    }

    // If ZERO published reviews, clear track and hide section
    if (extractedReviews.length === 0) {
      const tracks = document.querySelectorAll('[data-testimonials-track]');
      tracks.forEach(track => {
        track.innerHTML = '';
      });
      sections.forEach(sec => {
        sec.style.display = 'none';
      });
      hasSyncedJudgeme = true;
      return;
    }

    // Show section if reviews exist
    sections.forEach(sec => {
      sec.style.display = '';
    });

    // Populate green cards strictly for current active Judge.me reviews
    const tracks = document.querySelectorAll('[data-testimonials-track]');
    tracks.forEach(track => {
      let newCardsHTML = '';

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
      if (hasSyncedJudgeme || attempts > 25) clearInterval(interval);
    }, 300);
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
