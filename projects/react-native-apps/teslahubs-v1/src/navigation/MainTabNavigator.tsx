import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import LobbyScreen from '../screens/LobbyScreen';
import ArticlesStackNavigator from './ArticlesStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: '⌂',
  Articles: '▤',
  Profile: '👤',
};

const LABEL_KEYS: Record<keyof MainTabParamList, string> = {
  Home: 'tabs.home',
  Articles: 'tabs.articles',
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
            <TabIcon
              routeName={routeName}
              color={color}
              size={size}
              count={routeName === 'Home' ? cartCount : undefined}
              brand={colors.brand}
              white={colors.white}
            />
          ),
        };
      }}>
      <Tab.Screen name="Home" component={LobbyScreen} />
      <Tab.Screen name="Articles" component={ArticlesStackNavigator} />
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
