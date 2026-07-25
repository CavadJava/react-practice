import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import { ConnectorType, getStationsByConnector } from '../data/chargingStations';
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
  const [activeConnector, setActiveConnector] = useState<ConnectorType | null>(null);

  const filters: { key: ConnectorType | null; label: string }[] = [
    { key: null, label: t('charging.filterAll') },
    ...Object.values(ConnectorType).map(key => ({ key, label: t(`charging.connector.${key}`) })),
  ];

  const stations = getStationsByConnector(activeConnector);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <HeaderBar title={t('charging.title')} onBack={() => navigation.goBack()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        {filters.map(item => {
          const active = activeConnector === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => setActiveConnector(item.key)}
              style={[styles.filterChip, { backgroundColor: active ? colors.brand : 'transparent', borderColor: active ? colors.brand : colors.borderLight }]}>
              <Text style={[styles.filterLabel, { color: active ? colors.white : colors.textMuted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView style={styles.map} initialRegion={BAKU_REGION}>
          {stations.map(station => (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.lat, longitude: station.lng }}
              pinColor={station.portsAvailable > 0 ? colors.brand : colors.textFaded}>
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
    mapWrap: { flex: 1, marginHorizontal: spacing.xl, marginBottom: spacing.xl, borderRadius: radius.xl, overflow: 'hidden' },
    map: { flex: 1 },
    callout: { minWidth: 200, gap: 2, padding: 4 },
    calloutTitle: { fontWeight: '800', fontSize: 13, color: '#161616' },
    calloutLine: { fontSize: 11.5, color: '#4a4a4a' },
  });
