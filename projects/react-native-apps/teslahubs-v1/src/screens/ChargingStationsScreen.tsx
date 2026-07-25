import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import { CHARGING_NETWORKS, ChargingNetwork, ChargingStation, getStationsByNetwork } from '../data/chargingStations';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import HeaderBar from '../components/HeaderBar';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'ChargingStations'>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

const BAKU_REGION: Region = { latitude: 40.39, longitude: 49.86, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export default function ChargingStationsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const mapRef = useRef<MapView>(null);
  const [activeNetwork, setActiveNetwork] = useState<ChargingNetwork | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: { key: ChargingNetwork | null; label: string }[] = [
    { key: null, label: t('charging.filterAll') },
    ...CHARGING_NETWORKS.map(network => ({ key: network, label: network })),
  ];

  const stations = getStationsByNetwork(activeNetwork);

  const focusStation = (station: ChargingStation) => {
    setSelectedId(station.id);
    mapRef.current?.animateToRegion({ latitude: station.lat, longitude: station.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <HeaderBar title={t('charging.title')} onBack={() => navigation.goBack()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        {filters.map(item => {
          const active = activeNetwork === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => setActiveNetwork(item.key)}
              style={[styles.filterChip, { backgroundColor: active ? colors.brand : 'transparent', borderColor: active ? colors.brand : colors.borderLight }]}>
              <Text style={[styles.filterLabel, { color: active ? colors.white : colors.textMuted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={BAKU_REGION}>
          {stations.map(station => (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.lat, longitude: station.lng }}
              pinColor={station.portsAvailable > 0 ? colors.brand : colors.textFaded}
              onPress={() => setSelectedId(station.id)}>
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{station.name}</Text>
                  <Text style={styles.calloutLine}>
                    {station.network} · {station.address}
                  </Text>
                  <Text style={styles.calloutLine}>{t('charging.available', { count: station.portsAvailable, total: station.portsTotal })}</Text>
                  <Text style={styles.calloutLine}>{station.connectors.map(c => t(`charging.connector.${c}`)).join(', ')}</Text>
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
              <View style={styles.connectorRow}>
                {station.connectors.map(c => (
                  <View key={c} style={styles.connectorChip}>
                    <Text style={styles.connectorChipText}>{t(`charging.connector.${c}`)}</Text>
                  </View>
                ))}
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
    filterList: { flexGrow: 0, flexShrink: 0 },
    filterRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
    filterLabel: { fontSize: 12.5, fontWeight: '600' },
    mapWrap: { height: 220, marginHorizontal: spacing.xl, marginBottom: spacing.md, borderRadius: radius.xl, overflow: 'hidden' },
    map: { flex: 1 },
    callout: { minWidth: 200, gap: 2, padding: 4 },
    calloutTitle: { fontWeight: '800', fontSize: 13, color: '#161616' },
    calloutLine: { fontSize: 11.5, color: '#4a4a4a' },
    list: { flex: 1 },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: 10 },
    card: { backgroundColor: colors.cardAlt, borderRadius: radius.lg, borderWidth: 1.5, padding: 14, gap: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cardTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text },
    availabilityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    availabilityText: { fontSize: 10.5, fontWeight: '700' },
    cardNetwork: { fontSize: 11.5, fontWeight: '600', color: colors.brand },
    cardAddress: { fontSize: 11.5, color: colors.textMuted },
    connectorRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
    connectorChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.surface },
    connectorChipText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  });
