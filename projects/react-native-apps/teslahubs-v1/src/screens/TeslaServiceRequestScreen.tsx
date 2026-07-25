import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TeslaServiceStackParamList, RootStackParamList } from '../navigation/types';
import { TESLA_SERVICES } from '../data/teslaService';
import { WHATSAPP_PHONE } from '../data/products';
import { TS_THEME } from '../theme/teslaServiceTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<TeslaServiceStackParamList, 'TeslaServiceRequest'>, NativeStackScreenProps<RootStackParamList>>;

export default function TeslaServiceRequestScreen({ navigation, route }: Props) {
  const { t } = useLocale();

  const [serviceId, setServiceId] = useState<string | null>(route.params.serviceId ?? null);
  const [vehicleModel, setVehicleModel] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('994');
  const [submitted, setSubmitted] = useState(false);

  const canSend = !!(serviceId && vehicleModel.trim() && name.trim() && phone.trim());
  const missing: string[] = [];
  if (!serviceId) missing.push(t('teslaservice.missingService'));
  if (!vehicleModel.trim()) missing.push(t('teslaservice.missingVehicle'));
  if (!name.trim()) missing.push(t('teslaservice.missingName'));
  if (!phone.trim()) missing.push(t('teslaservice.missingPhone'));
  const missingHint = missing.length ? `${t('teslaservice.missingPrefix')}${missing.join(', ')}` : '';

  const handleSend = () => {
    if (!canSend) return;
    const service = TESLA_SERVICES.find(s => s.id === serviceId);

    const lines = [
      'Salam!',
      '',
      'Yeni Tesla Servis müraciəti:',
      '',
      '━━━━━━━━━━━━━━',
      '🔧 Xidmət növü',
      service?.name ?? '',
      '',
      '🚗 Avtomobil modeli',
      vehicleModel,
      '',
      '📝 Problemin təsviri',
      description.trim() || 'Qeyd edilməyib',
      '',
      '👤 Müştəri',
      name,
      '',
      '📞 Telefon',
      `+${phone}`,
      '━━━━━━━━━━━━━━',
      '',
      'Müraciətimin nəzərdən keçirilməsini gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={TS_THEME.bg} />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('teslaservice.requestTitle')}</Text>
      </View>

      {submitted ? (
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>{t('teslaservice.successTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('teslaservice.successSubtitle')}</Text>
          <Pressable style={styles.successBtn} onPress={() => navigation.getParent()?.goBack()}>
            <Text style={styles.successBtnText}>{t('teslaservice.backToHome')}</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>{t('teslaservice.serviceType')}</Text>
            <View style={styles.serviceList}>
              {TESLA_SERVICES.map(service => {
                const active = serviceId === service.id;
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => setServiceId(service.id)}
                    style={[styles.serviceRow, active && { borderColor: TS_THEME.primary, backgroundColor: TS_THEME.cardAlt }]}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {active && <Text style={styles.serviceCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('teslaservice.vehicleModel')}</Text>
              <TextInput
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder={t('teslaservice.vehicleModelPlaceholder')}
                placeholderTextColor={TS_THEME.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('teslaservice.description')}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('teslaservice.descriptionPlaceholder')}
                placeholderTextColor={TS_THEME.textMuted}
                style={[styles.input, styles.textarea]}
                multiline
                numberOfLines={4}
              />
            </View>

            <Text style={styles.sectionLabel}>{t('teslaservice.contactInfo')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('teslaservice.customerName')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('teslaservice.customerNamePlaceholder')}
                placeholderTextColor={TS_THEME.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('teslaservice.customerPhone')}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t('teslaservice.customerPhonePlaceholder')}
                placeholderTextColor={TS_THEME.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {!canSend && missingHint !== '' && <Text style={styles.missingHint}>{missingHint}</Text>}
            <Pressable style={[styles.sendBtn, { backgroundColor: canSend ? TS_THEME.primary : TS_THEME.border }]} onPress={handleSend} disabled={!canSend}>
              <Text style={[styles.sendBtnText, { color: canSend ? TS_THEME.white : TS_THEME.textMuted }]}>{t('teslaservice.submitBtn')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: TS_THEME.white },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TS_THEME.white },
  flexOne: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TS_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  serviceList: { gap: 8 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TS_THEME.card,
    borderWidth: 1,
    borderColor: TS_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  serviceIcon: { fontSize: 18 },
  serviceName: { flex: 1, fontSize: 13, fontWeight: '600', color: TS_THEME.text },
  serviceCheck: { fontSize: 15, fontWeight: '800', color: TS_THEME.primary },
  field: { gap: 6, marginTop: 12 },
  label: { fontSize: 12, color: TS_THEME.textMuted, fontWeight: '600' },
  input: { backgroundColor: TS_THEME.card, borderWidth: 1, borderColor: TS_THEME.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: TS_THEME.text, fontSize: 14 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  footer: { padding: 20, paddingBottom: 26, gap: 8, borderTopWidth: 1, borderTopColor: TS_THEME.border, backgroundColor: TS_THEME.bg },
  missingHint: { fontSize: 11.5, color: TS_THEME.primary, textAlign: 'center' },
  sendBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  sendBtnText: { fontSize: 15, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  successIcon: { fontSize: 44 },
  successTitle: { fontSize: 18, fontWeight: '800', color: TS_THEME.text, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: TS_THEME.textMuted, textAlign: 'center', lineHeight: 19 },
  successBtn: { marginTop: 16, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: TS_THEME.primary },
  successBtnText: { fontSize: 14, fontWeight: '700', color: TS_THEME.white },
});
