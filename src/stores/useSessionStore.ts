// src/stores/useSessionStore.ts
// UNIFICADO: Admin + Login con schema nuevo (code, encrypted_code, label, role)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { encryptCode, generateAccessCode } from '@/lib/accessControl';
import { getDeviceFingerprint, storeDeviceFingerprint } from '@/lib/deviceFingerprint';

// ============================================================
// INTERFACES
// ============================================================
export interface AccessCode {
  id: string
  code: string
  encryptedCode: string
  label: string
  role: 'admin' | 'instructor' | 'user'
  createdAt: string
  expiresAt?: string
  usedCount: number
  maxUses?: number
  isActive: boolean
  createdBy?: string
  isLocal?: boolean
}

export interface SessionToken {
  name: string
  role: string
  expiresAt: string
  codeId: string
  code: string
}

export interface CreateCodeParams {
  label: string
  role?: 'admin' | 'instructor' | 'user'
  expiresInDays?: number
  maxUses?: number
}

// ============================================================
// DEVICE BINDING (localStorage - no en Supabase)
// ============================================================
interface DeviceBinding {
  codeId: string
  deviceFp: string
  boundAt: string
}

function getDeviceBindings(): DeviceBinding[] {
  try {
    return JSON.parse(localStorage.getItem('index_device_bindings') || '[]');
  } catch { return []; }
}

function saveDeviceBinding(binding: DeviceBinding) {
  const all = getDeviceBindings().filter(b => b.codeId !== binding.codeId);
  all.push(binding);
  localStorage.setItem('index_device_bindings', JSON.stringify(all));
}

function isDeviceBound(codeId: string): boolean {
  return getDeviceBindings().some(b => b.codeId === codeId);
}

function isSameDevice(codeId: string, deviceFp: string): boolean {
  const binding = getDeviceBindings().find(b => b.codeId === codeId);
  return binding ? binding.deviceFp === deviceFp : false;
}

// ============================================================
// ADMIN STORE (Zustand + persist)
// ============================================================
interface AdminState {
  codes: AccessCode[]
  isLoading: boolean
  error: string | null
  loadCodes: () => Promise<void>
  createCode: (p: CreateCodeParams) => Promise<AccessCode | null>
  revokeCode: (id: string) => Promise<void>
  refreshCodes: () => Promise<void>
  clearError: () => void
}

const TBL = 'access_codes';

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      codes: [],
      isLoading: false,
      error: null,

      loadCodes: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from(TBL)
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          set({
            codes: (data || []).map((r: any) => ({
              id: r.id,
              code: r.code || '',
              encryptedCode: r.encrypted_code || '',
              label: r.label || '',
              role: r.role || 'user',
              createdAt: r.created_at,
              expiresAt: r.expires_at,
              usedCount: r.used_count || 0,
              maxUses: r.max_uses,
              isActive: r.is_active ?? true,
              createdBy: r.created_by,
              isLocal: false,
            })),
            isLoading: false,
          });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      createCode: async (p) => {
        set({ isLoading: true, error: null });
        try {
          const pc = generateAccessCode();
          const ec = encryptCode(pc);
          const ed = p.expiresInDays
            ? new Date(Date.now() + p.expiresInDays * 86400000).toISOString()
            : null;
          const ins: any = {
            encrypted_code: ec,
            code: pc,
            label: p.label,
            role: p.role || 'user',
            expires_at: ed,
            max_uses: p.maxUses,
            is_active: true,
            used_count: 0,
          };
          const { data, error } = await supabase
            .from(TBL)
            .insert(ins)
            .select()
            .single();
          if (error) throw error;
          const nc: AccessCode = {
            id: data.id,
            code: pc,
            encryptedCode: data.encrypted_code,
            label: data.label,
            role: data.role,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            usedCount: 0,
            maxUses: data.max_uses,
            isActive: true,
            createdBy: data.created_by,
            isLocal: false,
          };
          set((st) => ({ codes: [nc, ...st.codes], isLoading: false }));
          return nc;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          return null;
        }
      },

      revokeCode: async (id) => {
        if (id.startsWith('local-')) {
          set((st) => ({ codes: st.codes.filter((c) => c.id !== id) }));
          return;
        }
        try {
          const { error } = await supabase.from(TBL).update({ is_active: false }).eq('id', id);
          if (error) throw error;
        } catch (e: any) {
          set({ error: e.message });
        }
        set((st) => ({
          codes: st.codes.map((c) =>
            c.id === id ? { ...c, isActive: false } : c
          ),
        }));
      },

      refreshCodes: async () => {
        await get().loadCodes();
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'admin-store',
      partialize: (st) => ({ codes: st.codes }),
    }
  )
);

