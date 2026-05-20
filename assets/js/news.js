// Слайдер новостей. Подгружает assets/data/news.json и рендерит карточки.
// Чтобы добавить новость — отредактируйте news.json и положите картинку в assets/img/news/.
(function () {
  const track = document.getElementById('newsTrack');
  const dotsWrap = document.getElementById('newsDots');
  const prevBtn = document.getElementById('newsPrev');
  const nextBtn = document.getElementById('newsNext');
  const slider = document.getElementById('newsSlider');
  if (!track) return;

  fetch('assets/data/news.json')
    .then((r) => r.json())
    .then((data) => render(data.news || []))
    .catch((err) => {
      console.error('[news] failed', err);
      track.innerHTML =
        '<p style="color:var(--muted);padding:24px;">Не удалось загрузить новости. Откройте сайт через локальный сервер (см. README).</p>';
    });

  function render(items) {
    track.innerHTML = '';

    if (!items.length) {
      track.innerHTML = '<p style="color:var(--muted);padding:24px;">Новостей пока нет.</p>';
      if (dotsWrap) dotsWrap.innerHTML = '';
      return;
    }

    // Строим карточки через DOM (надёжнее, чем inline onerror со строкой SVG)
    items.forEach((n) => track.appendChild(buildCard(n)));

    const slides = Array.from(track.querySelectorAll('.news-card'));

    // Точки навигации
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Перейти к новости ' + (i + 1));
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => scrollToSlide(i));
      dotsWrap.appendChild(b);
    });

    function scrollToSlide(i) {
      const slide = slides[i];
      if (!slide) return;
      // прокручиваем контейнер так, чтобы выбранная карточка встала слева
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function activeIndex() {
      const scrollMid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const center = s.offsetLeft + s.offsetWidth / 2 - track.offsetLeft;
        const d = Math.abs(center - scrollMid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function updateDots() {
      const i = activeIndex();
      dotsWrap.querySelectorAll('button').forEach((b, idx) => {
        b.classList.toggle('is-active', idx === i);
      });
      // прячем стрелки на краях
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    let raf = null;
    track.addEventListener('scroll', () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => { updateDots(); raf = null; });
    }, { passive: true });

    prevBtn && prevBtn.addEventListener('click', () => scrollToSlide(Math.max(0, activeIndex() - 1)));
    nextBtn && nextBtn.addEventListener('click', () => scrollToSlide(Math.min(slides.length - 1, activeIndex() + 1)));

    if (slider) {
      slider.tabIndex = 0;
      slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn && prevBtn.click(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn && nextBtn.click(); }
      });
    }

    updateDots();
  }

  function buildCard(n) {
    const card = document.createElement('article');
    card.className = 'news-card';

    const media = document.createElement('div');
    media.className = 'news-card__media';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = n.imageAlt || n.title || '';
    img.src = n.image || '';
    // Чистый фолбэк: если фото нет — заменяем картинку на SVG-заглушку
    img.addEventListener('error', () => {
      media.classList.add('news-card__media--fallback');
      img.remove();
      media.appendChild(fallbackNode(n.tag || 'Новость'));
    });
    media.appendChild(img);

    const body = document.createElement('div');
    body.className = 'news-card__body';

    const meta = document.createElement('div');
    meta.className = 'news-card__meta';
    const tag = document.createElement('span');
    tag.className = 'news-card__tag';
    tag.textContent = n.tag || 'Новость';
    const time = document.createElement('time');
    time.textContent = formatDate(n.date);
    meta.append(tag, time);

    const title = document.createElement('h3');
    title.className = 'news-card__title';
    title.textContent = n.title || '';

    const excerpt = document.createElement('p');
    excerpt.className = 'news-card__excerpt';
    excerpt.textContent = n.excerpt || '';

    body.append(meta, title, excerpt);
    card.append(media, body);
    return card;
  }

  // SVG-заглушка для отсутствующего фото (тёплая палитра, без синего)
  function fallbackNode(tag) {
    const t = (tag || 'НОВОСТЬ').toUpperCase();
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 400 240');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '400'); bg.setAttribute('height', '240');
    bg.setAttribute('fill', '#3A271E');
    svg.appendChild(bg);

    const glow = document.createElementNS(ns, 'rect');
    glow.setAttribute('width', '400'); glow.setAttribute('height', '240');
    glow.setAttribute('fill', '#6E3B26'); glow.setAttribute('opacity', '0.5');
    svg.appendChild(glow);

    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('cx', '340'); ring.setAttribute('cy', '60'); ring.setAttribute('r', '28');
    ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#F2A341'); ring.setAttribute('opacity', '0.4');
    svg.appendChild(ring);

    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', '340'); dot.setAttribute('cy', '60'); dot.setAttribute('r', '14');
    dot.setAttribute('fill', '#C73E2D');
    svg.appendChild(dot);

    const t1 = document.createElementNS(ns, 'text');
    t1.setAttribute('x', '32'); t1.setAttribute('y', '198');
    t1.setAttribute('font-family', 'Unbounded, sans-serif');
    t1.setAttribute('font-size', '26'); t1.setAttribute('font-weight', '800');
    t1.setAttribute('fill', '#F2A341');
    t1.textContent = t;
    svg.appendChild(t1);

    const t2 = document.createElementNS(ns, 'text');
    t2.setAttribute('x', '32'); t2.setAttribute('y', '220');
    t2.setAttribute('font-family', 'Manrope, sans-serif');
    t2.setAttribute('font-size', '12'); t2.setAttribute('fill', '#C9B4A6');
    t2.textContent = 'ТД Архипов М.А.';
    svg.appendChild(t2);

    return svg;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
})();
