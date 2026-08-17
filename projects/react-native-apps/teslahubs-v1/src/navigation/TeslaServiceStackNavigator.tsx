import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TeslaServiceStackParamList } from './types';
import TeslaServiceScreen from '../screens/TeslaServiceScreen';
import TeslaServiceRequestScreen from '../screens/TeslaServiceRequestScreen';

const Stack = createNativeStackNavigator<TeslaServiceStackParamList>();

// Own fixed brand palette (see TS_THEME), presented as a fullScreenModal from
// the root — same "feels like a separate app" treatment as AvtoYuma.
export default function TeslaServiceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeslaService" component={TeslaServiceScreen} />
      <Stack.Screen name="TeslaServiceRequest" component={TeslaServiceRequestScreen} />
    </Stack.Navigator>
  );
}
