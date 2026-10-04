// Preloader: shows 3 words "Надёжность • Качество • Север", then hides.
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Block scrolling while preloader is up.
  document.body.classList.add('is-locked');

  // Failsafe — never leave the page blocked if startup stalls.
  const FAILSAFE = 6500;

  function hide() {
    if (preloader.classList.contains('is-hidden')) return;
    preloader.classList.add('is-hidden');
    document.body.classList.remove('is-locked');
    preloader.setAttribute('aria-hidden', 'true');
    // Remove from DOM after transition to avoid any layout cost.
    setTimeout(() => preloader.remove(), 800);
  }

  window.addEventListener('DOMContentLoaded', () => {
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300;
    setTimeout(hide, delay);
  }, { once: true });

  setTimeout(hide, FAILSAFE);

  // If the user wants to skip — click anywhere on the preloader.
  preloader.addEventListener('click', hide);
})();