export function useSessionCodes() {
  const st = useAdminStore();
  return {
    codes: st.codes,
    isLoading: st.isLoading,
    error: st.error,
    loadCodes: st.loadCodes,
    createCode: st.createCode,
    revokeCode: st.revokeCode,
    refreshCodes: st.refreshCodes,
    clearError: st.clearError,
  };
}

// ============================================================
// LOGIN / AUTH STORE
// ============================================================
interface AuthState {
  token: SessionToken | null;
  isAuthenticated: boolean;
  loginError: string;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  loadSession: () => Promise<void>;
  hasCourseAccess: (_courseId: string) => boolean;
}

const SESSION_KEY = 'index_session_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  loginError: '',

  login: async (inputCode: string) => {
    set({ loginError: '' });
    const code = inputCode.toUpperCase().trim();
    const deviceFp = storeDeviceFingerprint();
    const now = new Date().toISOString();

    // 1. Buscar en Supabase por code (plano)
    try {
      const { data, error } = await supabase
        .from(TBL)
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Verificar expiracion
        if (data.expires_at && data.expires_at <= now) {
          set({ loginError: 'Codigo expirado. Contacta a tu instructor.' });
          return false;
        }

        // Verificar device binding
        if (isDeviceBound(data.id) && !isSameDevice(data.id, deviceFp)) {
          set({ loginError: 'Este codigo ya fue usado en otro dispositivo. Solicita uno nuevo.' });
          return false;
        }

        // Crear token
        const token: SessionToken = {
          name: data.label || 'Usuario',
          role: data.role || 'user',
          expiresAt: data.expires_at || new Date(Date.now() + 365 * 86400000).toISOString(),
          codeId: data.id,
          code: data.code,
        };

        // Guardar device binding
        saveDeviceBinding({
          codeId: data.id,
          deviceFp,
          boundAt: now,
        });

        // Guardar sesion
        localStorage.setItem(SESSION_KEY, JSON.stringify(token));
        set({ token, isAuthenticated: true, loginError: '' });
        return true;
      }
    } catch (err: any) {
      console.warn('Supabase login failed:', err);
    }

    // 2. Fallback: buscar en localStorage (admin-store)
    const localCodes = useAdminStore.getState().codes;
    const localCode = localCodes.find(c => c.code === code && c.isActive);
    if (localCode) {
      if (localCode.expiresAt && localCode.expiresAt <= now) {
        set({ loginError: 'Codigo expirado.' });
        return false;
      }
      if (isDeviceBound(localCode.id) && !isSameDevice(localCode.id, deviceFp)) {
        set({ loginError: 'Este codigo ya fue usado en otro dispositivo.' });
        return false;
      }
      const token: SessionToken = {
        name: localCode.label,
        role: localCode.role,
        expiresAt: localCode.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
        codeId: localCode.id,
        code: localCode.code,
      };
      saveDeviceBinding({ codeId: localCode.id, deviceFp, boundAt: now });
      localStorage.setItem(SESSION_KEY, JSON.stringify(token));
      set({ token, isAuthenticated: true, loginError: '' });
      return true;
    }

    set({ loginError: 'Codigo invalido. Verifica e intenta de nuevo.' });
    return false;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ token: null, isAuthenticated: false, loginError: '' });
  },

  loadSession: async () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const token: SessionToken = JSON.parse(raw);
      if (new Date(token.expiresAt) <= new Date()) {
        localStorage.removeItem(SESSION_KEY);
        set({ token: null, isAuthenticated: false, loginError: 'Sesion expirada.' });
        return;
      }
      // Verificar device binding
      const deviceFp = getDeviceFingerprint();
      if (isDeviceBound(token.codeId) && !isSameDevice(token.codeId, deviceFp)) {
        localStorage.removeItem(SESSION_KEY);
        set({ token: null, isAuthenticated: false, loginError: 'Dispositivo no autorizado.' });
        return;
      }
      set({ token, isAuthenticated: true, loginError: '' });
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  hasCourseAccess: (_courseId: string) => {
    const { token } = get();
    if (!token) return false;
    // Por ahora todos los usuarios autenticados tienen acceso a todos los cursos
    // TODO: implementar matriz de cursos por rol si es necesario
    return true;
  },
}));

// ============================================================
// COMPATIBILIDAD: useSessionStore = useAuthStore (login/auth)
// ============================================================
export const useSessionStore = useAuthStore;
