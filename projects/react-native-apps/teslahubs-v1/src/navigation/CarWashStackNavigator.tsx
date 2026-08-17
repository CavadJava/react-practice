import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CarWashStackParamList } from './types';
import CarWashScreen from '../screens/CarWashScreen';
import CarWashProviderScreen from '../screens/CarWashProviderScreen';
import CarWashBookingScreen from '../screens/CarWashBookingScreen';

const Stack = createNativeStackNavigator<CarWashStackParamList>();

// Deliberately does not read app ThemeContext colors: AvtoYuma is styled with
// its own fixed brand palette (see screens) so entering it feels like
// stepping into a separate app, even though it's the same bundle/build.
export default function CarWashStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarWash" component={CarWashScreen} />
      <Stack.Screen name="CarWashProvider" component={CarWashProviderScreen} />
      <Stack.Screen name="CarWashBooking" component={CarWashBookingScreen} />
    </Stack.Navigator>
  );
}
