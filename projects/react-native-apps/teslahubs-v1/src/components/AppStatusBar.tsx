import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { THEMES } from '../theme/theme';

export default function AppStatusBar() {
  const { colors, themeKey } = useTheme();
  return <StatusBar barStyle={THEMES[themeKey].statusBarStyle} backgroundColor={colors.bg} />;
}
