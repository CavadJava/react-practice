import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { openAppleMaps, openGoogleMaps, openWaze } from '../utils/mapLinks';

type Props = {
  visible: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  onViewOnMap?: () => void;
};

export default function LocationActionSheet({ visible, onClose, lat, lng, onViewOnMap }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();

  const run = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.wrap} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{t('charging.routeSheetTitle')}</Text>
            <Text style={styles.subtitle}>{t('charging.routeSheetSubtitle')}</Text>
          </View>
          <View style={styles.divider} />
          {onViewOnMap && (
            <>
              <Pressable style={styles.option} onPress={() => run(onViewOnMap)}>
                <Text style={styles.optionText}>{t('charging.viewOnMap')}</Text>
              </Pressable>
              <View style={styles.divider} />
            </>
          )}
          <Pressable style={styles.option} onPress={() => run(() => openGoogleMaps(lat, lng))}>
            <Text style={styles.optionText}>{t('charging.googleMaps')}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.option} onPress={() => run(() => openAppleMaps(lat, lng))}>
            <Text style={styles.optionText}>{t('charging.openInAppleMaps')}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.option} onPress={() => run(() => openWaze(lat, lng))}>
            <Text style={styles.optionText}>{t('charging.waze')}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>{t('charging.cancel')}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
    wrap: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    sheet: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
    headerBlock: { paddingVertical: 14, alignItems: 'center', gap: 2 },
    title: { fontSize: 13, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 12, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.divider },
    option: { paddingVertical: 15, alignItems: 'center' },
    optionText: { fontSize: 15.5, color: colors.brand, fontWeight: '500' },
    cancelBtn: { backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    cancelText: { fontSize: 15.5, fontWeight: '700', color: colors.brand },
  });
