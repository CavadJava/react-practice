import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CarWashStackParamList, RootStackParamList } from '../navigation/types';
import { ADDON_SERVICES, FREE_SERVICES, TIME_SLOTS, VEHICLE_TYPES, VehicleType, getCarWashProvider } from '../data/carWash';
import { WHATSAPP_PHONE } from '../data/products';
import { CW_THEME } from '../theme/carWashTheme';
import { useLocale } from '../context/LocaleContext';
import { useCarWashBooking } from '../context/CarWashBookingContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CarWashStackParamList, 'CarWashBooking'>, NativeStackScreenProps<RootStackParamList>>;

function buildDateOptions(t: (key: string) => string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label = i === 0 ? t('carwash.today') : i === 1 ? t('carwash.tomorrow') : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label });
  }
  return options;
}

export default function CarWashBookingScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const { isSlotTaken, addBooking } = useCarWashBooking();
  const provider = getCarWashProvider(route.params.providerId);
  const branch = provider?.branches.find(b => b.id === route.params.branchId);

  const dateOptions = useMemo(() => buildDateOptions(t), [t]);

  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [date, setDate] = useState(dateOptions[0].value);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('994');
  const [submitted, setSubmitted] = useState(false);

  if (!provider || !branch) return null;

  const vehiclePrice = VEHICLE_TYPES.find(v => v.key === vehicleType)?.price ?? 0;
  const selectedAddonServices = ADDON_SERVICES.filter(a => selectedAddons.includes(a.id));
  const addonsTotal = selectedAddonServices.reduce((sum, a) => sum + a.price, 0);
  const total = vehiclePrice + addonsTotal;
  const canSend = !!(vehicleType && date && time && name.trim() && phone.trim());

  const missing: string[] = [];
  if (!vehicleType) missing.push(t('carwash.missingVehicle'));
  if (!time) missing.push(t('carwash.missingTime'));
  if (!name.trim()) missing.push(t('carwash.missingName'));
  if (!phone.trim()) missing.push(t('carwash.missingPhone'));
  const missingHint = missing.length ? `${t('carwash.missingPrefix')}${missing.join(', ')}` : '';

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSend = () => {
    if (!canSend || !vehicleType || !time) return;
    const vehicleLabel = VEHICLE_TYPES.find(v => v.key === vehicleType)?.label ?? '';

    addBooking({ providerId: provider.id, branchId: branch.id, date, time, vehicleType, addonIds: selectedAddons, customerName: name, customerPhone: phone, total });

    const lines = [
      'Salam!',
      '',
      'Yeni AvtoYuma rezervasiyası:',
      '',
      '━━━━━━━━━━━━━━',
      '🧼 Mərkəz',
      provider.name,
      '',
      '📍 Filial',
      branch.address,
      '',
      '🚗 Avtomobil növü',
      `${vehicleLabel} — ${vehiclePrice} ₼`,
      '',
      '➕ Əlavə xidmətlər',
      selectedAddonServices.length ? selectedAddonServices.map(a => `${a.name} — ${a.price} ₼`).join('\n') : 'Yoxdur',
      '',
      '📅 Tarix',
      date,
      '',
      '🕒 Saat',
      time,
      '',
      '👤 Müştəri',
      name,
      '',
      '📞 Telefon',
      `+${phone}`,
      '',
      '💵 Ümumi',
      `${total} ₼`,
      '━━━━━━━━━━━━━━',
      '',
      'Rezervasiyamın təsdiqlənməsini gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={provider.color} />
      <View style={[styles.header, { backgroundColor: provider.color }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('carwash.bookingTitle')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {provider.name} · {branch.address}
          </Text>
        </View>
      </View>

      {submitted ? (
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>{t('carwash.bookingSuccessTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('carwash.bookingSuccessSubtitle')}</Text>
          <Pressable style={[styles.successBtn, { backgroundColor: provider.color }]} onPress={() => navigation.getParent()?.goBack()}>
            <Text style={styles.successBtnText}>{t('carwash.backToHome')}</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>{t('carwash.freeServices')}</Text>
            <View style={styles.freeList}>
              {FREE_SERVICES.map(s => (
                <Text key={s} style={styles.freeItem}>
                  ✓ {s}
                </Text>
              ))}
            </View>

            <Text style={styles.sectionLabel}>{t('carwash.vehicleType')}</Text>
            <View style={styles.chipRow}>
              {VEHICLE_TYPES.map(v => {
                const active = vehicleType === v.key;
                return (
                  <Pressable
                    key={v.key}
                    onPress={() => setVehicleType(v.key)}
                    style={[styles.chip, active && { backgroundColor: provider.color, borderColor: provider.color }]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {v.label} · {v.price} ₼
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('carwash.addons')}</Text>
            <View style={styles.addonList}>
              {ADDON_SERVICES.map(a => {
                const active = selectedAddons.includes(a.id);
                return (
                  <Pressable key={a.id} onPress={() => toggleAddon(a.id)} style={styles.addonRow}>
                    <View style={[styles.checkbox, active && { backgroundColor: provider.color, borderColor: provider.color }]}>
                      {active && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.addonName}>{a.name}</Text>
                    <Text style={styles.addonPrice}>{a.price} ₼</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('carwash.dateLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRowScroll}>
              {dateOptions.map(d => {
                const active = date === d.value;
                return (
                  <Pressable
                    key={d.value}
                    onPress={() => {
                      setDate(d.value);
                      setTime(null);
                    }}
                    style={[styles.chip, active && { backgroundColor: provider.color, borderColor: provider.color }]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>{t('carwash.timeLabel')}</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map(slot => {
                const taken = isSlotTaken(provider.id, branch.id, date, slot);
                const active = time === slot;
                return (
                  <Pressable
                    key={slot}
                    disabled={taken}
                    onPress={() => setTime(slot)}
                    style={[styles.timeChip, active && { backgroundColor: provider.color, borderColor: provider.color }, taken && styles.timeChipTaken]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive, taken && styles.timeChipTakenText]}>
                      {taken ? t('carwash.slotTaken') : slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('carwash.contactInfo')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('carwash.customerName')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('carwash.customerNamePlaceholder')}
                placeholderTextColor={CW_THEME.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('carwash.customerPhone')}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t('carwash.customerPhonePlaceholder')}
                placeholderTextColor={CW_THEME.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('carwash.total')}</Text>
              <Text style={styles.totalValue}>{total} ₼</Text>
            </View>
            {!canSend && missingHint !== '' && <Text style={styles.missingHint}>{missingHint}</Text>}
            <Pressable
              style={[styles.sendBtn, { backgroundColor: canSend ? provider.color : CW_THEME.border }]}
              onPress={handleSend}
              disabled={!canSend}>
              <Text style={[styles.sendBtnText, { color: canSend ? CW_THEME.white : CW_THEME.textMuted }]}>{t('carwash.bookBtn')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CW_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: CW_THEME.white },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: CW_THEME.white },
  headerSubtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  flexOne: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: CW_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  freeList: { gap: 4 },
  freeItem: { fontSize: 12.5, color: CW_THEME.text, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRowScroll: { gap: 8, paddingRight: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: CW_THEME.border, backgroundColor: CW_THEME.card },
  chipText: { fontSize: 12.5, fontWeight: '600', color: CW_THEME.text },
  chipTextActive: { color: CW_THEME.white },
  addonList: { gap: 8 },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CW_THEME.card,
    borderWidth: 1,
    borderColor: CW_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: CW_THEME.border, alignItems: 'center', justifyContent: 'center' },
  checkboxMark: { fontSize: 12, fontWeight: '800', color: CW_THEME.white },
  addonName: { flex: 1, fontSize: 12.5, color: CW_THEME.text, fontWeight: '600' },
  addonPrice: { fontSize: 12.5, fontWeight: '700', color: CW_THEME.primary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: CW_THEME.border, backgroundColor: CW_THEME.card },
  timeChipTaken: { backgroundColor: CW_THEME.border, opacity: 0.6 },
  timeChipTakenText: { textDecorationLine: 'line-through' },
  field: { gap: 6, marginTop: 10 },
  label: { fontSize: 12, color: CW_THEME.textMuted, fontWeight: '600' },
  input: { backgroundColor: CW_THEME.card, borderWidth: 1, borderColor: CW_THEME.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: CW_THEME.text, fontSize: 14 },
  footer: { padding: 20, paddingBottom: 26, gap: 8, borderTopWidth: 1, borderTopColor: CW_THEME.border, backgroundColor: CW_THEME.bg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: CW_THEME.text },
  totalValue: { fontSize: 19, fontWeight: '800', color: CW_THEME.text },
  missingHint: { fontSize: 11.5, color: CW_THEME.primary, textAlign: 'center' },
  sendBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  sendBtnText: { fontSize: 15, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  successIcon: { fontSize: 44 },
  successTitle: { fontSize: 18, fontWeight: '800', color: CW_THEME.text, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: CW_THEME.textMuted, textAlign: 'center', lineHeight: 19 },
  successBtn: { marginTop: 16, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  successBtnText: { fontSize: 14, fontWeight: '700', color: CW_THEME.white },
});
