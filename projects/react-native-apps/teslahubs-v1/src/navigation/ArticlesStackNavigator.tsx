import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ArticlesStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';
import ArticlesScreen from '../screens/ArticlesScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';

const Stack = createNativeStackNavigator<ArticlesStackParamList>();

export default function ArticlesStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Articles" component={ArticlesScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    </Stack.Navigator>
  );
}
