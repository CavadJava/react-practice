import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AutoServicesStackParamList, RootStackParamList } from '../navigation/types';
import { getAutoServiceProvider } from '../data/autoServices';
import { WHATSAPP_PHONE } from '../data/products';
import { AS_THEME } from '../theme/autoServicesTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<AutoServicesStackParamList, 'AutoServiceProvider'>, NativeStackScreenProps<RootStackParamList>>;

export default function AutoServiceProviderScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const provider = getAutoServiceProvider(route.params.providerId);

  const [vehicleModel, setVehicleModel] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('994');
  const [submitted, setSubmitted] = useState(false);

  if (!provider) return null;

  const canSend = !!(vehicleModel.trim() && name.trim() && phone.trim());
  const missing: string[] = [];
  if (!vehicleModel.trim()) missing.push(t('autoservices.missingVehicle'));
  if (!name.trim()) missing.push(t('autoservices.missingName'));
  if (!phone.trim()) missing.push(t('autoservices.missingPhone'));
  const missingHint = missing.length ? `${t('autoservices.missingPrefix')}${missing.join(', ')}` : '';

  const handleSend = () => {
    if (!canSend) return;
    const lines = [
      'Salam!',
      '',
      'Yeni müraciət:',
      '',
      '━━━━━━━━━━━━━━',
      '🏢 Provayder',
      provider.name,
      '',
      '🚗 Avtomobil modeli',
      vehicleModel,
      '',
      '📝 Qeyd',
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
      <StatusBar barStyle="light-content" backgroundColor={provider.color} />
      <View style={[styles.header, { backgroundColor: provider.color }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.providerName}>
            {provider.icon} {provider.name}
          </Text>
          <Text style={styles.providerTagline}>{provider.tagline}</Text>
        </View>
      </View>

      {submitted ? (
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>{t('autoservices.successTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('autoservices.successSubtitle')}</Text>
          <Pressable style={[styles.successBtn, { backgroundColor: provider.color }]} onPress={() => navigation.getParent()?.goBack()}>
            <Text style={styles.successBtnText}>{t('autoservices.backToHome')}</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.infoCard}>
              <Text style={styles.infoLine}>📍 {provider.address}</Text>
              {provider.phone && <Text style={styles.infoLine}>📞 {provider.phone}</Text>}
            </View>

            <Text style={styles.sectionLabel}>{t('autoservices.requestTitle')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('autoservices.vehicleModel')}</Text>
              <TextInput
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder={t('autoservices.vehicleModelPlaceholder')}
                placeholderTextColor={AS_THEME.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('autoservices.description')}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('autoservices.descriptionPlaceholder')}
                placeholderTextColor={AS_THEME.textMuted}
                style={[styles.input, styles.textarea]}
                multiline
                numberOfLines={4}
              />
            </View>

            <Text style={styles.sectionLabel}>{t('autoservices.contactInfo')}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{t('autoservices.customerName')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('autoservices.customerNamePlaceholder')}
                placeholderTextColor={AS_THEME.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('autoservices.customerPhone')}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t('autoservices.customerPhonePlaceholder')}
                placeholderTextColor={AS_THEME.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {!canSend && missingHint !== '' && <Text style={styles.missingHint}>{missingHint}</Text>}
            <Pressable style={[styles.sendBtn, { backgroundColor: canSend ? provider.color : AS_THEME.border }]} onPress={handleSend} disabled={!canSend}>
              <Text style={[styles.sendBtnText, { color: canSend ? AS_THEME.white : AS_THEME.textMuted }]}>{t('autoservices.submitBtn')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: AS_THEME.white },
  headerText: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: '800', color: AS_THEME.white },
  providerTagline: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  flexOne: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  infoCard: { backgroundColor: AS_THEME.cardAlt, borderRadius: 14, padding: 14, gap: 6, marginTop: 4 },
  infoLine: { fontSize: 12.5, color: AS_THEME.text, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: AS_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  field: { gap: 6, marginTop: 12 },
  label: { fontSize: 12, color: AS_THEME.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: AS_THEME.card,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AS_THEME.text,
    fontSize: 14,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  footer: { padding: 20, paddingBottom: 26, gap: 8, borderTopWidth: 1, borderTopColor: AS_THEME.border, backgroundColor: AS_THEME.bg },
  missingHint: { fontSize: 11.5, color: AS_THEME.primary, textAlign: 'center' },
  sendBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  sendBtnText: { fontSize: 15, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  successIcon: { fontSize: 44 },
  successTitle: { fontSize: 18, fontWeight: '800', color: AS_THEME.text, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: AS_THEME.textMuted, textAlign: 'center', lineHeight: 19 },
  successBtn: { marginTop: 16, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  successBtnText: { fontSize: 14, fontWeight: '700', color: AS_THEME.white },
});
