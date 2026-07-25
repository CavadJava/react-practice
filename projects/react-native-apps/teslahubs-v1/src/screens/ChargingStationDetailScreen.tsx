import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChargingStationsStackParamList, RootStackParamList } from '../navigation/types';
import { getChargingStation } from '../data/chargingStations';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import LocationActionSheet from '../components/LocationActionSheet';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ChargingStationsStackParamList, 'ChargingStationDetail'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Tab = 'location' | 'connectors' | 'reviews';

const TAB_LABEL_KEYS: Record<Tab, string> = {
  location: 'charging.tabLocation',
  connectors: 'charging.tabConnectors',
  reviews: 'charging.tabReviews',
};

export default function ChargingStationDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const station = getChargingStation(route.params.stationId);
  const [tab, setTab] = useState<Tab>('connectors');
  const [favorited, setFavorited] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!station) return null;

  const handleShare = () => {
    Share.share({ message: `${station.name} — ${station.address}` });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <View style={styles.photo}>
          <Text style={styles.photoIcon}>⚡</Text>
        </View>

        <View style={[styles.headerIconsRow, { top: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerIconsRight}>
            <Pressable onPress={() => setFavorited(f => !f)} style={styles.iconBtn} hitSlop={8}>
              <Text style={[styles.iconText, favorited && { color: colors.brand }]}>{favorited ? '♥' : '♡'}</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.iconText}>⇪</Text>
            </Pressable>
            <Pressable onPress={() => setSheetOpen(true)} style={styles.iconBtn} hitSlop={8}>
              <Text style={styles.iconText}>▤</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{t('category.other')}</Text>
          </View>
          <Text style={styles.stationName}>{station.name}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(Object.keys(TAB_LABEL_KEYS) as Tab[]).map(key => {
          const active = tab === key;
          return (
            <Pressable key={key} style={styles.tabItem} onPress={() => setTab(key)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(TAB_LABEL_KEYS[key])}</Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {tab === 'location' && (
          <View style={styles.locationTab}>
            <Text style={styles.addressText}>📍 {station.address}</Text>
            <Text style={styles.hoursText}>{station.is24h ? t('charging.open247') : t('charging.limitedHours')}</Text>
            <Text style={styles.networkText}>{station.network}</Text>
            <Pressable style={styles.routeBtn} onPress={() => setSheetOpen(true)}>
              <Text style={styles.routeBtnText}>{t('charging.routeSheetTitle')}</Text>
            </Pressable>
          </View>
        )}

        {tab === 'connectors' &&
          station.connectors.map(c => (
            <View key={c} style={styles.connectorCard}>
              <View style={styles.connectorCardLeft}>
                <Text style={styles.connectorLabel}>{t('charging.maxPower')}</Text>
                <View style={styles.connectorPowerRow}>
                  <Text style={styles.connectorPower}>{station.powerKw}</Text>
                  <Text style={styles.connectorPowerUnit}>kW</Text>
                </View>
                <Text style={styles.connectorNA}>N/A</Text>
              </View>
              <View style={styles.connectorCardRight}>
                <Text style={styles.connectorType}>{t(`charging.connector.${c}`)}</Text>
                <Text style={styles.connectorIcon}>🔌</Text>
              </View>
            </View>
          ))}

        {tab === 'reviews' && (
          <View style={styles.reviewsEmpty}>
            <View style={styles.reviewsIconCircle}>
              <Text style={styles.reviewsIcon}>★</Text>
            </View>
            <Text style={styles.reviewsEmptyText}>{t('charging.noReviewsYet')}</Text>
          </View>
        )}
      </ScrollView>

      <LocationActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        lat={station.lat}
        lng={station.lng}
        onViewOnMap={() => navigation.goBack()}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    headerArea: { backgroundColor: colors.cardAlt },
    photo: { height: 260, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    photoIcon: { fontSize: 56, color: colors.brand },
    headerIconsRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
    },
    headerIconsRight: { flexDirection: 'row', gap: 8 },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(20,20,22,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: { color: '#fff', fontSize: 16 },
    titleBlock: { paddingHorizontal: spacing.xl, paddingTop: 10, paddingBottom: 16, gap: 8 },
    categoryTag: { alignSelf: 'flex-start', flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    categoryTagText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
    stationName: { fontSize: 20, fontWeight: '800', color: colors.text },
    tabBar: { flexDirection: 'row', backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.divider },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 8 },
    tabLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textMuted },
    tabLabelActive: { color: colors.text },
    tabIndicator: { position: 'absolute', bottom: 0, height: 2, width: '60%', backgroundColor: colors.brand },
    body: { flex: 1 },
    bodyContent: { padding: spacing.xl, gap: 12 },
    locationTab: { gap: 8 },
    addressText: { fontSize: 14.5, fontWeight: '600', color: colors.text },
    hoursText: { fontSize: 12.5, color: colors.textMuted },
    networkText: { fontSize: 12.5, fontWeight: '600', color: colors.brand },
    routeBtn: { marginTop: 10, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.lg, paddingVertical: 13, alignItems: 'center' },
    routeBtnText: { color: colors.brand, fontSize: 14, fontWeight: '700' },
    connectorCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.cardAlt,
      borderRadius: radius.lg,
      padding: 16,
    },
    connectorCardLeft: { gap: 4 },
    connectorLabel: { fontSize: 12.5, color: colors.textMuted },
    connectorPowerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    connectorPower: { fontSize: 26, fontWeight: '800', color: colors.text },
    connectorPowerUnit: { fontSize: 13, color: colors.textMuted },
    connectorNA: { fontSize: 12.5, fontWeight: '700', color: '#E0B23D' },
    connectorCardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
    connectorType: { fontSize: 12.5, color: colors.textMuted },
    connectorIcon: { fontSize: 24, marginTop: 8 },
    reviewsEmpty: { alignItems: 'center', paddingTop: 60, gap: 14 },
    reviewsIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
    reviewsIcon: { fontSize: 24, color: colors.textFaded },
    reviewsEmptyText: { fontSize: 13.5, color: colors.textMuted },
  });
