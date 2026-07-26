import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Share, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RestaurantsStackParamList, RootStackParamList } from '../navigation/types';
import { Dish, getCategoryLabel, getDishRanking, getRestaurant } from '../data/restaurants';
import { RS_THEME } from '../theme/restaurantsTheme';
import { useLocale } from '../context/LocaleContext';
import { useRestaurantFavorites } from '../context/RestaurantFavoritesContext';
import DishRankingModal from '../components/DishRankingModal';
import DishDetailModal from '../components/DishDetailModal';

type Props = CompositeScreenProps<NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantDetail'>, NativeStackScreenProps<RootStackParamList>>;

export default function RestaurantDetailScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useRestaurantFavorites();
  const restaurant = getRestaurant(route.params.restaurantId);

  const [dishQuery, setDishQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [rankingDishKey, setRankingDishKey] = useState<string | null>(null);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);

  if (!restaurant) return null;

  const favorite = isFavorite(restaurant.id);
  const query = dishQuery.trim().toLowerCase();

  const dishes = restaurant.dishes.filter(d => {
    if (activeCategory && d.category !== activeCategory) return false;
    if (query && !`${d.name} ${d.composition}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const rankingEntries = rankingDishKey ? getDishRanking(rankingDishKey) : [];
  const rankingDishName = rankingDishKey ? restaurant.dishes.find(d => d.dishKey === rankingDishKey)?.name ?? '' : '';

  const handleShare = () => {
    Share.share({ message: `${restaurant.name} — ${restaurant.address}` });
  };

  const handleCall = () => {
    Linking.openURL(`tel:${restaurant.phone.replace(/\s/g, '')}`);
  };

  const openRanking = (dish: Dish) => setRankingDishKey(dish.dishKey);

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor={RS_THEME.primary} />

      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
          <View style={styles.hero}>
            <Image source={{ uri: restaurant.coverPhoto }} style={styles.heroImage} resizeMode="cover" />
            <Pressable style={[styles.heroBtn, styles.heroBtnLeft, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
              <Text style={styles.heroBtnText}>←</Text>
            </Pressable>
          </View>

          <View style={styles.infoWrap}>
            <View style={styles.infoTopRow}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <View style={styles.actionsRow}>
                <Pressable style={styles.actionBtn} onPress={handleCall}>
                  <Text style={styles.actionBtnIcon}>📞</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => toggleFavorite(restaurant.id)}>
                  <Text style={[styles.actionBtnIcon, favorite && styles.actionBtnIconActive]}>{favorite ? '♥' : '♡'}</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={handleShare}>
                  <Text style={styles.actionBtnIcon}>↗</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.address}>📍 {restaurant.address}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>⭐ {restaurant.rating.toFixed(1)}</Text>
                <Text style={styles.statChipSub}>({restaurant.reviewCount})</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>
                  🛵 {restaurant.deliveryMinMinutes}-{restaurant.deliveryMaxMinutes} dəq
                </Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>💳 {restaurant.deliveryFee.toFixed(2)} ₼</Text>
                <Text style={styles.statChipSub}>{t('restaurants.deliveryFee')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabBarWrap}>
          <View style={styles.stickySearchWrap}>
            <TextInput
              value={dishQuery}
              onChangeText={setDishQuery}
              placeholder={t('restaurants.dishSearchPlaceholder')}
              placeholderTextColor={RS_THEME.textMuted}
              style={styles.dishSearchInput}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarRow}>
            <Pressable style={[styles.tabChip, !activeCategory && styles.tabChipActive]} onPress={() => setActiveCategory(null)}>
              <Text style={[styles.tabChipText, !activeCategory && styles.tabChipTextActive]}>{t('charging.filterAll')}</Text>
            </Pressable>
            {restaurant.categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <Pressable key={cat} style={[styles.tabChip, isActive && styles.tabChipActive]} onPress={() => setActiveCategory(cat)}>
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>{getCategoryLabel(cat)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.dishList}>
          {dishes.length === 0 ? (
            <Text style={styles.emptyText}>{t('restaurants.noDishes')}</Text>
          ) : (
            dishes.map(dish => (
              <Pressable key={dish.id} style={styles.dishCard} onPress={() => setDetailDish(dish)}>
                <Image source={{ uri: dish.photo }} style={styles.dishPhoto} resizeMode="cover" />
                <View style={styles.dishBody}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {dish.name}
                  </Text>
                  <Text style={styles.dishWeight}>{dish.weight}</Text>
                  <Text style={styles.dishComposition} numberOfLines={2}>
                    {dish.composition}
                  </Text>
                  <View style={styles.dishBottomRow}>
                    {dish.discountPrice != null ? (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceOld}>{dish.originalPrice} ₼</Text>
                        <Text style={styles.priceNew}>{dish.discountPrice} ₼</Text>
                      </View>
                    ) : (
                      <Text style={styles.priceOnly}>{dish.originalPrice} ₼</Text>
                    )}
                    <Pressable style={styles.rankBtn} onPress={() => openRanking(dish)}>
                      <Text style={styles.rankBtnText}>🏆 ⭐{dish.rating.toFixed(1)}</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <DishDetailModal
        dish={detailDish}
        restaurantName={restaurant.name}
        onClose={() => setDetailDish(null)}
        onViewRanking={dish => {
          setDetailDish(null);
          openRanking(dish);
        }}
      />

      <DishRankingModal
        visible={!!rankingDishKey}
        dishName={rankingDishName}
        ranking={rankingEntries}
        onClose={() => setRankingDishKey(null)}
        onSelectRestaurant={id => {
          if (id !== restaurant.id) navigation.push('RestaurantDetail', { restaurantId: id });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RS_THEME.bg },
  scrollContent: { paddingBottom: 30 },
  hero: { width: '100%', height: 230, backgroundColor: RS_THEME.cardAlt },
  heroImage: { width: '100%', height: 230 },
  heroBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnLeft: { left: 16 },
  heroBtnText: { color: RS_THEME.white, fontSize: 16 },
  stickySearchWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  dishSearchInput: {
    backgroundColor: RS_THEME.card,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: RS_THEME.text,
    fontSize: 14,
  },
  infoWrap: { padding: 20, gap: 8, backgroundColor: RS_THEME.bg },
  infoTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 20, fontWeight: '900', color: RS_THEME.text },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: RS_THEME.card,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: { fontSize: 15, color: RS_THEME.text },
  actionBtnIconActive: { color: RS_THEME.primary },
  address: { fontSize: 12.5, color: RS_THEME.textMuted },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  statChip: { flex: 1, backgroundColor: RS_THEME.cardAlt, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 1 },
  statChipText: { fontSize: 12.5, fontWeight: '800', color: RS_THEME.text },
  statChipSub: { fontSize: 10, color: RS_THEME.textMuted },
  tabBarWrap: { backgroundColor: RS_THEME.bg, borderBottomWidth: 1, borderBottomColor: RS_THEME.border, paddingBottom: 10 },
  tabBarRow: { paddingHorizontal: 20, gap: 8 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RS_THEME.border,
    backgroundColor: RS_THEME.card,
  },
  tabChipActive: { backgroundColor: RS_THEME.primary, borderColor: RS_THEME.primary },
  tabChipText: { fontSize: 12.5, fontWeight: '700', color: RS_THEME.textMuted },
  tabChipTextActive: { color: RS_THEME.white },
  dishList: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  emptyText: { fontSize: 13, color: RS_THEME.textMuted, textAlign: 'center', marginTop: 30 },
  dishCard: { flexDirection: 'row', gap: 12, backgroundColor: RS_THEME.card, borderRadius: 16, borderWidth: 1, borderColor: RS_THEME.border, padding: 12 },
  dishPhoto: { width: 84, height: 84, borderRadius: 12, backgroundColor: RS_THEME.cardAlt },
  dishBody: { flex: 1, gap: 2 },
  dishName: { fontSize: 14, fontWeight: '800', color: RS_THEME.text },
  dishWeight: { fontSize: 11, color: RS_THEME.textMuted },
  dishComposition: { fontSize: 11.5, color: RS_THEME.textMuted, lineHeight: 15, marginTop: 2 },
  dishBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceOld: { fontSize: 11.5, color: RS_THEME.textMuted, textDecorationLine: 'line-through' },
  priceNew: { fontSize: 14, fontWeight: '800', color: RS_THEME.primary },
  priceOnly: { fontSize: 14, fontWeight: '800', color: RS_THEME.text },
  rankBtn: { backgroundColor: RS_THEME.cardAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  rankBtnText: { fontSize: 11, fontWeight: '700', color: RS_THEME.gold },
});
