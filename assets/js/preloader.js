// Preloader: shows 3 words "Надёжность • Качество • Север", then hides.
// Total duration 4.5s — synced with progress bar and truck animation (CSS).
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Block scrolling while preloader is up.
  document.body.classList.add('is-locked');

  // Failsafe — even if animation is interrupted, never block the page > 6s.
  const HIDE_AFTER = 4500;
  const FAILSAFE = 6500;

  function hide() {
    if (preloader.classList.contains('is-hidden')) return;
    preloader.classList.add('is-hidden');
    document.body.classList.remove('is-locked');
    preloader.setAttribute('aria-hidden', 'true');
    // Remove from DOM after transition to avoid any layout cost.
    setTimeout(() => preloader.remove(), 800);
  }

  window.addEventListener('load', () => {
    setTimeout(hide, HIDE_AFTER);
  }, { once: true });

  setTimeout(hide, FAILSAFE);

  // If the user wants to skip — click anywhere on the preloader.
  preloader.addEventListener('click', hide);
})();
