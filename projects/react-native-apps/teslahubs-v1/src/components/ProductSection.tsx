import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Product } from '../data/products';
import { ThemeColors, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import ProductCard from './ProductCard';

type Props = {
  title: string;
  products: Product[];
  seeAllLabel?: string;
  onSeeAll?: () => void;
  onOpenProduct: (productId: string) => void;
  onGoToOrder: () => void;
};

export default function ProductSection({ title, products, seeAllLabel, onSeeAll, onOpenProduct, onGoToOrder }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isInCart, addToCart } = useCart();

  if (products.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {seeAllLabel && onSeeAll && (
          <Text style={styles.seeAll} onPress={onSeeAll}>
            {seeAllLabel}
          </Text>
        )}
      </View>
      <View style={styles.grid}>
        {products.map(p => (
          <View key={p.id} style={styles.gridItem}>
            <ProductCard
              product={p}
              isInCart={isInCart(p.id)}
              onOpen={() => onOpenProduct(p.id)}
              onAddToCart={() => addToCart(p.id)}
              onGoToOrder={onGoToOrder}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { paddingBottom: spacing.lg },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    title: { fontSize: 15, fontWeight: '700', color: colors.text },
    seeAll: { fontSize: 12, fontWeight: '600', color: colors.brand },
    grid: { paddingHorizontal: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '47%' },
  });
