import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, RootStackParamList, ShoppingTabParamList } from '../navigation/types';
import { CATEGORIES, CollectionKey, getProductsByCollection } from '../data/products';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import ProductSection from '../components/ProductSection';

const modelImages = {
  'model-y': require('../assets/images/model-y.png'),
  'model-3': require('../assets/images/model-3.png'),
} as const;

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  CompositeScreenProps<BottomTabScreenProps<ShoppingTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { cartCount } = useCart();
  const featured = getProductsByCollection(CollectionKey.BestSellers);
  const recommended = getProductsByCollection(CollectionKey.Recommended);
  const recentlyViewed = getProductsByCollection(CollectionKey.PreviouslyViewed);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>TESLAHUBS</Text>
          <View style={styles.topBarActions}>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
              <Text style={styles.iconText}>⌕</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
              <View style={styles.guestAvatar}>
                <Text style={styles.guestAvatarText}>G</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Cart')}
              style={({ pressed }) => [styles.iconBtn, styles.cartIcon, pressed && styles.iconBtnPressed]}>
              <Text style={styles.iconText}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>

          <View style={styles.banner}>
            <Text style={styles.bannerEyebrow}>{t('home.saleEyebrow')}</Text>
            <Text style={styles.bannerTitle}>{t('home.saleTitle')}</Text>
            {/* <Text style={styles.bannerSub}>
              {t('home.saleEnds', { d: countdown.days, h: countdown.hours, m: countdown.mins })}
            </Text> */}
          </View>
          <View style={styles.banner}>
            <Text style={styles.bannerEyebrow}>{t('home.saleEyebrow')}</Text>
            <Text style={styles.bannerTitle}>{t('home.saleTitle')}</Text>
            {/* <Text style={styles.bannerSub}>
              {t('home.saleEnds', { d: countdown.days, h: countdown.hours, m: countdown.mins })}
            </Text> */}
          </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.shopByModel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
            <Pressable
              style={({ pressed }) => [styles.modelCard, pressed && styles.pressedCard]}
              onPress={() => navigation.navigate('ProductList', { category: null })}>
              <Image source={modelImages['model-y']} style={styles.modelImage} resizeMode="cover" />
              <View style={styles.modelOverlay} />
              <Text style={styles.modelLabel}>Model Y</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modelCard, pressed && styles.pressedCard]}
              onPress={() => navigation.navigate('ProductList', { category: null })}>
              <Image source={modelImages['model-3']} style={styles.modelImage} resizeMode="cover" />
              <View style={styles.modelOverlay} />
              <Text style={styles.modelLabel}>Model 3</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c.key}
                style={({ pressed }) => [styles.categoryItem, pressed && styles.pressedFaded]}
                onPress={() => navigation.navigate('ProductList', { category: c.key })}>
                <View style={[styles.categoryIcon, { backgroundColor: c.color }]} />
                <Text style={styles.categoryLabel}>{t(`category.${c.key}`)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ProductSection
          title={t('home.bestSellers')}
          products={featured}
          seeAllLabel={t('home.seeAll')}
          onSeeAll={() => navigation.navigate('ProductList', { category: null })}
          onOpenProduct={productId => navigation.navigate('ProductDetail', { productId })}
          onGoToOrder={() => navigation.navigate('Cart')}
        />

        <ProductSection
          title={t('home.pickedForYou')}
          products={recommended}
          onOpenProduct={productId => navigation.navigate('ProductDetail', { productId })}
          onGoToOrder={() => navigation.navigate('Cart')}
        />

        <ProductSection
          title={t('home.recentlyViewed')}
          products={recentlyViewed}
          onOpenProduct={productId => navigation.navigate('ProductDetail', { productId })}
          onGoToOrder={() => navigation.navigate('Cart')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingBottom: 40 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: 10,
      paddingBottom: 10,
    },
    logo: { fontWeight: '900', fontSize: 19, letterSpacing: 0.4, color: colors.text },
    topBarActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
    iconBtnPressed: { backgroundColor: colors.cardAlt },
    cartIcon: { position: 'relative' },
    iconText: { fontSize: 17, color: colors.text },
    guestAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.brandMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestAvatarText: { color: colors.white, fontSize: 11, fontWeight: '800' },
    cartBadge: {
      position: 'absolute',
      top: -6,
      right: -8,
      backgroundColor: colors.brand,
      borderRadius: 999,
      width: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
    section: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: 10 },
    banner: { backgroundColor: colors.brandMuted, borderRadius: radius.xl, padding: 16, gap: 4 },
    bannerEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, color: colors.white, opacity: 0.85 },
    bannerTitle: { fontSize: 22, fontWeight: '800', color: colors.white },
    bannerSub: { fontSize: 12, color: colors.white, opacity: 0.85, marginTop: 2 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    modelRow: { gap: 10 },
    modelCard: {
      width: 150,
      height: 120,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: colors.cardAlt,
    },
    modelImage: { position: 'absolute', width: '100%', height: '100%' },
    modelOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(20,10,10,0.55)' },
    modelLabel: { position: 'absolute', left: 10, bottom: 8, fontSize: 13, fontWeight: '700', color: colors.white },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
    categoryItem: { alignItems: 'center', gap: 6, width: '23%' },
    categoryIcon: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    categoryLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center', color: colors.text },
    pressedCard: { opacity: 0.85 },
    pressedFaded: { opacity: 0.6 },
    servicesRow: { flexDirection: 'row', gap: 10 },
  });
