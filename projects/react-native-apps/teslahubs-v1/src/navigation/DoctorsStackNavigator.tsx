import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DoctorsStackParamList } from './types';
import DoctorsScreen from '../screens/DoctorsScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';

const Stack = createNativeStackNavigator<DoctorsStackParamList>();

// Own fixed brand palette (see DR_THEME) — same "feels like a separate app"
// treatment as AvtoYuma/Tesla Service/Auto Services.
export default function DoctorsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Doctors" component={DoctorsScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
    </Stack.Navigator>
  );
}
