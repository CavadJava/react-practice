import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarWashStackParamList, RootStackParamList } from '../navigation/types';
import { getCarWashProvider } from '../data/carWash';
import { CW_THEME } from '../theme/carWashTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CarWashStackParamList, 'CarWashProvider'>, NativeStackScreenProps<RootStackParamList>>;

export default function CarWashProviderScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const provider = getCarWashProvider(route.params.providerId);

  if (!provider) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={provider.color} />
      <View style={[styles.header, { backgroundColor: provider.color }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerTagline}>{provider.tagline}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{t('carwash.branches')}</Text>
        {provider.branches.map(branch => (
          <View key={branch.id} style={styles.branchCard}>
            <Text style={styles.branchAddress}>📍 {branch.address}</Text>
            {branch.phone && <Text style={styles.branchDetail}>📞 {branch.phone}</Text>}
            {branch.workingHours && <Text style={styles.branchDetail}>🕒 {branch.workingHours}</Text>}
            <Pressable
              style={[styles.bookBtn, { backgroundColor: provider.color }]}
              onPress={() => navigation.navigate('CarWashBooking', { providerId: provider.id, branchId: branch.id })}>
              <Text style={styles.bookBtnText}>📅 {t('carwash.bookBtn')}</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.mapComingSoon}>
          <Text style={styles.mapComingSoonText}>🗺️ {t('carwash.mapComingSoon')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CW_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22 },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: CW_THEME.white },
  headerText: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: '800', color: CW_THEME.white },
  providerTagline: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  list: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: CW_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  branchCard: {
    backgroundColor: CW_THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CW_THEME.border,
    padding: 14,
    gap: 5,
  },
  branchAddress: { fontSize: 13.5, fontWeight: '700', color: CW_THEME.text },
  branchDetail: { fontSize: 12, color: CW_THEME.textMuted },
  bookBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  bookBtnText: { fontSize: 12.5, fontWeight: '700', color: CW_THEME.white },
  mapComingSoon: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CW_THEME.border,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 4,
  },
  mapComingSoonText: { fontSize: 12.5, color: CW_THEME.textMuted, fontWeight: '600' },
});
