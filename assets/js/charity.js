// Charity auto-rotating slider.
// Один слайд на ширину окна, авто-листание по кругу, остановка на hover.
(function () {
  const slider  = document.getElementById('charitySlider');
  const track   = document.getElementById('charityTrack');
  const dotsBox = document.getElementById('charityDots');
  const prevBtn = document.getElementById('charityPrev');
  const nextBtn = document.getElementById('charityNext');
  if (!slider || !track) return;

  const slides = Array.from(track.children);
  if (!slides.length) return;

  const INTERVAL = 6000;     // ms между слайдами
  const TRANSITION = 650;    // мс перехода (синхронно с CSS)
  let index = 0;
  let timer = null;
  let paused = false;

  // Точки навигации
  dotsBox.innerHTML = '';
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Слайд ' + (i + 1));
    if (i === 0) b.classList.add('is-active');
    b.addEventListener('click', () => { goTo(i); restart(); });
    dotsBox.appendChild(b);
  });
  const dots = Array.from(dotsBox.children);

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    dots.forEach((d, n) => d.classList.toggle('is-active', n === index));
    slides.forEach((s, n) => {
      s.setAttribute('aria-hidden', n === index ? 'false' : 'true');
    });
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function start() {
    stop();
    if (paused) return;
    timer = setInterval(next, INTERVAL);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function restart() { stop(); start(); }

  // Ручная навигация
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restart(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restart(); });

  // Клавиатура (когда слайдер в фокусе)
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { next(); restart(); }
    if (e.key === 'ArrowLeft')  { prev(); restart(); }
  });

  // Пауза при наведении / фокусе
  slider.addEventListener('mouseenter', () => { paused = true; stop(); });
  slider.addEventListener('mouseleave', () => { paused = false; start(); });
  slider.addEventListener('focusin',    () => { paused = true; stop(); });
  slider.addEventListener('focusout',   () => { paused = false; start(); });

  // Когда вкладка скрыта — не крутим зря
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!paused)   start();
  });

  // Свайп на тач-устройствах
  let touchX = null;
  track.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].clientX;
    paused = true; stop();
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX = null;
    paused = false; start();
  });

  // Старт
  goTo(0);
  start();
})();
