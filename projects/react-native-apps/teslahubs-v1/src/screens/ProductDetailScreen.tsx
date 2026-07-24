import React, { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PRODUCTS, getProductImages } from '../data/products';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { format } = useCurrency();
  const { addToCart } = useCart();
  const { width } = useWindowDimensions();
  const product = PRODUCTS.find(p => p.id === route.params.productId) ?? PRODUCTS[0];
  const images = useMemo(() => getProductImages(product), [product]);
  const [justAdded, setJustAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleAddToCart = () => {
    addToCart(product.id);
    setJustAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { backgroundColor: product.placeholderColor }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={[styles.heroImage, { width }]} resizeMode="cover" />
            ))}
          </ScrollView>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i === activeImage ? colors.white : 'rgba(255,255,255,0.4)' }]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View>
            <Text style={styles.fit}>{product.fit}</Text>
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{format(product.price)}</Text>
              {product.wasPrice && <Text style={styles.wasPrice}>{format(product.wasPrice)}</Text>}
            </View>
            <Text style={styles.rating}>
              ★★★★★ {product.rating} {t('product.reviews', { count: product.reviewCount })}
            </Text>
          </View>

          <View style={styles.divider} />

          <View>
            <Text style={styles.blockTitle}>{t('product.description')}</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View>
            <Text style={styles.blockTitle}>{t('product.fits')}</Text>
            <View style={styles.tagRow}>
              {product.fitTags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.reviewsTitle}>{t('product.ownersSay')}</Text>
            <View style={styles.reviewsList}>
              {product.reviews.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <Text style={styles.reviewStars}>★★★★★</Text>
                  <Text style={styles.reviewQuote}>"{r.quote}"</Text>
                  <Text style={styles.reviewAuthor}>
                    {r.name} · {r.model}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.favBtn}>
          <Text style={styles.favIcon}>♡</Text>
        </Pressable>
        <Pressable style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.addBtnText}>{justAdded ? t('product.added') : t('product.addToCartPrice', { price: format(product.price) })}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingBottom: 110 },
    hero: { width: '100%', height: 320, justifyContent: 'space-between', overflow: 'hidden' },
    heroImage: { height: 320 },
    backBtn: {
      marginTop: spacing.md,
      marginLeft: spacing.lg,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(20,10,10,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: { color: colors.white, fontSize: 18 },
    dotsRow: { position: 'absolute', bottom: 12, right: 14, flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    body: { padding: spacing.xl, gap: spacing.lg },
    fit: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, color: colors.brandLight, textTransform: 'uppercase', marginBottom: 6 },
    name: { fontSize: 20, fontWeight: '800', lineHeight: 26, color: colors.text, marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    price: { fontSize: 22, fontWeight: '800', color: colors.text },
    wasPrice: { fontSize: 15, color: colors.textStrike, textDecorationLine: 'line-through' },
    rating: { fontSize: 13, color: colors.brandLight, marginTop: 4 },
    divider: { height: 1, backgroundColor: colors.divider },
    blockTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
    description: { fontSize: 13.5, lineHeight: 22, color: colors.textMuted },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: colors.cardAlt, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
    tagText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
    reviewsTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
    reviewsList: { gap: 10 },
    reviewCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, gap: 4 },
    reviewStars: { color: colors.brandLight, fontSize: 12 },
    reviewQuote: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
    reviewAuthor: { fontSize: 11.5, color: colors.textFaded },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingHorizontal: spacing.xl,
      paddingTop: 14,
      paddingBottom: 26,
      flexDirection: 'row',
      gap: 10,
    },
    favBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    favIcon: { color: colors.white, fontSize: 18 },
    addBtn: { flex: 1, backgroundColor: colors.brand, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  });
