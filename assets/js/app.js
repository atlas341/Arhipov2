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
    const navHome = nav.parentNode;            // запоминаем родителя (header)
    const navAnchor = document.createComment('nav-anchor'); // место возврата
    navHome.insertBefore(navAnchor, nav);

    const openMenu = () => {
      // выносим меню в body — иначе backdrop-filter хедера ломает position:fixed
      document.body.appendChild(nav);
      nav.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; // блокируем прокрутку фона
    };
    const closeMenu = () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      navAnchor.parentNode.insertBefore(nav, navAnchor); // возвращаем на место
    };

    burger.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') closeMenu();
    });
    // закрытие по Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) closeMenu();
    });
  }

  // -------- Footer accordions (mobile) --------
  const footerCols = document.querySelectorAll('.footer-col');
  const mqMobile = window.matchMedia('(max-width: 520px)');
  footerCols.forEach((col) => {
    const head = col.querySelector('h4');
    if (!head) return;
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    const toggle = () => {
      if (!mqMobile.matches) return; // на десктопе ничего не сворачиваем
      col.classList.toggle('is-open');
      head.setAttribute('aria-expanded', col.classList.contains('is-open') ? 'true' : 'false');
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

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
