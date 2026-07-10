/* ============================================================
   EMAS Admin — Shared Sidebar + Live Utilities
   ============================================================ */

const EMAS_MENU = [
  {
    section: 'Əsas',
    items: [
      { id: 'dashboard', icon: 'bi-grid-1x2-fill', label: 'İdarəetmə Paneli', href: 'index.html' },
      {
        id: 'applications', icon: 'bi-file-earmark-text', label: 'Müraciətlər', badge: 24,
        sub: [
          { id: 'app-all',     label: 'Bütün Müraciətlər', href: 'index.html' },
          { id: 'app-pending', label: 'Gözləyən',           href: 'index.html#pending' },
          { id: 'app-archive', label: 'Arxiv',              href: 'index.html#archive' },
        ]
      },
      {
        id: 'beneficiaries', icon: 'bi-people-fill', label: 'Benefisiarlar',
        sub: [
          { id: 'ben-list', label: 'Siyahı',         href: '#' },
          { id: 'ben-new',  label: 'Yeni Əlavə Et',  href: '#' },
        ]
      },
      {
        id: 'payments', icon: 'bi-cash-stack', label: 'Ödənişlər',
        sub: [
          { id: 'pay-monthly',  label: 'Aylıq Ödənişlər', href: '#' },
          { id: 'pay-history',  label: 'Tarixçə',          href: '#' },
        ]
      },
    ]
  },
  {
    section: 'CRM',
    items: [
      {
        id: 'customers', icon: 'bi-person-lines-fill', label: 'Müştərilər',
        sub: [
          { id: 'cust-list',   label: 'Müştəri Siyahısı',       href: 'customers.html' },
          { id: 'cust-charts', label: 'Statistika & Qrafiklər',  href: 'customers.html#charts' },
          { id: 'cust-new',    label: 'Yeni Müştəri',            href: 'customers.html#new' },
        ]
      },
    ]
  },
  {
    section: 'Sistem',
    items: [
      {
        id: 'users', icon: 'bi-person-badge', label: 'İstifadəçilər',
        sub: [
          { id: 'usr-list',  label: 'İstifadəçi Siyahısı', href: 'users.html' },
          { id: 'usr-roles', label: 'Rol İdarəetməsi',      href: 'roles.html' },
          { id: 'usr-new',   label: 'Yeni İstifadəçi',      href: 'users.html#new' },
        ]
      },
      { id: 'reports',  icon: 'bi-bar-chart-line', label: 'Hesabatlar',   href: '#' },
      {
        id: 'settings', icon: 'bi-gear-fill', label: 'Parametrlər',
        sub: [
          { id: 'set-profile', label: 'Profil',               href: 'profile.html' },
          { id: 'set-sys',     label: 'Sistem Parametrləri',  href: '#' },
        ]
      },
    ]
  }
];

function initSidebar(activeId) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  function subMatchesPage(sub) {
    return sub.some(s => {
      const f = s.href.split('#')[0].split('?')[0];
      return f && f !== '#' && f === currentFile;
    });
  }

  let html = `
    <a href="index.html" class="sidebar-logo">
      <div class="logo-icon"><i class="bi bi-shield-check"></i></div>
      <div class="logo-text">
        <strong>EMAS</strong>
        <span>E-Sosial Sistemlər</span>
      </div>
    </a>`;

  EMAS_MENU.forEach(section => {
    html += `<p class="sb-section">${section.section}</p><ul class="sb-nav">`;

    section.items.forEach(item => {
      const hasSub = item.sub && item.sub.length > 0;
      const isActive = item.id === activeId || (hasSub && subMatchesPage(item.sub));

      if (hasSub) {
        html += `
          <li>
            <button class="sb-link ${isActive ? 'active' : ''}"
                    data-bs-toggle="collapse"
                    data-bs-target="#sb-${item.id}"
                    aria-expanded="${isActive ? 'true' : 'false'}">
              <i class="bi ${item.icon} sb-icon"></i>
              <span class="sb-label">${item.label}</span>
              ${item.badge ? `<span class="sb-badge">${item.badge}</span>` : ''}
              <i class="bi bi-chevron-down sb-chevron"></i>
            </button>
            <div class="collapse ${isActive ? 'show' : ''}" id="sb-${item.id}">
              <ul class="sb-sub">
                ${item.sub.map(s => {
                  const sf = s.href.split('#')[0].split('?')[0];
                  const subActive = sf && sf !== '#' && sf === currentFile;
                  return `<li>
                    <a href="${s.href}" class="sb-sub-link ${subActive ? 'sub-active' : ''}">
                      <span class="sub-dot"></span>${s.label}
                    </a>
                  </li>`;
                }).join('')}
              </ul>
            </div>
          </li>`;
      } else {
        const linkFile = (item.href || '').split('#')[0];
        const linkActive = item.id === activeId || (linkFile && linkFile === currentFile);
        html += `
          <li>
            <a href="${item.href || '#'}" class="sb-link ${linkActive ? 'active' : ''}">
              <i class="bi ${item.icon} sb-icon"></i>
              <span class="sb-label">${item.label}</span>
              ${item.badge ? `<span class="sb-badge">${item.badge}</span>` : ''}
            </a>
          </li>`;
      }
    });

    html += `</ul>`;
  });

  html += `
    <div class="sidebar-footer">
      <a href="profile.html"><i class="bi bi-person-circle"></i> Profil</a>
      <a href="#"><i class="bi bi-question-circle"></i> Yardım</a>
      <a href="#" onclick="return confirm('Çıxmaq istədiyinizə əminsiniz?')">
        <i class="bi bi-box-arrow-right"></i> Çıxış
      </a>
    </div>`;

  sidebar.innerHTML = html;
}

