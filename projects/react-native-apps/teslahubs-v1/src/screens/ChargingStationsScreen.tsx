import React, { useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import HeaderBar from '../components/HeaderBar';

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        {items.map(item => {
          const isActive = active === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => onSelect(item.key)}
              style={[styles.filterChip, { backgroundColor: isActive ? colors.brand : 'transparent', borderColor: isActive ? colors.brand : colors.borderLight }]}>
              <Text style={[styles.filterLabel, { color: isActive ? colors.white : colors.textMuted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function ChargingStationsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const mapRef = useRef<MapView>(null);
  const [activeNetwork, setActiveNetwork] = useState<ChargingNetwork | null>(null);
  const [activeConnector, setActiveConnector] = useState<ConnectorType | null>(null);
  const [activeCurrent, setActiveCurrent] = useState<CurrentType | null>(null);
  const [activePower, setActivePower] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const stations = filterStations({ network: activeNetwork, connector: activeConnector, currentType: activeCurrent, powerRangeKey: activePower });

  const focusStation = (station: ChargingStation) => {
    setSelectedId(station.id);
    mapRef.current?.animateToRegion({ latitude: station.lat, longitude: station.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <HeaderBar title={t('charging.title')} onBack={() => navigation.goBack()} />

      <FilterRow label={t('charging.filterNetworkLabel')} items={networkItems} active={activeNetwork} onSelect={setActiveNetwork} styles={styles} colors={colors} />
      <FilterRow label={t('charging.filterConnectorLabel')} items={connectorItems} active={activeConnector} onSelect={setActiveConnector} styles={styles} colors={colors} />
      <FilterRow label={t('charging.filterCurrentLabel')} items={currentItems} active={activeCurrent} onSelect={setActiveCurrent} styles={styles} colors={colors} />
      <FilterRow label={t('charging.filterPowerLabel')} items={powerItems} active={activePower} onSelect={setActivePower} styles={styles} colors={colors} />

      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={BAKU_REGION}>
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
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {stations.map(station => {
          const selected = selectedId === station.id;
          const hasAvailable = station.portsAvailable > 0;
          return (
            <Pressable
              key={station.id}
              onPress={() => focusStation(station)}
              style={[styles.card, { borderColor: selected ? colors.brand : colors.borderLight }]}>
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
              <View style={styles.connectorRow}>
                {station.connectors.map(c => (
                  <View key={c} style={styles.connectorChip}>
                    <Text style={styles.connectorChipText}>{t(`charging.connector.${c}`)}</Text>
                  </View>
                ))}
              </View>
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
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    filterSectionLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textFaded,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      paddingHorizontal: spacing.xl,
      marginBottom: 4,
    },
    filterList: { flexGrow: 0, flexShrink: 0 },
    filterRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
    filterLabel: { fontSize: 12, fontWeight: '600' },
    mapWrap: { height: 200, marginHorizontal: spacing.xl, marginTop: 4, marginBottom: spacing.md, borderRadius: radius.xl, overflow: 'hidden' },
    map: { flex: 1 },
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
    list: { flex: 1 },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: 10 },
    card: { backgroundColor: colors.cardAlt, borderRadius: radius.lg, borderWidth: 1.5, padding: 14, gap: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cardTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text },
    availabilityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    availabilityText: { fontSize: 10.5, fontWeight: '700' },
    cardNetwork: { fontSize: 11.5, fontWeight: '600', color: colors.brand },
    cardAddress: { fontSize: 11.5, color: colors.textMuted },
    cardPower: { fontSize: 11.5, color: colors.textMuted },
    connectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    connectorChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.surface },
    connectorChipText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
    cardNavRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    cardNavBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
    cardNavBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.text },
  });
