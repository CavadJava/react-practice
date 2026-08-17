import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MyPlace, useMyPlaces } from '../context/MyPlacesContext';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import MapPickerModal from '../components/MapPickerModal';
import LocationActionSheet from '../components/LocationActionSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPlaces'>;

const BAKU_REGION: Region = { latitude: 40.4093, longitude: 49.8671, latitudeDelta: 0.12, longitudeDelta: 0.12 };

const PLACE_ICONS = ['🏠', '🏢', '🏬', '⛽', '🏭', '🅿️', '🛠️', '⭐'];
const DEFAULT_ICON = '📍';

export default function MyPlacesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { places, addPlace, updatePlace, removePlace } = useMyPlaces();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [icon, setIcon] = useState(PLACE_ICONS[0]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [placesMapOpen, setPlacesMapOpen] = useState(false);
  const [routePlace, setRoutePlace] = useState<MyPlace | null>(null);

  const placesWithCoords = places.filter((p): p is MyPlace & { lat: number; lng: number } => p.lat != null && p.lng != null);

  const canSave = label.trim() && address.trim();

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setAddress('');
    setNote('');
    setIcon(PLACE_ICONS[0]);
    setCoords(null);
    setFormOpen(false);
  };

  const startAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const startEdit = (place: MyPlace) => {
    setEditingId(place.id);
    setLabel(place.label);
    setAddress(place.address);
    setNote(place.note ?? '');
    setIcon(place.icon ?? PLACE_ICONS[0]);
    setCoords(place.lat != null && place.lng != null ? { lat: place.lat, lng: place.lng } : null);
    setFormOpen(true);
  };

  const handlePlacePress = (place: MyPlace) => {
    if (place.lat != null && place.lng != null) setRoutePlace(place);
  };

  const confirmMapPicker = (picked: { lat: number; lng: number }) => {
    setCoords(picked);
    if (!address.trim()) {
      setAddress(`${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`);
    }
    setMapOpen(false);
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      label: label.trim(),
      address: address.trim(),
      note: note.trim() || undefined,
      icon,
      lat: coords?.lat,
      lng: coords?.lng,
    };
    if (editingId) {
      updatePlace(editingId, payload);
    } else {
      addPlace(payload);
    }
    resetForm();
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('myplaces.title')}</Text>
        {placesWithCoords.length > 0 ? (
          <Pressable onPress={() => setPlacesMapOpen(true)} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.mapToggleText}>🗺</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {places.length === 0 && !formOpen && <Text style={styles.emptyText}>{t('myplaces.empty')}</Text>}

        {places.map(place => {
          const hasCoords = place.lat != null && place.lng != null;
          return (
            <Pressable
              key={place.id}
              style={({ pressed }) => [styles.card, pressed && hasCoords && styles.cardPressed]}
              onPress={() => handlePlacePress(place)}
              disabled={!hasCoords}>
              <View style={styles.cardIconWrap}>
                <Text style={styles.cardIcon}>{place.icon ?? DEFAULT_ICON}</Text>
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardLabel}>{place.label}</Text>
                <Text style={styles.cardAddress}>{place.address}</Text>
                {place.note && <Text style={styles.cardNote}>{place.note}</Text>}
                {hasCoords && <Text style={styles.cardRouteHint}>🧭 {t('myplaces.tapToRoute')}</Text>}
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => startEdit(place)} style={styles.iconBtn} hitSlop={6}>
                  <Text style={styles.iconBtnText}>✎</Text>
                </Pressable>
                <Pressable onPress={() => removePlace(place.id)} style={styles.iconBtn} hitSlop={6}>
                  <Text style={styles.iconBtnText}>🗑</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}

        {formOpen ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingId ? t('myplaces.editTitle') : t('myplaces.addTitle')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('myplaces.label')}</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder={t('myplaces.labelPlaceholder')}
                placeholderTextColor={colors.textFaded}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('myplaces.icon')}</Text>
              <View style={styles.iconPickerRow}>
                {PLACE_ICONS.map(item => {
                  const isActive = icon === item;
                  return (
                    <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconOption, isActive && styles.iconOptionActive]}>
                      <Text style={styles.iconOptionText}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.field}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.label}>{t('myplaces.address')}</Text>
                <Pressable onPress={() => setMapOpen(true)} style={styles.mapPickBtn}>
                  <Text style={styles.mapPickBtnText}>🗺 {t('myplaces.pickFromMap')}</Text>
                </Pressable>
              </View>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={t('myplaces.addressPlaceholder')}
                placeholderTextColor={colors.textFaded}
                style={[styles.input, styles.textarea]}
                multiline
                numberOfLines={3}
              />
              {coords && (
                <Text style={styles.coordsHint}>
                  📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </Text>
              )}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('myplaces.note')}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('myplaces.notePlaceholder')}
                placeholderTextColor={colors.textFaded}
                style={styles.input}
              />
            </View>
            <View style={styles.formActions}>
              <Pressable style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>{t('myplaces.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={handleSave} disabled={!canSave}>
                <Text style={styles.saveBtnText}>{t('myplaces.save')}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.addBtn} onPress={startAdd}>
            <Text style={styles.addBtnText}>+ {t('myplaces.addTitle')}</Text>
          </Pressable>
        )}
      </ScrollView>

      <MapPickerModal visible={mapOpen} initialCoords={coords} onClose={() => setMapOpen(false)} onConfirm={confirmMapPicker} />

      <Modal visible={placesMapOpen} animationType="slide" onRequestClose={() => setPlacesMapOpen(false)}>
        <SafeAreaView style={styles.screen} edges={[]}>
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <Pressable onPress={() => setPlacesMapOpen(false)} hitSlop={10} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <Text style={styles.title}>{t('myplaces.mapViewTitle')}</Text>
            <View style={styles.backBtn} />
          </View>
          <MapView
            style={styles.placesMap}
            initialRegion={
              placesWithCoords.length === 1
                ? { latitude: placesWithCoords[0].lat, longitude: placesWithCoords[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
                : BAKU_REGION
            }>
            {placesWithCoords.map(place => (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={place.label}
                description={place.address}
                onCalloutPress={() => {
                  setPlacesMapOpen(false);
                  setRoutePlace(place);
                }}>
                <View style={styles.markerBadge}>
                  <Text style={styles.markerIcon}>{place.icon ?? DEFAULT_ICON}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </SafeAreaView>
      </Modal>

      {routePlace && routePlace.lat != null && routePlace.lng != null && (
        <LocationActionSheet visible={!!routePlace} onClose={() => setRoutePlace(null)} lat={routePlace.lat} lng={routePlace.lng} />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: 14 },
    backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.text, fontSize: 18 },
    mapToggleText: { fontSize: 16 },
    title: { fontSize: 17, fontWeight: '800', color: colors.text },
    placesMap: { flex: 1 },
    markerBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerIcon: { fontSize: 16 },
    content: { padding: spacing.xl, gap: 12, paddingBottom: 40 },
    emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 30 },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 14,
      gap: 10,
    },
    cardPressed: { opacity: 0.75 },
    cardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.brandMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIcon: { fontSize: 17 },
    cardTextWrap: { flex: 1, gap: 3 },
    cardLabel: { fontSize: 14.5, fontWeight: '800', color: colors.text },
    cardAddress: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 17 },
    cardNote: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
    cardRouteHint: { fontSize: 11, color: colors.brand, fontWeight: '600', marginTop: 4 },
    cardActions: { flexDirection: 'row', gap: 6 },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnText: { fontSize: 13, color: colors.text },
    addBtn: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
      paddingVertical: 14,
      alignItems: 'center',
    },
    addBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.brand },
    form: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderLight, padding: 16, gap: 10 },
    formTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text, marginBottom: 2 },
    field: { gap: 6 },
    label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    input: {
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: colors.text,
      fontSize: 14,
    },
    textarea: { minHeight: 66, textAlignVertical: 'top' },
    iconPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    iconOption: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.cardAlt,
      borderWidth: 1.5,
      borderColor: colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconOptionActive: { borderColor: colors.brand, backgroundColor: colors.brandMuted },
    iconOptionText: { fontSize: 17 },
    addressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mapPickBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.cardAlt },
    mapPickBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
    coordsHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.cardAlt },
    cancelBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
    saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.brand },
    saveBtnDisabled: { backgroundColor: colors.borderLight },
    saveBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.white },
  });
