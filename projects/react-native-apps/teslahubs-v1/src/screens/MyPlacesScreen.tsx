import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MyPlace, useMyPlaces } from '../context/MyPlacesContext';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPlaces'>;

const BAKU_REGION: Region = { latitude: 40.39, longitude: 49.86, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export default function MyPlacesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { places, addPlace, updatePlace, removePlace } = useMyPlaces();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [pickerCoords, setPickerCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: BAKU_REGION.latitude,
    longitude: BAKU_REGION.longitude,
  });

  const canSave = label.trim() && address.trim();

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setAddress('');
    setNote('');
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
    setCoords(place.lat != null && place.lng != null ? { lat: place.lat, lng: place.lng } : null);
    setFormOpen(true);
  };

  const openMapPicker = () => {
    setPickerCoords(coords ? { latitude: coords.lat, longitude: coords.lng } : { latitude: BAKU_REGION.latitude, longitude: BAKU_REGION.longitude });
    setMapOpen(true);
  };

  const confirmMapPicker = () => {
    setCoords({ lat: pickerCoords.latitude, lng: pickerCoords.longitude });
    if (!address.trim()) {
      setAddress(`${pickerCoords.latitude.toFixed(5)}, ${pickerCoords.longitude.toFixed(5)}`);
    }
    setMapOpen(false);
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      label: label.trim(),
      address: address.trim(),
      note: note.trim() || undefined,
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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('myplaces.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {places.length === 0 && !formOpen && <Text style={styles.emptyText}>{t('myplaces.empty')}</Text>}

        {places.map(place => (
          <View key={place.id} style={styles.card}>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardLabel}>{place.label}</Text>
              <Text style={styles.cardAddress}>{place.address}</Text>
              {place.note && <Text style={styles.cardNote}>{place.note}</Text>}
            </View>
            <View style={styles.cardActions}>
              <Pressable onPress={() => startEdit(place)} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>✎</Text>
              </Pressable>
              <Pressable onPress={() => removePlace(place.id)} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🗑</Text>
              </Pressable>
            </View>
          </View>
        ))}

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
              <View style={styles.addressLabelRow}>
                <Text style={styles.label}>{t('myplaces.address')}</Text>
                <Pressable onPress={openMapPicker} style={styles.mapPickBtn}>
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

      <Modal visible={mapOpen} animationType="slide" onRequestClose={() => setMapOpen(false)}>
        <SafeAreaView style={styles.mapScreen} edges={['top']}>
          <View style={styles.mapHeader}>
            <Pressable onPress={() => setMapOpen(false)} hitSlop={10} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <Text style={styles.title}>{t('myplaces.pickFromMap')}</Text>
            <View style={styles.backBtn} />
          </View>
          <MapView
            style={styles.map}
            initialRegion={{ ...BAKU_REGION, latitude: pickerCoords.latitude, longitude: pickerCoords.longitude }}
            onPress={e => setPickerCoords(e.nativeEvent.coordinate)}>
            <Marker
              coordinate={pickerCoords}
              draggable
              onDragEnd={e => setPickerCoords(e.nativeEvent.coordinate)}
            />
          </MapView>
          <View style={styles.mapFooter}>
            <Text style={styles.mapCoordsText}>
              📍 {pickerCoords.latitude.toFixed(5)}, {pickerCoords.longitude.toFixed(5)}
            </Text>
            <Pressable style={styles.saveBtn} onPress={confirmMapPicker}>
              <Text style={styles.saveBtnText}>{t('myplaces.confirmLocation')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: 14 },
    backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.text, fontSize: 18 },
    title: { fontSize: 17, fontWeight: '800', color: colors.text },
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
    cardTextWrap: { flex: 1, gap: 3 },
    cardLabel: { fontSize: 14.5, fontWeight: '800', color: colors.text },
    cardAddress: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 17 },
    cardNote: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
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
    addressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mapPickBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.cardAlt },
    mapPickBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.brand },
    coordsHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    mapScreen: { flex: 1, backgroundColor: colors.bg },
    mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: 14 },
    map: { flex: 1 },
    mapFooter: { padding: spacing.xl, gap: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.borderLight },
    mapCoordsText: { fontSize: 12.5, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.cardAlt },
    cancelBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
    saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.brand },
    saveBtnDisabled: { backgroundColor: colors.borderLight },
    saveBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.white },
  });
