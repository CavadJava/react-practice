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

export type AutoServicesStackParamList = {
  AutoServices: undefined;
  AutoServiceProvider: { providerId: string };
};

export type DoctorsStackParamList = {
  Doctors: undefined;
  DoctorDetail: { doctorId: string };
};

// The "Xidmətlər" (Services) tab: a grid landing screen (AvtoYuma/Tesla
// Service/Articles) with Articles' own screens pushed inline in the same
// stack — AvtoYuma/Tesla Service still open as their own root-level modals.
export type ServicesStackParamList = ArticlesStackParamList & {
  ServicesGrid: undefined;
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
  // The Charging Stations map, hosted directly (not a modal) so it's the
  // app's default, always-visible landing tab.
  Map: NavigatorScreenParams<ChargingStationsStackParamList> | undefined;
  // Not a real screen — focusing this tab immediately opens the root-level
  // "Shopping" section (see ShoppingRedirect in MainTabNavigator).
  Home: undefined;
  Services: NavigatorScreenParams<ServicesStackParamList> | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Shopping: NavigatorScreenParams<ShoppingTabParamList> | undefined;
  CarWash: NavigatorScreenParams<CarWashStackParamList> | undefined;
  TeslaService: NavigatorScreenParams<TeslaServiceStackParamList> | undefined;
  AutoServices: NavigatorScreenParams<AutoServicesStackParamList> | undefined;
  Doctors: NavigatorScreenParams<DoctorsStackParamList> | undefined;
  MyPlaces: undefined;
  OrderConfirm: {
    firstName: string;
    fullName: string;
    phone: string;
    itemCount: number;
    deliveryTime: string;
    total: string;
  };
};
