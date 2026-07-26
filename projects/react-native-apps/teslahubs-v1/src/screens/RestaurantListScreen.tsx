import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RestaurantsStackParamList, RootStackParamList } from '../navigation/types';
import {
  Restaurant,
  getDiscountedRestaurants,
  getMostOrderedRestaurants,
  getNearbyRestaurants,
  getRestaurantsByCategory,
  getTopRatedRestaurants,
} from '../data/restaurants';
import { RS_THEME } from '../theme/restaurantsTheme';
import { useLocale } from '../context/LocaleContext';
import RestaurantCard from '../components/RestaurantCard';

type Props = CompositeScreenProps<NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantList'>, NativeStackScreenProps<RootStackParamList>>;

export default function RestaurantListScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { mode, category, title } = route.params;

  const restaurants: Restaurant[] = useMemo(() => {
    switch (mode) {
      case 'top':
        return getTopRatedRestaurants(50);
      case 'discount':
        return getDiscountedRestaurants(50);
      case 'nearby':
        return getNearbyRestaurants(50);
      case 'popular':
        return getMostOrderedRestaurants(50);
      case 'category':
        return category ? getRestaurantsByCategory(category) : [];
      default:
        return [];
    }
  }, [mode, category]);

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {restaurants.length === 0 ? (
          <Text style={styles.emptyText}>{t('restaurants.noResults')}</Text>
        ) : (
          restaurants.map(r => (
            <View key={r.id} style={styles.cardWrap}>
              <RestaurantCard restaurant={r} variant="list" onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RS_THEME.card,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: RS_THEME.text, fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 15.5, fontWeight: '800', color: RS_THEME.text, marginHorizontal: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  cardWrap: { marginBottom: 16 },
  emptyText: { fontSize: 13, color: RS_THEME.textMuted, textAlign: 'center', marginTop: 30 },
});
