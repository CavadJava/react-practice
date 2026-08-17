import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CargoStackParamList } from './types';
import CargoScreen from '../screens/CargoScreen';


const Stack = createNativeStackNavigator<CargoStackParamList>();

// Own fixed brand palette (see CG_THEME) — same "feels like a separate app"
// treatment as AvtoYuma/Tesla Service/Auto Services/Doctors/Restaurants.
export default function CargoStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Cargo" component={CargoScreen} />
    </Stack.Navigator>
  );
}
