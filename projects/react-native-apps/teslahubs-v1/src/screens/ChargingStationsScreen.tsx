import React, { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChargingStationsStackParamList, RootStackParamList } from '../navigation/types';
import {
  CHARGING_NETWORKS,
  ChargingNetwork,
  ChargingStation,
  ConnectorType,
  CurrentType,
  POWER_RANGES,
  filterStations,
} from '../data/chargingStations';
import { ThemeColors, radius, spacing, withAlpha } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import LocationActionSheet from '../components/LocationActionSheet';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ChargingStationsStackParamList, 'ChargingStations'>,
  NativeStackScreenProps<RootStackParamList>
>;

const BAKU_REGION: Region = { latitude: 40.39, longitude: 49.86, latitudeDelta: 0.12, longitudeDelta: 0.12 };

// Fixed "Service" pin colors — independent of the app theme, matching the
// glowing charging-pin style: green when the station has open ports, purple
// when it doesn't.
const MARKER_AVAILABLE_COLOR = '#22C55E';
const MARKER_UNAVAILABLE_COLOR = '#8B5CF6';

const CARD_WIDTH = 240;
const CARD_GAP = 12;

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
  const carouselRef = useRef<ScrollView>(null);
  const [query, setQuery] = useState('');
  const [activeNetwork, setActiveNetwork] = useState<ChargingNetwork | null>(null);
  const [activeConnector, setActiveConnector] = useState<ConnectorType | null>(null);
  const [activeCurrent, setActiveCurrent] = useState<CurrentType | null>(null);
  const [activePower, setActivePower] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sheetStation, setSheetStation] = useState<ChargingStation | null>(null);

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

  const selectStation = (station: ChargingStation) => {
    setSelectedId(station.id);
    mapRef.current?.animateToRegion({ latitude: station.lat, longitude: station.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400);
    const index = stations.findIndex(s => s.id === station.id);
    if (index >= 0) {
      carouselRef.current?.scrollTo({ x: index * (CARD_WIDTH + CARD_GAP), animated: true });
    }
  };

  const recenter = () => mapRef.current?.animateToRegion(BAKU_REGION, 400);

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={BAKU_REGION}
        userInterfaceStyle="dark"
        showsPointsOfInterests={false}
        showsBuildings={false}>
        {stations.map(station => {
          const markerColor = station.portsAvailable > 0 ? MARKER_AVAILABLE_COLOR : MARKER_UNAVAILABLE_COLOR;
          return (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.lat, longitude: station.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => selectStation(station)}>
              <View style={[styles.markerGlow, { backgroundColor: withAlpha(markerColor, 0.28) }]}>
                <View style={[styles.markerBadge, { backgroundColor: markerColor }]}>
                  <Text style={styles.markerIcon}>⚡</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.backCircle}>
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
          <ScrollView ref={carouselRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
            {stations.map(station => {
              const selected = selectedId === station.id;
              return (
                <Pressable
                  key={station.id}
                  onPress={() => selectStation(station)}
                  style={[styles.card, { borderColor: selected ? colors.brand : 'transparent' }]}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{t('category.other')}</Text>
                    </View>
                    <Text style={styles.hoursTag}>{station.is24h ? t('charging.open247') : t('charging.limitedHours')}</Text>
                  </View>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {station.name}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>

                  <View style={styles.cardInnerPanel}>
                    <Text style={styles.cardNetwork}>{station.network}</Text>
                    <View style={styles.connectorRow}>
                      <Text style={styles.connectorRowIcon}>🔌</Text>
                      <Text style={styles.connectorRowText}>{t('charging.connectorsCount', { count: station.connectors.length })} ›</Text>
                    </View>
                    <View style={styles.cardStatsRow}>
                      <Text style={styles.cardPower}>{station.powerKw} kW</Text>
                      <Text style={styles.cardAvailable}>{t('charging.available', { count: station.portsAvailable, total: station.portsTotal })}</Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.viewInfoBtn}
                    onPress={e => {
                      e.stopPropagation();
                      navigation.navigate('ChargingStationDetail', { stationId: station.id });
                    }}>
                    <Text style={styles.viewInfoBtnText}>{t('charging.viewInfo')}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.directionsBtn}
                    onPress={e => {
                      e.stopPropagation();
                      setSheetStation(station);
                    }}>
                    <Text style={styles.directionsBtnIcon}>➤</Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <LocationActionSheet
        visible={!!sheetStation}
        onClose={() => setSheetStation(null)}
        lat={sheetStation?.lat ?? 0}
        lng={sheetStation?.lng ?? 0}
        onViewOnMap={() => {
          if (sheetStation) selectStation(sheetStation);
        }}
      />

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
    markerGlow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    markerBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.9)',
    },
    markerIcon: { fontSize: 14, color: '#fff' },
    bottomCarousel: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    carouselContent: { paddingHorizontal: spacing.lg, gap: CARD_GAP },
    noResults: { marginHorizontal: spacing.lg, backgroundColor: 'rgba(20,20,22,0.9)', borderRadius: radius.lg, padding: 16, alignItems: 'center' },
    noResultsText: { color: '#fff', fontSize: 12.5 },
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      padding: 14,
      gap: 6,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    directionsBtn: {
      position: 'absolute',
      top: -14,
      right: 12,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 5,
    },
    directionsBtnIcon: { fontSize: 14, color: colors.text, transform: [{ rotate: '-45deg' }] },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    categoryTag: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    categoryTagText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
    hoursTag: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
    cardNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
    chevron: { fontSize: 18, color: colors.textMuted },
    cardInnerPanel: { backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: 10, gap: 6, marginTop: 2 },
    cardNetwork: { fontSize: 11.5, fontWeight: '600', color: colors.brand },
    connectorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    connectorRowIcon: { fontSize: 13 },
    connectorRowText: { fontSize: 12, color: colors.text, fontWeight: '600' },
    cardStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardPower: { fontSize: 12.5, fontWeight: '700', color: colors.text },
    cardAvailable: { fontSize: 10.5, color: colors.textMuted },
    viewInfoBtn: { borderWidth: 1, borderColor: colors.brand, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', marginTop: 2 },
    viewInfoBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
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
