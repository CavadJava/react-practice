import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AutoServicesStackParamList, RootStackParamList } from '../navigation/types';
import { SampleWorkItem, ServiceOption, getAutoServiceProvider, getServiceOption } from '../data/autoServices';
import { WHATSAPP_PHONE } from '../data/products';
import { AS_THEME } from '../theme/autoServicesTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<AutoServicesStackParamList, 'AutoServiceProvider'>, NativeStackScreenProps<RootStackParamList>>;

export default function AutoServiceProviderScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const provider = getAutoServiceProvider(route.params.providerId);

  const [activePhoto, setActivePhoto] = useState(0);
  const [vehicleModel, setVehicleModel] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<Record<string, string[]>>({});
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('994');
  const [submitted, setSubmitted] = useState(false);

  if (!provider) return null;

  const serviceOptions = provider.serviceOptionIds.map(id => getServiceOption(id)).filter((o): o is ServiceOption => !!o);
  const selectedServices = serviceOptions.filter(o => selectedIds.includes(o.id));

  const toggleService = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    setSelectedSubIds(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleSub = (serviceId: string, subId: string) => {
    setSelectedSubIds(prev => {
      const current = prev[serviceId] ?? [];
      const next = current.includes(subId) ? current.filter(x => x !== subId) : [...current, subId];
      return { ...prev, [serviceId]: next };
    });
  };

  const servicePrice = (option: ServiceOption): number => {
    const subIds = selectedSubIds[option.id] ?? [];
    const subTotal = (option.subOptions ?? []).filter(s => subIds.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
    return option.price + subTotal;
  };

  const totalPrice = selectedServices.reduce((sum, o) => sum + servicePrice(o), 0);

  const canSend = !!(vehicleModel.trim() && selectedIds.length > 0 && name.trim() && phone.trim());
  const missing: string[] = [];
  if (!vehicleModel.trim()) missing.push(t('autoservices.missingVehicle'));
  if (selectedIds.length === 0) missing.push(t('autoservices.missingService'));
  if (!name.trim()) missing.push(t('autoservices.missingName'));
  if (!phone.trim()) missing.push(t('autoservices.missingPhone'));
  const missingHint = missing.length ? `${t('autoservices.missingPrefix')}${missing.join(', ')}` : '';

  const openSampleWork = (item: SampleWorkItem) => {
    if (item.type === 'video') Linking.openURL(item.url);
  };

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
      '🛠️ Xidmətlər',
      ...selectedServices.map(o => {
        const subIds = selectedSubIds[o.id] ?? [];
        const subNames = (o.subOptions ?? []).filter(s => subIds.includes(s.id)).map(s => s.name);
        const subPart = subNames.length ? ` (${subNames.join(', ')})` : '';
        return `• ${o.name}${subPart} — ${servicePrice(o)} ₼`;
      }),
      '',
      '💰 Ümumi qiymət',
      `${totalPrice} ₼`,
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
    <SafeAreaView style={styles.screen} edges={submitted ? ['top'] : []}>
      <StatusBar barStyle="light-content" backgroundColor={provider.color} />

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
            <View style={styles.hero}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width))}>
                {provider.photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[styles.heroImage, { width }]} resizeMode="cover" />
                ))}
              </ScrollView>
              <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>←</Text>
              </Pressable>
              {provider.photos.length > 1 && (
                <View style={styles.dotsRow}>
                  {provider.photos.map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: i === activePhoto ? AS_THEME.white : 'rgba(255,255,255,0.4)' }]} />
                  ))}
                </View>
              )}
              <View style={styles.heroTitleWrap}>
                <Text style={styles.providerName}>
                  {provider.icon} {provider.name}
                </Text>
                <Text style={styles.providerTagline}>{provider.tagline}</Text>
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLine}>📍 {provider.address}</Text>
                {provider.phone && <Text style={styles.infoLine}>📞 {provider.phone}</Text>}
              </View>

              <Text style={styles.sectionLabel}>{t('autoservices.sampleWork')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workRow}>
                {provider.sampleWork.map((item, i) => (
                  <Pressable
                    key={i}
                    style={styles.workCard}
                    onPress={() => openSampleWork(item)}
                    disabled={item.type !== 'video'}>
                    <Image source={{ uri: item.thumbnail }} style={styles.workThumbnail} resizeMode="cover" />
                    {item.type === 'video' && (
                      <View style={styles.playBadge}>
                        <Text style={styles.playBadgeText}>▶</Text>
                      </View>
                    )}
                    <Text style={styles.workCaption} numberOfLines={2}>
                      {item.caption}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

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
                <Text style={styles.label}>{t('autoservices.serviceLabel')}</Text>
                <Pressable style={styles.dropdown} onPress={() => setServicePickerOpen(true)}>
                  <Text style={[styles.dropdownText, selectedServices.length === 0 && styles.dropdownPlaceholder]} numberOfLines={1}>
                    {selectedServices.length > 0
                      ? `${selectedServices.length} xidmət seçilib — ${totalPrice} ₼`
                      : t('autoservices.servicePlaceholder')}
                  </Text>
                  <Text style={styles.dropdownChevron}>⌄</Text>
                </Pressable>
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
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {selectedServices.length > 0 && (
              <View style={styles.footerTotalRow}>
                <Text style={styles.footerTotalLabel}>{t('autoservices.totalPrice')}</Text>
                <Text style={[styles.footerTotalValue, { color: provider.color }]}>{totalPrice} ₼</Text>
              </View>
            )}
            {!canSend && missingHint !== '' && <Text style={styles.missingHint}>{missingHint}</Text>}
            <Pressable style={[styles.sendBtn, { backgroundColor: canSend ? provider.color : AS_THEME.border }]} onPress={handleSend} disabled={!canSend}>
              <Text style={[styles.sendBtnText, { color: canSend ? AS_THEME.white : AS_THEME.textMuted }]}>{t('autoservices.submitBtn')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal visible={servicePickerOpen} animationType="slide" transparent onRequestClose={() => setServicePickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setServicePickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('autoservices.serviceModalTitle')}</Text>
            <ScrollView>
              {serviceOptions.map(option => {
                const isSelected = selectedIds.includes(option.id);
                const subIds = selectedSubIds[option.id] ?? [];
                return (
                  <View key={option.id}>
                    <Pressable style={styles.optionRow} onPress={() => toggleService(option.id)}>
                      <View style={[styles.checkbox, isSelected && { backgroundColor: provider.color, borderColor: provider.color }]}>
                        {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                      </View>
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.optionName}>{option.name}</Text>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>
                      <Text style={styles.optionPrice}>{option.price} ₼</Text>
                    </Pressable>
                    {isSelected && !!option.subOptions?.length && (
                      <View style={styles.subList}>
                        {option.subOptions.map(sub => {
                          const subSelected = subIds.includes(sub.id);
                          return (
                            <Pressable key={sub.id} style={styles.subRow} onPress={() => toggleSub(option.id, sub.id)}>
                              <View style={[styles.checkboxSm, subSelected && { backgroundColor: provider.color, borderColor: provider.color }]}>
                                {subSelected && <Text style={styles.checkboxMarkSm}>✓</Text>}
                              </View>
                              <Text style={styles.subName}>{sub.name}</Text>
                              <Text style={styles.subPrice}>{sub.price > 0 ? `+${sub.price} ₼` : t('autoservices.included')}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Text style={styles.modalTotalLabel}>{t('autoservices.totalPrice')}</Text>
              <Text style={[styles.modalTotalValue, { color: provider.color }]}>{totalPrice} ₼</Text>
            </View>
            <Pressable style={[styles.modalDoneBtn, { backgroundColor: provider.color }]} onPress={() => setServicePickerOpen(false)}>
              <Text style={styles.modalDoneBtnText}>{t('autoservices.done')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AS_THEME.bg },
  flexOne: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  hero: { width: '100%', height: 260, backgroundColor: AS_THEME.cardAlt },
  heroImage: { height: 260 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: AS_THEME.white, fontSize: 18 },
  dotsRow: { position: 'absolute', bottom: 62, right: 14, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heroTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  providerName: { fontSize: 18, fontWeight: '800', color: AS_THEME.white },
  providerTagline: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { paddingHorizontal: 20, gap: 8 },
  infoCard: { backgroundColor: AS_THEME.cardAlt, borderRadius: 14, padding: 14, gap: 6, marginTop: 16 },
  infoLine: { fontSize: 12.5, color: AS_THEME.text, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: AS_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  workRow: { gap: 12, paddingBottom: 4 },
  workCard: { width: 160 },
  workThumbnail: { width: 160, height: 110, borderRadius: 12, backgroundColor: AS_THEME.cardAlt },
  playBadge: {
    position: 'absolute',
    top: 38,
    left: 64,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeText: { color: AS_THEME.white, fontSize: 13 },
  workCaption: { fontSize: 11.5, color: AS_THEME.textMuted, marginTop: 6, lineHeight: 15 },
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
  dropdown: {
    backgroundColor: AS_THEME.card,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { color: AS_THEME.text, fontSize: 14, flex: 1, marginRight: 8 },
  dropdownPlaceholder: { color: AS_THEME.textMuted },
  dropdownChevron: { color: AS_THEME.textMuted, fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: AS_THEME.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: AS_THEME.text, marginBottom: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AS_THEME.border,
    gap: 10,
  },
  optionTextWrap: { flex: 1, gap: 3 },
  optionName: { fontSize: 14, fontWeight: '700', color: AS_THEME.text },
  optionDescription: { fontSize: 11.5, color: AS_THEME.textMuted, lineHeight: 15 },
  optionCheck: { fontSize: 16, fontWeight: '800' },
  optionPrice: { fontSize: 13, fontWeight: '700', color: AS_THEME.text },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: AS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: { color: AS_THEME.white, fontSize: 13, fontWeight: '800' },
  subList: { paddingLeft: 32, paddingBottom: 8, gap: 2 },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  checkboxSm: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: AS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarkSm: { color: AS_THEME.white, fontSize: 11, fontWeight: '800' },
  subName: { flex: 1, fontSize: 12.5, color: AS_THEME.text },
  subPrice: { fontSize: 12, fontWeight: '600', color: AS_THEME.textMuted },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: AS_THEME.border,
  },
  modalTotalLabel: { fontSize: 13, fontWeight: '700', color: AS_THEME.textMuted },
  modalTotalValue: { fontSize: 18, fontWeight: '800' },
  modalDoneBtn: { marginTop: 14, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalDoneBtnText: { fontSize: 14, fontWeight: '700', color: AS_THEME.white },
  footer: { padding: 20, paddingBottom: 26, gap: 8, borderTopWidth: 1, borderTopColor: AS_THEME.border, backgroundColor: AS_THEME.bg },
  footerTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerTotalLabel: { fontSize: 12.5, fontWeight: '600', color: AS_THEME.textMuted },
  footerTotalValue: { fontSize: 17, fontWeight: '800' },
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
