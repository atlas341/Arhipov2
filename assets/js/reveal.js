// Reveal-on-enter для секций в стопке:
// сначала виден фон секции, потом каскадом проявляются заголовок и карточки.
// Уважает prefers-reduced-motion, не блокирует существующую логику стека.
(function () {
  const stack = document.querySelector('.section-stack');
  if (!stack) return;

  // Если человек просил уменьшить анимации — ничего не подключаем,
  // всё видно сразу (CSS включается только при наличии .has-reveal на стеке).
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sections = stack.querySelectorAll(':scope > section');
  if (!sections.length) return;

  // Селекторы «карточек» внутри секций стека
  const itemSelectors = [
    '.story',        // .stories
    '.why-card',     // .why
    '.num-strip',    // .numbers (одна полоса)
    '.map',          // .map-section (виджет карты целиком)
  ].join(', ');

  stack.classList.add('has-reveal');

  // Расставляем --i на каждом элементе, чтобы каскад работал через CSS
  sections.forEach((sec) => {
    const head = sec.querySelector('.section-head');
    if (head) head.style.setProperty('--i', '0');
    const items = sec.querySelectorAll(itemSelectors);
    items.forEach((el, idx) => el.style.setProperty('--i', String(idx + 1)));
  });

  // Наблюдатель: как только секция показалась хотя бы на 15% — открываем
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  sections.forEach((sec) => io.observe(sec));
})();
