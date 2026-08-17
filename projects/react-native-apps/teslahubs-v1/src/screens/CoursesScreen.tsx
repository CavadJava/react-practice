import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoursesStackParamList, RootStackParamList } from '../navigation/types';
import { COURSES, getFlattenedLessons } from '../data/courses';
import { CO_THEME } from '../theme/coursesTheme';
import { useLocale } from '../context/LocaleContext';
import { useCoursesProgress } from '../context/CoursesProgressContext';

type Props = CompositeScreenProps<NativeStackScreenProps<CoursesStackParamList, 'Courses'>, NativeStackScreenProps<RootStackParamList>>;

export default function CoursesScreen({ navigation }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { isUnlocked, completedLessonIds } = useCoursesProgress();

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerText}>
          <Text style={styles.brand}>{t('courses.entryTitle')}</Text>
          <Text style={styles.tagline}>{t('courses.tagline')}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {COURSES.map(course => {
          const isFree = course.price === 0;
          const unlocked = isFree || isUnlocked(course.id);
          const totalLessons = getFlattenedLessons(course).length;
          const completedCount = completedLessonIds(course.id).length;
          const progressPct = unlocked && totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

          return (
            <Pressable
              key={course.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}>
              <Image source={{ uri: course.cover }} style={styles.cardPhoto} resizeMode="cover" />
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{isFree ? `✨ ${t('courses.free')}` : unlocked ? `✓ ${t('courses.owned')}` : `🔒 ${t('courses.locked')}`}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{course.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {course.subtitle}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rating}>⭐ {course.rating.toFixed(1)}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.meta}>{t('courses.studentsCount', { count: String(course.studentsCount) })}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.meta}>{totalLessons} {t('courses.lessonsWord')}</Text>
                </View>
                {unlocked ? (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progressPct}%</Text>
                  </View>
                ) : (
                  <Text style={styles.price}>{course.price} ₼</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CO_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  headerText: { flex: 1, paddingRight: 12 },
  brand: { fontSize: 24, fontWeight: '900', color: CO_THEME.white, letterSpacing: 0.3 },
  tagline: { fontSize: 12.5, color: CO_THEME.textMuted, marginTop: 4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CO_THEME.card,
    borderWidth: 1,
    borderColor: CO_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: CO_THEME.text },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { backgroundColor: CO_THEME.card, borderRadius: 18, borderWidth: 1, borderColor: CO_THEME.border, overflow: 'hidden' },
  cardPressed: { opacity: 0.9 },
  cardPhoto: { width: '100%', height: 140, backgroundColor: CO_THEME.cardAlt },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(14,11,26,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: CO_THEME.white },
  cardBody: { padding: 16, gap: 6 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: CO_THEME.text },
  cardSubtitle: { fontSize: 12.5, color: CO_THEME.textMuted, lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  rating: { fontSize: 12, fontWeight: '700', color: CO_THEME.text },
  dot: { fontSize: 10, color: CO_THEME.textMuted },
  meta: { fontSize: 11.5, color: CO_THEME.textMuted },
  price: { fontSize: 18, fontWeight: '800', color: CO_THEME.primary, marginTop: 6 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: CO_THEME.cardAlt, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: CO_THEME.primary },
  progressText: { fontSize: 11.5, fontWeight: '700', color: CO_THEME.primary },
});
