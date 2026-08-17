import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChargingStationsStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import ChargingStationsScreen from '../screens/ChargingStationsScreen';
import ChargingStationDetailScreen from '../screens/ChargingStationDetailScreen';

const Stack = createNativeStackNavigator<ChargingStationsStackParamList>();

export default function ChargingStationsStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="ChargingStations" component={ChargingStationsScreen} />
      <Stack.Screen name="ChargingStationDetail" component={ChargingStationDetailScreen} />
    </Stack.Navigator>
  );
}
