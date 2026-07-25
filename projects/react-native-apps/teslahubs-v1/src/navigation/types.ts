import type { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '../data/products';

export type ProductBrowseParamList = {
  ProductList: { category: Product['category'] | null };
  ProductDetail: { productId: string };
};

export type HomeStackParamList = ProductBrowseParamList & {
  Home: undefined;
  Search: undefined;
};

export type CategoriesStackParamList = ProductBrowseParamList & {
  Categories: undefined;
};

export type WishlistStackParamList = {
  Wishlist: undefined;
  ProductDetail: { productId: string };
};

export type ArticlesStackParamList = {
  Articles: undefined;
  ArticleDetail: { articleId: string };
};

export type CarWashStackParamList = {
  CarWash: undefined;
  CarWashProvider: { providerId: string };
  CarWashBooking: { providerId: string; branchId: string };
};

export type TeslaServiceStackParamList = {
  TeslaService: undefined;
  TeslaServiceRequest: { serviceId?: string };
};

export type ChargingStationsStackParamList = {
  ChargingStations: undefined;
  ChargingStationDetail: { stationId: string };
};

// The full shopping experience (browsing, cart, wishlist) — presented as its
// own section from the root, the same way CarWash/TeslaService are, so it
// reads as a distinct part of the app. This is exactly the previous
// MainTabParamList's Home/Categories/Wishlist/Cart tabs, unchanged, just
// hosted one level deeper.
export type ShoppingTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Categories: NavigatorScreenParams<CategoriesStackParamList> | undefined;
  Wishlist: NavigatorScreenParams<WishlistStackParamList> | undefined;
  Cart: undefined;
};

export type MainTabParamList = {
  // Not product-browsing content itself — a lobby listing the app's
  // sections (Shopping, Charging Stations, AvtoYuma, Tesla Service) as
  // equal peer entries (see LobbyScreen).
  Home: undefined;
  Articles: NavigatorScreenParams<ArticlesStackParamList> | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Shopping: NavigatorScreenParams<ShoppingTabParamList> | undefined;
  ChargingStations: NavigatorScreenParams<ChargingStationsStackParamList> | undefined;
  CarWash: NavigatorScreenParams<CarWashStackParamList> | undefined;
  TeslaService: NavigatorScreenParams<TeslaServiceStackParamList> | undefined;
  OrderConfirm: {
    firstName: string;
    fullName: string;
    phone: string;
    itemCount: number;
    deliveryTime: string;
    total: string;
  };
};
