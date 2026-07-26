// src/stores/useSessionStore.ts
// MODIFICADO: Al login/logout recarga datos del usuario en appStore

import { create } from 'zustand';
import type { SessionToken, AccessCode } from '@/lib/accessControl';
import { isSessionValid, encryptSession, decryptSession, hash, createSessionToken, defaultAccessCodes } from '@/lib/accessControl';
import { getDeviceFingerprint, isSameDevice } from '@/lib/deviceFingerprint';
import { useAppStore } from './useAppStore';

interface SessionState {
  token: SessionToken | null;
  isAuthenticated: boolean;
  loginError: string;
  login: (token: SessionToken, deviceFp: string) => Promise<boolean>;
  logout: () => void;
  hasCourseAccess: (courseId: string) => boolean;
  loadSession: () => Promise<void>;
}

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('index-auth', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('codes')) {
        db.createObjectStore('codes', { keyPath: 'id' });
      }
    };
  });
}

async function saveSessionToDB(encrypted: string) {
  try {
    const db = await getDB();
    const tx = db.transaction('session', 'readwrite');
    const store = tx.objectStore('session');
    store.put({ id: 'current', encrypted });
  } catch {
    localStorage.setItem('index_session', encrypted);
  }
}

async function loadSessionFromDB(): Promise<string | null> {
  try {
    const db = await getDB();
    const tx = db.transaction('session', 'readonly');
    const store = tx.objectStore('session');
    const req = store.get('current');
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result?.encrypted || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return localStorage.getItem('index_session') || null;
  }
}

// LocalStorage fallback for codes
function getCodesFromLS(): AccessCode[] {
  const stored = localStorage.getItem('index_codes');
  if (stored) return JSON.parse(stored);
  // Seed with defaults on first use
  localStorage.setItem('index_codes', JSON.stringify(defaultAccessCodes));
  return defaultAccessCodes;
}

function saveCodesToLS(codes: AccessCode[]) {
  localStorage.setItem('index_codes', JSON.stringify(codes));
}

