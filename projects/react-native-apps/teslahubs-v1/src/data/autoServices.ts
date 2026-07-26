export type AutoServiceCategory = 'ppf';

export const AUTO_SERVICE_CATEGORIES: { key: AutoServiceCategory; label: string }[] = [{ key: 'ppf', label: 'PPF' }];

export type AutoServiceProvider = {
  id: string;
  name: string;
  category: AutoServiceCategory;
  tagline: string;
  icon: string;
  color: string;
  address: string;
  phone?: string;
};

export const AUTO_SERVICE_PROVIDERS: AutoServiceProvider[] = [
  {
    id: 'prowash',
    name: 'Prowash',
    category: 'ppf',
    tagline: 'Peşəkar PPF (boya qoruyucu plyonka) tətbiqi',
    icon: '🛡️',
    color: '#2F8FE0',
    address: 'Bakı',
    phone: '+994 12 555 60 60',
  },
  {
    id: 'auto444',
    name: 'Auto444',
    category: 'ppf',
    tagline: 'Premium PPF örtük xidməti',
    icon: '🛡️',
    color: '#E08A2E',
    address: 'Bakı',
    phone: '+994 12 555 44 44',
  },
];

export function getAutoServiceProvider(id: string): AutoServiceProvider | undefined {
  return AUTO_SERVICE_PROVIDERS.find(p => p.id === id);
}
