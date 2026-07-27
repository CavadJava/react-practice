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
import { WishlistProvider } from './src/context/WishlistContext';
import { MyPlacesProvider } from './src/context/MyPlacesContext';
import { RestaurantFavoritesProvider } from './src/context/RestaurantFavoritesContext';
import { CoursesProgressProvider } from './src/context/CoursesProgressContext';
import { CarWashBookingProvider } from './src/context/CarWashBookingContext';
import { CargoAccountsProvider } from './src/context/CargoAccountsContext';
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
              <WishlistProvider>
                <MyPlacesProvider>
                  <RestaurantFavoritesProvider>
                    <CoursesProgressProvider>
                      <CarWashBookingProvider>
                        <CargoAccountsProvider>
                          <RootNavigator />
                        </CargoAccountsProvider>
                      </CarWashBookingProvider>
                    </CoursesProgressProvider>
                  </RestaurantFavoritesProvider>
                </MyPlacesProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
