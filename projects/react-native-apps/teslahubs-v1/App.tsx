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
import { CurrencyProvider } from './src/context/CurrencyContext';
import RootNavigator from './src/navigation/RootNavigator';
import AppStatusBar from './src/components/AppStatusBar';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <CurrencyProvider>
            <AppStatusBar />
            <CartProvider>
              <RootNavigator />
            </CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
