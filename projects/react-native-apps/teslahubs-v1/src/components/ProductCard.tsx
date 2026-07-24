import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Product, getProductImage } from '../data/products';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  product: Product;
  isInCart: boolean;
  onOpen: () => void;
  onAddToCart: () => void;
  onGoToOrder: () => void;
};

export default function ProductCard({ product, isInCart, onOpen, onAddToCart, onGoToOrder }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onOpen}>
      <View style={[styles.image, { backgroundColor: product.placeholderColor }]}>
        <Image source={{ uri: getProductImage(product) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {product.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {product.wasPrice && <Text style={styles.wasPrice}>${product.wasPrice.toFixed(2)}</Text>}
        </View>
        {isInCart ? (
          <Pressable style={({ pressed }) => [styles.orderBtn, pressed && styles.btnPressed]} onPress={onGoToOrder}>
            <Text style={styles.orderBtnText}>Go to Order →</Text>
          </Pressable>
        ) : (
          <Pressable style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]} onPress={onAddToCart}>
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPressed: { opacity: 0.85 },
    btnPressed: { opacity: 0.75 },
    image: {
      width: '100%',
      height: 130,
      justifyContent: 'flex-start',
      overflow: 'hidden',
    },
    badge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.brandMuted,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
    body: { padding: spacing.md, gap: spacing.sm },
    name: { fontSize: 12.5, fontWeight: '600', lineHeight: 16, color: colors.text },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    price: { fontSize: 14, fontWeight: '800', color: colors.text },
    wasPrice: { fontSize: 11, color: colors.textStrike, textDecorationLine: 'line-through' },
    addBtn: { backgroundColor: colors.brand, borderRadius: radius.sm, paddingVertical: 7, alignItems: 'center' },
    addBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
    orderBtn: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingVertical: 7,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    orderBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  });
