import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoursesStackParamList, RootStackParamList } from '../navigation/types';
import { Lesson, getCourse, getFlattenedLesson, getNextLesson } from '../data/courses';
import { WHATSAPP_PHONE } from '../data/products';
import { CO_THEME } from '../theme/coursesTheme';
import { useLocale } from '../context/LocaleContext';
import { useCoursesProgress } from '../context/CoursesProgressContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CoursesStackParamList, 'Lesson'>, NativeStackScreenProps<RootStackParamList>>;

const LESSON_ICON: Record<Lesson['type'], string> = { theory: '📖', exercise: '✏️', project: '🚀' };
const LESSON_TYPE_KEY: Record<Lesson['type'], string> = { theory: 'courses.typeTheory', exercise: 'courses.typeExercise', project: 'courses.typeProject' };

export default function LessonScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { isLessonCompleted, completeLesson, isLessonSubmitted, submitLesson } = useCoursesProgress();
  const { courseId, lessonId } = route.params;
  const course = getCourse(courseId);
  const entry = course ? getFlattenedLesson(course, lessonId) : undefined;

  const [submissionText, setSubmissionText] = useState('');

  if (!course || !entry) return null;

  const { lesson, moduleTitle, index } = entry;
  const completed = isLessonCompleted(courseId, lessonId);
  const nextEntry = getNextLesson(course, lessonId);

  // Theory lessons have nothing to review, so they can be completed
  // directly. Exercise/project lessons require the student's work to be
  // sent to the instructor first — completed-before-this-feature lessons
  // also count as satisfied so old progress isn't blocked retroactively.
  const requiresSubmission = lesson.type !== 'theory';
  const submitted = isLessonSubmitted(courseId, lessonId) || completed;
  const canContinue = !requiresSubmission || submitted;

  const handleSubmitWork = () => {
    if (!submissionText.trim()) return;
    const lines = [
      'Salam!',
      '',
      'Tapşırıq təqdimatı:',
      '',
      '━━━━━━━━━━━━━━',
      '🎓 Kurs',
      course.title,
      '',
      '📚 Dərs',
      lesson.title,
      '',
      '📝 Həll',
      submissionText.trim(),
      '━━━━━━━━━━━━━━',
      '',
      'Yoxlanılmasını gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);
    submitLesson(courseId, lessonId);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    completeLesson(courseId, lessonId);
    if (nextEntry) {
      navigation.replace('Lesson', { courseId, lessonId: nextEntry.lesson.id });
    } else {
      navigation.navigate('CourseDetail', { courseId });
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.moduleTitle} numberOfLines={1}>
          {moduleTitle}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {LESSON_ICON[lesson.type]} {t(LESSON_TYPE_KEY[lesson.type])}
          </Text>
        </View>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.duration}>⏱ {lesson.duration}</Text>

        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{lesson.content}</Text>
          {lesson.exerciseCount != null && (
            <View style={styles.exerciseBadge}>
              <Text style={styles.exerciseBadgeText}>{t('courses.exerciseCount', { count: String(lesson.exerciseCount) })}</Text>
            </View>
          )}
        </View>

        {lesson.codeExample && (
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{lesson.codeExample}</Text>
          </View>
        )}

        {lesson.exercises && lesson.exercises.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>{t('courses.exercisesListTitle')}</Text>
            {lesson.exercises.map((task, i) => (
              <View key={i} style={styles.listItemRow}>
                <Text style={styles.listItemBullet}>{i + 1}.</Text>
                <Text style={styles.listItemText}>{task}</Text>
              </View>
            ))}
          </View>
        )}

        {lesson.projectRequirements && lesson.projectRequirements.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>{t('courses.requirementsListTitle')}</Text>
            {lesson.projectRequirements.map((req, i) => (
              <View key={i} style={styles.listItemRow}>
                <Text style={styles.listItemBullet}>✓</Text>
                <Text style={styles.listItemText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {requiresSubmission && (
          <View style={styles.submitCard}>
            <Text style={styles.listCardTitle}>{t('courses.submitTitle')}</Text>
            {submitted ? (
              <View style={styles.submittedBanner}>
                <Text style={styles.submittedBannerText}>✓ {t('courses.submittedStatus')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.submitHint}>{t('courses.submitHint')}</Text>
                <TextInput
                  value={submissionText}
                  onChangeText={setSubmissionText}
                  placeholder={t('courses.submitPlaceholder')}
                  placeholderTextColor={CO_THEME.textMuted}
                  style={styles.submitInput}
                  multiline
                  numberOfLines={4}
                />
                <Pressable
                  style={[styles.submitBtn, !submissionText.trim() && styles.submitBtnDisabled]}
                  onPress={handleSubmitWork}
                  disabled={!submissionText.trim()}>
                  <Text style={styles.submitBtnText}>{t('courses.submitBtn')}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <Text style={styles.progressLabel}>{t('courses.lessonPosition', { current: String(index + 1) })}</Text>
      </ScrollView>

      <View style={styles.footer}>
        {completed && !nextEntry ? (
          <View style={styles.doneBanner}>
            <Text style={styles.doneBannerText}>🎉 {t('courses.courseCompleted')}</Text>
          </View>
        ) : null}
        {!canContinue && <Text style={styles.continueHint}>{t('courses.continueHint')}</Text>}
        <Pressable style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]} onPress={handleContinue} disabled={!canContinue}>
          <Text style={[styles.continueBtnText, !canContinue && styles.continueBtnTextDisabled]}>
            {nextEntry ? t('courses.completeAndContinue') : t('courses.finishCourse')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CO_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CO_THEME.card,
    borderWidth: 1,
    borderColor: CO_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: CO_THEME.text, fontSize: 16 },
  moduleTitle: { flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: '700', color: CO_THEME.textMuted, marginHorizontal: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 20, gap: 6 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: CO_THEME.cardAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 6 },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: CO_THEME.primary },
  title: { fontSize: 21, fontWeight: '900', color: CO_THEME.text },
  duration: { fontSize: 12.5, color: CO_THEME.textMuted },
  contentCard: { backgroundColor: CO_THEME.card, borderRadius: 16, borderWidth: 1, borderColor: CO_THEME.border, padding: 16, marginTop: 16, gap: 12 },
  contentText: { fontSize: 14.5, color: CO_THEME.text, lineHeight: 22 },
  exerciseBadge: { alignSelf: 'flex-start', backgroundColor: CO_THEME.cardAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  exerciseBadgeText: { fontSize: 12, fontWeight: '700', color: CO_THEME.text },
  codeBlock: { backgroundColor: '#0A0812', borderRadius: 12, borderWidth: 1, borderColor: CO_THEME.border, padding: 14, marginTop: 14 },
  codeText: { fontFamily: 'Courier', fontSize: 12.5, color: '#B9F2D6', lineHeight: 19 },
  listCard: { backgroundColor: CO_THEME.card, borderRadius: 16, borderWidth: 1, borderColor: CO_THEME.border, padding: 16, marginTop: 14, gap: 8 },
  listCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: CO_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  listItemRow: { flexDirection: 'row', gap: 8 },
  listItemBullet: { fontSize: 13, fontWeight: '800', color: CO_THEME.primary, width: 18 },
  listItemText: { flex: 1, fontSize: 13.5, color: CO_THEME.text, lineHeight: 19 },
  submitCard: {
    backgroundColor: CO_THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CO_THEME.primary,
    padding: 16,
    marginTop: 14,
    gap: 8,
  },
  submitHint: { fontSize: 12.5, color: CO_THEME.textMuted, lineHeight: 18 },
  submitInput: {
    backgroundColor: CO_THEME.cardAlt,
    borderWidth: 1,
    borderColor: CO_THEME.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: CO_THEME.text,
    fontSize: 13.5,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: CO_THEME.primary },
  submitBtnDisabled: { backgroundColor: CO_THEME.lock },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: CO_THEME.white },
  submittedBanner: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  submittedBannerText: { fontSize: 13, fontWeight: '700', color: CO_THEME.success },
  progressLabel: { fontSize: 11.5, color: CO_THEME.textMuted, marginTop: 16, textAlign: 'center' },
  footer: { padding: 20, paddingBottom: 26, gap: 10, borderTopWidth: 1, borderTopColor: CO_THEME.border, backgroundColor: CO_THEME.bg },
  doneBanner: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  doneBannerText: { fontSize: 13.5, fontWeight: '700', color: CO_THEME.success },
  continueHint: { fontSize: 11.5, color: CO_THEME.textMuted, textAlign: 'center' },
  continueBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', backgroundColor: CO_THEME.primary },
  continueBtnDisabled: { backgroundColor: CO_THEME.lock },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: CO_THEME.white },
  continueBtnTextDisabled: { color: 'rgba(255,255,255,0.6)' },
});
