export const MENU = [
  {
    section: 'Əsas',
    items: [
      { id: 'dashboard', icon: 'bi-grid-1x2-fill', label: 'İdarəetmə Paneli', path: '/' },
      {
        id: 'applications', icon: 'bi-file-earmark-text', label: 'Müraciətlər', badge: 24,
        sub: [
          { label: 'Bütün Müraciətlər', path: '/' },
          { label: 'Gözləyən',           path: '/#pending' },
          { label: 'Arxiv',              path: '/#archive' },
        ],
      },
      {
        id: 'beneficiaries', icon: 'bi-people-fill', label: 'Benefisiarlar',
        sub: [
          { label: 'Siyahı',        path: '#' },
          { label: 'Yeni Əlavə Et', path: '#' },
        ],
      },
      {
        id: 'payments', icon: 'bi-cash-stack', label: 'Ödənişlər',
        sub: [
          { label: 'Aylıq Ödənişlər', path: '#' },
          { label: 'Tarixçə',          path: '#' },
        ],
      },
    ],
  },
  {
    section: 'CRM',
    items: [
      {
        id: 'customers', icon: 'bi-person-lines-fill', label: 'Müştərilər',
        sub: [
          { label: 'Müştəri Siyahısı',      path: '/customers' },
          { label: 'Statistika & Qrafiklər', path: '/customers#charts' },
          { label: 'Yeni Müştəri',           path: '/customers#new' },
        ],
      },
    ],
  },
  {
    section: 'Sistem',
    items: [
      {
        id: 'users', icon: 'bi-person-badge', label: 'İstifadəçilər',
        sub: [
          { label: 'İstifadəçi Siyahısı', path: '/users' },
          { label: 'Rol İdarəetməsi',      path: '/roles' },
          { label: 'Yeni İstifadəçi',      path: '/users#new' },
        ],
      },
      { id: 'reports', icon: 'bi-bar-chart-line', label: 'Hesabatlar', path: '#' },
      {
        id: 'settings', icon: 'bi-gear-fill', label: 'Parametrlər',
        sub: [
          { label: 'Profil',               path: '/profile' },
          { label: 'Sistem Parametrləri',  path: '#' },
        ],
      },
    ],
  },
]
