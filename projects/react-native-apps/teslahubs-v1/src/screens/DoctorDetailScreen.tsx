import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DoctorsStackParamList, RootStackParamList } from '../navigation/types';
import { Operation, getDoctor, getDoctorScore, getSpecialtyLabel, getTopDoctors } from '../data/doctors';
import { WHATSAPP_PHONE } from '../data/products';
import { DR_THEME } from '../theme/doctorsTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<DoctorsStackParamList, 'DoctorDetail'>, NativeStackScreenProps<RootStackParamList>>;

export default function DoctorDetailScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const doctor = getDoctor(route.params.doctorId);

  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('994');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!doctor) return null;

  const selectedOperation: Operation | undefined = doctor.operations.find(o => o.id === selectedOperationId);
  const specialtyLabel = getSpecialtyLabel(doctor.specialty);
  const score = getDoctorScore(doctor);
  const isTopDoctor = getTopDoctors(3).some(d => d.id === doctor.id);

  const canSend = !!(name.trim() && phone.trim());
  const missing: string[] = [];
  if (!name.trim()) missing.push(t('doctors.missingName'));
  if (!phone.trim()) missing.push(t('doctors.missingPhone'));
  const missingHint = missing.length ? `${t('doctors.missingPrefix')}${missing.join(', ')}` : '';

  const toggleOperation = (id: string) => {
    setSelectedOperationId(prev => (prev === id ? null : id));
  };

  const handleSend = () => {
    if (!canSend) return;
    const lines = [
      'Salam!',
      '',
      'Yeni randevu sorğusu:',
      '',
      '━━━━━━━━━━━━━━',
      '👨‍⚕️ Həkim',
      `${doctor.name} (${specialtyLabel})`,
      '',
      '🏥 Klinika',
      doctor.clinic,
      '',
      '🩺 Əməliyyat/xidmət',
      selectedOperation ? `${selectedOperation.name} — ${selectedOperation.price} ₼` : 'Seçilməyib (ilkin konsultasiya)',
      '',
      '📝 Qeyd',
      note.trim() || 'Qeyd edilməyib',
      '',
      '👤 Xəstə',
      name,
      '',
      '📞 Telefon',
      `+${phone}`,
      '━━━━━━━━━━━━━━',
      '',
      'Randevumun təsdiqlənməsini gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={submitted ? ['top'] : []}>
      <StatusBar barStyle="light-content" backgroundColor={DR_THEME.primary} />

      {submitted ? (
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>{t('doctors.successTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('doctors.successSubtitle')}</Text>
          <Pressable style={styles.successBtn} onPress={() => navigation.getParent()?.goBack()}>
            <Text style={styles.successBtnText}>{t('doctors.backToHome')}</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
              <Image source={{ uri: doctor.photo }} style={styles.heroImage} resizeMode="cover" />
              <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>←</Text>
              </Pressable>
              <View style={styles.heroTitleWrap}>
                {isTopDoctor && (
                  <View style={styles.topDoctorBadge}>
                    <Text style={styles.topDoctorBadgeText}>🏆 {t('doctors.topDoctorBadge')}</Text>
                  </View>
                )}
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{specialtyLabel}</Text>
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>⭐ {doctor.rating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>{t('doctors.ratingLabel', { count: String(doctor.reviewCount) })}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{doctor.experienceYears}</Text>
                  <Text style={styles.statLabel}>{t('doctors.experienceLabel')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{doctor.operationsPerformed}</Text>
                  <Text style={styles.statLabel}>{t('doctors.operationsCountLabel')}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLine}>🏥 {doctor.clinic}</Text>
                <Text style={styles.infoLine}>📍 {doctor.address}</Text>
                {doctor.phone && <Text style={styles.infoLine}>📞 {doctor.phone}</Text>}
              </View>

              <Text style={styles.sectionLabel}>{t('doctors.bioTitle')}</Text>
              <Text style={styles.bioText}>{doctor.bio}</Text>

              <Text style={styles.sectionLabel}>{t('doctors.credentialsTitle')}</Text>
              <View style={styles.credentialsCard}>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialIcon}>📊</Text>
                  <Text style={styles.credentialText}>{t('doctors.scoreLabel', { score: score.toFixed(1) })}</Text>
                </View>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialIcon}>📄</Text>
                  <Text style={styles.credentialText}>{t('doctors.articlesCount', { count: String(doctor.articles.length) })}</Text>
                </View>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialIcon}>🌍</Text>
                  <Text style={styles.credentialText}>
                    {t('doctors.conferencesCount', { count: String(doctor.internationalConferences) })}
                  </Text>
                </View>
                {doctor.newTechniques.length > 0 && (
                  <View style={styles.credentialBlock}>
                    <Text style={styles.credentialBlockTitle}>🧪 {t('doctors.newTechniquesTitle')}</Text>
                    {doctor.newTechniques.map((tech, i) => (
                      <Text key={i} style={styles.credentialListItem}>
                        • {tech}
                      </Text>
                    ))}
                  </View>
                )}
                {doctor.certificates.length > 0 && (
                  <View style={styles.credentialBlock}>
                    <Text style={styles.credentialBlockTitle}>🎓 {t('doctors.certificatesTitle')}</Text>
                    {doctor.certificates.map((cert, i) => (
                      <Text key={i} style={styles.credentialListItem}>
                        • {cert}
                      </Text>
                    ))}
                  </View>
                )}
                {doctor.articles.length > 0 && (
                  <View style={styles.credentialBlock}>
                    <Text style={styles.credentialBlockTitle}>📄 {t('doctors.articlesTitle')}</Text>
                    {doctor.articles.map((article, i) => (
                      <Text key={i} style={styles.credentialListItem}>
                        • {article.title} ({article.year})
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.sectionLabel}>{t('doctors.operationsTitle')}</Text>
              {doctor.operations.map(op => {
                const isActive = selectedOperationId === op.id;
                return (
                  <Pressable
                    key={op.id}
                    style={[styles.opRow, isActive && styles.opRowActive]}
                    onPress={() => toggleOperation(op.id)}>
                    <View style={styles.opTextWrap}>
                      <Text style={styles.opName}>{op.name}</Text>
                      <Text style={styles.opDescription}>{op.description}</Text>
                    </View>
                    <View style={styles.opRightWrap}>
                      <Text style={styles.opPrice}>{op.price} ₼</Text>
                      {isActive && <Text style={styles.opCheck}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}

              <Text style={styles.sectionLabel}>{t('doctors.requestTitle')}</Text>
              {selectedOperation && (
                <View style={styles.selectedOpChip}>
                  <Text style={styles.selectedOpChipText} numberOfLines={1}>
                    🩺 {selectedOperation.name}
                  </Text>
                  <Pressable onPress={() => setSelectedOperationId(null)} hitSlop={8}>
                    <Text style={styles.selectedOpChipClear}>✕</Text>
                  </Pressable>
                </View>
              )}
              <View style={styles.field}>
                <Text style={styles.label}>{t('doctors.patientName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('doctors.patientNamePlaceholder')}
                  placeholderTextColor={DR_THEME.textMuted}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t('doctors.patientPhone')}</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('doctors.patientPhonePlaceholder')}
                  placeholderTextColor={DR_THEME.textMuted}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t('doctors.note')}</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('doctors.notePlaceholder')}
                  placeholderTextColor={DR_THEME.textMuted}
                  style={[styles.input, styles.textarea]}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {!canSend && missingHint !== '' && <Text style={styles.missingHint}>{missingHint}</Text>}
            <Pressable style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]} onPress={handleSend} disabled={!canSend}>
              <Text style={[styles.sendBtnText, !canSend && styles.sendBtnTextDisabled]}>{t('doctors.submitBtn')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DR_THEME.bg },
  flexOne: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  hero: { width: '100%', height: 260, backgroundColor: DR_THEME.cardAlt },
  heroImage: { width: '100%', height: 260 },
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
  backText: { color: DR_THEME.white, fontSize: 18 },
  heroTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topDoctorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: DR_THEME.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  topDoctorBadgeText: { fontSize: 11, fontWeight: '800', color: DR_THEME.white },
  doctorName: { fontSize: 18, fontWeight: '800', color: DR_THEME.white },
  doctorSpecialty: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { paddingHorizontal: 20, gap: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: {
    flex: 1,
    backgroundColor: DR_THEME.cardAlt,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: DR_THEME.text },
  statLabel: { fontSize: 10.5, color: DR_THEME.textMuted, fontWeight: '600' },
  infoCard: { backgroundColor: DR_THEME.cardAlt, borderRadius: 14, padding: 14, gap: 6, marginTop: 12 },
  infoLine: { fontSize: 12.5, color: DR_THEME.text, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: DR_THEME.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  bioText: { fontSize: 13, color: DR_THEME.text, lineHeight: 19 },
  credentialsCard: { backgroundColor: DR_THEME.cardAlt, borderRadius: 14, padding: 14, gap: 10 },
  credentialRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  credentialIcon: { fontSize: 14 },
  credentialText: { fontSize: 12.5, color: DR_THEME.text, fontWeight: '600', flex: 1 },
  credentialBlock: { gap: 4 },
  credentialBlockTitle: { fontSize: 12, fontWeight: '700', color: DR_THEME.primary },
  credentialListItem: { fontSize: 12, color: DR_THEME.textMuted, lineHeight: 17 },
  opRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DR_THEME.card,
    borderWidth: 1,
    borderColor: DR_THEME.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  opRowActive: { borderColor: DR_THEME.primary, backgroundColor: DR_THEME.cardAlt },
  opTextWrap: { flex: 1, gap: 2 },
  opName: { fontSize: 13.5, fontWeight: '700', color: DR_THEME.text },
  opDescription: { fontSize: 11.5, color: DR_THEME.textMuted, lineHeight: 15 },
  opRightWrap: { alignItems: 'flex-end', gap: 4 },
  opPrice: { fontSize: 13, fontWeight: '800', color: DR_THEME.primary },
  opCheck: { fontSize: 14, fontWeight: '800', color: DR_THEME.primary },
  selectedOpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DR_THEME.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  selectedOpChipText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: DR_THEME.primary, marginRight: 8 },
  selectedOpChipClear: { fontSize: 13, color: DR_THEME.textMuted },
  field: { gap: 6, marginTop: 12 },
  label: { fontSize: 12, color: DR_THEME.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: DR_THEME.card,
    borderWidth: 1,
    borderColor: DR_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: DR_THEME.text,
    fontSize: 14,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  footer: { padding: 20, paddingBottom: 26, gap: 8, borderTopWidth: 1, borderTopColor: DR_THEME.border, backgroundColor: DR_THEME.bg },
  missingHint: { fontSize: 11.5, color: DR_THEME.primary, textAlign: 'center' },
  sendBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', backgroundColor: DR_THEME.primary },
  sendBtnDisabled: { backgroundColor: DR_THEME.border },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: DR_THEME.white },
  sendBtnTextDisabled: { color: DR_THEME.textMuted },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  successIcon: { fontSize: 44 },
  successTitle: { fontSize: 18, fontWeight: '800', color: DR_THEME.text, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: DR_THEME.textMuted, textAlign: 'center', lineHeight: 19 },
  successBtn: { marginTop: 16, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: DR_THEME.primary },
  successBtnText: { fontSize: 14, fontWeight: '700', color: DR_THEME.white },
});
