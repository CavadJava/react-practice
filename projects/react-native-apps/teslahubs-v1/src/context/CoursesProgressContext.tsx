import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'teslahubs_courses_progress';

type ProgressState = {
  unlockedCourseIds: string[];
  completedLessons: Record<string, string[]>;
  // Exercise/project lessons require the student's work to be sent to the
  // instructor for review (via WhatsApp) before the lesson can be marked
  // complete — this tracks "submitted, awaiting/assumed review" separately
  // from "completed", since there's no backend here to receive a real verdict.
  submittedLessons: Record<string, string[]>;
};

const EMPTY_STATE: ProgressState = { unlockedCourseIds: [], completedLessons: {}, submittedLessons: {} };

type CoursesProgressContextValue = {
  isUnlocked: (courseId: string) => boolean;
  unlockCourse: (courseId: string) => void;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  completeLesson: (courseId: string, lessonId: string) => void;
  completedLessonIds: (courseId: string) => string[];
  isLessonSubmitted: (courseId: string, lessonId: string) => boolean;
  submitLesson: (courseId: string, lessonId: string) => void;
  resetCourse: (courseId: string) => void;
};

const CoursesProgressContext = createContext<CoursesProgressContextValue | undefined>(undefined);

export function CoursesProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY_STATE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.unlockedCourseIds) && parsed.completedLessons) {
            setState({ submittedLessons: {}, ...parsed });
          }
        } catch {
          // ignore malformed storage
        }
      }
    });
  }, []);

  const persist = (updater: (prev: ProgressState) => ProgressState) => {
    setState(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const unlockCourse = (courseId: string) => {
    persist(prev => (prev.unlockedCourseIds.includes(courseId) ? prev : { ...prev, unlockedCourseIds: [...prev.unlockedCourseIds, courseId] }));
  };

  const completeLesson = (courseId: string, lessonId: string) => {
    persist(prev => {
      const current = prev.completedLessons[courseId] ?? [];
      if (current.includes(lessonId)) return prev;
      return { ...prev, completedLessons: { ...prev.completedLessons, [courseId]: [...current, lessonId] } };
    });
  };

  const submitLesson = (courseId: string, lessonId: string) => {
    persist(prev => {
      const current = prev.submittedLessons[courseId] ?? [];
      if (current.includes(lessonId)) return prev;
      return { ...prev, submittedLessons: { ...prev.submittedLessons, [courseId]: [...current, lessonId] } };
    });
  };

  const resetCourse = (courseId: string) => {
    persist(prev => {
      const unlockedCourseIds = prev.unlockedCourseIds.filter(id => id !== courseId);
      const completedLessons = { ...prev.completedLessons };
      const submittedLessons = { ...prev.submittedLessons };
      delete completedLessons[courseId];
      delete submittedLessons[courseId];
      return { unlockedCourseIds, completedLessons, submittedLessons };
    });
  };

  const value: CoursesProgressContextValue = {
    isUnlocked: courseId => state.unlockedCourseIds.includes(courseId),
    unlockCourse,
    isLessonCompleted: (courseId, lessonId) => (state.completedLessons[courseId] ?? []).includes(lessonId),
    completeLesson,
    completedLessonIds: courseId => state.completedLessons[courseId] ?? [],
    isLessonSubmitted: (courseId, lessonId) => (state.submittedLessons[courseId] ?? []).includes(lessonId),
    submitLesson,
    resetCourse,
  };

  return <CoursesProgressContext.Provider value={value}>{children}</CoursesProgressContext.Provider>;
}

export function useCoursesProgress() {
  const ctx = useContext(CoursesProgressContext);
  if (!ctx) throw new Error('useCoursesProgress must be used within CoursesProgressProvider');
  return ctx;
}
