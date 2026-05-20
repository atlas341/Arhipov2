// Общая логика страницы: хедер на скролле, бургер, reveal-on-scroll,
// scrollytelling-числа, форма заявки.

(function () {
  // -------- Sticky header tint on scroll --------
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -------- Burger menu --------
  const burger = document.getElementById('burgerBtn');
  const nav = document.querySelector('.site-header__nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // -------- Reveal on scroll for select containers --------
  const revealTargets = document.querySelectorAll(
    '.section-head, .story, .num, .cat, .catx, .infra-card, .news-card, .charity__inner, .contact__inner, .map__stage'
  );
  revealTargets.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = (i % 6) * 70 + 'ms';
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-revealed'));
  }

  // -------- Scrollytelling counters --------
  const counters = document.querySelectorAll('[data-count-to]');
  function formatNumber(n) {
    return Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');
  }
  function animateCounter(el) {
    const target = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      // For "4 млрд ₽" — keep one decimal until almost done
      let formatted;
      if (target < 10) {
        formatted = (value).toFixed(p < 1 ? 1 : 0);
        if (p >= 1) formatted = String(Math.round(target));
      } else {
        formatted = formatNumber(value);
      }
      el.textContent = formatted + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => io2.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = (el.dataset.countTo) + (el.dataset.suffix || '');
    });
  }

  // -------- Smooth scroll for hash links (with header offset) --------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // -------- Contact form (locally only, no backend) --------
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form && success) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Простой visual feedback. Подключение к backend — позже.
      success.hidden = false;
      form.querySelectorAll('input, textarea').forEach((el) => (el.value = ''));
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
})();
