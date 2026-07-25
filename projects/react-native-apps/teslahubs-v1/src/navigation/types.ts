import type { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '../data/products';

export type ProductBrowseParamList = {
  ProductList: { category: Product['category'] | null };
  ProductDetail: { productId: string };
};

export type HomeStackParamList = ProductBrowseParamList & {
  Home: undefined;
  Search: undefined;
  ChargingStations: undefined;
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

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Categories: NavigatorScreenParams<CategoriesStackParamList> | undefined;
  Wishlist: NavigatorScreenParams<WishlistStackParamList> | undefined;
  Articles: NavigatorScreenParams<ArticlesStackParamList> | undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CarWash: NavigatorScreenParams<CarWashStackParamList> | undefined;
  OrderConfirm: {
    firstName: string;
    fullName: string;
    phone: string;
    itemCount: number;
    deliveryTime: string;
    total: string;
  };
};
