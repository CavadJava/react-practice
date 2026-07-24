import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

type Coords = { lat: number; lng: number } | null;

type Props = {
  visible: boolean;
  coords: Coords;
  onClose: () => void;
  onConfirm: () => void;
  onUseGps: (coords: { lat: number; lng: number }, error?: string) => void;
  gpsError: string;
};

export default function MapPickerModal({ visible, coords, onClose, onConfirm, onUseGps, gpsError }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [requesting, setRequesting] = useState(false);

  const useGps = () => {
    setRequesting(true);
    Geolocation.getCurrentPosition(
      pos => {
        setRequesting(false);
        onUseGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      err => {
        setRequesting(false);
        onUseGps({ lat: 0, lng: 0 }, err.code === 1 ? 'İcazə verilmədi — brauzer ayarlarından GPS-ə icazə verin' : 'Məkan alına bilmədi, yenidən cəhd edin');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const coordsLabel = coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : gpsError || 'Məkan seçilməyib — GPS düyməsini basın';
  const mapQuery = coords ? `${coords.lat},${coords.lng}` : 'Baku,Azerbaijan';
  const embedSrc = `https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`;
  // Google's embed endpoint only serves content when the request genuinely
  // comes from inside an <iframe> — loading it directly as the WebView's
  // top-level page fails with "must be used in an iframe". Wrapping it in a
  // local HTML shell with a real iframe satisfies that check.
  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>html,body{margin:0;padding:0;height:100%;}iframe{width:100%;height:100%;border:0;}</style></head>
    <body><iframe src="${embedSrc}" loading="lazy" allowfullscreen></iframe></body></html>`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Xəritədən yer seçin</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.mapWrap}>
          <WebView source={{ html: mapHtml, baseUrl: 'https://www.google.com/' }} style={styles.webview} originWhitelist={['*']} />
          <Text pointerEvents="none" style={styles.pin}>
            📍
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Xəritəni sürüşdürüb, yaxınlaşdıraraq öz məkanınızı tapın</Text>
          <Text style={styles.coordsLabel}>📌 {coordsLabel}</Text>
          <Pressable style={styles.gpsBtn} onPress={useGps} disabled={requesting}>
            <Text style={styles.gpsBtnText}>{requesting ? 'Məkan alınır…' : '📡 Cari məkanımı istifadə et (dəqiq)'}</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmBtnText}>Bu yeri təsdiqlə</Text>
          </Pressable>
        </View>
      </View>
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
    webview: { flex: 1 },
    pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -18, marginTop: -36, fontSize: 36 },
    footer: { padding: spacing.xl, paddingBottom: 26, gap: 10 },
    hint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
    coordsLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
    gpsBtn: { backgroundColor: colors.cardAlt, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center' },
    gpsBtnText: { color: colors.white, fontSize: 13.5, fontWeight: '600' },
    confirmBtn: { backgroundColor: colors.brand, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
    confirmBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  });
