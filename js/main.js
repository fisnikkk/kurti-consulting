/* ============================================= */
/* KURTI CONSULTING — Main JavaScript            */
/* Lenis smooth scroll, GSAP animations,         */
/* custom cursor, magnetic buttons, and more     */
/* ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for all resources to load before starting animations
  window.addEventListener('load', init);
});

function init() {
  initPreloader();
}

/* ============================================= */
/* PRELOADER                                     */
/* ============================================= */
function initPreloader() {
  const preloader = document.getElementById('preloader');

  function startSite() {
    initLenis();
    initGSAP();
    initCustomCursor();
    initMagneticButtons();
    initNavigation();
    initMobileMenu();
    initStatsCounter();
    initContactForm();
    initPageTransitions();
  }

  if (!preloader) {
    // No preloader on this page (e.g. case study pages) — start immediately
    startSite();
    return;
  }

  // After the bar animation completes (~1.8s), hide preloader and start site
  setTimeout(() => {
    preloader.classList.add('is-hidden');
    setTimeout(startSite, 400);
  }, 2000);
}

/* ============================================= */
/* LENIS SMOOTH SCROLL                           */
/* ============================================= */
let lenis;

function initLenis() {
  if (typeof Lenis === 'undefined') {
    // Lenis not loaded, skip smooth scroll
    return;
  }

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  // Connect Lenis to GSAP ScrollTrigger
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Handle anchor links with smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
        // Close mobile menu if open
        closeMobileMenu();
      }
    });
  });
}

/* ============================================= */
/* GSAP ANIMATIONS                               */
/* ============================================= */
function initGSAP() {
  if (typeof gsap === 'undefined') {
    // Fallback: use IntersectionObserver for fade-ins
    initFallbackAnimations();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---- Hero Animations (only on homepage) ----
  if (document.querySelector('.hero__headline')) {
    const heroTl = gsap.timeline({ delay: 0.3 });

    heroTl
      .to('.hero__pre-headline', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power4.out',
      })
      .call(() => {
        document.querySelector('.hero__headline').classList.add('is-revealed');
      }, null, '-=0.2')
      .to('.hero__sub', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power4.out',
      }, '-=0.3')
      .to('.hero__cta-group', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power4.out',
      }, '-=0.4');

  }

  // ---- Scroll-triggered fade-ins ----
  // Use CSS class toggle (more reliable with Lenis than GSAP tweens)
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '50px' });

  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  // Bulletproof fallback: if anything is still hidden after 2s, show it
  setTimeout(() => {
    document.querySelectorAll('.fade-in:not(.is-visible)').forEach(el => {
      el.classList.add('is-visible');
    });
  }, 2000);

  // ---- Section title text reveals ----
  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateTextReveal(entry.target);
        textObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.split-text:not(.hero__headline)').forEach(el => textObserver.observe(el));

  // ---- Staggered grid entrances (CSS class-based, no GSAP opacity) ----
  function staggerGrid(gridSelector, childSelector, delayMs) {
    document.querySelectorAll(gridSelector).forEach(grid => {
      const cards = grid.querySelectorAll(childSelector);
      if (!cards.length) return;
      const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            cards.forEach((card, i) => {
              setTimeout(() => card.classList.add('is-visible'), i * delayMs);
            });
            gridObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '50px' });
      gridObserver.observe(grid);
    });
  }

  staggerGrid('.services__grid', '.service-card', 120);
  staggerGrid('.results__grid', '.result-card', 120);
  staggerGrid('.process__timeline', '.process__step', 150);

  staggerGrid('.work__grid', '.work-card', 150);

  // ---- Dramatic work card reveals (parallax entrance) ----
  gsap.utils.toArray('.work-card').forEach((card) => {
    gsap.fromTo(card,
      { y: 80, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
          once: true,
        }
      }
    );

    const img = card.querySelector('.work-card__image-placeholder');
    if (img) {
      gsap.fromTo(img,
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 0.9,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            once: true,
          }
        }
      );
    }
  });

  // ---- Image reveals for case study ----
  const csReveals = document.querySelectorAll('.cs-reveal');
  if (csReveals.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '50px' });

    csReveals.forEach(el => revealObserver.observe(el));

    // Fallback: if IntersectionObserver hasn't fired after 1.5s
    // (e.g. Lenis/smooth-scroll edge case), reveal everything in viewport
    setTimeout(() => {
      csReveals.forEach(el => {
        if (!el.classList.contains('is-revealed')) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 100) {
            el.classList.add('is-revealed');
          }
        }
      });
    }, 1500);
  }

  // ---- Parallax on hero background (subtle, homepage only) ----
  if (document.querySelector('.hero')) {
    gsap.to('.hero', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      '--parallax-y': '80px',
      ease: 'none',
    });
  }

  // ---- Stats reveal (no pin — avoids layout gaps) ----
  if (document.querySelector('.stats')) {
    const statsSection = document.querySelector('.stats');
    const statsItems = statsSection.querySelectorAll('.stats__item');

    gsap.set(statsItems, { opacity: 0, y: 60, scale: 0.9 });

    const statsTl = gsap.timeline({
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 75%',
        once: true,
      }
    });

    statsItems.forEach((item, i) => {
      statsTl.to(item, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power4.out',
      }, i * 0.15);
    });
  }

  // Refresh ScrollTrigger after a brief delay so it catches
  // elements that are already in the viewport on page load
  setTimeout(() => ScrollTrigger.refresh(), 100);
}

