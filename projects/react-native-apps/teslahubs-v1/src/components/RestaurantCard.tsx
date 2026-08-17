import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../data/restaurants';
import { RS_THEME } from '../theme/restaurantsTheme';

type Props = {
  restaurant: Restaurant;
  onPress: () => void;
  variant?: 'carousel' | 'list';
};

export default function RestaurantCard({ restaurant, onPress, variant = 'carousel' }: Props) {
  const isList = variant === 'list';
  return (
    <Pressable style={[styles.card, isList && styles.cardList]} onPress={onPress}>
      <View>
        <Image source={{ uri: restaurant.coverPhoto }} style={[styles.photo, isList && styles.photoList]} resizeMode="cover" />
        {restaurant.discountPercent ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{restaurant.discountPercent}%</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>⭐ {restaurant.rating.toFixed(1)}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>
            {restaurant.deliveryMinMinutes}-{restaurant.deliveryMaxMinutes} dəq
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{restaurant.distanceKm} km</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 180 },
  cardList: { width: '100%', flexDirection: 'row', gap: 12, alignItems: 'center' },
  photo: { width: 180, height: 110, borderRadius: 14, backgroundColor: RS_THEME.cardAlt },
  photoList: { width: 96, height: 96, borderRadius: 14 },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: RS_THEME.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: { color: RS_THEME.white, fontSize: 10.5, fontWeight: '800' },
  body: { marginTop: 6, gap: 3, flex: 1, justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '800', color: RS_THEME.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 11.5, fontWeight: '700', color: RS_THEME.gold },
  dot: { fontSize: 10, color: RS_THEME.textMuted },
  meta: { fontSize: 11, color: RS_THEME.textMuted },
});
