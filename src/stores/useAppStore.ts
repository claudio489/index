import { create } from 'zustand';
import type { CourseProgress } from '@/types';

interface AppState {
  isOffline: boolean;
  greetingName: string;
  activeRoute: string;
  enrolledCourses: string[];
  courseProgress: CourseProgress[];
  favoriteCalculators: string[];
  setIsOffline: (offline: boolean) => void;
  setActiveRoute: (route: string) => void;
  enrollCourse: (courseId: string) => void;
  updateProgress: (courseId: string, completed: number, total: number) => void;
  toggleFavoriteCalculator: (calcId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isOffline: !navigator.onLine,
  greetingName: 'Buzo',
  activeRoute: '/',
  enrolledCourses: ['enriched-air-nitrox', 'deep-diver', 'tec-40'],
  courseProgress: [
    { courseId: 'enriched-air-nitrox', completed: 65, total: 100 },
    { courseId: 'deep-diver', completed: 30, total: 100 },
    { courseId: 'tec-40', completed: 10, total: 100 },
  ],
  favoriteCalculators: ['mod', 'lnd'],

  setIsOffline: (offline) => set({ isOffline: offline }),
  setActiveRoute: (route) => set({ activeRoute: route }),

  enrollCourse: (courseId) => {
    const { enrolledCourses } = get();
    if (!enrolledCourses.includes(courseId)) {
      set({ enrolledCourses: [...enrolledCourses, courseId] });
    }
  },

  updateProgress: (courseId, completed, total) => {
    const { courseProgress } = get();
    const existing = courseProgress.find(p => p.courseId === courseId);
    if (existing) {
      set({
        courseProgress: courseProgress.map(p =>
          p.courseId === courseId ? { ...p, completed, total } : p
        )
      });
    } else {
      set({ courseProgress: [...courseProgress, { courseId, completed, total }] });
    }
  },

  toggleFavoriteCalculator: (calcId) => {
    const { favoriteCalculators } = get();
    if (favoriteCalculators.includes(calcId)) {
      set({ favoriteCalculators: favoriteCalculators.filter(id => id !== calcId) });
    } else {
      set({ favoriteCalculators: [...favoriteCalculators, calcId] });
    }
  },
}));

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.getState().setIsOffline(false));
  window.addEventListener('offline', () => useAppStore.getState().setIsOffline(true));
}
