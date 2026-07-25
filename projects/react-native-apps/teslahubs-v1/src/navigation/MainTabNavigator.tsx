import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: '⌂',
  Categories: '▦',
  Wishlist: '♡',
  Cart: '🛒',
  Profile: '👤',
};

const LABEL_KEYS: Record<keyof MainTabParamList, string> = {
  Home: 'tabs.home',
  Categories: 'tabs.categories',
  Wishlist: 'tabs.wishlist',
  Cart: 'tabs.cart',
  Profile: 'tabs.profile',
};

type TabIconProps = { routeName: keyof MainTabParamList; color: string; size: number; count?: number; brand: string; white: string };

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

export default function MainTabNavigator() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { cartCount } = useCart();
  const { wishlistIds } = useWishlist();

  const badgeCounts: Partial<Record<keyof MainTabParamList, number>> = useMemo(
    () => ({ Cart: cartCount, Wishlist: wishlistIds.length }),
    [cartCount, wishlistIds.length],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = route.name as keyof MainTabParamList;
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
