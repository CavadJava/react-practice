import React, { useMemo } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import MainTabNavigator from './MainTabNavigator';
import ShoppingTabNavigator from './ShoppingTabNavigator';
import CarWashStackNavigator from './CarWashStackNavigator';
import TeslaServiceStackNavigator from './TeslaServiceStackNavigator';
import OrderConfirmScreen from '../screens/OrderConfirmScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.divider, primary: colors.brand },
    }),
    [colors],
  );

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Shopping" component={ShoppingTabNavigator} />
        <Stack.Screen name="CarWash" component={CarWashStackNavigator} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="TeslaService" component={TeslaServiceStackNavigator} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
