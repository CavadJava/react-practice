import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoursesStackParamList, RootStackParamList } from '../navigation/types';
import { Lesson, getCourse, getFlattenedLessons, isValidCoupon } from '../data/courses';
import { WHATSAPP_PHONE } from '../data/products';
import { CO_THEME } from '../theme/coursesTheme';
import { useLocale } from '../context/LocaleContext';
import { useCoursesProgress } from '../context/CoursesProgressContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CoursesStackParamList, 'CourseDetail'>, NativeStackScreenProps<RootStackParamList>>;

const LESSON_ICON: Record<Lesson['type'], string> = { theory: '📖', exercise: '✏️', project: '🚀' };

export default function CourseDetailScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { isUnlocked, unlockCourse, isLessonCompleted, resetCourse } = useCoursesProgress();
  const course = getCourse(route.params.courseId);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  if (!course) return null;

  const unlocked = isUnlocked(course.id);
  const flat = getFlattenedLessons(course);

  const isLessonUnlocked = (lessonId: string, index: number) => {
    if (!unlocked) return false;
    if (index === 0) return true;
    if (isLessonCompleted(course.id, lessonId)) return true;
    const prev = flat[index - 1];
    return !!prev && isLessonCompleted(course.id, prev.lesson.id);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess(false);
    if (!couponCode.trim()) return;
    if (isValidCoupon(course, couponCode)) {
      unlockCourse(course.id);
      setCouponSuccess(true);
      setCouponCode('');
    } else {
      setCouponError(t('courses.couponInvalid'));
    }
  };

  const handleReset = () => {
    Alert.alert(t('courses.resetConfirmTitle'), t('courses.resetConfirmMessage'), [
      { text: t('courses.resetCancel'), style: 'cancel' },
      { text: t('courses.resetConfirm'), style: 'destructive', onPress: () => resetCourse(course.id) },
    ]);
  };

  const handleBuy = () => {
    const lines = [
      'Salam!',
      '',
      'Kurs almaq istəyirəm:',
      '',
      '━━━━━━━━━━━━━━',
      '🎓 Kurs',
      course.title,
      '',
      '💰 Qiymət',
      `${course.price} ₼`,
      '━━━━━━━━━━━━━━',
      '',
      'Ödəniş üsulları və kupon kodu haqqında məlumat gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: course.cover }} style={styles.heroImage} resizeMode="cover" />
          <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseSubtitle}>{course.subtitle}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>⭐ {course.rating.toFixed(1)}</Text>
              <Text style={styles.statChipSub}>({course.reviewCount})</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>{course.studentsCount}</Text>
              <Text style={styles.statChipSub}>{t('courses.studentsWord')}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>{flat.length}</Text>
              <Text style={styles.statChipSub}>{t('courses.lessonsWord')}</Text>
            </View>
          </View>

          {unlocked ? (
            <View style={styles.unlockedBanner}>
              <Text style={styles.unlockedBannerText}>✓ {t('courses.youOwnThis')}</Text>
              <Pressable style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>↺ {t('courses.resetCourse')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.purchaseCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('courses.price')}</Text>
                <Text style={styles.priceValue}>{course.price} ₼</Text>
              </View>
              <Pressable style={styles.buyBtn} onPress={handleBuy}>
                <Text style={styles.buyBtnText}>{t('courses.buyBtn')}</Text>
              </Pressable>

              <Text style={styles.couponLabel}>{t('courses.haveCoupon')}</Text>
              <View style={styles.couponRow}>
                <TextInput
                  value={couponCode}
                  onChangeText={text => {
                    setCouponCode(text);
                    setCouponError('');
                  }}
                  placeholder={t('courses.couponPlaceholder')}
                  placeholderTextColor={CO_THEME.textMuted}
                  style={styles.couponInput}
                  autoCapitalize="characters"
                />
                <Pressable style={styles.couponBtn} onPress={handleApplyCoupon}>
                  <Text style={styles.couponBtnText}>{t('courses.applyCoupon')}</Text>
                </Pressable>
              </View>
              {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
              {couponSuccess && <Text style={styles.couponSuccess}>{t('courses.couponSuccess')}</Text>}
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('courses.curriculumTitle')}</Text>
          {course.modules.map(module => (
            <View key={module.id} style={styles.moduleWrap}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              {module.lessons.map(lesson => {
                const flatEntry = flat.find(f => f.lesson.id === lesson.id)!;
                const completed = isLessonCompleted(course.id, lesson.id);
                const lessonUnlocked = isLessonUnlocked(lesson.id, flatEntry.index);
                return (
                  <Pressable
                    key={lesson.id}
                    style={[styles.lessonRow, !lessonUnlocked && styles.lessonRowLocked]}
                    disabled={!lessonUnlocked}
                    onPress={() => navigation.navigate('Lesson', { courseId: course.id, lessonId: lesson.id })}>
                    <Text style={styles.lessonIcon}>{lessonUnlocked ? LESSON_ICON[lesson.type] : '🔒'}</Text>
                    <View style={styles.lessonTextWrap}>
                      <Text style={[styles.lessonTitle, !lessonUnlocked && styles.lessonTitleLocked]}>{lesson.title}</Text>
                      <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                    </View>
                    {completed && <Text style={styles.lessonCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CO_THEME.bg },
  scrollContent: { paddingBottom: 30 },
  hero: { width: '100%', height: 200, backgroundColor: CO_THEME.cardAlt },
  heroImage: { width: '100%', height: 200 },
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
  backText: { color: CO_THEME.white, fontSize: 18 },
  heroTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  courseTitle: { fontSize: 18, fontWeight: '800', color: CO_THEME.white },
  courseSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { paddingHorizontal: 20, gap: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statChip: { flex: 1, backgroundColor: CO_THEME.cardAlt, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 1 },
  statChipText: { fontSize: 13, fontWeight: '800', color: CO_THEME.text },
  statChipSub: { fontSize: 10, color: CO_THEME.textMuted },
  unlockedBanner: { marginTop: 14, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 8 },
  unlockedBannerText: { fontSize: 13.5, fontWeight: '700', color: CO_THEME.success },
  resetBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: CO_THEME.border },
  resetBtnText: { fontSize: 12, fontWeight: '700', color: CO_THEME.textMuted },
  purchaseCard: { marginTop: 14, backgroundColor: CO_THEME.card, borderRadius: 16, borderWidth: 1, borderColor: CO_THEME.border, padding: 16, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 13, color: CO_THEME.textMuted, fontWeight: '600' },
  priceValue: { fontSize: 22, fontWeight: '900', color: CO_THEME.primary },
  buyBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: CO_THEME.primary },
  buyBtnText: { fontSize: 14.5, fontWeight: '700', color: CO_THEME.white },
  couponLabel: { fontSize: 12, color: CO_THEME.textMuted, fontWeight: '600', marginTop: 4 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1,
    backgroundColor: CO_THEME.cardAlt,
    borderWidth: 1,
    borderColor: CO_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: CO_THEME.text,
    fontSize: 14,
  },
  couponBtn: { backgroundColor: CO_THEME.cardAlt, borderWidth: 1, borderColor: CO_THEME.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  couponBtnText: { fontSize: 12.5, fontWeight: '700', color: CO_THEME.primary },
  couponError: { fontSize: 12, color: '#F87171' },
  couponSuccess: { fontSize: 12, color: CO_THEME.success, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: CO_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 8,
  },
  moduleWrap: { marginTop: 10 },
  moduleTitle: { fontSize: 15, fontWeight: '800', color: CO_THEME.text, marginBottom: 6 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CO_THEME.card,
    borderWidth: 1,
    borderColor: CO_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  lessonRowLocked: { opacity: 0.5 },
  lessonIcon: { fontSize: 16 },
  lessonTextWrap: { flex: 1, gap: 1 },
  lessonTitle: { fontSize: 13.5, fontWeight: '700', color: CO_THEME.text },
  lessonTitleLocked: { color: CO_THEME.textMuted },
  lessonDuration: { fontSize: 11, color: CO_THEME.textMuted },
  lessonCheck: { fontSize: 15, fontWeight: '800', color: CO_THEME.success },
});
