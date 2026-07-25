# Teslahubs — React Native

A React Native port of the Teslahubs mobile app design (Tesla accessories e-commerce, Baku/Azerbaijan). Bare React Native CLI, TypeScript, no Expo.

## Screens

- **Home** — sale banner with live countdown, "Shop by Model", categories, best sellers grid
- **Product List** — category filter chips + product grid
- **Product Detail** — swipeable photo gallery, description, fit tags, reviews, seller
- **Cart / Checkout** — quantity stepper per item, delivery form, map location picker, WhatsApp order submission
- **Order Confirmation** — order summary, clears cart on return home

## Features added during development

- **Theming** — 4 switchable color templates (Classic Red, Midnight Blue, Ember Orange, White/light), chosen from the profile dropdown, persisted across launches. Every screen reads colors from `ThemeContext` rather than a static palette, so switching is instant and app-wide.
- **Localization** — Azerbaijani (default) and English, switchable from the profile dropdown, persisted. All UI chrome is translated (`src/i18n/translations.ts`); the WhatsApp order message stays in Azerbaijani regardless of UI language, since it's a business document read by the shop owner, not user-facing UI.
- **Currency** — USD ($) and AZN (₼, default), switchable from the profile dropdown, persisted. Product prices are stored in USD in the data layer and converted for display (`src/currency/currency.ts`).
- **Cart** — adding the same product again increments a quantity stepper instead of creating duplicate rows.
- **Delivery location picker** — a native map (`react-native-maps`, Apple Maps on iOS — no API key needed) with a center-pin pattern: panning the map updates the selected coordinates live, plus a "use my location" GPS button. Replaced an earlier Google Maps `iframe` embed, which could navigate away with no way back and never actually reported coordinates (Google's free embed has no callback API).
- **Product photo gallery** — swipeable carousel on the detail screen, with pagination dots that reflect the *actual* number of photos a product has (hidden entirely for single-photo products) rather than a fixed decorative count.
- **Multi-store-ready data model** — every product carries a `store` field (all currently `"Teslahubs"`), shown on the detail page ("Sold by …"), so a second seller can be introduced later without a schema change.

## Project structure

```
src/
  components/     ProductCard, HeaderBar, ProfileMenu, SelectField, MapPickerModal, ...
  context/        ThemeContext, LocaleContext, CurrencyContext, CartContext
  screens/        HomeScreen, ProductListScreen, ProductDetailScreen, CartScreen, OrderConfirmScreen
  data/           products.ts — product catalog, categories, cities/regions
  theme/          theme.ts — the 4 color templates
  i18n/           translations.ts — az/en dictionaries
  currency/       currency.ts — USD/AZN conversion + formatting
  navigation/     RootNavigator, route types
```

State (theme, language, currency, cart) is plain React Context + `AsyncStorage`, no external state library.

## Getting started

### Install

```sh
npm install
cd ios && pod install && cd ..
```

### Run

```sh
npm start        # Metro bundler
npm run ios       # or
npm run android
```

Android's map requires a Google Maps API key (`com.google.android.geo.API_KEY` in `AndroidManifest.xml`) for `react-native-maps` to render — not yet configured. iOS uses Apple Maps and needs no key.

If port 8081 is already in use by something else on your machine, run Metro on another port and point the app at it:

```sh
RCT_METRO_PORT=8088 npx react-native start --port 8088
RCT_METRO_PORT=8088 npx react-native run-ios
```
