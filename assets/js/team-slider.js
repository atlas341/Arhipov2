// Мобильный слайдер для секции «Наша команда».
// Auto-rotate каждые 5 сек, стрелки prev/next, snap-scroll.
// На экранах ≥769px ничего не делает — сетка остаётся как была.
(function () {
  const section = document.querySelector('.team');
  if (!section) return;
  const grid = section.querySelector('.team__grid--photo');
  if (!grid) return;

  const mqMobile = matchMedia('(max-width: 768px)');
  const mqMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const AUTO_MS  = 5000;
  const RESUME_AFTER_TOUCH = 3500;

  let prevBtn = null;
  let nextBtn = null;
  let autoTimer = null;
  let touchPauseTimer = null;
  let attached = false;

  function getCards() {
    return grid.querySelectorAll('.team-card');
  }

  function buildArrows() {
    if (prevBtn) return;
    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'team-slider-arrow team-slider-arrow--prev';
    prevBtn.setAttribute('aria-label', 'Предыдущий сотрудник');
    prevBtn.textContent = '‹';

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'team-slider-arrow team-slider-arrow--next';
    nextBtn.setAttribute('aria-label', 'Следующий сотрудник');
    nextBtn.textContent = '›';

    section.appendChild(prevBtn);
    section.appendChild(nextBtn);

    prevBtn.addEventListener('click', () => userClick(-1));
    nextBtn.addEventListener('click', () => userClick(1));
  }

  function destroyArrows() {
    if (prevBtn) { prevBtn.remove(); prevBtn = null; }
    if (nextBtn) { nextBtn.remove(); nextBtn = null; }
  }

  // Индекс карточки, центр которой ближе всего к центру контейнера
  function getCurrentIdx() {
    const cards = getCards();
    if (!cards.length) return 0;
    const gridRect = grid.getBoundingClientRect();
    const cx = gridRect.left + gridRect.width / 2;
    let bestIdx = 0, bestDist = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - cx);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    return bestIdx;
  }

  // Прокручиваем контейнер так, чтобы карточка #idx стала по центру.
  // ВАЖНО: меняем scrollLeft контейнера, чтобы не дёргать общую страницу.
  function goTo(idx) {
    const cards = getCards();
    if (!cards.length) return;
    if (idx < 0) idx = cards.length - 1;
    if (idx >= cards.length) idx = 0;
    const card = cards[idx];
    const gridRect = grid.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const offset = (cardRect.left - gridRect.left) - (gridRect.width - cardRect.width) / 2;
    grid.scrollTo({
      left: grid.scrollLeft + offset,
      behavior: 'smooth'
    });
  }

  function slide(dir) {
    goTo(getCurrentIdx() + dir);
  }

  function userClick(dir) {
    stopAuto();
    slide(dir);
    clearTimeout(touchPauseTimer);
    touchPauseTimer = setTimeout(startAuto, RESUME_AFTER_TOUCH);
  }

  function markActive() {
    const cur = getCurrentIdx();
    getCards().forEach((c, i) => c.classList.toggle('is-active', i === cur));
  }

  function startAuto() {
    if (mqMotion.matches) return;  // уважаем reduced-motion
    stopAuto();
    autoTimer = setInterval(() => slide(1), AUTO_MS);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  function onScroll() {
    markActive();
  }
  function onTouchStart() {
    stopAuto();
    clearTimeout(touchPauseTimer);
  }
  function onTouchEnd() {
    clearTimeout(touchPauseTimer);
    touchPauseTimer = setTimeout(startAuto, RESUME_AFTER_TOUCH);
  }

  function attach() {
    if (mqMobile.matches && !attached) {
      buildArrows();
      // Дать браузеру отрисовать flex-раскладку перед первым замером
      requestAnimationFrame(() => {
        markActive();
        // Центрируем первую активную карточку, чтобы старт был «чистым»
        goTo(getCurrentIdx());
        startAuto();
      });
      grid.addEventListener('scroll', onScroll, { passive: true });
      grid.addEventListener('touchstart', onTouchStart, { passive: true });
      grid.addEventListener('touchend', onTouchEnd, { passive: true });
      attached = true;
    } else if (!mqMobile.matches && attached) {
      destroyArrows();
      stopAuto();
      clearTimeout(touchPauseTimer);
      grid.removeEventListener('scroll', onScroll);
      grid.removeEventListener('touchstart', onTouchStart);
      grid.removeEventListener('touchend', onTouchEnd);
      getCards().forEach(c => c.classList.remove('is-active'));
      attached = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
  mqMobile.addEventListener('change', attach);
})();
