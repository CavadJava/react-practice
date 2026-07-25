export type Review = { quote: string; name: string; model: string };

export enum ProductCategory {
  Interior = 'interior',
  Exterior = 'exterior',
  Wheels = 'wheels',
  Charging = 'charging',
  Other = 'other',
}

/**
 * Curated product groupings shown as Home sections (e.g. "Best Sellers").
 * Mirrors a `collections` + `collection_products` join table: each key here
 * is a `collections.slug`, and a product's `collections` array is the set of
 * join rows for that product. Membership order within a collection follows
 * each product's position in `PRODUCTS` (stands in for `sort_order`).
 */
export enum CollectionKey {
  BestSellers = 'best-sellers',
  Recommended = 'recommended',
  PreviouslyViewed = 'previously-viewed',
}

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  /** Selling store's display name. Every product belongs to exactly one store; the app currently has a single store, but this is what future multi-store support will key off of. */
  store: string;
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
  /** Optional gallery of photo URLs, for products with more than one real photo. */
  images?: string[];
  /** Collections (Home sections) this product belongs to. See `CollectionKey`. */
  collections?: CollectionKey[];
};

export const CATEGORIES: { key: ProductCategory; name: string; color: string }[] = [
  { key: ProductCategory.Interior, name: 'Interior', color: '#4A3636' },
  { key: ProductCategory.Exterior, name: 'Exterior', color: '#39492B' },
  { key: ProductCategory.Charging, name: 'Charging', color: '#2B3A49' },
  { key: ProductCategory.Wheels, name: 'Wheels', color: '#49402B' },
  { key: ProductCategory.Other, name: 'Other', color: '#333333' },
];

// Sourced from the sibling project's live product catalog (projects/teslahubsss.com/react-public-shopping-side).
export const CATEGORY_DEFAULT_IMAGE: Record<ProductCategory, string> = {
  [ProductCategory.Interior]: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
  [ProductCategory.Exterior]: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500&q=80',
  [ProductCategory.Wheels]: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
  [ProductCategory.Charging]: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&q=80',
  [ProductCategory.Other]: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80',
};

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80';

export function getProductImage(product: Product): string {
  return product.image ?? CATEGORY_DEFAULT_IMAGE[product.category] ?? DEFAULT_PRODUCT_IMAGE;
}

export function getProductImages(product: Product): string[] {
  return product.images && product.images.length > 0 ? product.images : [getProductImage(product)];
}