export async function getAccessCodes(): Promise<AccessCode[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('codes', 'readonly');
      const store = tx.objectStore('codes');
      const req = store.getAll();
      req.onsuccess = () => {
        const codes = req.result;
        if (codes.length === 0) {
          // Seed with defaults
          for (const code of defaultAccessCodes) {
            const wtx = db.transaction('codes', 'readwrite');
            wtx.objectStore('codes').put(code);
          }
          resolve([...defaultAccessCodes]);
        } else {
          resolve(codes);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getCodesFromLS();
  }
}

export async function getAccessCodesWithDevices(): Promise<(AccessCode & { deviceFp?: string; deviceName?: string })[]> {
  const codes = await getAccessCodes();
  const devices = getAllDeviceBindings();
  return codes.map(c => {
    const dev = devices.find(d => d.codeId === c.id);
    return { ...c, deviceFp: dev?.deviceFp, deviceName: dev?.deviceName };
  });
}

export async function saveAccessCode(code: AccessCode) {
  try {
    const db = await getDB();
    const tx = db.transaction('codes', 'readwrite');
    tx.objectStore('codes').put(code);
  } catch {
    const existing = getCodesFromLS();
    const idx = existing.findIndex((c: AccessCode) => c.id === code.id);
    if (idx >= 0) existing[idx] = code; else existing.push(code);
    saveCodesToLS(existing);
  }
}

export async function deleteAccessCode(id: string) {
  deleteDeviceBinding(id);
  try {
    const db = await getDB();
    const tx = db.transaction('codes', 'readwrite');
    tx.objectStore('codes').delete(id);
  } catch {
    const existing = getCodesFromLS().filter((c: AccessCode) => c.id !== id);
    saveCodesToLS(existing);
  }
}

// Device binding management
interface DeviceBinding {
  codeId: string;
  deviceFp: string;
  deviceName: string;
  boundAt: string;
}

function getAllDeviceBindings(): DeviceBinding[] {
  try {
    return JSON.parse(localStorage.getItem('index_device_bindings') || '[]');
  } catch { return []; }
}

function getDeviceBinding(codeId: string): DeviceBinding | undefined {
  return getAllDeviceBindings().find(b => b.codeId === codeId);
}

function saveDeviceBinding(binding: DeviceBinding) {
  const all = getAllDeviceBindings().filter(b => b.codeId !== binding.codeId);
  all.push(binding);
  localStorage.setItem('index_device_bindings', JSON.stringify(all));
}

export function deleteDeviceBinding(codeId: string) {
  const all = getAllDeviceBindings().filter(b => b.codeId !== codeId);
  localStorage.setItem('index_device_bindings', JSON.stringify(all));
}

export function revokeDeviceFromCode(codeId: string) {
  deleteDeviceBinding(codeId);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  loginError: '',

  login: async (token, deviceFp) => {
    saveDeviceBinding({
      codeId: token.codeId,
      deviceFp,
      deviceName: navigator.userAgent.slice(0, 50),
      boundAt: new Date().toISOString(),
    });
    const encrypted = encryptSession(token, token.codeId);
    await saveSessionToDB(encrypted);
    set({ token, isAuthenticated: true, loginError: '' });

    // RECARGAR DATOS DEL USUARIO AL HACER LOGIN
    try {
      useAppStore.getState().loadUserData();
    } catch { /* ignore if appStore not loaded yet */ }

    return true;
  },

  logout: () => {
    localStorage.removeItem('index_session');
    set({ token: null, isAuthenticated: false, loginError: '' });

    // RECARGAR DATOS DEFAULT AL HACER LOGOUT
    try {
      useAppStore.getState().loadUserData();
    } catch { /* ignore */ }
  },

  hasCourseAccess: (courseId) => {
    const { token } = get();
    if (!token || !isSessionValid(token)) return false;
    return token.courses.includes(courseId);
  },

  loadSession: async () => {
    try {
      const encrypted = await loadSessionFromDB();
      if (!encrypted) return;
      const codes = await getAccessCodes();
      for (const code of codes) {
        const decrypted = decryptSession(encrypted, code.id);
        if (decrypted && isSessionValid(decrypted)) {
          const binding = getDeviceBinding(decrypted.codeId);
          if (binding) {
            const currentFp = getDeviceFingerprint();
            if (currentFp !== binding.deviceFp) {
              set({ token: null, isAuthenticated: false, loginError: 'Codigo vinculado a otro dispositivo. Solicita uno nuevo.' });
              return;
            }
          }
          set({ token: decrypted, isAuthenticated: true, loginError: '' });

          // RECARGAR DATOS DEL USUARIO AL CARGAR SESION
          try {
            useAppStore.getState().loadUserData();
          } catch { /* ignore */ }

          return;
        }
      }
    } catch {
      // No valid session
    }
  },
}));

// Validate access code with device binding check
export async function validateAccessWithDevice(
  inputCode: string,
  deviceFp: string,
  _deviceName: string
): Promise<{ valid: boolean; token?: SessionToken; error?: string }> {
  const inputHash = hash(inputCode.toUpperCase());
  const codes = await getAccessCodes();
  const now = new Date().toISOString();

  for (const code of codes) {
    if (code.codeHash !== inputHash) continue;

    if (code.expiresAt <= now) {
      return { valid: false, error: 'Codigo expirado. Contacta a tu instructor.' };
    }

    const existingBinding = getDeviceBinding(code.id);
    if (existingBinding) {
      if (!isSameDevice(existingBinding.deviceFp)) {
        return {
          valid: false,
          error: 'Este codigo ya fue usado en otro dispositivo. No se permite compartir. Solicita uno nuevo a tu instructor.'
        };
      }
      // Same device re-login
    }

    const token = createSessionToken(code);
    saveDeviceBinding({
      codeId: code.id,
      deviceFp,
      deviceName: navigator.userAgent.slice(0, 80),
      boundAt: new Date().toISOString(),
    });

    return { valid: true, token };
  }

  return { valid: false, error: 'Codigo invalido. Verifica e intenta de nuevo.' };
}


