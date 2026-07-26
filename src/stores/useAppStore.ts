// src/stores/useAppStore.ts
// APP STATE - Aislado por usuario (codeId)
// Cada codigo de acceso tiene su propio perfil, cursos y progreso

import { create } from 'zustand';
import type { CourseProgress } from '@/types';
import { getUserData, setUserData } from '@/lib/userStorage';

interface AppState {
  isOffline: boolean;
  greetingName: string;
  activeRoute: string;
  enrolledCourses: string[];
  courseProgress: CourseProgress[];
  favoriteCalculators: string[];
  setIsOffline: (offline: boolean) => void;
  setActiveRoute: (route: string) => void;
  setGreetingName: (name: string) => void;
  enrollCourse: (courseId: string) => void;
  updateProgress: (courseId: string, completed: number, total: number) => void;
  toggleFavoriteCalculator: (calcId: string) => void;
  loadUserData: () => void;
}

const BASE_KEY = 'index_app_state';

function loadPersistedState(): Partial<AppState> {
  return getUserData<Partial<AppState>>(BASE_KEY, {});
}

function savePersistedState(state: Partial<AppState>) {
  setUserData(BASE_KEY, state);
}

// Valores default por usuario
const DEFAULT_STATE = {
  greetingName: 'Buzo',
  enrolledCourses: [] as string[],
  courseProgress: [] as CourseProgress[],
  favoriteCalculators: ['mod', 'lnd'] as string[],
};

export const useAppStore = create<AppState>((set, get) => {
  const persisted = loadPersistedState();

  return {
    isOffline: !navigator.onLine,
    greetingName: persisted.greetingName || DEFAULT_STATE.greetingName,
    activeRoute: '/',
    enrolledCourses: persisted.enrolledCourses || DEFAULT_STATE.enrolledCourses,
    courseProgress: persisted.courseProgress || DEFAULT_STATE.courseProgress,
    favoriteCalculators: persisted.favoriteCalculators || DEFAULT_STATE.favoriteCalculators,

    setIsOffline: (offline) => set({ isOffline: offline }),

    setActiveRoute: (route) => set({ activeRoute: route }),

    setGreetingName: (name) => {
      set({ greetingName: name });
      const { enrolledCourses, courseProgress, favoriteCalculators } = get();
      savePersistedState({ greetingName: name, enrolledCourses, courseProgress, favoriteCalculators });
    },

    enrollCourse: (courseId) => {
      const { enrolledCourses, courseProgress, favoriteCalculators, greetingName } = get();
      if (!enrolledCourses.includes(courseId)) {
        const updated = {
          enrolledCourses: [...enrolledCourses, courseId],
          courseProgress: [...courseProgress, { courseId, completed: 0, total: 100 }],
        };
        set(updated);
        savePersistedState({ ...updated, greetingName, favoriteCalculators });
      }
    },

    updateProgress: (courseId, completed, total) => {
      const { courseProgress, enrolledCourses, greetingName, favoriteCalculators } = get();
      const existing = courseProgress.find(p => p.courseId === courseId);
      let updatedProgress;
      if (existing) {
        updatedProgress = courseProgress.map(p =>
          p.courseId === courseId ? { ...p, completed, total } : p
        );
      } else {
        updatedProgress = [...courseProgress, { courseId, completed, total }];
      }
      set({ courseProgress: updatedProgress });
      savePersistedState({ enrolledCourses, courseProgress: updatedProgress, greetingName, favoriteCalculators });
    },

    toggleFavoriteCalculator: (calcId) => {
      const { favoriteCalculators, enrolledCourses, courseProgress, greetingName } = get();
      const updated = favoriteCalculators.includes(calcId)
        ? favoriteCalculators.filter(c => c !== calcId)
        : [...favoriteCalculators, calcId];
      set({ favoriteCalculators: updated });
      savePersistedState({ enrolledCourses, courseProgress, greetingName, favoriteCalculators: updated });
    },

    loadUserData: () => {
      const persisted = loadPersistedState();
      set({
        greetingName: persisted.greetingName || DEFAULT_STATE.greetingName,
        enrolledCourses: persisted.enrolledCourses || DEFAULT_STATE.enrolledCourses,
        courseProgress: persisted.courseProgress || DEFAULT_STATE.courseProgress,
        favoriteCalculators: persisted.favoriteCalculators || DEFAULT_STATE.favoriteCalculators,
      });
    },
  };
});
