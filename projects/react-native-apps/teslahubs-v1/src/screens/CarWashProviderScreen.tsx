import React, { useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarWashStackParamList, RootStackParamList } from '../navigation/types';
import { CarWashBranch, getCarWashProvider } from '../data/carWash';
import { CW_THEME } from '../theme/carWashTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CarWashStackParamList, 'CarWashProvider'>, NativeStackScreenProps<RootStackParamList>>;

function openGoogleMaps(branch: CarWashBranch) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`);
}

function openWaze(branch: CarWashBranch) {
  Linking.openURL(`https://waze.com/ul?ll=${branch.lat},${branch.lng}&navigate=yes`);
}

export default function CarWashProviderScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const provider = getCarWashProvider(route.params.providerId);
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const initialRegion: Region | undefined = useMemo(() => {
    if (!provider || provider.branches.length === 0) return undefined;
    const lats = provider.branches.map(b => b.lat);
    const lngs = provider.branches.map(b => b.lng);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const spreadLat = Math.max(Math.max(...lats) - Math.min(...lats), 0.05) + 0.06;
    const spreadLng = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.05) + 0.06;
    return { latitude: midLat, longitude: midLng, latitudeDelta: spreadLat, longitudeDelta: spreadLng };
  }, [provider]);

  if (!provider) return null;

  const focusBranch = (branch: CarWashBranch) => {
    setSelectedId(branch.id);
    mapRef.current?.animateToRegion({ latitude: branch.lat, longitude: branch.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400);
  };

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

      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
          {provider.branches.map(branch => (
            <Marker key={branch.id} coordinate={{ latitude: branch.lat, longitude: branch.lng }} pinColor={provider.color} onPress={() => setSelectedId(branch.id)}>
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{provider.name}</Text>
                  <Text style={styles.calloutLine}>{branch.address}</Text>
                  {branch.workingHours && <Text style={styles.calloutLine}>🕒 {branch.workingHours}</Text>}
                  <View style={styles.calloutNavRow}>
                    <Pressable onPress={() => openGoogleMaps(branch)} style={styles.calloutNavBtn}>
                      <Text style={styles.calloutNavBtnText}>🗺️ {t('carwash.googleMaps')}</Text>
                    </Pressable>
                    <Pressable onPress={() => openWaze(branch)} style={styles.calloutNavBtn}>
                      <Text style={styles.calloutNavBtnText}>🚗 {t('carwash.waze')}</Text>
                    </Pressable>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{t('carwash.branches')}</Text>
        {provider.branches.map(branch => {
          const selected = selectedId === branch.id;
          return (
            <Pressable
              key={branch.id}
              onPress={() => focusBranch(branch)}
              style={[styles.branchCard, { borderColor: selected ? provider.color : CW_THEME.border }]}>
              <Text style={styles.branchAddress}>📍 {branch.address}</Text>
              {branch.phone && <Text style={styles.branchDetail}>📞 {branch.phone}</Text>}
              {branch.workingHours && <Text style={styles.branchDetail}>🕒 {branch.workingHours}</Text>}

              <View style={styles.navRow}>
                <Pressable
                  onPress={e => {
                    e.stopPropagation();
                    openGoogleMaps(branch);
                  }}
                  style={styles.navBtn}>
                  <Text style={styles.navBtnText}>🗺️ {t('carwash.googleMaps')}</Text>
                </Pressable>
                <Pressable
                  onPress={e => {
                    e.stopPropagation();
                    openWaze(branch);
                  }}
                  style={styles.navBtn}>
                  <Text style={styles.navBtnText}>🚗 {t('carwash.waze')}</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.bookBtn, { backgroundColor: provider.color }]}
                onPress={e => {
                  e.stopPropagation();
                  navigation.navigate('CarWashBooking', { providerId: provider.id, branchId: branch.id });
                }}>
                <Text style={styles.bookBtnText}>📅 {t('carwash.bookBtn')}</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CW_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: CW_THEME.white },
  headerText: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: '800', color: CW_THEME.white },
  providerTagline: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  mapWrap: { height: 210, marginHorizontal: 20, marginBottom: 14, borderRadius: 14, overflow: 'hidden' },
  map: { flex: 1 },
  callout: {
    minWidth: 210,
    gap: 2,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  calloutTitle: { fontWeight: '800', fontSize: 13, color: '#161616' },
  calloutLine: { fontSize: 11.5, color: '#4a4a4a' },
  calloutNavRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  calloutNavBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  calloutNavBtnText: { fontSize: 10.5, fontWeight: '700', color: '#161616' },
  list: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: CW_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  branchCard: {
    backgroundColor: CW_THEME.card,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 5,
  },
  branchAddress: { fontSize: 13.5, fontWeight: '700', color: CW_THEME.text },
  branchDetail: { fontSize: 12, color: CW_THEME.textMuted },
  navRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  navBtn: { flex: 1, backgroundColor: CW_THEME.bg, borderWidth: 1, borderColor: CW_THEME.border, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  navBtnText: { fontSize: 11.5, fontWeight: '700', color: CW_THEME.text },
  bookBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  bookBtnText: { fontSize: 12.5, fontWeight: '700', color: CW_THEME.white },
});
