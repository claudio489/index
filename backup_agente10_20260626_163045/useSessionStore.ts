// src/stores/useSessionStore.ts
// MODIFICADO: Al login/logout recarga datos del usuario en appStore

import { create } from 'zustand';
import type { SessionToken, AccessCode } from '@/lib/accessControl';
import { isSessionValid, encryptSession, decryptSession, hash, createSessionToken, defaultAccessCodes } from '@/lib/accessControl';
import { getDeviceFingerprint, isSameDevice } from '@/lib/deviceFingerprint';
import { useAppStore } from './useAppStore';
import { supabase } from '../lib/supabaseClient';

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

const SYNC_STATUS_KEY = 'access_codes_sync_pending';

function setSyncPending(pending: boolean) {
  if (pending) {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ pending: true, timestamp: Date.now() }));
  } else {
    localStorage.removeItem(SYNC_STATUS_KEY);
  }
}

export function getSyncStatus(): { pending: boolean; timestamp?: number } {
  try {
    const raw = localStorage.getItem(SYNC_STATUS_KEY);
    return raw ? JSON.parse(raw) : { pending: false };
  } catch {
    return { pending: false };
  }
}

export async function getAccessCodes(): Promise<AccessCode[]> {
  // 1. Intentar obtener de Supabase primero
  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const codes: AccessCode[] = data.map((row: any) => ({
        id: row.id,
        codeHash: row.code_hash,
        name: row.name,
        courses: row.courses || [],
        role: row.role || 'diver',
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        isActive: row.is_active ?? true,
        deviceFp: row.device_fp,
        deviceName: row.device_name
      }));

      // Sync local con Supabase
      try {
        const db = await getDB();
        const tx = db.transaction('codes', 'readwrite');
        const store = tx.objectStore('codes');
        await store.clear();
        for (const code of codes) {
          await store.put(code);
        }
      } catch {
        saveCodesToLS(codes);
      }

      setSyncPending(false);
      return codes;
    }
  } catch (err) {
    console.warn('Supabase fetch failed, using local fallback:', err);
  }

  // 2. Fallback: obtener de local
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('codes', 'readonly');
      const store = tx.objectStore('codes');
      const req = store.getAll();
      req.onsuccess = () => {
        const codes = req.result;
        if (codes.length === 0) {
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
  // 1. Guardar en local primero (fallback offline)
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

  // 2. Sync con Supabase
  try {
    const { error } = await supabase
      .from('access_codes')
      .upsert({
        id: code.id,
        code_hash: code.codeHash,
        name: code.name,
        courses: code.courses,
        role: code.role,
        expires_at: code.expiresAt,
        is_active: code.isActive ?? true,
        device_fp: code.deviceFp,
        device_name: code.deviceName,
        created_at: code.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    setSyncPending(false);
  } catch (err) {
    console.warn('Supabase sync failed (offline?), will retry later:', err);
    setSyncPending(true);
  }
}

export async function deleteAccessCode(id: string) {
  deleteDeviceBinding(id);
  
  // 1. Eliminar de Supabase
  try {
    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase delete failed:', err);
  }

  // 2. Eliminar de local (siempre)
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
  const now = new Date().toISOString();

  // 1. Buscar en Supabase primero
  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code_hash', inputHash)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const code: AccessCode = {
        id: data.id,
        codeHash: data.code_hash,
        name: data.name,
        courses: data.courses || [],
        role: data.role || 'diver',
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        isActive: data.is_active ?? true,
        deviceFp: data.device_fp,
        deviceName: data.device_name
      };

      if (code.expiresAt && code.expiresAt <= now) {
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
      }

      const token = createSessionToken(code);
      saveDeviceBinding({
        codeId: code.id,
        deviceFp,
        deviceName: navigator.userAgent.slice(0, 80),
        boundAt: new Date().toISOString(),
      });

      // Guardar en Supabase para sync de device binding
      await saveAccessCode({ ...code, deviceFp, deviceName: navigator.userAgent.slice(0, 80) });

      return { valid: true, token };
    }
  } catch (err) {
    console.warn('Supabase validation failed, trying local:', err);
  }

  // 2. Fallback: buscar en local
  const codes = await getAccessCodes();
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




// Reintenta sincronizar códigos locales con Supabase
export async function syncPendingCodes(): Promise<void> {
  try {
    const localCodes = await getAccessCodes();
    for (const code of localCodes) {
      await supabase
        .from('access_codes')
        .upsert({
          id: code.id,
          code_hash: code.codeHash,
          name: code.name,
          courses: code.courses,
          role: code.role,
          expires_at: code.expiresAt,
          is_active: code.isActive ?? true,
          device_fp: code.deviceFp,
          device_name: code.deviceName,
          created_at: code.createdAt || new Date().toISOString()
        }, { onConflict: 'id' });
    }
    setSyncPending(false);
  } catch (err) {
    console.error('Sync retry failed:', err);
    throw err;
  }
}
