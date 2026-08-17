import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DoctorsStackParamList, RootStackParamList } from '../navigation/types';
import { DOCTOR_SPECIALTIES, DoctorSpecialty, getRankedDoctors, getTopDoctors } from '../data/doctors';
import { DR_THEME } from '../theme/doctorsTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<DoctorsStackParamList, 'Doctors'>, NativeStackScreenProps<RootStackParamList>>;

export default function DoctorsScreen({ navigation }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState<DoctorSpecialty | null>(null);
  const [topOnly, setTopOnly] = useState(false);

  const specialtyFilters: { key: DoctorSpecialty | null; label: string }[] = [
    { key: null, label: t('charging.filterAll') },
    ...DOCTOR_SPECIALTIES.map(s => ({ key: s.key, label: s.label })),
  ];

  const topDoctorIds = new Set(getTopDoctors(3).map(d => d.id));

  const query = search.trim().toLowerCase();
  // Ranked by the scoring algorithm (rating + reviews + experience +
  // operations performed + articles + conferences + certificates) so the
  // strongest doctors surface first by default, not just alphabetically.
  const doctors = getRankedDoctors().filter(d => {
    if (topOnly && !topDoctorIds.has(d.id)) return false;
    if (activeSpecialty && d.specialty !== activeSpecialty) return false;
    if (query) {
      const specialtyLabel = DOCTOR_SPECIALTIES.find(s => s.key === d.specialty)?.label ?? '';
      const haystack = `${d.name} ${specialtyLabel} ${d.clinic}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerText}>
          <Text style={styles.brand}>{t('doctors.entryTitle')}</Text>
          <Text style={styles.tagline}>{t('doctors.tagline')}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('doctors.searchPlaceholder')}
          placeholderTextColor={DR_THEME.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        <Pressable onPress={() => setTopOnly(v => !v)} style={[styles.filterChip, styles.topChip, topOnly && styles.filterChipActive]}>
          <Text style={[styles.filterLabel, topOnly && styles.filterLabelActive]}>🏆 {t('doctors.topDoctors')}</Text>
        </Pressable>
        {specialtyFilters.map(item => {
          const isActive = activeSpecialty === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => setActiveSpecialty(item.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}>
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {doctors.length === 0 ? (
          <Text style={styles.emptyText}>{t('doctors.noResults')}</Text>
        ) : (
          doctors.map(doctor => {
            const specialtyLabel = DOCTOR_SPECIALTIES.find(s => s.key === doctor.specialty)?.label ?? doctor.specialty;
            const isTop = topDoctorIds.has(doctor.id);
            return (
              <Pressable
                key={doctor.id}
                style={({ pressed }) => [styles.card, isTop && styles.cardTop, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor.id })}>
                <View>
                  <Image source={{ uri: doctor.photo }} style={styles.cardPhoto} resizeMode="cover" />
                  {isTop && (
                    <View style={styles.topBadge}>
                      <Text style={styles.topBadgeText}>🏆</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {doctor.name}
                  </Text>
                  <Text style={styles.cardSpecialty}>{specialtyLabel}</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardRating}>⭐ {doctor.rating.toFixed(1)}</Text>
                    <Text style={styles.cardReviews}>({doctor.reviewCount})</Text>
                    <Text style={styles.cardDot}>•</Text>
                    <Text style={styles.cardExperience}>{t('doctors.yearsExperience', { count: String(doctor.experienceYears) })}</Text>
                  </View>
                  <Text style={styles.cardClinic} numberOfLines={1}>
                    🏥 {doctor.clinic}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DR_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  headerText: { flex: 1, paddingRight: 12 },
  brand: { fontSize: 24, fontWeight: '900', color: DR_THEME.white, letterSpacing: 0.3 },
  tagline: { fontSize: 12.5, color: DR_THEME.textMuted, marginTop: 4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: DR_THEME.card,
    borderWidth: 1,
    borderColor: DR_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: DR_THEME.text },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: DR_THEME.card,
    borderWidth: 1,
    borderColor: DR_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: DR_THEME.text,
    fontSize: 14,
  },
  filterList: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DR_THEME.border,
    backgroundColor: DR_THEME.card,
    alignSelf: 'flex-start',
  },
  filterChipActive: { backgroundColor: DR_THEME.primary, borderColor: DR_THEME.primary },
  topChip: { borderColor: DR_THEME.primary },
  filterLabel: { fontSize: 12.5, fontWeight: '600', color: DR_THEME.textMuted },
  filterLabelActive: { color: DR_THEME.white },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  emptyText: { fontSize: 13, color: DR_THEME.textMuted, textAlign: 'center', marginTop: 30 },
  card: {
    flexDirection: 'row',
    backgroundColor: DR_THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DR_THEME.border,
    padding: 12,
    gap: 12,
  },
  cardPressed: { opacity: 0.85 },
  cardTop: { borderColor: DR_THEME.primary, borderWidth: 1.5 },
  cardPhoto: { width: 72, height: 72, borderRadius: 14, backgroundColor: DR_THEME.cardAlt },
  topBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DR_THEME.bg,
    borderWidth: 1.5,
    borderColor: DR_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBadgeText: { fontSize: 11 },
  cardBody: { flex: 1, gap: 3, justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '800', color: DR_THEME.text },
  cardSpecialty: { fontSize: 12, fontWeight: '600', color: DR_THEME.primary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardRating: { fontSize: 12, fontWeight: '700', color: DR_THEME.text },
  cardReviews: { fontSize: 11, color: DR_THEME.textMuted },
  cardDot: { fontSize: 11, color: DR_THEME.textMuted },
  cardExperience: { fontSize: 11, color: DR_THEME.textMuted },
  cardClinic: { fontSize: 11.5, color: DR_THEME.textMuted, marginTop: 2 },
});
