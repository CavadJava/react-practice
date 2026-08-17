import React, { useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Coords = { lat: number; lng: number };

type Props = {
  visible: boolean;
  initialCoords: Coords | null;
  onClose: () => void;
  onConfirm: (coords: Coords) => void;
};

const BAKU_REGION: Region = { latitude: 40.4093, longitude: 49.8671, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapPickerModal({ visible, initialCoords, onClose, onConfirm }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<Coords | null>(initialCoords);
  const [requesting, setRequesting] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const initialRegion: Region = initialCoords
    ? { latitude: initialCoords.lat, longitude: initialCoords.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : BAKU_REGION;

  const useGps = () => {
    setRequesting(true);
    setGpsError('');
    Geolocation.getCurrentPosition(
      pos => {
        setRequesting(false);
        const region: Region = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        setSelected({ lat: region.latitude, lng: region.longitude });
        mapRef.current?.animateToRegion(region, 400);
      },
      err => {
        setRequesting(false);
        setGpsError(err.code === 1 ? t('map.permissionDenied') : t('map.failed'));
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const coordsLabel = selected ? `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}` : gpsError || t('map.pressGps');

  // Re-mounting the map on every open (via `key`) guarantees a clean, predictable
  // starting view instead of carrying over whatever the user last panned/zoomed to.
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible && (
        <View style={styles.container} key={visible ? 'open' : 'closed'}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('map.title')}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              onRegionChangeComplete={region => setSelected({ lat: region.latitude, lng: region.longitude })}
            />
            <Text pointerEvents="none" style={styles.pin}>
              📍
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.hint}>{t('map.hint')}</Text>
            <Text style={styles.coordsLabel}>📌 {coordsLabel}</Text>
            <Pressable style={styles.gpsBtn} onPress={useGps} disabled={requesting}>
              <Text style={styles.gpsBtnText}>{requesting ? t('map.gettingLocation') : t('map.useGps')}</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={() => selected && onConfirm(selected)} disabled={!selected}>
              <Text style={styles.confirmBtnText}>{t('map.confirm')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'ios' ? 54 : 24 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: 12 },
    headerTitle: { fontWeight: '800', fontSize: 16, color: colors.text },
    closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: colors.white, fontSize: 15 },
    mapWrap: { flex: 1, marginHorizontal: spacing.xl, borderRadius: radius.xl, overflow: 'hidden' },
    map: { flex: 1 },
    pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -18, marginTop: -36, fontSize: 36 },
    footer: { padding: spacing.xl, paddingBottom: 26, gap: 10 },
    hint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
    coordsLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
    gpsBtn: { backgroundColor: colors.cardAlt, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center' },
    gpsBtnText: { color: colors.white, fontSize: 13.5, fontWeight: '600' },
    confirmBtn: { backgroundColor: colors.brand, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
    confirmBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  });