/* ============================================= */
/* TEXT REVEAL ANIMATION                         */
/* ============================================= */
function animateTextReveal(selector) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el || el.dataset.revealed === 'true') return;
  el.dataset.revealed = 'true';

  // Split text into words, preserving HTML structure
  const words = [];
  const processNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const wordArray = text.split(/(\s+)/);
      wordArray.forEach(word => {
        if (word.trim()) {
          const span = document.createElement('span');
          span.className = 'word';
          span.style.display = 'inline-block';
          span.style.overflow = 'hidden';

          const inner = document.createElement('span');
          inner.className = 'word-inner';
          inner.style.display = 'inline-block';
          inner.style.transform = 'translateY(120%)';
          inner.style.opacity = '0.3';
          inner.textContent = word;

          span.appendChild(inner);
          words.push(inner);
          node.parentNode.insertBefore(span, node);
        } else if (word) {
          // Preserve whitespace
          const space = document.createTextNode(word);
          node.parentNode.insertBefore(space, node);
        }
      });
      node.parentNode.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Process child nodes (like <span>, <br>)
      const children = Array.from(node.childNodes);
      children.forEach(processNode);
    }
  };

  const children = Array.from(el.childNodes);
  children.forEach(processNode);

  // Animate words
  if (typeof gsap !== 'undefined') {
    gsap.to(words, {
      y: '0%',
      opacity: 1,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power4.out',
    });
  } else {
    // Fallback: reveal immediately
    words.forEach((word, i) => {
      setTimeout(() => {
        word.style.transform = 'translateY(0)';
        word.style.opacity = '1';
        word.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';
      }, i * 50);
    });
  }
}

/* ============================================= */
/* FALLBACK ANIMATIONS (no GSAP)                 */
/* ============================================= */
function initFallbackAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Show hero elements
  document.querySelector('.hero__pre-headline').style.opacity = '1';
  document.querySelector('.hero__pre-headline').style.transform = 'translateY(0)';
  document.querySelector('.hero__headline').classList.add('is-revealed');
  document.querySelector('.hero__sub').style.opacity = '1';
  document.querySelector('.hero__sub').style.transform = 'translateY(0)';
  document.querySelector('.hero__cta-group').style.opacity = '1';
  document.querySelector('.hero__cta-group').style.transform = 'translateY(0)';
}

/* ============================================= */
/* CUSTOM CURSOR                                 */
/* ============================================= */
function initCustomCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cursor = document.getElementById('cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const outline = cursor.querySelector('.cursor__outline');

  // Add "View" label inside the outline circle
  const cursorLabel = document.createElement('span');
  cursorLabel.className = 'cursor__label';
  cursorLabel.textContent = 'View';
  outline.appendChild(cursorLabel);

  // Use GSAP quickTo for buttery smooth cursor follow
  if (typeof gsap !== 'undefined') {
    const dotX = gsap.quickTo(dot, 'left', { duration: 0.15, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'top', { duration: 0.15, ease: 'power3.out' });
    const outX = gsap.quickTo(outline, 'left', { duration: 0.35, ease: 'power3.out' });
    const outY = gsap.quickTo(outline, 'top', { duration: 0.35, ease: 'power3.out' });

    document.addEventListener('mousemove', (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      outX(e.clientX);
      outY(e.clientY);
    });
  } else {
    // Fallback without GSAP
    document.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      outline.style.left = e.clientX + 'px';
      outline.style.top = e.clientY + 'px';
    });
  }

  // Hover state for interactive elements — dot grows slightly
  const hoverTargets = document.querySelectorAll('a, button, .service-card, .result-card, .tech__item, .form-input, .form-select');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hovering');
      cursor.classList.remove('is-viewing');
    });
  });

  // Work cards — teal circle with "View" label
  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      cursor.classList.add('is-viewing');
      cursor.classList.add('is-hovering');
    });
    card.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-viewing');
      cursor.classList.remove('is-hovering');
    });
  });
}

