import React, { useEffect, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DISH_ADDON_CATEGORIES, Dish, getAddOnCategoryLabel, getDishAddOn } from '../data/restaurants';
import { WHATSAPP_PHONE } from '../data/products';
import { RS_THEME } from '../theme/restaurantsTheme';
import { useLocale } from '../context/LocaleContext';

type Props = {
  dish: Dish | null;
  restaurantName: string;
  onClose: () => void;
  onViewRanking: (dish: Dish) => void;
};

// Tapping a product opens this: a pinch-to-zoom photo (RN's built-in
// ScrollView zoom, so no extra native dependency is needed) with the dish
// details laid out below it, plus its "child products" — optional
// salad/drink/sauce/dessert add-ons the customer can attach to the order.
export default function DishDetailModal({ dish, restaurantName, onClose, onViewRanking }: Props) {
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedAddOnIds([]);
  }, [dish?.id]);

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const addOns = (dish?.addOnIds ?? []).map(id => getDishAddOn(id)).filter((a): a is NonNullable<typeof a> => !!a);
  const addOnsByCategory = DISH_ADDON_CATEGORIES.map(cat => ({ ...cat, items: addOns.filter(a => a.category === cat.key) })).filter(
    g => g.items.length > 0,
  );

  const basePrice = dish ? dish.discountPrice ?? dish.originalPrice : 0;
  const addOnsTotal = addOns.filter(a => selectedAddOnIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const total = basePrice + addOnsTotal;

  const handleOrder = () => {
    if (!dish) return;
    const selectedAddOns = addOns.filter(a => selectedAddOnIds.includes(a.id));
    const lines = [
      'Salam!',
      '',
      'Yeni sifariş:',
      '',
      '━━━━━━━━━━━━━━',
      '🏢 Restoran',
      restaurantName,
      '',
      '🍽️ Məhsul',
      `${dish.name} — ${basePrice} ₼`,
      '',
      ...(selectedAddOns.length
        ? ['➕ Əlavələr', ...selectedAddOns.map(a => `• ${a.name} — ${a.price} ₼`), '']
        : []),
      '💰 Ümumi',
      `${total.toFixed(2)} ₼`,
      '━━━━━━━━━━━━━━',
      '',
      'Sifarişimin təsdiqlənməsini gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);
  };

  return (
    <Modal visible={!!dish} animationType="slide" onRequestClose={onClose}>
      {dish && (
        <View style={styles.screen}>
          <View style={styles.zoomArea}>
            <ScrollView
              contentContainerStyle={styles.zoomContent}
              minimumZoomScale={1}
              maximumZoomScale={3}
              bouncesZoom
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}>
              <Image source={{ uri: dish.photo }} style={[styles.photo, { width }]} resizeMode="contain" />
            </ScrollView>
            <Pressable style={[styles.closeBtn, { top: insets.top + 10 }]} onPress={onClose} hitSlop={10}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.name}>{dish.name}</Text>
            <Text style={styles.weight}>{dish.weight}</Text>
            <Text style={styles.composition}>{dish.composition}</Text>

            <View style={styles.bottomRow}>
              {dish.discountPrice != null ? (
                <View style={styles.priceRow}>
                  <Text style={styles.priceOld}>{dish.originalPrice} ₼</Text>
                  <Text style={styles.priceNew}>{dish.discountPrice} ₼</Text>
                </View>
              ) : (
                <Text style={styles.priceOnly}>{dish.originalPrice} ₼</Text>
              )}
              <Pressable style={styles.rankBtn} onPress={() => onViewRanking(dish)}>
                <Text style={styles.rankBtnText}>🏆 ⭐ {dish.rating.toFixed(1)} ({dish.reviewCount})</Text>
              </Pressable>
            </View>

            <Pressable style={styles.rankingLink} onPress={() => onViewRanking(dish)}>
              <Text style={styles.rankingLinkText}>{t('restaurants.viewRanking')}</Text>
            </Pressable>

            {addOnsByCategory.length > 0 && (
              <>
                <Text style={styles.addOnsTitle}>{t('restaurants.addOnsTitle')}</Text>
                {addOnsByCategory.map(group => (
                  <View key={group.key} style={styles.addOnGroup}>
                    <Text style={styles.addOnGroupTitle}>
                      {group.icon} {getAddOnCategoryLabel(group.key)}
                    </Text>
                    {group.items.map(item => {
                      const isSelected = selectedAddOnIds.includes(item.id);
                      return (
                        <Pressable key={item.id} style={styles.addOnRow} onPress={() => toggleAddOn(item.id)}>
                          <Image source={{ uri: item.photo }} style={styles.addOnPhoto} resizeMode="cover" />
                          <Text style={styles.addOnName}>{item.name}</Text>
                          <Text style={styles.addOnPrice}>+{item.price} ₼</Text>
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerTotalRow}>
              <Text style={styles.footerTotalLabel}>{t('restaurants.total')}</Text>
              <Text style={styles.footerTotalValue}>{total.toFixed(2)} ₼</Text>
            </View>
            <Pressable style={styles.orderBtn} onPress={handleOrder}>
              <Text style={styles.orderBtnText}>{t('restaurants.orderBtn')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RS_THEME.bg },
  zoomArea: { height: 260, backgroundColor: RS_THEME.cardAlt },
  zoomContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { height: '100%' },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: RS_THEME.white, fontSize: 15 },
  detailsScroll: { flex: 1 },
  detailsContent: { padding: 20, paddingBottom: 30, gap: 4 },
  name: { fontSize: 19, fontWeight: '900', color: RS_THEME.text },
  weight: { fontSize: 12.5, color: RS_THEME.textMuted },
  composition: { fontSize: 13.5, color: RS_THEME.text, lineHeight: 20, marginTop: 4 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceOld: { fontSize: 13, color: RS_THEME.textMuted, textDecorationLine: 'line-through' },
  priceNew: { fontSize: 20, fontWeight: '800', color: RS_THEME.primary },
  priceOnly: { fontSize: 20, fontWeight: '800', color: RS_THEME.text },
  rankBtn: { backgroundColor: RS_THEME.cardAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  rankBtnText: { fontSize: 12, fontWeight: '700', color: RS_THEME.gold },
  rankingLink: { marginTop: 14, alignItems: 'center', borderRadius: 12, paddingVertical: 13, backgroundColor: RS_THEME.cardAlt },
  rankingLinkText: { fontSize: 13, fontWeight: '700', color: RS_THEME.text },
  addOnsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: RS_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 4,
  },
  addOnGroup: { marginTop: 10 },
  addOnGroupTitle: { fontSize: 13, fontWeight: '800', color: RS_THEME.text, marginBottom: 6 },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: RS_THEME.border,
  },
  addOnPhoto: { width: 40, height: 40, borderRadius: 10, backgroundColor: RS_THEME.cardAlt },
  addOnName: { flex: 1, fontSize: 13, fontWeight: '600', color: RS_THEME.text },
  addOnPrice: { fontSize: 12.5, fontWeight: '700', color: RS_THEME.primary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: RS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: RS_THEME.primary, borderColor: RS_THEME.primary },
  checkboxMark: { color: RS_THEME.white, fontSize: 13, fontWeight: '800' },
  footer: { padding: 20, paddingBottom: 26, gap: 10, borderTopWidth: 1, borderTopColor: RS_THEME.border, backgroundColor: RS_THEME.bg },
  footerTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerTotalLabel: { fontSize: 12.5, fontWeight: '600', color: RS_THEME.textMuted },
  footerTotalValue: { fontSize: 18, fontWeight: '800', color: RS_THEME.primary },
  orderBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', backgroundColor: RS_THEME.primary },
  orderBtnText: { fontSize: 15, fontWeight: '700', color: RS_THEME.white },
});
