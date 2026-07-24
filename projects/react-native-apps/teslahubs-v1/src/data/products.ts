export type Review = { quote: string; name: string; model: string };

export enum ProductCategory {
  Interior = 'interior',
  Exterior = 'exterior',
  Wheels = 'wheels',
  Charging = 'charging',
}

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  wasPrice?: number;
  badge?: 'BEST SELLER' | 'TOP RATED' | 'NEW';
  fit: string;
  rating: string;
  reviewCount: number;
  description: string;
  fitTags: string[];
  reviews: Review[];
  placeholderColor: string;
  placeholderLabel: string;
  /** Optional real photo URL. Falls back to the category default, then DEFAULT_PRODUCT_IMAGE. */
  image?: string;
};

export const CATEGORIES: { key: ProductCategory; name: string; color: string }[] = [
  { key: ProductCategory.Interior, name: 'Interior', color: '#4A3636' },
  { key: ProductCategory.Exterior, name: 'Exterior', color: '#39492B' },
  { key: ProductCategory.Charging, name: 'Charging', color: '#2B3A49' },
  { key: ProductCategory.Wheels, name: 'Wheels', color: '#49402B' },
];

// Sourced from the sibling project's live product catalog (projects/teslahubsss.com/react-public-shopping-side).
export const CATEGORY_DEFAULT_IMAGE: Record<ProductCategory, string> = {
  [ProductCategory.Interior]: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
  [ProductCategory.Exterior]: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500&q=80',
  [ProductCategory.Wheels]: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
  [ProductCategory.Charging]: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&q=80',
};

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80';

export function getProductImage(product: Product): string {
  return product.image ?? CATEGORY_DEFAULT_IMAGE[product.category] ?? DEFAULT_PRODUCT_IMAGE;
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Solar Shield® Roof Sunshade Pro Kit',
    category: ProductCategory.Interior,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
    price: 139.99,
    wasPrice: 185.0,
    badge: 'BEST SELLER',
    fit: 'Model 3 & Model Y',
    rating: '4.9',
    reviewCount: 842,
    description:
      'Precision-molded roof sunshade that blocks 99% of UV rays and keeps the cabin cool. Installs in minutes with no tools, fits flush against the glass roof with zero gaps.',
    fitTags: ['Model 3', 'Model Y'],
    reviews: [
      { quote: 'Cabin temp dropped noticeably within the first drive. Fits perfectly.', name: 'Daniela R.', model: 'Model Y owner' },
      { quote: 'Easy install, no residue, looks factory.', name: 'Marcus T.', model: 'Model 3 owner' },
    ],
    placeholderColor: '#4A3636',
    placeholderLabel: 'Solar Shield sunshade',
  },
  {
    id: 'p2',
    name: 'ProGuard Noise Reduction & Weatherproofing Kit',
    category: ProductCategory.Exterior,
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=500&q=80',
    price: 79.99,
    wasPrice: 179.99,
    badge: 'TOP RATED',
    fit: 'Model 3 & Model Y',
    rating: '4.8',
    reviewCount: 613,
    description:
      'OEM-grade rubber seals that cut wind and road noise while sealing out moisture and dust. A direct upgrade over stock seals with a noticeably quieter cabin.',
    fitTags: ['Model 3', 'Model Y'],
    reviews: [
      { quote: 'Rubber feels and works just like OEM seals — noticeably quieter.', name: 'Robert', model: 'Model 3 owner' },
    ],
    placeholderColor: '#39492B',
    placeholderLabel: 'ProGuard noise kit',
  },
  {
    id: 'p3',
    name: 'Aluminium Caliper Covers',
    category: ProductCategory.Wheels,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
    price: 149.99,
    wasPrice: 300.0,
    badge: 'BEST SELLER',
    fit: 'Model 3 & Model Y',
    rating: '4.9',
    reviewCount: 401,
    description:
      'Lightweight aluminium caliper covers that bolt directly over factory calipers — no brake removal needed. Powder-coated finish resists brake dust and corrosion.',
    fitTags: ['Model 3', 'Model Y'],
    reviews: [
      { quote: 'Transformed the look of the wheels, install took 20 minutes.', name: 'Geoff N.', model: 'Model Y owner' },
    ],
    placeholderColor: '#49402B',
    placeholderLabel: 'Caliper covers',
  },
  {
    id: 'p4',
    name: 'DashGlow 360° Vision System (BLIS)',
    category: ProductCategory.Exterior,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80',
    price: 149.99,
    wasPrice: 199.99,
    badge: 'NEW',
    fit: 'Model 3 & Model Y',
    rating: '4.7',
    reviewCount: 219,
    description:
      'Blind-spot indicator system with subtle LED dash alerts. Plug-and-play install with no wiring cuts, integrates with factory sensors.',
    fitTags: ['Model 3', 'Model Y'],
    reviews: [
      { quote: 'Great peace of mind in traffic, install was plug and play.', name: 'Mark H.', model: 'Model Y owner' },
    ],
    placeholderColor: '#2B3A49',
    placeholderLabel: 'DashGlow BLIS',
  },
  {
    id: 'p5',
    name: 'All-Weather Floor Mat Set',
    category: ProductCategory.Interior,
    price: 89.0,
    fit: 'Model 3 & Model Y',
    rating: '4.8',
    reviewCount: 355,
    description:
      'Custom-molded all-weather floor mats that trap water, mud, and debris. Raised edges and a textured surface keep footing secure.',
    fitTags: ['Model 3', 'Model Y'],
    reviews: [
      { quote: 'Floor mats fit perfectly and installation took minutes.', name: 'Mark H.', model: 'Model Y owner' },
    ],
    placeholderColor: '#4A3636',
    placeholderLabel: 'Floor mat set',
  },
  {
    id: 'p6',
    name: 'Dual Wireless Charging Pad',
    category: ProductCategory.Charging,
    price: 59.0,
    wasPrice: 79.0,
    fit: 'Model 3 & Model Y',
    rating: '4.6',
    reviewCount: 188,
    description:
      'Fits the factory center console cubby with dual 15W charging zones for driver and passenger phones simultaneously.',
    fitTags: ['Model 3', 'Model Y'],
    reviews: [
      { quote: 'Charges both phones fast and looks completely factory.', name: 'Priya S.', model: 'Model Y owner' },
    ],
    placeholderColor: '#2B3A49',
    placeholderLabel: 'Wireless charger',
  },
];

export const CITIES = [
  { value: 'baku', label: 'Bakı' },
  { value: 'ganja', label: 'Gəncə' },
  { value: 'sumgait', label: 'Sumqayıt' },
  { value: 'mingachevir', label: 'Mingəçevir' },
  { value: 'other', label: 'Digər' },
];

export const REGIONS = ['Yasamal', 'Nərimanov', 'Nizami', 'Xətai', 'Səbail', 'Binəqədi', 'Nəsimi', 'Qaradağ'];

export const WHATSAPP_PHONE = '994102344071';