export const PRODUCTS: Product[] = [
  {
  id: 'p1',
  name: 'Solar Shield® Roof Sunshade Pro Kit',
  category: ProductCategory.Interior,
  store: 'Teslahubs',
  image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80',
  images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80'],
  price: 139.99,
  wasPrice: 185.0,
  badge: 'BEST SELLER',
  collections: [CollectionKey.BestSellers],
  fit: 'Model 3 & Model Y',
  rating: '4.9',
  reviewCount: 842,
  description: 'Precision-molded roof sunshade that blocks 99% of UV rays and keeps the cabin cool. Installs in minutes with no tools, fits flush against the glass roof with zero gaps.',
  fitTags: [
    'Model 3',
    'Model Y'
  ],
  reviews: [
    {
      quote: 'Cabin temp dropped noticeably within the first drive. Fits perfectly.',
      name: 'Daniela R.',
      model: 'Model Y owner'
    },
    {
      quote: 'Easy install, no residue, looks factory.',
      name: 'Marcus T.',
      model: 'Model 3 owner'
    },
    
  ],
  placeholderColor: '#4A3636',
  placeholderLabel: 'Solar Shield sunshade',
  
},
{
  id: 'p2',
  name: 'ProGuard Noise Reduction & Weatherproofing Kit',
  category: ProductCategory.Exterior,
  store: 'Teslahubs',
  image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=500&q=80',
  images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=500&q=80'],
  price: 79.99,
  wasPrice: 179.99,
  badge: 'TOP RATED',
  collections: [CollectionKey.BestSellers],
  fit: 'Model 3 & Model Y',
  rating: '4.8',
  reviewCount: 613,
  description: 'OEM-grade rubber seals that cut wind and road noise while sealing out moisture and dust. A direct upgrade over stock seals with a noticeably quieter cabin.',
  fitTags: [
    'Model 3',
    'Model Y'
  ],
  reviews: [
    {
      quote: 'Rubber feels and works just like OEM seals — noticeably quieter.',
      name: 'Robert',
      model: 'Model 3 owner'
    },
    
  ],
  placeholderColor: '#39492B',
  placeholderLabel: 'ProGuard noise kit',
  
},
{
  id: 'p3',
  name: 'Aluminium Caliper Covers',
  category: ProductCategory.Wheels,
  store: 'Teslahubs',
  image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
  images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80'],
  price: 149.99,
  wasPrice: 300.0,
  badge: 'BEST SELLER',
  collections: [CollectionKey.BestSellers],
  fit: 'Model 3 & Model Y',
  rating: '4.9',
  reviewCount: 401,
  description: 'Lightweight aluminium caliper covers that bolt directly over factory calipers — no brake removal needed. Powder-coated finish resists brake dust and corrosion.',
  fitTags: [
    'Model 3',
    'Model Y'
  ],
  reviews: [
    {
      quote: 'Transformed the look of the wheels, install took 20 minutes.',
      name: 'Geoff N.',
      model: 'Model Y owner'
    },
    
  ],
  placeholderColor: '#49402B',
  placeholderLabel: 'Caliper covers',
  
},
{
  id: 'p4',
  name: 'DashGlow 360° Vision System (BLIS)',
  category: ProductCategory.Exterior,
  store: 'Teslahubs',
  image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80',
  images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80'],
  price: 149.99,
  wasPrice: 199.99,
  badge: 'NEW',
  collections: [CollectionKey.BestSellers],
  fit: 'Model 3 & Model Y',
  rating: '4.7',
  reviewCount: 219,
  description: 'Blind-spot indicator system with subtle LED dash alerts. Plug-and-play install with no wiring cuts, integrates with factory sensors.',
  fitTags: [
    'Model 3',
    'Model Y'
  ],
  reviews: [
    {
      quote: 'Great peace of mind in traffic, install was plug and play.',
      name: 'Mark H.',
      model: 'Model Y owner'
    },
    
  ],
  placeholderColor: '#2B3A49',
  placeholderLabel: 'DashGlow BLIS',
  
},
{
  id: 'p5',
  name: 'All-Weather Floor Mat Set',
  category: ProductCategory.Interior,
  store: 'Teslahubs',
  price: 89.0,
  fit: 'Model 3 & Model Y',
  rating: '4.8',
  reviewCount: 355,
  description: 'Custom-molded all-weather floor mats that trap water, mud, and debris. Raised edges and a textured surface keep footing secure.',
  fitTags: [
    'Model 3',
    'Model Y'
  ],
  reviews: [
    {
      quote: 'Floor mats fit perfectly and installation took minutes.',
      name: 'Mark H.',
      model: 'Model Y owner'
    },
    
  ],
  placeholderColor: '#4A3636',
  placeholderLabel: 'Floor mat set',
  
},
{
  id: 'p6',
  name: 'Dual Wireless Charging Pad',
  category: ProductCategory.Charging,
  store: 'Teslahubs',
  price: 59.0,
  wasPrice: 79.0,
  collections: [CollectionKey.Recommended],
  fit: 'Model 3 & Model Y',
  rating: '4.6',
  reviewCount: 188,
  description: 'Fits the factory center console cubby with dual 15W charging zones for driver and passenger phones simultaneously.',
  fitTags: [
    'Model 3',
    'Model Y'
  ],
  reviews: [
    {
      quote: 'Charges both phones fast and looks completely factory.',
      name: 'Priya S.',
      model: 'Model Y owner'
    },
    
  ],
  placeholderColor: '#2B3A49',
  placeholderLabel: 'Wireless charger',
  
},
{
  id: 'p7',
  name: 'Tesla Wall Connector Gen 2',
  category: ProductCategory.Charging,
  store: 'Teslahubs',
  image: 'https://i.ebayimg.com/images/g/T-cAAOSw7KZnUKSN/s-l400.jpg',
  images: ['https://i.ebayimg.com/images/g/T-cAAOSw7KZnUKSN/s-l400.jpg'],
  price: 299.99,
  wasPrice: 349.99,
  badge: 'BEST SELLER',
  fit: 'Model 3, Model Y, Model S & Model X',
  rating: '4.9',
  reviewCount: 512,
  description: 'Original Tesla Wall Connector Gen 2 for fast, safe and reliable home charging. Easy wall installation and durable design.',
  fitTags: [
    'Model 3',
    'Model Y',
    'Model S',
    'Model X'
  ],
  reviews: [
    {
      quote: 'Fast charging and premium quality.',
      name: 'Elvin A.',
      model: 'Model Y owner',
      
    },
    
  ],
  placeholderColor: '#2B3A49',
  placeholderLabel: 'Tesla Wall Connector',
  
},
{
  id: 'p8',
  name: 'CCS2 + Type 2 to NACS Fast Charging Adapter',
  category: ProductCategory.Charging,
  store: 'Teslahubs',
  image: 'https://s.alicdn.com/@sc04/kf/H26db433949144feeac32dd62529efcd43.jpg',
  images: ['https://s.alicdn.com/@sc04/kf/H26db433949144feeac32dd62529efcd43.jpg'],
  price: 189.99,
  wasPrice: 229.99,
  badge: 'NEW',
  fit: 'Tesla NACS',
  rating: '4.8',
  reviewCount: 138,
  description: 'Premium CCS2 and Type 2 to NACS adapter supporting high-speed DC and AC charging at compatible public charging stations.',
  fitTags: [
    'Model 3',
    'Model Y',
    'Model S',
    'Model X'
  ],
  reviews: [
    {
      quote: 'Works perfectly with fast chargers.',
      name: 'Kamran R.',
      model: 'Model 3 owner',
      
    },
    
  ],
  placeholderColor: '#2B3A49',
  placeholderLabel: 'NACS Adapter',
  
},
{
  id: 'p9',
  name: 'Tesla NFC Key Card',
  category: ProductCategory.Charging,
  store: 'Teslahubs',
  image: 'https://www.slashgear.com/img/gallery/the-20-dollar-device-that-can-break-into-a-tesla/intro-1659390855.jpg',
  images: ['https://www.slashgear.com/img/gallery/the-20-dollar-device-that-can-break-into-a-tesla/intro-1659390855.jpg'],
  price: 24.99,
  collections: [CollectionKey.PreviouslyViewed],
  fit: 'All Tesla Models',
  rating: '4.9',
  reviewCount: 324,
  description: 'Original Tesla NFC key card for secure vehicle access. Perfect as a spare or replacement card.',
  fitTags: [
    'Model 3',
    'Model Y',
    'Model S',
    'Model X'
  ],
  reviews: [
    {
      quote: 'Always keep one in my wallet.',
      name: 'Orxan M.',
      model: 'Model Y owner',
      
    },
    
  ],
  placeholderColor: '#2B3A49',
  placeholderLabel: 'Tesla NFC Card',
  
},
{
  id: 'p10',
  name: 'USB Flash Drive 128GB',
  category: ProductCategory.Charging,
  store: 'Teslahubs',
  image: 'https://teslaemblems.com/cdn/shop/files/1995188-10-A-01.jpg?v=1763448706',
  images: ['https://teslaemblems.com/cdn/shop/files/1995188-10-A-01.jpg?v=1763448706','https://teslaemblems.com/cdn/shop/files/1995188-10-A-01.jpg?v=1763448706'],
  price: 34.99,
  wasPrice: 49.99,
  fit: 'Tesla Dashcam & Sentry Mode',
  rating: '4.8',
  reviewCount: 267,
  description: '128GB high-speed USB flash drive designed for Tesla Dashcam and Sentry Mode video recording.',
  fitTags: [
    'Model 3',
    'Model Y',
    'Model S',
    'Model X'
  ],
  reviews: [
    {
      quote: 'Reliable recording with plenty of storage.',
      name: 'Murad A.',
      model: 'Model 3 owner',
      
    },
    
  ],
  placeholderColor: '#2B3A49',
  placeholderLabel: 'USB 128GB',
  
},

];

/**
 * Products belonging to a given collection, in catalog order.
 * `Recommended`/`PreviouslyViewed` are hand-picked mock membership until a
 * real recommendation/view-history engine assigns these keys dynamically;
 * an empty result is expected and is how the calling screen knows to hide
 * that section, not an error state.
 */
export function getProductsByCollection(key: CollectionKey): Product[] {
  return PRODUCTS.filter(p => p.collections?.includes(key));
}

export const CITIES = [
  { value: 'baku', label: 'Bakı' },
  { value: 'ganja', label: 'Gəncə' },
  { value: 'sumgait', label: 'Sumqayıt' },
  { value: 'mingachevir', label: 'Mingəçevir' },
  { value: 'other', label: 'Digər' },
];

export const REGIONS = ['Yasamal', 'Nərimanov', 'Nizami', 'Xətai', 'Səbail', 'Binəqədi', 'Nəsimi', 'Qaradağ'];

export const WHATSAPP_PHONE = '994102344071';