/* ============================================= */
/* MAGNETIC BUTTONS                              */
/* ============================================= */
function initMagneticButtons() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const buttons = document.querySelectorAll('.magnetic-btn');

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;

      const inner = btn.querySelector('span');
      if (inner) {
        inner.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
      }
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      const inner = btn.querySelector('span');
      if (inner) {
        inner.style.transform = '';
      }
    });

    // Add transition for smooth return
    btn.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  });
}

/* ============================================= */
/* NAVIGATION                                    */
/* ============================================= */
function initNavigation() {
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }

    // Auto-hide on scroll down, show on scroll up
    if (currentScroll > 200) {
      if (currentScroll > lastScroll && currentScroll - lastScroll > 10) {
        nav.classList.add('is-hidden');
      } else if (lastScroll - currentScroll > 10) {
        nav.classList.remove('is-hidden');
      }
    } else {
      nav.classList.remove('is-hidden');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ============================================= */
/* MOBILE MENU                                   */
/* ============================================= */
let isMobileMenuOpen = false;

function initMobileMenu() {
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    isMobileMenuOpen = !isMobileMenuOpen;

    if (isMobileMenuOpen) {
      hamburger.classList.add('is-active');
      mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    } else {
      closeMobileMenu();
    }
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
}

function closeMobileMenu() {
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  isMobileMenuOpen = false;
  hamburger.classList.remove('is-active');
  mobileMenu.classList.remove('is-open');
  document.body.style.overflow = '';
  if (lenis) lenis.start();
}

/* ============================================= */
/* STATS COUNTER ANIMATION                       */
/* ============================================= */
function initStatsCounter() {
  const numbers = document.querySelectorAll('.stats__number');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  numbers.forEach(num => observer.observe(num));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const start = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out expo
    const eased = 1 - Math.pow(2, -10 * progress);
    const current = Math.round(eased * target);

    el.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target + suffix;
    }
  }

  requestAnimationFrame(update);
}

/* ============================================= */
/* CONTACT FORM                                  */
/* ============================================= */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.querySelector('span').textContent;
    const formAction = form.getAttribute('action');

    btn.querySelector('span').textContent = 'Sending...';
    btn.disabled = true;

    // If Formspree is configured (action URL replaced), submit for real
    if (formAction && !formAction.includes('YOUR_FORM_ID')) {
      try {
        const data = new FormData(form);
        const response = await fetch(formAction, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          btn.querySelector('span').textContent = 'Message Sent!';
          btn.style.background = 'var(--accent-teal)';
          form.reset();
        } else {
          btn.querySelector('span').textContent = 'Error — try again';
          btn.style.background = '#c0392b';
        }
      } catch (err) {
        btn.querySelector('span').textContent = 'Error — try again';
        btn.style.background = '#c0392b';
      }
    } else {
      // Formspree not configured yet — show helpful message
      btn.querySelector('span').textContent = 'Setup Formspree first!';
      btn.style.background = 'var(--text-secondary)';
      console.warn('Contact form: Replace YOUR_FORM_ID in the form action with your Formspree form ID. Get one free at https://formspree.io');
    }

    setTimeout(() => {
      btn.querySelector('span').textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  });
}

/* ============================================= */
/* PAGE TRANSITIONS                              */
/* ============================================= */
function initPageTransitions() {
  const overlay = document.getElementById('pageTransition');
  if (!overlay) return;

  // On page load: if overlay is active (we just navigated here), slide it away
  if (sessionStorage.getItem('page-transitioning')) {
    sessionStorage.removeItem('page-transitioning');
    overlay.classList.add('is-active');
    // Force reflow, then trigger leave animation
    overlay.offsetHeight;
    requestAnimationFrame(() => {
      overlay.classList.add('is-leaving');
      overlay.classList.remove('is-active');
      setTimeout(() => {
        overlay.classList.remove('is-leaving');
      }, 600);
    });
  }

  // Intercept internal navigation links
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept case study links and homepage links (not hash links or external)
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    if (href.startsWith('/#')) return; // hash links to homepage sections

    link.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.setItem('page-transitioning', 'true');
      overlay.classList.add('is-active');
      setTimeout(() => {
        window.location.href = href;
      }, 500);
    });
  });
}
