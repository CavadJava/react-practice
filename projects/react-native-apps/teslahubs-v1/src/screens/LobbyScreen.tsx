import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Home'>, NativeStackScreenProps<RootStackParamList>>;

type Entry = { key: string; icon: string; titleKey: string; subtitleKey: string; onPress: (navigation: Props['navigation']) => void };

const ENTRIES: Entry[] = [
  { key: 'shopping', icon: '🛍️', titleKey: 'shopping.entryTitle', subtitleKey: 'shopping.entrySubtitle', onPress: nav => nav.navigate('Shopping') },
  { key: 'charging', icon: '🔌', titleKey: 'charging.entryTitle', subtitleKey: 'charging.entrySubtitle', onPress: nav => nav.navigate('ChargingStations') },
  { key: 'carwash', icon: '🧼', titleKey: 'carwash.entryTitle', subtitleKey: 'carwash.entrySubtitle', onPress: nav => nav.navigate('CarWash') },
  { key: 'teslaservice', icon: '🔧', titleKey: 'teslaservice.entryTitle', subtitleKey: 'teslaservice.entrySubtitle', onPress: nav => nav.navigate('TeslaService') },
];

// The outer "Home" tab's landing screen — a flat list of the app's sections
// (Shopping, Charging Stations, AvtoYuma, Tesla Service) as equal peers, each
// opening its own dedicated part of the app from the root.
export default function LobbyScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>TESLAHUBS</Text>
        <Text style={styles.subtitle}>{t('lobby.subtitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {ENTRIES.map(entry => (
          <Pressable
            key={entry.key}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => entry.onPress(navigation)}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>{entry.icon}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{t(entry.titleKey)}</Text>
              <Text style={styles.cardSubtitle}>{t(entry.subtitleKey)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.xl, paddingTop: 10, paddingBottom: spacing.lg, gap: 4 },
    logo: { fontWeight: '900', fontSize: 22, letterSpacing: 0.4, color: colors.text },
    subtitle: { fontSize: 13, color: colors.textMuted },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: 12 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.cardAlt,
      borderRadius: radius.xl,
      padding: 14,
    },
    cardPressed: { opacity: 0.85 },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconText: { fontSize: 22 },
    cardBody: { flex: 1, gap: 3 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    cardSubtitle: { fontSize: 11.5, color: colors.textMuted },
    chevron: { fontSize: 22, color: colors.textMuted },
  });
