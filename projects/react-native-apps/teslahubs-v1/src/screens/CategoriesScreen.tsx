import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CategoriesStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import { CATEGORIES } from '../data/products';
import { ThemeColors, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CategoriesStackParamList, 'Categories'>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

export default function CategoriesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>{t('home.categories')}</Text>
      <View style={styles.grid}>
        {CATEGORIES.map(c => (
          <Pressable
            key={c.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => navigation.navigate('ProductList', { category: c.key })}>
            <View style={[styles.icon, { backgroundColor: c.color }]} />
            <Text style={styles.label}>{t(`category.${c.key}`)}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: spacing.xl },
    item: { alignItems: 'center', gap: 8, width: '29%' },
    itemPressed: { opacity: 0.6 },
    icon: { width: '100%', aspectRatio: 1, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    label: { fontSize: 12.5, fontWeight: '600', textAlign: 'center', color: colors.text },
  });
