import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarWashStackParamList, RootStackParamList } from '../navigation/types';
import { CAR_WASH_PROVIDERS } from '../data/carWash';
import { CW_THEME } from '../theme/carWashTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CarWashStackParamList, 'CarWash'>, NativeStackScreenProps<RootStackParamList>>;

export default function CarWashScreen({ navigation }: Props) {
  const { t } = useLocale();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={CW_THEME.bg} />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{t('carwash.entryTitle')}</Text>
          <Text style={styles.tagline}>{t('carwash.tagline')}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {CAR_WASH_PROVIDERS.map(provider => (
          <Pressable
            key={provider.id}
            style={({ pressed }) => [styles.card, { borderLeftColor: provider.color }, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('CarWashProvider', { providerId: provider.id })}>
            <Text style={styles.cardName}>{provider.name}</Text>
            <Text style={styles.cardTagline}>{provider.tagline}</Text>
            <Text style={styles.cardBranches}>{t('carwash.branchCount', { count: provider.branches.length })}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CW_THEME.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  brand: { fontSize: 24, fontWeight: '900', color: CW_THEME.primaryDark, letterSpacing: 0.3 },
  tagline: { fontSize: 12.5, color: CW_THEME.textMuted, marginTop: 3 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CW_THEME.card,
    borderWidth: 1,
    borderColor: CW_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: CW_THEME.text },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: CW_THEME.card,
    borderRadius: 14,
    borderLeftWidth: 5,
    padding: 16,
    gap: 4,
    shadowColor: '#0B2436',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  cardName: { fontSize: 15.5, fontWeight: '800', color: CW_THEME.text },
  cardTagline: { fontSize: 12.5, color: CW_THEME.textMuted },
  cardBranches: { fontSize: 11.5, fontWeight: '700', color: CW_THEME.primary, marginTop: 4 },
});
