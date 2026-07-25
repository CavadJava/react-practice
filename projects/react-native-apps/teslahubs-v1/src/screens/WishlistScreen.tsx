import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, WishlistStackParamList } from '../navigation/types';
import { PRODUCTS } from '../data/products';
import { ThemeColors, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

type Props = CompositeScreenProps<
  NativeStackScreenProps<WishlistStackParamList, 'Wishlist'>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

export default function WishlistScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { isInCart, addToCart } = useCart();
  const { wishlistIds } = useWishlist();

  const products = useMemo(() => PRODUCTS.filter(p => wishlistIds.includes(p.id)), [wishlistIds]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>{t('wishlist.title')}</Text>

      {products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyText}>{t('wishlist.empty')}</Text>
          <Text style={styles.emptyHint}>{t('wishlist.emptyHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={2}
          style={styles.gridList}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                isInCart={isInCart(item.id)}
                onOpen={() => navigation.navigate('ProductDetail', { productId: item.id })}
                onAddToCart={() => addToCart(item.id)}
                onGoToOrder={() => navigation.navigate('Cart')}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    gridList: { flex: 1 },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    gridRow: { gap: 12, marginBottom: 12 },
    gridItem: { width: '47%' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: 6 },
    emptyIcon: { fontSize: 40, color: colors.textFaded, marginBottom: 8 },
    emptyText: { fontSize: 15, fontWeight: '700', color: colors.text },
    emptyHint: { fontSize: 13, color: colors.textFaded, textAlign: 'center' },
  });
