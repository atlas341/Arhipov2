// Интерактивная карта России.
// 1. Загружаем SVG и инжектим в #mapSvgWrap.
// 2. Подсвечиваем регионы присутствия.
// 3. Рисуем маркеры филиалов и точек доставки по координатам из branches.json.
// 4. Слушаем переключение режимов транспорта и перерисовываем маршруты.

(function () {
  const wrap = document.getElementById('mapSvgWrap');
  const panel = document.getElementById('mapPanel');
  if (!wrap || !panel) return;

  const SVG_URL = 'assets/svg/russia.svg';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  let svgRoot = null;
  let branches = [];
  let destinations = [];
  let routes = {};
  let currentMode = 'all';
  let pointsLayer = null;
  let routesLayer = null;

  // ---- Load data ----
  Promise.all([
    fetch(SVG_URL).then((r) => r.text()),
    fetch('assets/data/branches.json').then((r) => r.json()),
    fetch('assets/data/routes.json').then((r) => r.json()),
  ])
    .then(([svgText, branchData, routeData]) => {
      branches = branchData.branches || [];
      destinations = branchData.destinations || [];
      routes = routeData.modes || {};
      initMap(svgText);
    })
    .catch((err) => {
      console.error('[map] failed to init', err);
      wrap.innerHTML =
        '<div style="padding:32px;color:#8095AC;text-align:center;">Не удалось загрузить карту. Откройте сайт через локальный сервер (см. README).</div>';
    });

  function initMap(svgText) {
    wrap.innerHTML = svgText;
    svgRoot = wrap.querySelector('svg');
    if (!svgRoot) return;

    svgRoot.removeAttribute('width');
    svgRoot.removeAttribute('height');
    svgRoot.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Подсвечиваем регионы присутствия
    const activeRegions = new Set(branches.map((b) => b.regionId).filter(Boolean));
    activeRegions.forEach((id) => {
      const path = svgRoot.querySelector('#' + id);
      if (path) path.classList.add('is-active-region');
    });

    // Слои поверх карты
    routesLayer = document.createElementNS(SVG_NS, 'g');
    routesLayer.setAttribute('class', 'map-routes');
    svgRoot.appendChild(routesLayer);

    pointsLayer = document.createElementNS(SVG_NS, 'g');
    pointsLayer.setAttribute('class', 'map-points');
    svgRoot.appendChild(pointsLayer);

    // Маркеры филиалов
    branches.forEach((b) => drawBranchMarker(b));

    // Точки доставки (синие)
    destinations.forEach((d) => drawDestinationMarker(d));

    // Сразу подгружаем все маршруты
    drawRoutes(currentMode);

    // Контролы переключения режимов
    document.querySelectorAll('.map__mode').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map__mode').forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        currentMode = btn.dataset.mode;
        drawRoutes(currentMode);
      });
    });

    // Поведение панели справа по умолчанию — головной офис
    const hq = branches.find((b) => b.type === 'hq') || branches[0];
    if (hq) showBranchInPanel(hq);
  }

  function drawBranchMarker(branch) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'map-marker map-marker--' + branch.type);
    g.setAttribute('data-id', branch.id);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', branch.city);

    const cx = branch.x;
    const cy = branch.y;

    const sizes = {
      hq: { halo: 9, dot: 4.2, pulse: 7 },
      warehouse: { halo: 7, dot: 3.4, pulse: 6 },
      office: { halo: 6.5, dot: 3, pulse: 5.5 },
    };
    const s = sizes[branch.type] || sizes.warehouse;

    const pulse = document.createElementNS(SVG_NS, 'circle');
    pulse.setAttribute('class', 'marker-pulse');
    pulse.setAttribute('cx', cx); pulse.setAttribute('cy', cy);
    pulse.setAttribute('r', s.pulse);
    pulse.style.animationDelay = (Math.random() * 1.5) + 's';
    g.appendChild(pulse);

    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.setAttribute('class', 'marker-halo');
    halo.setAttribute('cx', cx); halo.setAttribute('cy', cy);
    halo.setAttribute('r', s.halo);
    g.appendChild(halo);

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'marker-dot');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    dot.setAttribute('r', s.dot);
    g.appendChild(dot);

    // Подпись для крупных. По умолчанию справа от точки.
    // Поддерживаются опциональные labelDx / labelDy / hideLabel в branches.json.
    if ((branch.type === 'hq' || branch.type === 'warehouse') && !branch.hideLabel) {
      const dx = (branch.labelDx != null) ? branch.labelDx : (s.halo + 3);
      const dy = (branch.labelDy != null) ? branch.labelDy : 2;
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', cx + dx);
      label.setAttribute('y', cy + dy);
      label.setAttribute('font-size', '5.2');
      label.setAttribute('fill', branch.type === 'hq' ? '#FFFFFF' : '#A8B9CC');
      label.setAttribute('font-family', 'Manrope, sans-serif');
      label.setAttribute('font-weight', branch.type === 'hq' ? '700' : '600');
      label.setAttribute('pointer-events', 'none');
      label.setAttribute('paint-order', 'stroke');
      label.setAttribute('stroke', '#06101A');
      label.setAttribute('stroke-width', '0.6');
      label.textContent = branch.city;
      g.appendChild(label);
    }

    g.addEventListener('mouseenter', () => showBranchInPanel(branch));
    g.addEventListener('focus', () => showBranchInPanel(branch));
    g.addEventListener('click', () => showBranchInPanel(branch));

    pointsLayer.appendChild(g);
  }

  function drawDestinationMarker(dest) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'map-marker map-marker--dest');
    g.setAttribute('data-id', dest.id);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', dest.city);

    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.setAttribute('class', 'marker-halo');
    halo.setAttribute('cx', dest.x); halo.setAttribute('cy', dest.y);
    halo.setAttribute('r', 4.5);
    g.appendChild(halo);

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'marker-dot');
    dot.setAttribute('cx', dest.x); dot.setAttribute('cy', dest.y);
    dot.setAttribute('r', 2);
    g.appendChild(dot);

    g.addEventListener('mouseenter', () => showDestinationInPanel(dest));
    g.addEventListener('focus', () => showDestinationInPanel(dest));
    g.addEventListener('click', () => showDestinationInPanel(dest));

    pointsLayer.appendChild(g);
  }

  function locationById(id) {
    return (
      branches.find((b) => b.id === id) ||
      destinations.find((d) => d.id === id)
    );
  }

  function drawRoutes(mode) {
    routesLayer.innerHTML = '';
    const modesToDraw = mode === 'all' ? Object.keys(routes) : [mode];

    modesToDraw.forEach((m) => {
      const conf = routes[m];
      if (!conf) return;
      conf.routes.forEach(([fromId, toId]) => {
        const a = locationById(fromId);
        const b = locationById(toId);
        if (!a || !b) return;
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'map-route map-route--' + m);
        // Curve: control point above the midpoint
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const lift = Math.min(60, dist * 0.18);
        const cx = mx;
        const cy = my - lift;
        const d = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
        path.setAttribute('d', d);
        routesLayer.appendChild(path);
      });
    });
  }

  function showBranchInPanel(branch) {
    panel.innerHTML = `
      <span class="branch-card__type">${escapeHtml(branch.label || typeLabel(branch.type))}</span>
      <h3 class="branch-card__city">${escapeHtml(branch.city)}</h3>
      <p class="branch-card__region">${escapeHtml(branch.region || '')}</p>
      <p class="branch-card__desc">${escapeHtml(branch.description || '')}</p>
      <div class="branch-card__meta">
        <span>В&nbsp;структуре с</span>
        <b>${branch.since || '—'}</b>
      </div>
    `;
  }

  function showDestinationInPanel(dest) {
    panel.innerHTML = `
      <span class="branch-card__type" style="background:rgba(79,183,255,.14);color:#4FB7FF;border-color:rgba(79,183,255,.3);">Точка доставки</span>
      <h3 class="branch-card__city">${escapeHtml(dest.city)}</h3>
      <p class="branch-card__region">${escapeHtml(dest.note || '')}</p>
      <p class="branch-card__desc">Регулярные поставки продуктов питания. Доставка морем во&nbsp;время навигации, авиа — круглогодично.</p>
    `;
  }

  function typeLabel(type) {
    return { hq: 'Головной офис', warehouse: 'Склад', office: 'Представительство' }[type] || 'Филиал';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
