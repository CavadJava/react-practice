import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ShoppingTabParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import HomeStackNavigator from './HomeStackNavigator';
import CategoriesStackNavigator from './CategoriesStackNavigator';
import WishlistStackNavigator from './WishlistStackNavigator';
import CartScreen from '../screens/CartScreen';

const Tab = createBottomTabNavigator<ShoppingTabParamList>();

const ICONS: Record<keyof ShoppingTabParamList, string> = {
  Home: '⌂',
  Categories: '▦',
  Wishlist: '♡',
  Cart: '🛒',
};

const LABEL_KEYS: Record<keyof ShoppingTabParamList, string> = {
  Home: 'tabs.home',
  Categories: 'tabs.categories',
  Wishlist: 'tabs.wishlist',
  Cart: 'tabs.cart',
};

type TabIconProps = { routeName: keyof ShoppingTabParamList; color: string; size: number; count?: number; brand: string; white: string };

function TabIcon({ routeName, color, size, count, brand, white }: TabIconProps) {
  return (
    <View>
      <Text style={{ fontSize: size, color }}>{ICONS[routeName]}</Text>
      {!!count && (
        <View style={[styles.badge, { backgroundColor: brand }]}>
          <Text style={[styles.badgeText, { color: white }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// The inner tab bar for the Shopping section — Home/Categories/Wishlist/Cart,
// identical to what used to be the app's main tab bar before those four
// moved off the persistent outer tabs and into this dedicated section.
export default function ShoppingTabNavigator() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { cartCount } = useCart();
  const { wishlistIds } = useWishlist();

  const badgeCounts: Partial<Record<keyof ShoppingTabParamList, number>> = useMemo(
    () => ({ Cart: cartCount, Wishlist: wishlistIds.length }),
    [cartCount, wishlistIds.length],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = route.name as keyof ShoppingTabParamList;
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textFaded,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.divider },
          tabBarLabel: t(LABEL_KEYS[routeName]),
          tabBarIcon: ({ color, size }) => (
            <TabIcon routeName={routeName} color={color} size={size} count={badgeCounts[routeName]} brand={colors.brand} white={colors.white} />
          ),
        };
      }}>
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Categories" component={CategoriesStackNavigator} />
      <Tab.Screen name="Wishlist" component={WishlistStackNavigator} />
      <Tab.Screen name="Cart" component={CartScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 999,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800' },
});
