import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RestaurantsStackParamList } from './types';
import RestaurantsScreen from '../screens/RestaurantsScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';

const Stack = createNativeStackNavigator<RestaurantsStackParamList>();

// Own fixed brand palette (see RS_THEME) — same "feels like a separate app"
// treatment as AvtoYuma/Tesla Service/Auto Services/Doctors.
export default function RestaurantsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
      <Stack.Screen name="RestaurantList" component={RestaurantListScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    </Stack.Navigator>
  );
}
