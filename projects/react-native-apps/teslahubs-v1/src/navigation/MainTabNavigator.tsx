import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import ChargingStationsStackNavigator from './ChargingStationsStackNavigator';
import ServicesStackNavigator from './ServicesStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Map: '🗺️',
  Home: '🛍️',
  Services: '🛠️',
  Profile: '👤',
};

const LABEL_KEYS: Record<keyof MainTabParamList, string> = {
  Map: 'tabs.map',
  Home: 'shopping.entryTitle',
  Services: 'tabs.services',
  Profile: 'tabs.profile',
};

type TabIconProps = { routeName: keyof MainTabParamList; color: string; size: number };

function TabIcon({ routeName, color, size }: TabIconProps) {
  return <Text style={{ fontSize: size, color }}>{ICONS[routeName]}</Text>;
}

// Never actually rendered — tapping the "Home" tab is intercepted by the
// tabPress listener below, which opens the root-level "Shopping" section
// instead of switching to this tab. Kept only because Tab.Screen requires
// a component.
function ShoppingPlaceholder() {
  const { colors } = useTheme();
  return <View style={[styles.redirectPlaceholder, { backgroundColor: colors.bg }]} />;
}

export default function MainTabNavigator() {
  const { colors } = useTheme();
  const { t } = useLocale();

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => {
        const routeName = route.name as keyof MainTabParamList;
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textFaded,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.divider },
          tabBarLabel: t(LABEL_KEYS[routeName]),
          tabBarIcon: ({ color, size }) => <TabIcon routeName={routeName} color={color} size={size} />,
        };
      }}>
      <Tab.Screen name="Map" component={ChargingStationsStackNavigator} />
      <Tab.Screen
        name="Home"
        component={ShoppingPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Only a real tap should open Shopping — using focus (instead of
            // tabPress) here would re-fire every time this tab regains focus,
            // including right after the user backs out of Shopping, making
            // it impossible to ever leave.
            e.preventDefault();
            navigation.getParent()?.navigate('Shopping');
          },
        })}
      />
      <Tab.Screen name="Services" component={ServicesStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  redirectPlaceholder: { flex: 1 },
});
