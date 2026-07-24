import { Product } from '../data/products';

export type RootStackParamList = {
  Home: undefined;
  ProductList: { category: Product['category'] | null };
  ProductDetail: { productId: string };
  Cart: undefined;
  OrderConfirm: {
    firstName: string;
    fullName: string;
    phone: string;
    itemCount: number;
    deliveryTime: string;
    total: string;
  };
};
