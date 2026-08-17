export type FoodCategory = 'pizza' | 'doner' | 'sushi' | 'kebab';

export const FOOD_CATEGORIES: { key: FoodCategory; label: string; icon: string }[] = [
  { key: 'pizza', label: 'Pizza', icon: '🍕' },
  { key: 'doner', label: 'Döner', icon: '🌯' },
  { key: 'sushi', label: 'Suşi', icon: '🍣' },
  { key: 'kebab', label: 'Kabab', icon: '🍢' },
];

export function getCategoryLabel(key: FoodCategory): string {
  return FOOD_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

export type DishAddOnCategory = 'salad' | 'drink' | 'sauce' | 'dessert';

export const DISH_ADDON_CATEGORIES: { key: DishAddOnCategory; label: string; icon: string }[] = [
  { key: 'salad', label: 'Salatlar', icon: '🥗' },
  { key: 'drink', label: 'İçkilər', icon: '🥤' },
  { key: 'sauce', label: 'Souslar', icon: '🥫' },
  { key: 'dessert', label: 'Şirniyyat', icon: '🍰' },
];

export function getAddOnCategoryLabel(key: DishAddOnCategory): string {
  return DISH_ADDON_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

// A "child product" — an optional add-on attached to a parent dish (salad,
// drink, sauce, dessert). Shared catalog referenced by id from each dish's
// addOnIds, mirroring the AUTO_SERVICE_OPTIONS/serviceOptionIds pattern used
// in the Auto Services module.
export type DishAddOn = {
  id: string;
  name: string;
  category: DishAddOnCategory;
  photo: string;
  price: number;
};

export const DISH_ADDONS: DishAddOn[] = [
  {
    id: 'caesar-salad',
    name: 'Sezar salatı',
    category: 'salad',
    photo: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80',
    price: 6,
  },
  {
    id: 'greek-salad',
    name: 'Yunan salatı',
    category: 'salad',
    photo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    price: 5.5,
  },
  {
    id: 'coleslaw',
    name: 'Kələm salatı',
    category: 'salad',
    photo: 'https://images.unsplash.com/photo-1622206151226-18ca2c9d680b?w=400&q=80',
    price: 3,
  },
  {
    id: 'cola',
    name: 'Coca-Cola 0.5L',
    category: 'drink',
    photo: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80',
    price: 2.5,
  },
  {
    id: 'ayran',
    name: 'Ayran',
    category: 'drink',
    photo: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
    price: 2,
  },
  {
    id: 'fresh-juice',
    name: 'Təzə sıxılmış şirə',
    category: 'drink',
    photo: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
    price: 4,
  },
  {
    id: 'garlic-sauce',
    name: 'Sarımsaq sousu',
    category: 'sauce',
    photo: 'https://images.unsplash.com/photo-1626200926749-27a68f5b1044?w=400&q=80',
    price: 1.5,
  },
  {
    id: 'spicy-sauce',
    name: 'Acı sous',
    category: 'sauce',
    photo: 'https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=400&q=80',
    price: 1.5,
  },
  {
    id: 'soy-sauce',
    name: 'Soya sousu',
    category: 'sauce',
    photo: 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=400&q=80',
    price: 1,
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    category: 'dessert',
    photo: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80',
    price: 7,
  },
  {
    id: 'baklava',
    name: 'Paxlava',
    category: 'dessert',
    photo: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80',
    price: 4.5,
  },
];

export function getDishAddOn(id: string): DishAddOn | undefined {
  return DISH_ADDONS.find(a => a.id === id);
}

export type Dish = {
  id: string;
  // Shared across restaurants that serve "the same" dish (e.g. every
  // restaurant's Pepperoni Pizza uses dishKey 'pepperoni-pizza') — this is
  // what lets us rank *the same dish* across different restaurants instead
  // of just ranking restaurants overall.
  dishKey: string;
  name: string;
  category: FoodCategory;
  photo: string;
  weight: string;
  composition: string;
  originalPrice: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  // "Child products" — optional salads/drinks/sauces/desserts the customer
  // can add alongside this dish.
  addOnIds?: string[];
};

export type Restaurant = {
  id: string;
  name: string;
  logo: string;
  coverPhoto: string;
  bannerPhoto: string;
  categories: FoodCategory[];
  rating: number;
  reviewCount: number;
  deliveryMinMinutes: number;
  deliveryMaxMinutes: number;
  deliveryFee: number;
  distanceKm: number;
  discountPercent?: number;
  orderCount: number;
  phone: string;
  address: string;
  dishes: Dish[];
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'papajohns',
    name: "Papa John's",
    logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80',
    bannerPhoto: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=900&q=80',
    categories: ['pizza'],
    rating: 4.6,
    reviewCount: 1820,
    deliveryMinMinutes: 30,
    deliveryMaxMinutes: 45,
    deliveryFee: 2.5,
    distanceKm: 1.8,
    discountPercent: 15,
    orderCount: 5400,
    phone: '+994 12 404 70 70',
    address: 'Bakı, Nərimanov rayonu, Atatürk pr. 12',
    dishes: [
      {
        id: 'pj-pepperoni',
        dishKey: 'pepperoni-pizza',
        name: 'Pepperoni Pizza',
        category: 'pizza',
        photo: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
        weight: '450 q',
        composition: 'Pomidor sousu, mozzarella, pepperoni kolbasası, oregano',
        originalPrice: 22,
        discountPrice: 18.5,
        rating: 4.6,
        reviewCount: 640,
        addOnIds: ['caesar-salad', 'coleslaw', 'cola', 'ayran'],
      },
      {
        id: 'pj-margherita',
        dishKey: 'margherita-pizza',
        name: 'Marqarita Pizza',
        category: 'pizza',
        photo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        weight: '420 q',
        composition: 'Pomidor sousu, mozzarella, təzə reyhan',
        originalPrice: 18,
        rating: 4.4,
        reviewCount: 310,
        addOnIds: ['greek-salad', 'cola', 'fresh-juice'],
      },
      {
        id: 'pj-bbq',
        dishKey: 'bbq-chicken-pizza',
        name: 'BBQ Toyuq Pizza',
        category: 'pizza',
        photo: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600&q=80',
        weight: '480 q',
        composition: 'BBQ sousu, toyuq döş əti, soğan, mozzarella',
        originalPrice: 24,
        discountPrice: 20,
        rating: 4.5,
        reviewCount: 275,
        addOnIds: ['coleslaw', 'cola', 'ayran', 'tiramisu'],
      },
    ],
  },
  {
    id: 'ejdahapizza',
    name: 'Ejdaha Pizza',
    logo: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=200&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1548365328-9f547fb0953b?w=900&q=80',
    bannerPhoto: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=900&q=80',
    categories: ['pizza', 'kebab', 'sushi'],
    rating: 4.8,
    reviewCount: 2460,
    deliveryMinMinutes: 25,
    deliveryMaxMinutes: 40,
    deliveryFee: 2,
    distanceKm: 0.9,
    orderCount: 8100,
    phone: '+994 12 404 80 80',
    address: 'Bakı, Yasamal rayonu, Şərifzadə küç. 24',
    dishes: [
      {
        id: 'ej-pepperoni',
        dishKey: 'pepperoni-pizza',
        name: 'Pepperoni Pizza',
        category: 'pizza',
        photo: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
        weight: '460 q',
        composition: 'Pomidor sousu, mozzarella, əlavə pepperoni, chili flakes',
        originalPrice: 21,
        discountPrice: 17,
        rating: 4.9,
        reviewCount: 780,
        addOnIds: ['caesar-salad', 'greek-salad', 'cola', 'fresh-juice', 'tiramisu'],
      },
      {
        id: 'ej-adana',
        dishKey: 'adana-kabab',
        name: 'Adana Kabab',
        category: 'kebab',
        photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
        weight: '350 q',
        composition: 'Qıyma quzu əti, acı bibər, ədviyyat, lavaş, közlənmiş tomat',
        originalPrice: 16,
        rating: 4.7,
        reviewCount: 420,
        addOnIds: ['coleslaw', 'ayran', 'spicy-sauce', 'baklava'],
      },
      {
        id: 'ej-california',
        dishKey: 'california-roll',
        name: 'California Roll',
        category: 'sushi',
        photo: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
        weight: '260 q',
        composition: 'Kraft çubuğu, avokado, xiyar, tobiko, düyü, nori',
        originalPrice: 14,
        discountPrice: 11.5,
        rating: 4.6,
        reviewCount: 190,
        addOnIds: ['soy-sauce', 'spicy-sauce', 'fresh-juice'],
      },
    ],
  },
  {
    id: 'qoceti',
    name: 'Qoçəti',
    logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=900&q=80',
    bannerPhoto: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&q=80',
    categories: ['kebab', 'doner', 'pizza'],
    rating: 4.5,
    reviewCount: 1340,
    deliveryMinMinutes: 35,
    deliveryMaxMinutes: 50,
    deliveryFee: 1.5,
    distanceKm: 3.2,
    discountPercent: 10,
    orderCount: 3200,
    phone: '+994 12 404 90 90',
    address: 'Bakı, Xətai rayonu, Zərifə Əliyeva küç. 5',
    dishes: [
      {
        id: 'qo-adana',
        dishKey: 'adana-kabab',
        name: 'Adana Kabab',
        category: 'kebab',
        photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
        weight: '380 q',
        composition: 'Qıyma mal əti, soğan, təzə göyərti, lavaş',
        originalPrice: 15,
        discountPrice: 13,
        rating: 4.4,
        reviewCount: 260,
        addOnIds: ['coleslaw', 'ayran', 'spicy-sauce'],
      },
      {
        id: 'qo-doner',
        dishKey: 'toyuq-doner',
        name: 'Toyuq Döner',
        category: 'doner',
        photo: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80',
        weight: '320 q',
        composition: 'Toyuq döş əti, təzə tərəvəz, sous, lavaş',
        originalPrice: 9,
        discountPrice: 7.5,
        rating: 4.6,
        reviewCount: 510,
        addOnIds: ['garlic-sauce', 'spicy-sauce', 'ayran', 'cola'],
      },
      {
        id: 'qo-pepperoni',
        dishKey: 'pepperoni-pizza',
        name: 'Pepperoni Pizza',
        category: 'pizza',
        photo: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
        weight: '430 q',
        composition: 'Pomidor sousu, mozzarella, pepperoni kolbasası',
        originalPrice: 19,
        rating: 4.2,
        reviewCount: 150,
        addOnIds: ['coleslaw', 'cola'],
      },
    ],
  },
];

export function getRestaurant(id: string): Restaurant | undefined {
  return RESTAURANTS.find(r => r.id === id);
}

export function getTopRatedRestaurants(limit = 10): Restaurant[] {
  return [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getDiscountedRestaurants(limit = 10): Restaurant[] {
  return RESTAURANTS.filter(r => (r.discountPercent ?? 0) > 0)
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, limit);
}

export function getNearbyRestaurants(limit = 10): Restaurant[] {
  return [...RESTAURANTS].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit);
}

export function getMostOrderedRestaurants(limit = 10): Restaurant[] {
  return [...RESTAURANTS].sort((a, b) => b.orderCount - a.orderCount).slice(0, limit);
}

export function getRestaurantsByCategory(category: FoodCategory): Restaurant[] {
  return RESTAURANTS.filter(r => r.categories.includes(category));
}

export type DishRanking = {
  restaurant: Restaurant;
  dish: Dish;
};

// The cross-restaurant "which place makes the best kabab/pizza" ranking —
// looks up every restaurant that serves a dish with this dishKey and sorts
// by that dish's own rating (not the restaurant's overall rating).
export function getDishRanking(dishKey: string): DishRanking[] {
  const results: DishRanking[] = [];
  for (const restaurant of RESTAURANTS) {
    const dish = restaurant.dishes.find(d => d.dishKey === dishKey);
    if (dish) results.push({ restaurant, dish });
  }
  return results.sort((a, b) => b.dish.rating - a.dish.rating);
}
