import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { WishlistStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import WishlistScreen from '../screens/WishlistScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';

const Stack = createNativeStackNavigator<WishlistStackParamList>();

export default function WishlistStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