/* ── LIVE CLOCK ─────────────────────────────── */
function initClock() {
  const timeEl = document.getElementById('live-time');
  const dateEl = document.getElementById('live-date');
  if (!timeEl) return;

  const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'];

  function tick() {
    const now = new Date();
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('az-AZ', { hour12: false });
    if (dateEl) {
      dateEl.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    }
  }
  tick();
  setInterval(tick, 1000);
}

/* ── LIVE STAT COUNTER ──────────────────────── */
function initLiveStats(configs) {
  // configs: [{ elId, base, variance, prefix, suffix }]
  setInterval(() => {
    configs.forEach(cfg => {
      const el = document.getElementById(cfg.elId);
      if (!el) return;
      const v = cfg.variance || 1;
      const delta = Math.floor(Math.random() * v * 2) - v;
      const cur = parseInt(el.getAttribute('data-val') || cfg.base);
      const next = Math.max(0, cur + delta);
      el.setAttribute('data-val', next);
      el.textContent = (cfg.prefix || '') + next.toLocaleString('az-AZ') + (cfg.suffix || '');
      const card = el.closest('.stat-card');
      if (card) { card.classList.add('pulse'); setTimeout(() => card.classList.remove('pulse'), 500); }
    });
  }, 12000);
}

/* ── LIVE ACTIVITY FEED ─────────────────────── */
const LIVE_ACTIVITIES = [
  { icon: 'bi-check2-circle', cls: 'c-green',  text: '<strong>Yeni müraciət</strong> daxil oldu — Bakı, Nəsimi', time: 'Az önce' },
  { icon: 'bi-cash',          cls: 'c-teal',   text: '<strong>₼3,200</strong> ödənişi tamamlandı', time: 'Az önce' },
  { icon: 'bi-person-plus',   cls: 'c-blue',   text: 'Yeni benefisiar <strong>qeydiyyatdan</strong> keçdi', time: 'Az önce' },
  { icon: 'bi-exclamation',   cls: 'c-orange', text: 'Müraciət <strong>sənəd çatışmazlığına</strong> görə dayandırıldı', time: 'Az önce' },
  { icon: 'bi-shield-check',  cls: 'c-purple', text: 'Sistem <strong>təhlükəsizlik yoxlaması</strong> tamamlandı', time: 'Az önce' },
];

function initLiveFeed(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let idx = 0;
  setInterval(() => {
    const act = LIVE_ACTIVITIES[idx % LIVE_ACTIVITIES.length];
    const item = document.createElement('div');
    item.className = 'act-item';
    item.style.cssText = 'animation:fadeIn .4s ease;opacity:0;';
    item.innerHTML = `
      <div class="act-icon ${act.cls}"><i class="bi ${act.icon}"></i></div>
      <div>
        <div class="act-text">${act.text}</div>
        <div class="act-time" data-live-ts="${Date.now()}">Az önce</div>
      </div>`;
    container.prepend(item);
    requestAnimationFrame(() => { item.style.opacity = '1'; });
    // remove oldest if more than 6
    const items = container.querySelectorAll('.act-item');
    if (items.length > 6) items[items.length - 1].remove();
    idx++;
  }, 18000);

  // Update relative timestamps every minute
  setInterval(() => {
    container.querySelectorAll('[data-live-ts]').forEach(el => {
      const diff = Math.floor((Date.now() - +el.dataset.liveTs) / 60000);
      el.textContent = diff < 1 ? 'Az önce' : `${diff} dəq əvvəl`;
    });
  }, 30000);
}

/* ── ONLINE USERS ───────────────────────────── */
function initOnlineCounter(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  let count = 8;
  el.textContent = count;
  setInterval(() => {
    count += Math.random() > .5 ? 1 : -1;
    count = Math.max(3, Math.min(20, count));
    el.textContent = count;
  }, 7000);
}

/* ── INIT ALL ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initClock();
});
