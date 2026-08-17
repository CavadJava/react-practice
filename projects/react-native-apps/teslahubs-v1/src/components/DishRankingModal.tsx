import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DishRanking } from '../data/restaurants';
import { RS_THEME } from '../theme/restaurantsTheme';
import { useLocale } from '../context/LocaleContext';

type Props = {
  visible: boolean;
  dishName: string;
  ranking: DishRanking[];
  onClose: () => void;
  onSelectRestaurant: (restaurantId: string) => void;
};

// Shows every restaurant that serves "the same" dish (matched by dishKey),
// ranked by that dish's own rating — answers "where is the best kabab/pizza"
// rather than just "which restaurant overall has the best rating".
export default function DishRankingModal({ visible, dishName, ranking, onClose, onSelectRestaurant }: Props) {
  const { t } = useLocale();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t('restaurants.dishRankingTitle', { dish: dishName })}</Text>
          <Text style={styles.subtitle}>{t('restaurants.dishRankingSubtitle')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ranking.map((entry, i) => (
              <Pressable
                key={entry.restaurant.id}
                style={styles.row}
                onPress={() => {
                  onClose();
                  onSelectRestaurant(entry.restaurant.id);
                }}>
                <Text style={styles.rank}>{i + 1}</Text>
                <Image source={{ uri: entry.restaurant.logo }} style={styles.logo} resizeMode="cover" />
                <View style={styles.textWrap}>
                  <Text style={styles.restaurantName}>{entry.restaurant.name}</Text>
                  <Text style={styles.dishPrice}>
                    {entry.dish.discountPrice ?? entry.dish.originalPrice} ₼
                    {entry.dish.discountPrice != null && <Text style={styles.dishPriceOld}> {entry.dish.originalPrice} ₼</Text>}
                  </Text>
                </View>
                <View style={styles.ratingWrap}>
                  <Text style={styles.ratingText}>⭐ {entry.dish.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewText}>({entry.dish.reviewCount})</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('restaurants.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: RS_THEME.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: { fontSize: 16, fontWeight: '800', color: RS_THEME.text },
  subtitle: { fontSize: 12, color: RS_THEME.textMuted, marginTop: 2, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: RS_THEME.border,
  },
  rank: { width: 18, fontSize: 13, fontWeight: '800', color: RS_THEME.textMuted },
  logo: { width: 42, height: 42, borderRadius: 10, backgroundColor: RS_THEME.cardAlt },
  textWrap: { flex: 1, gap: 2 },
  restaurantName: { fontSize: 13.5, fontWeight: '700', color: RS_THEME.text },
  dishPrice: { fontSize: 12, fontWeight: '700', color: RS_THEME.primary },
  dishPriceOld: { fontSize: 11, color: RS_THEME.textMuted, textDecorationLine: 'line-through' },
  ratingWrap: { alignItems: 'flex-end' },
  ratingText: { fontSize: 13, fontWeight: '800', color: RS_THEME.gold },
  reviewText: { fontSize: 10.5, color: RS_THEME.textMuted },
  closeBtn: { marginTop: 14, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: RS_THEME.cardAlt },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: RS_THEME.text },
});
