import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CoursesStackParamList } from './types';
import CoursesScreen from '../screens/CoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LessonScreen from '../screens/LessonScreen';

const Stack = createNativeStackNavigator<CoursesStackParamList>();

// Own fixed brand palette (see CO_THEME) — same "feels like a separate app"
// treatment as AvtoYuma/Tesla Service/Auto Services/Doctors/Restaurants.
export default function CoursesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}
