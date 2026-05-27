// Общая логика страницы: хедер на скролле, бургер, reveal-on-scroll,
// scrollytelling-числа, форма заявки.

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------- Hero parallax (курсор + лёгкий скролл) --------
  const hero = document.getElementById('hero');
  if (hero && !prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    let raf = null, tx = 0, ty = 0;
    const apply = () => {
      hero.style.setProperty('--px', tx.toFixed(3));
      hero.style.setProperty('--py', ty.toFixed(3));
      raf = null;
    };
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener('mouseleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  // -------- 3D tilt на карточках (десктоп) --------
  if (!prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    const tiltCards = document.querySelectorAll('.why-card, .cat, .story, .infra-card');
    tiltCards.forEach((card) => {
      let ticking = false, lastE = null;
      const render = () => {
        ticking = false;
        if (!lastE) return;
        const r = card.getBoundingClientRect();
        const px = (lastE.clientX - r.left) / r.width - 0.5;
        const py = (lastE.clientY - r.top) / r.height - 0.5;
        const ry = px * 10;
        const rx = -py * 10;
        card.style.transform =
          `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
      };
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform .08s linear';
      });
      card.addEventListener('mousemove', (e) => {
        lastE = e;
        if (!ticking) { ticking = true; requestAnimationFrame(render); }
      });
      card.addEventListener('mouseleave', () => {
        lastE = null;
        card.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)';
        card.style.transform = '';
      });
    });
  }

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
      document.body.classList.add('menu-is-open');
    };
    const closeMenu = () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      document.body.classList.remove('menu-is-open');
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
    '.section-head, .story, .why-card, .num, .cat, .catx, .infra-card, .news-card, .charity__inner, .charity-card, .charity-stat, .contact__inner, .map__stage'
  );
  revealTargets.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = (i % 6) * 90 + 'ms';
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
      // ссылки в каталог-сайдбаре обрабатываются отдельно
      if (a.closest('#catalogNav')) return;
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
  // -------- Catalog sidebar scroll-spy --------
  const catalogNav = document.getElementById('catalogNav');
  if (catalogNav) {
    const navLinks = catalogNav.querySelectorAll('a[href^="#"]');
    const sections = Array.from(navLinks).map((a) =>
      document.querySelector(a.getAttribute('href'))
    ).filter(Boolean);

    const setActive = (id) => {
      navLinks.forEach((a) => {
        const active = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', active);
      });
      // на мобилке центрируем активную ссылку в горизонтальной ленте
      // используем scrollLeft вместо scrollIntoView — иначе отменяет вертикальный скролл страницы
      const activeLink = catalogNav.querySelector('a.is-active');
      if (activeLink && catalogNav.scrollWidth > catalogNav.clientWidth) {
        const navCenter = catalogNav.offsetWidth / 2;
        const linkCenter = activeLink.offsetLeft + activeLink.offsetWidth / 2;
        catalogNav.scrollLeft = linkCenter - navCenter;
      }
    };

    if ('IntersectionObserver' in window) {
      const spyObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-25% 0px -60% 0px' });
      sections.forEach((s) => spyObs.observe(s));
    }

    // плавный скролл — offset задаётся через CSS scroll-margin-top на .pcat
    navLinks.forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.querySelector(a.getAttribute('href'));
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(section.id);
      });
    });
  }

})();
