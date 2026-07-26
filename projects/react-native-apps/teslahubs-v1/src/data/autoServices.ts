export type AutoServiceCategory = 'ppf';

export const AUTO_SERVICE_CATEGORIES: { key: AutoServiceCategory; label: string }[] = [{ key: 'ppf', label: 'PPF' }];

export type SampleWorkItem = {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  caption: string;
  serviceOptionId?: string;
  originalPrice?: number;
  discountPrice?: number;
};

export type SubServiceOption = {
  id: string;
  name: string;
  price: number;
};

export type ServiceOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  subOptions?: SubServiceOption[];
};

export const AUTO_SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'ppf-full',
    name: 'PPF — Tam bədən',
    description: 'Avtomobilin bütün bədəninə tam PPF örtük',
    price: 1200,
    subOptions: [
      { id: 'ppf-full-standard', name: 'Standart plyonka', price: 0 },
      { id: 'ppf-full-premium', name: 'Premium (self-heal) plyonka', price: 400 },
    ],
  },
  {
    id: 'ppf-front',
    name: 'PPF — Ön hissə',
    description: 'Kapot, buferlər, ön qanadlar və güzgülər',
    price: 650,
    subOptions: [
      { id: 'ppf-front-standard', name: 'Standart plyonka', price: 0 },
      { id: 'ppf-front-premium', name: 'Premium (self-heal) plyonka', price: 220 },
    ],
  },
  {
    id: 'ppf-hood',
    name: 'PPF — Yalnız kapot',
    description: 'Yalnız kapot hissəsi qorunur',
    price: 280,
    subOptions: [
      { id: 'ppf-hood-standard', name: 'Standart plyonka', price: 0 },
      { id: 'ppf-hood-premium', name: 'Premium (self-heal) plyonka', price: 90 },
    ],
  },
  {
    id: 'ppf-mirrors',
    name: 'PPF — Güzgülər və qapı kənarları',
    description: 'Ən çox cızılan hissələr üçün nöqtəvi qoruma',
    price: 120,
    subOptions: [
      { id: 'ppf-mirrors-gloss', name: 'Qlyansız (glossy)', price: 0 },
      { id: 'ppf-mirrors-matte', name: 'Mat (matte)', price: 30 },
    ],
  },
  {
    id: 'ceramic',
    name: 'Keramik təbəqə (Ceramic Coating)',
    description: 'Parlaqlıq və uzunmüddətli boya qoruması',
    price: 350,
    subOptions: [
      { id: 'ceramic-2y', name: '2 illik təbəqə', price: 0 },
      { id: 'ceramic-5y', name: '5 illik təbəqə', price: 200 },
    ],
  },
  {
    id: 'ceramic-interior',
    name: 'Salon keramik təmizləmə',
    description: 'Salon səthləri üçün keramik qoruyucu təbəqə',
    price: 150,
  },
  {
    id: 'tint',
    name: 'Cam tonlama',
    description: 'Şüşələrin peşəkar tonlanması',
    price: 200,
    subOptions: [
      { id: 'tint-light', name: 'Açıq ton (%50)', price: 0 },
      { id: 'tint-dark', name: 'Tünd ton (%20)', price: 0 },
      { id: 'tint-full', name: 'Tam qara (%5)', price: 20 },
    ],
  },
];

export function getServiceOption(id: string): ServiceOption | undefined {
  return AUTO_SERVICE_OPTIONS.find(o => o.id === id);
}

export function getSubServiceOption(serviceId: string, subId: string): SubServiceOption | undefined {
  return getServiceOption(serviceId)?.subOptions?.find(s => s.id === subId);
}

export type AutoServiceProvider = {
  id: string;
  name: string;
  category: AutoServiceCategory;
  tagline: string;
  icon: string;
  color: string;
  address: string;
  phone?: string;
  photos: string[];
  sampleWork: SampleWorkItem[];
  serviceOptionIds: string[];
};

export const AUTO_SERVICE_PROVIDERS: AutoServiceProvider[] = [
  {
    id: 'prowash',
    name: 'Prowash',
    category: 'ppf',
    tagline: 'Peşəkar PPF (boya qoruyucu plyonka) tətbiqi',
    icon: '🛡️',
    color: '#2F8FE0',
    address: 'Bakı, Nərimanov rayonu, Həsən Əliyev küç. 12',
    phone: '+994 12 555 60 60',
    photos: [
      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=900&q=80',
      'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=900&q=80',
      'https://images.unsplash.com/photo-1493238792000-8113da705763?w=900&q=80',
    ],
    sampleWork: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=900&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&q=80',
        caption: 'Tam ön kapot PPF tətbiqi',
        serviceOptionId: 'ppf-front',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1600661653561-629509216228?w=900&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1600661653561-629509216228?w=500&q=80',
        caption: 'Güzgü və qapı kənarları',
        serviceOptionId: 'ppf-mirrors',
      },
      {
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
        caption: 'Tətbiq prosesi (video)',
        serviceOptionId: 'ppf-full',
      },
    ],
    serviceOptionIds: ['ppf-full', 'ppf-front', 'ppf-hood', 'ppf-mirrors', 'ceramic', 'tint'],
  },
  {
    id: 'auto444',
    name: 'Auto444',
    category: 'ppf',
    tagline: 'Premium PPF örtük xidməti',
    icon: '🛡️',
    color: '#E08A2E',
    address: 'Bakı, Xətai rayonu, Zərifə Əliyeva küç. 27',
    phone: '+994 12 555 44 44',
    photos: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=900&q=80',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=900&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&q=80',
    ],
    sampleWork: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80',
        caption: 'Tam bədən PPF örtüyü — endirimli kampaniya',
        serviceOptionId: 'ppf-full',
        originalPrice: 1200,
        discountPrice: 950,
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=900&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=500&q=80',
        caption: 'Keramik təbəqə + PPF',
        serviceOptionId: 'ceramic',
      },
      {
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80',
        caption: 'Salon detallandırma (video)',
        serviceOptionId: 'ceramic-interior',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
        caption: 'Güzgü və qapı kənarları — həftəlik endirim',
        serviceOptionId: 'ppf-mirrors',
        originalPrice: 120,
        discountPrice: 89,
      },
    ],
    serviceOptionIds: ['ppf-full', 'ppf-mirrors', 'ceramic', 'ceramic-interior'],
  },
];

export function getAutoServiceProvider(id: string): AutoServiceProvider | undefined {
  return AUTO_SERVICE_PROVIDERS.find(p => p.id === id);
}
