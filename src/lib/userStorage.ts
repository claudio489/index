// src/lib/userStorage.ts
// Helper para aislamiento de datos por usuario

import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';

export function getCurrentUserId(): string {
  try {
    const userId = useDivespotAuthStore.getState().userId;
    return userId || 'demo';
  } catch {
    return 'demo';
  }
}

export function getUserStorageKey(baseKey: string): string {
  const userId = getCurrentUserId();
  return `${baseKey}_${userId}`;
}

export function getUserData<T>(baseKey: string, defaultValue: T): T {
  try {
    const key = getUserStorageKey(baseKey);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { }
  return defaultValue;
}

export function setUserData<T>(baseKey: string, data: T): void {
  try {
    const key = getUserStorageKey(baseKey);
    localStorage.setItem(key, JSON.stringify(data));
  } catch { }
}

export function clearUserData(baseKey: string): void {
  try {
    const key = getUserStorageKey(baseKey);
    localStorage.removeItem(key);
  } catch { }
}

export function listUserStorageKeys(): string[] {
  const userId = getCurrentUserId();
  return Object.keys(localStorage).filter(k => k.endsWith(`_${userId}`));
}