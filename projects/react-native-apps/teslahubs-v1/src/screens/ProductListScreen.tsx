import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CATEGORIES, PRODUCTS, Product } from '../data/products';
import { ThemeColors, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import HeaderBar from '../components/HeaderBar';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

export default function ProductListScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { isInCart, addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState<Product['category'] | null>(route.params.category);

  const filters: { key: Product['category'] | null; label: string }[] = [
    { key: null, label: t('category.all') },
    ...CATEGORIES.map(c => ({ key: c.key, label: t(`category.${c.key}`) })),
  ];

  const filteredProducts = activeCategory ? PRODUCTS.filter(p => p.category === activeCategory) : PRODUCTS;
  const listTitle = activeCategory ? t(`category.${activeCategory}`) : t('category.allProducts');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <HeaderBar title={listTitle} onBack={() => navigation.goBack()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        {filters.map(item => {
          const active = activeCategory === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => setActiveCategory(item.key)}
              style={[styles.filterChip, { backgroundColor: active ? colors.brand : 'transparent', borderColor: active ? colors.brand : colors.borderLight }]}>
              <Text style={[styles.filterLabel, { color: active ? colors.white : colors.textMuted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredProducts}
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
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    filterList: { flexGrow: 0, flexShrink: 0 },
    filterRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
    filterLabel: { fontSize: 12.5, fontWeight: '600' },
    gridList: { flex: 1 },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    gridRow: { gap: 12, marginBottom: 12 },
    gridItem: { width: '47%' },
  });
