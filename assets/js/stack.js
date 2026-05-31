// Эффект «стопки секций с глубиной» (как у Orakl).
// Каждая секция в .section-stack — position: sticky сверху.
// При прокрутке нижняя секция сжимается и тускнеет под наплывающей.
// Активируется только на десктопе (≥1024px) и уважает prefers-reduced-motion.
(function () {
  const stack = document.querySelector('.section-stack');
  if (!stack) return;

  const sections = stack.querySelectorAll(':scope > section');
  if (!sections.length) return;

  const mqDesktop = matchMedia('(min-width: 1024px)');
  const mqMotion  = matchMedia('(prefers-reduced-motion: reduce)');

  // Сколько максимально сжимать / тускнеть к моменту полного перекрытия
  const SCALE_FROM = 1;
  const SCALE_TO   = 0.92;     // 8% сжатия
  const DIM_FROM   = 1;
  const DIM_TO     = 0.55;     // ~45% затемнения
  const SAT_FROM   = 1;
  const SAT_TO     = 0.85;     // лёгкая десатурация — «на задний план»

  let rafId = null;

  function reset() {
    sections.forEach(sec => {
      sec.style.removeProperty('--stack-scale');
      sec.style.removeProperty('--stack-dim');
      sec.style.removeProperty('--stack-sat');
    });
  }

  function update() {
    rafId = null;
    const vh = window.innerHeight;
    sections.forEach((sec, i) => {
      const next = sections[i + 1];
      if (!next) {
        // Последняя секция в стопке — не подкрашиваем
        sec.style.setProperty('--stack-scale', 1);
        sec.style.setProperty('--stack-dim',   1);
        sec.style.setProperty('--stack-sat',   1);
        return;
      }
      // Прогресс перекрытия: 0 когда следующая ещё ниже экрана,
      // 1 когда её верх дошёл до верха экрана (она полностью накрыла предыдущую).
      const nextTop = next.getBoundingClientRect().top;
      let p = 1 - nextTop / vh;
      if (p < 0) p = 0;
      else if (p > 1) p = 1;

      // Лёгкая ease-out, чтобы анимация была мягче в начале
      const eased = 1 - Math.pow(1 - p, 2);

      sec.style.setProperty('--stack-scale', (SCALE_FROM + (SCALE_TO - SCALE_FROM) * eased).toFixed(4));
      sec.style.setProperty('--stack-dim',   (DIM_FROM   + (DIM_TO   - DIM_FROM)   * eased).toFixed(4));
      sec.style.setProperty('--stack-sat',   (SAT_FROM   + (SAT_TO   - SAT_FROM)   * eased).toFixed(4));
    });
  }

  function onScroll() {
    if (rafId == null) rafId = requestAnimationFrame(update);
  }

  let attached = false;
  function sync() {
    const shouldRun = mqDesktop.matches && !mqMotion.matches;
    if (shouldRun && !attached) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
      attached = true;
    } else if (!shouldRun && attached) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reset();
      attached = false;
    }
  }

  sync();
  mqDesktop.addEventListener('change', sync);
  mqMotion.addEventListener('change', sync);
})();
