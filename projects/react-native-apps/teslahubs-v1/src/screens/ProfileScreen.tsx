import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, ThemeKey, THEMES, radius, spacing } from '../theme/theme';
import { LOCALES } from '../i18n/translations';
import { CURRENCIES } from '../currency/currency';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCurrency } from '../context/CurrencyContext';

export default function ProfileScreen() {
  const { colors, themeKey, setThemeKey } = useTheme();
  const { t, locale, setLocale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('tabs.profile')}</Text>

        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>G</Text>
          </View>
          <Text style={styles.name}>{t('profile.guest')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
          <View style={styles.chipRow}>
            {LOCALES.map(l => {
              const active = l.key === locale;
              return (
                <Pressable
                  key={l.key}
                  onPress={() => setLocale(l.key)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.rowPressed]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{l.key.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.currency')}</Text>
          <View style={styles.chipRow}>
            {CURRENCIES.map(c => {
              const active = c.key === currency;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCurrency(c.key)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.rowPressed]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {c.symbol} {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.appearance')}</Text>
          <View style={styles.card}>
            {(Object.keys(THEMES) as ThemeKey[]).map(key => {
              const template = THEMES[key];
              const active = key === themeKey;
              return (
                <Pressable
                  key={key}
                  onPress={() => setThemeKey(key)}
                  style={({ pressed }) => [styles.templateRow, active && styles.templateRowActive, pressed && styles.rowPressed]}>
                  <View style={[styles.swatch, { backgroundColor: template.swatch }]} />
                  <Text style={styles.templateLabel}>{template.name}</Text>
                  {active && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.xl, gap: spacing.xl, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.brandMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.white, fontSize: 20, fontWeight: '800' },
    name: { color: colors.text, fontSize: 17, fontWeight: '700' },
    section: { gap: spacing.sm },
    sectionLabel: { color: colors.textFaded, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    chipRow: { flexDirection: 'row', gap: spacing.sm },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
    chipTextActive: { color: colors.white },
    rowPressed: { opacity: 0.6 },
    card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.sm, gap: 2 },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 11,
      paddingHorizontal: 10,
      borderRadius: radius.sm,
    },
    templateRowActive: { backgroundColor: colors.cardAlt },
    swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
    templateLabel: { flex: 1, color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    checkmark: { color: colors.brandLight, fontSize: 15, fontWeight: '800' },
  });
