/**
 * Teslahubs — React Native app
 * Ported from the Teslahubs mobile design.
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LocaleProvider } from './src/context/LocaleContext';
import RootNavigator from './src/navigation/RootNavigator';
import AppStatusBar from './src/components/AppStatusBar';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <AppStatusBar />
          <CartProvider>
            <RootNavigator />
          </CartProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
