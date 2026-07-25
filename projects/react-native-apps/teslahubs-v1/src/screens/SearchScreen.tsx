import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PRODUCTS } from '../data/products';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { isInCart, addToCart } = useCart();
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmed) return [];
    return PRODUCTS.filter(p => {
      const haystack = [p.name, p.description, t(`category.${p.category}`), ...p.fitTags].join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [trimmed, t]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textFaded}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {trimmed.length === 0 ? (
        <Text style={styles.hintText}>{t('search.prompt')}</Text>
      ) : results.length === 0 ? (
        <Text style={styles.hintText}>{t('search.noResults', { query: query.trim() })}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          numColumns={2}
          style={styles.gridList}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          keyboardShouldPersistTaps="handled"
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
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    backBtn: { width: 20 },
    backText: { color: colors.white, fontSize: 20 },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.pill,
      paddingHorizontal: 14,
      height: 42,
    },
    searchIcon: { fontSize: 16, color: colors.textFaded },
    searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },
    clearIcon: { fontSize: 14, color: colors.textFaded },
    hintText: { textAlign: 'center', color: colors.textFaded, fontSize: 13.5, paddingHorizontal: spacing.xxl, marginTop: 40 },
    gridList: { flex: 1 },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    gridRow: { gap: 12, marginBottom: 12 },
    gridItem: { width: '47%' },
  });
