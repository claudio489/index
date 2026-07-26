// src/stores/useDivespotAuthStore.ts
// Autenticacion REAL (Supabase Auth, email + contrasena) contra el proyecto 'divespot'.
// Separado del sistema de codigos INDEX-XXXX (useSessionStore.ts), que sigue existiendo
// en paralelo hasta que migremos el login principal (Fase 2 del plan).
import { create } from 'zustand';
import { supabaseDivespot } from '@/lib/supabaseDivespot';

export interface DivespotProfile {
  id: string;
  name: string | null;
  full_name: string | null;
  is_instructor: boolean;
  cert_level: string | null;
  dive_level: string | null;
}

interface DivespotAuthState {
  userId: string | null;
  email: string | null;
  profile: DivespotProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

async function fetchProfile(userId: string): Promise<DivespotProfile | null> {
  const { data, error } = await supabaseDivespot
    .from('profiles')
    .select('id, name, full_name, is_instructor, cert_level, dive_level')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as DivespotProfile;
}

export const useDivespotAuthStore = create<DivespotAuthState>((set) => ({
  userId: null,
  email: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: '',
  signUp: async (email, password, name) => {
    set({ isLoading: true, error: '' });
    try {
      const { data, error } = await supabaseDivespot.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        set({ isLoading: false, error: '' });
        return true;
      }
      if (data.user && data.session) {
        const profile = await fetchProfile(data.user.id);
        set({
          userId: data.user.id,
          email: data.user.email ?? null,
          profile,
          isAuthenticated: true,
          isLoading: false,
        });
      }
      return true;
    } catch (e: any) {
      set({ error: e.message || 'Error al crear la cuenta', isLoading: false });
      return false;
    }
  },
  signIn: async (email, password) => {
    set({ isLoading: true, error: '' });
    try {
      const { data, error } = await supabaseDivespot.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Cerrar cualquier otra sesion activa de esta cuenta (bloqueo de uso concurrente
      // entre distintas personas compartiendo el mismo usuario/contrasena)
      try {
        await supabaseDivespot.auth.signOut({ scope: 'others' });
      } catch (signOutErr) {
        console.warn('[Auth] No se pudo cerrar otras sesiones:', signOutErr);
      }

      const profile = data.user ? await fetchProfile(data.user.id) : null;
      set({
        userId: data.user?.id ?? null,
        email: data.user?.email ?? null,
        profile,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (e: any) {
      set({ error: e.message || 'Email o contrasena incorrectos', isLoading: false });
      return false;
    }
  },
  signOut: async () => {
    await supabaseDivespot.auth.signOut();
    set({ userId: null, email: null, profile: null, isAuthenticated: false });
  },
  loadSession: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabaseDivespot.auth.getSession();
      const session = data.session;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({
          userId: session.user.id,
          email: session.user.email ?? null,
          profile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  clearError: () => set({ error: '' }),
}));