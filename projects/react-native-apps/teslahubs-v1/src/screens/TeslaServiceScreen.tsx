import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TeslaServiceStackParamList, RootStackParamList } from '../navigation/types';
import { TESLA_SERVICES } from '../data/teslaService';
import { TS_THEME } from '../theme/teslaServiceTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<TeslaServiceStackParamList, 'TeslaService'>, NativeStackScreenProps<RootStackParamList>>;

export default function TeslaServiceScreen({ navigation }: Props) {
  const { t } = useLocale();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={TS_THEME.bg} />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.brand}>{t('teslaservice.entryTitle')}</Text>
          <Text style={styles.tagline}>{t('teslaservice.tagline')}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {TESLA_SERVICES.map(service => (
          <Pressable
            key={service.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('TeslaServiceRequest', { serviceId: service.id })}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>{service.icon}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{service.name}</Text>
              <Text style={styles.cardDescription}>{service.description}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Pressable style={styles.requestBtn} onPress={() => navigation.navigate('TeslaServiceRequest', {})}>
          <Text style={styles.requestBtnText}>{t('teslaservice.requestBtn')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  headerText: { flex: 1, paddingRight: 12 },
  brand: { fontSize: 24, fontWeight: '900', color: TS_THEME.white, letterSpacing: 0.3 },
  tagline: { fontSize: 12.5, color: TS_THEME.textMuted, marginTop: 4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TS_THEME.card,
    borderWidth: 1,
    borderColor: TS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: TS_THEME.text },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: TS_THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TS_THEME.border,
    padding: 14,
  },
  cardPressed: { opacity: 0.85 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TS_THEME.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { fontSize: 20 },
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '800', color: TS_THEME.text },
  cardDescription: { fontSize: 11.5, color: TS_THEME.textMuted, lineHeight: 16 },
  chevron: { fontSize: 22, color: TS_THEME.textMuted },
  requestBtn: { backgroundColor: TS_THEME.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  requestBtnText: { fontSize: 15, fontWeight: '700', color: TS_THEME.white },
});
