import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RestaurantsStackParamList, RootStackParamList } from '../navigation/types';
import {
  FOOD_CATEGORIES,
  FoodCategory,
  RESTAURANTS,
  getDiscountedRestaurants,
  getMostOrderedRestaurants,
  getNearbyRestaurants,
  getTopRatedRestaurants,
} from '../data/restaurants';
import { RS_THEME } from '../theme/restaurantsTheme';
import { useLocale } from '../context/LocaleContext';
import RestaurantCard from '../components/RestaurantCard';

type Props = CompositeScreenProps<NativeStackScreenProps<RestaurantsStackParamList, 'Restaurants'>, NativeStackScreenProps<RootStackParamList>>;

export default function RestaurantsScreen({ navigation }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [locationLabel, setLocationLabel] = useState(t('restaurants.defaultLocation'));
  const [locating, setLocating] = useState(false);

  const query = search.trim().toLowerCase();
  const searchResults = query
    ? RESTAURANTS.filter(r => {
        const dishNames = r.dishes.map(d => d.name).join(' ');
        return `${r.name} ${dishNames}`.toLowerCase().includes(query);
      })
    : null;

  const refreshLocation = () => {
    setLocating(true);
    Geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        setLocationLabel(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      err => {
        setLocating(false);
        setLocationLabel(err.code === 1 ? t('map.permissionDenied') : t('map.failed'));
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const goToRestaurant = (id: string) => navigation.navigate('RestaurantDetail', { restaurantId: id });

  const sections: { key: string; titleKey: string; data: ReturnType<typeof getTopRatedRestaurants>; mode: 'top' | 'discount' | 'nearby' | 'popular' }[] = [
    { key: 'top', titleKey: 'restaurants.topRated', data: getTopRatedRestaurants(6), mode: 'top' },
    { key: 'discount', titleKey: 'restaurants.discounted', data: getDiscountedRestaurants(6), mode: 'discount' },
    { key: 'nearby', titleKey: 'restaurants.nearby', data: getNearbyRestaurants(6), mode: 'nearby' },
    { key: 'popular', titleKey: 'restaurants.mostOrdered', data: getMostOrderedRestaurants(6), mode: 'popular' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={refreshLocation} style={styles.locationRow} hitSlop={6}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {locating ? t('restaurants.locating') : locationLabel}
          </Text>
          <Text style={styles.locationRefresh}>⟳</Text>
        </Pressable>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('restaurants.searchPlaceholder')}
          placeholderTextColor={RS_THEME.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList} contentContainerStyle={styles.categoryRow}>
        {FOOD_CATEGORIES.map(cat => (
          <Pressable
            key={cat.key}
            style={styles.categoryChip}
            onPress={() =>
              navigation.navigate('RestaurantList', { mode: 'category', category: cat.key as FoodCategory, title: cat.label })
            }>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {searchResults ? (
          <View style={styles.searchResultsWrap}>
            <Text style={styles.sectionTitle}>{t('restaurants.searchResults')}</Text>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>{t('restaurants.noResults')}</Text>
            ) : (
              searchResults.map(r => (
                <View key={r.id} style={styles.listCardWrap}>
                  <RestaurantCard restaurant={r} variant="list" onPress={() => goToRestaurant(r.id)} />
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerRow}>
              {RESTAURANTS.map(r => (
                <Pressable key={r.id} onPress={() => goToRestaurant(r.id)}>
                  <Image source={{ uri: r.bannerPhoto }} style={styles.banner} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>

            {sections.map(section => (
              <View key={section.key} style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
                  <Pressable
                    onPress={() => navigation.navigate('RestaurantList', { mode: section.mode, title: t(section.titleKey) })}>
                    <Text style={styles.seeAll}>{t('restaurants.seeAll')}</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselRow}>
                  {section.data.map(r => (
                    <RestaurantCard key={r.id} restaurant={r} onPress={() => goToRestaurant(r.id)} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  locationRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationIcon: { fontSize: 15 },
  locationText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: RS_THEME.text },
  locationRefresh: { fontSize: 15, color: RS_THEME.primary },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: RS_THEME.card,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: RS_THEME.text },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: RS_THEME.card,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: RS_THEME.text,
    fontSize: 14,
  },
  categoryList: { flexGrow: 0, flexShrink: 0 },
  categoryRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 10 },
  categoryChip: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: RS_THEME.card,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontSize: 11.5, fontWeight: '700', color: RS_THEME.text },
  scrollBody: { paddingBottom: 40 },
  bannerRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  banner: { width: 280, height: 130, borderRadius: 16, backgroundColor: RS_THEME.cardAlt },
  sectionWrap: { marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: RS_THEME.text },
  seeAll: { fontSize: 12, fontWeight: '700', color: RS_THEME.primary },
  carouselRow: { paddingHorizontal: 20, gap: 14 },
  searchResultsWrap: { paddingHorizontal: 20, marginTop: 10 },
  listCardWrap: { marginBottom: 14 },
  emptyText: { fontSize: 13, color: RS_THEME.textMuted, marginTop: 20, textAlign: 'center' },
});
