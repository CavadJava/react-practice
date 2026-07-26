import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AutoServicesStackParamList } from './types';
import AutoServicesScreen from '../screens/AutoServicesScreen';
import AutoServiceProviderScreen from '../screens/AutoServiceProviderScreen';

const Stack = createNativeStackNavigator<AutoServicesStackParamList>();

// Own fixed brand palette (see AS_THEME) — same "feels like a separate app"
// treatment as AvtoYuma/Tesla Service.
export default function AutoServicesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AutoServices" component={AutoServicesScreen} />
      <Stack.Screen name="AutoServiceProvider" component={AutoServiceProviderScreen} />
    </Stack.Navigator>
  );
}
