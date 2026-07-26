import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AutoServicesStackParamList, RootStackParamList } from '../navigation/types';
import { AUTO_SERVICE_CATEGORIES, AUTO_SERVICE_PROVIDERS, AutoServiceCategory } from '../data/autoServices';
import { AS_THEME } from '../theme/autoServicesTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<AutoServicesStackParamList, 'AutoServices'>, NativeStackScreenProps<RootStackParamList>>;

export default function AutoServicesScreen({ navigation }: Props) {
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState<AutoServiceCategory | null>(null);

  const filters: { key: AutoServiceCategory | null; label: string }[] = [
    { key: null, label: t('charging.filterAll') },
    ...AUTO_SERVICE_CATEGORIES.map(c => ({ key: c.key, label: c.label })),
  ];

  const providers = activeCategory ? AUTO_SERVICE_PROVIDERS.filter(p => p.category === activeCategory) : AUTO_SERVICE_PROVIDERS;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.brand}>{t('autoservices.entryTitle')}</Text>
          <Text style={styles.tagline}>{t('autoservices.tagline')}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        {filters.map(item => {
          const isActive = activeCategory === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => setActiveCategory(item.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}>
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {providers.map(provider => (
          <Pressable
            key={provider.id}
            style={({ pressed }) => [styles.tile, { borderColor: provider.color }, pressed && styles.tilePressed]}
            onPress={() => navigation.navigate('AutoServiceProvider', { providerId: provider.id })}>
            <Text style={styles.tileIcon}>{provider.icon}</Text>
            <Text style={styles.tileName}>{provider.name}</Text>
            <Text style={styles.tileTagline} numberOfLines={2}>
              {provider.tagline}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerText: { flex: 1, paddingRight: 12 },
  brand: { fontSize: 24, fontWeight: '900', color: AS_THEME.white, letterSpacing: 0.3 },
  tagline: { fontSize: 12.5, color: AS_THEME.textMuted, marginTop: 4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AS_THEME.card,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: AS_THEME.text },
  filterList: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    backgroundColor: AS_THEME.card,
    alignSelf: 'flex-start',
  },
  filterChipActive: { backgroundColor: AS_THEME.primary, borderColor: AS_THEME.primary },
  filterLabel: { fontSize: 12.5, fontWeight: '600', color: AS_THEME.textMuted },
  filterLabelActive: { color: AS_THEME.white },
  grid: { paddingHorizontal: 20, paddingBottom: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    backgroundColor: AS_THEME.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
    minHeight: 130,
    justifyContent: 'center',
  },
  tilePressed: { opacity: 0.85 },
  tileIcon: { fontSize: 28 },
  tileName: { fontSize: 15, fontWeight: '800', color: AS_THEME.text },
  tileTagline: { fontSize: 11, color: AS_THEME.textMuted, lineHeight: 15 },
});
