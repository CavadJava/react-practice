import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, ThemeKey, THEMES, radius, spacing } from '../theme/theme';
import { LOCALES } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

export default function ProfileMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, themeKey, setThemeKey } = useTheme();
  const { t, locale, setLocale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <Text style={styles.name}>{t('profile.guest')}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
          <View style={styles.languageRow}>
            {LOCALES.map(l => {
              const active = l.key === locale;
              return (
                <Pressable
                  key={l.key}
                  onPress={() => setLocale(l.key)}
                  style={({ pressed }) => [styles.languageChip, active && styles.languageChipActive, pressed && styles.templateRowPressed]}>
                  <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>{l.key.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t('profile.appearance')}</Text>
          {(Object.keys(THEMES) as ThemeKey[]).map(key => {
            const template = THEMES[key];
            const active = key === themeKey;
            return (
              <Pressable
                key={key}
                onPress={() => setThemeKey(key)}
                style={({ pressed }) => [styles.templateRow, active && styles.templateRowActive, pressed && styles.templateRowPressed]}>
                <View style={[styles.swatch, { backgroundColor: template.swatch }]} />
                <Text style={styles.templateLabel}>{template.name}</Text>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(10,5,5,0.55)' },
    card: {
      position: 'absolute',
      top: 96,
      right: spacing.xl,
      width: 250,
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.brandMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.white, fontSize: 16, fontWeight: '800' },
    name: { color: colors.text, fontSize: 15, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.divider },
    sectionLabel: { color: colors.textFaded, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    languageRow: { flexDirection: 'row', gap: spacing.sm },
    languageChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.cardAlt,
    },
    languageChipActive: { backgroundColor: colors.brand },
    languageChipText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '700' },
    languageChipTextActive: { color: colors.white },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
    },
    templateRowActive: { backgroundColor: colors.cardAlt },
    templateRowPressed: { opacity: 0.6 },
    swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
    templateLabel: { flex: 1, color: colors.textSecondary, fontSize: 13.5, fontWeight: '600' },
    checkmark: { color: colors.brandLight, fontSize: 14, fontWeight: '800' },
  });
