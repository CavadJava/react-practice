import React, { useMemo, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  CHARGING_NETWORKS,
  ChargingNetwork,
  ChargingStation,
  ConnectorType,
  CurrentType,
  POWER_RANGES,
  filterStations,
} from '../data/chargingStations';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'ChargingStations'>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

const BAKU_REGION: Region = { latitude: 40.39, longitude: 49.86, latitudeDelta: 0.12, longitudeDelta: 0.12 };

function openGoogleMaps(station: ChargingStation) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`);
}

function openWaze(station: ChargingStation) {
  Linking.openURL(`https://waze.com/ul?ll=${station.lat},${station.lng}&navigate=yes`);
}

function matchesQuery(station: ChargingStation, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLocaleLowerCase();
  return station.name.toLocaleLowerCase().includes(q) || station.network.toLocaleLowerCase().includes(q) || station.address.toLocaleLowerCase().includes(q);
}

type FilterRowProps<T extends string> = {
  label: string;
  items: { key: T | null; label: string }[];
  active: T | null;
  onSelect: (key: T | null) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
};

function FilterRow<T extends string>({ label, items, active, onSelect, styles, colors }: FilterRowProps<T>) {
  return (
    <View>
      <Text style={styles.filterSectionLabel}>{label}</Text>
      <View style={styles.filterChipsWrap}>
        {items.map(item => {
          const isActive = active === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => onSelect(item.key)}
              style={[styles.filterChip, { backgroundColor: isActive ? colors.brand : colors.cardAlt, borderColor: isActive ? colors.brand : colors.borderLight }]}>
              <Text style={[styles.filterLabel, { color: isActive ? colors.white : colors.textMuted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ChargingStationsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState('');
  const [activeNetwork, setActiveNetwork] = useState<ChargingNetwork | null>(null);
  const [activeConnector, setActiveConnector] = useState<ConnectorType | null>(null);
  const [activeCurrent, setActiveCurrent] = useState<CurrentType | null>(null);
  const [activePower, setActivePower] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const allLabel = t('charging.filterAll');
  const networkItems = [{ key: null, label: allLabel }, ...CHARGING_NETWORKS.map(n => ({ key: n, label: n }))];
  const connectorItems = [
    { key: null, label: allLabel },
    ...Object.values(ConnectorType).map(c => ({ key: c, label: t(`charging.connector.${c}`) })),
  ];
  const currentItems: { key: CurrentType | null; label: string }[] = [
    { key: null, label: allLabel },
    { key: 'ac', label: t('charging.currentAc') },
    { key: 'dc', label: t('charging.currentDc') },
  ];
  const powerItems = [{ key: null, label: allLabel }, ...POWER_RANGES.map(r => ({ key: r.key, label: r.label }))];

  const activeFilterCount = [activeConnector, activeCurrent, activePower].filter(Boolean).length;

  const stations = filterStations({ network: activeNetwork, connector: activeConnector, currentType: activeCurrent, powerRangeKey: activePower }).filter(s =>
    matchesQuery(s, query),
  );

  const focusStation = (station: ChargingStation) => {
    setSelectedId(station.id);
    mapRef.current?.animateToRegion({ latitude: station.lat, longitude: station.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400);
  };

  const recenter = () => mapRef.current?.animateToRegion(BAKU_REGION, 400);

  return (
    <View style={styles.screen}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={BAKU_REGION} userInterfaceStyle="dark">
        {stations.map(station => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.lat, longitude: station.lng }}
            pinColor={station.portsAvailable > 0 ? colors.brand : colors.textFaded}
            onPress={() => setSelectedId(station.id)}>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{station.name}</Text>
                <Text style={styles.calloutLine}>
                  {station.network} · {station.address}
                </Text>
                <Text style={styles.calloutLine}>{t('charging.available', { count: station.portsAvailable, total: station.portsTotal })}</Text>
                <Text style={styles.calloutLine}>
                  {station.powerKw} kW · {t(station.currentType === 'dc' ? 'charging.currentDc' : 'charging.currentAc')}
                </Text>
                <Text style={styles.calloutLine}>{station.connectors.map(c => t(`charging.connector.${c}`)).join(', ')}</Text>
                <View style={styles.calloutNavRow}>
                  <Pressable onPress={() => openGoogleMaps(station)} style={styles.calloutNavBtn}>
                    <Text style={styles.calloutNavBtnText}>🗺️ {t('charging.googleMaps')}</Text>
                  </Pressable>
                  <Pressable onPress={() => openWaze(station)} style={styles.calloutNavBtn}>
                    <Text style={styles.calloutNavBtnText}>🚗 {t('charging.waze')}</Text>
                  </Pressable>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backCircle}>
            <Text style={styles.backCircleText}>←</Text>
          </Pressable>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('charging.searchPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={styles.searchInput}
            />
          </View>
          <Pressable onPress={() => setFilterModalOpen(true)} style={styles.filterBtn}>
            <Text style={styles.filterBtnIcon}>⚙</Text>
            <Text style={styles.filterBtnText}>{t('charging.filterBtn')}</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsRow}>
          {networkItems.map(item => {
            const isActive = activeNetwork === item.key;
            return (
              <Pressable
                key={String(item.key)}
                onPress={() => setActiveNetwork(item.key)}
                style={[styles.quickChip, isActive && styles.quickChipActive]}>
                <Text style={[styles.quickChipText, isActive && styles.quickChipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Pressable style={[styles.recenterBtn, { bottom: insets.bottom + 130 }]} onPress={recenter} hitSlop={8}>
        <Text style={styles.recenterIcon}>◎</Text>
      </Pressable>

      <View style={[styles.bottomCarousel, { paddingBottom: insets.bottom + 10 }]}>
        {stations.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>{t('charging.noResults')}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
            {stations.map(station => {
              const selected = selectedId === station.id;
              const hasAvailable = station.portsAvailable > 0;
              return (
                <Pressable
                  key={station.id}
                  onPress={() => focusStation(station)}
                  style={[styles.card, { borderColor: selected ? colors.brand : 'transparent' }]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {station.name}
                    </Text>
                    <View style={[styles.availabilityBadge, { backgroundColor: hasAvailable ? colors.brand : colors.cardAlt }]}>
                      <Text style={[styles.availabilityText, { color: hasAvailable ? colors.white : colors.textFaded }]}>
                        {t('charging.available', { count: station.portsAvailable, total: station.portsTotal })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardNetwork}>{station.network}</Text>
                  <Text style={styles.cardAddress} numberOfLines={1}>
                    {station.address}
                  </Text>
                  <Text style={styles.cardPower}>
                    {station.powerKw} kW · {t(station.currentType === 'dc' ? 'charging.currentDc' : 'charging.currentAc')}
                  </Text>
                  <View style={styles.cardNavRow}>
                    <Pressable
                      onPress={e => {
                        e.stopPropagation();
                        openGoogleMaps(station);
                      }}
                      style={styles.cardNavBtn}>
                      <Text style={styles.cardNavBtnText}>🗺️ {t('charging.googleMaps')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={e => {
                        e.stopPropagation();
                        openWaze(station);
                      }}
                      style={styles.cardNavBtn}>
                      <Text style={styles.cardNavBtnText}>🚗 {t('charging.waze')}</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Modal visible={filterModalOpen} transparent animationType="slide" onRequestClose={() => setFilterModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('charging.filterBtn')}</Text>
            <Pressable onPress={() => setFilterModalOpen(false)} hitSlop={10}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <FilterRow label={t('charging.filterConnectorLabel')} items={connectorItems} active={activeConnector} onSelect={setActiveConnector} styles={styles} colors={colors} />
            <FilterRow label={t('charging.filterCurrentLabel')} items={currentItems} active={activeCurrent} onSelect={setActiveCurrent} styles={styles} colors={colors} />
            <FilterRow label={t('charging.filterPowerLabel')} items={powerItems} active={activePower} onSelect={setActivePower} styles={styles} colors={colors} />
          </ScrollView>
          <Pressable style={styles.modalApplyBtn} onPress={() => setFilterModalOpen(false)}>
            <Text style={styles.modalApplyBtnText}>{t('charging.showResults', { count: stations.length })}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: 10 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg },
    backCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(20,20,22,0.82)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backCircleText: { color: '#fff', fontSize: 18 },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(20,20,22,0.82)',
      borderRadius: 999,
      paddingHorizontal: 14,
      height: 40,
    },
    searchIcon: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14, padding: 0 },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(20,20,22,0.82)',
      borderRadius: 999,
      paddingHorizontal: 14,
      height: 40,
    },
    filterBtnIcon: { color: '#fff', fontSize: 14 },
    filterBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    filterBadge: { backgroundColor: colors.brand, borderRadius: 999, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    filterBadgeText: { color: colors.white, fontSize: 9.5, fontWeight: '800' },
    quickChipsRow: { paddingHorizontal: spacing.lg, paddingTop: 10, gap: 8 },
    quickChip: { backgroundColor: 'rgba(20,20,22,0.82)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    quickChipActive: { backgroundColor: colors.brand },
    quickChipText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
    quickChipTextActive: { color: colors.white },
    recenterBtn: {
      position: 'absolute',
      right: spacing.lg,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(20,20,22,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recenterIcon: { color: '#fff', fontSize: 18 },
    callout: {
      minWidth: 210,
      gap: 2,
      padding: 10,
      backgroundColor: '#ffffff',
      borderRadius: radius.md,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    calloutTitle: { fontWeight: '800', fontSize: 13, color: '#161616' },
    calloutLine: { fontSize: 11.5, color: '#4a4a4a' },
    calloutNavRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
    calloutNavBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: radius.sm, paddingVertical: 6, alignItems: 'center' },
    calloutNavBtnText: { fontSize: 10.5, fontWeight: '700', color: '#161616' },
    bottomCarousel: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    carouselContent: { paddingHorizontal: spacing.lg, gap: 12 },
    noResults: { marginHorizontal: spacing.lg, backgroundColor: 'rgba(20,20,22,0.9)', borderRadius: radius.lg, padding: 16, alignItems: 'center' },
    noResultsText: { color: '#fff', fontSize: 12.5 },
    card: {
      width: 240,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      padding: 14,
      gap: 4,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    cardTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text },
    availabilityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    availabilityText: { fontSize: 10, fontWeight: '700' },
    cardNetwork: { fontSize: 11.5, fontWeight: '600', color: colors.brand },
    cardAddress: { fontSize: 11.5, color: colors.textMuted },
    cardPower: { fontSize: 11.5, color: colors.textMuted },
    cardNavRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    cardNavBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
    cardNavBtnText: { fontSize: 11, fontWeight: '700', color: colors.text },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '75%',
      paddingTop: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: 12,
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
    modalClose: { fontSize: 16, color: colors.textMuted },
    modalBody: { paddingHorizontal: spacing.xl, gap: 16, paddingBottom: 10 },
    modalApplyBtn: { marginHorizontal: spacing.xl, marginTop: 8, backgroundColor: colors.brand, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
    modalApplyBtnText: { color: colors.white, fontSize: 14.5, fontWeight: '700' },
    filterSectionLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textFaded,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    filterChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
    filterLabel: { fontSize: 12.5, fontWeight: '600' },
  });
