import { create } from 'zustand'
import { supabaseDivespot } from '@/lib/supabaseDivespot'
import { getUserData, setUserData, getCurrentUserId } from '@/lib/userStorage'
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore'

export interface UserProfile {
  id: string
  fullName: string
  email?: string
  phone?: string
  birthDate?: string
  certifications?: string[]
  diveLevel?: string
  trainingCenter?: string
  instructor?: string
  preferredLanguage?: string
  units?: 'metric' | 'imperial'
  photoUrl?: string
  createdAt?: string
  updatedAt?: string
}

const STORAGE_KEY = 'user_profile'

function toDbRow(profile: UserProfile, userId: string) {
  return {
    id: userId,
    full_name: profile.fullName || null,
    phone: profile.phone || null,
    birth_date: profile.birthDate || null,
    certifications: profile.certifications || null,
    dive_level: profile.diveLevel || null,
    training_center: profile.trainingCenter || null,
    instructor: profile.instructor || null,
    preferred_language: profile.preferredLanguage || null,
    units: profile.units || null,
    photo_url: profile.photoUrl || null,
    updated_at: new Date().toISOString(),
  }
}

function fromDbRow(row: any, userId: string): UserProfile {
  return {
    id: userId,
    fullName: row.full_name || '',
    phone: row.phone || undefined,
    birthDate: row.birth_date || undefined,
    certifications: row.certifications || undefined,
    diveLevel: row.dive_level || undefined,
    trainingCenter: row.training_center || undefined,
    instructor: row.instructor || undefined,
    preferredLanguage: row.preferred_language || undefined,
    units: row.units || undefined,
    photoUrl: row.photo_url || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  }
}

export async function fetchProfileFromServer(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseDivespot
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return null
    return fromDbRow(data, userId)
  } catch (err) {
    console.warn('[Profile] Excepcion trayendo del servidor:', err)
    return null
  }
}

interface UserProfileState {
  profile: UserProfile | null
  isLoading: boolean
  lastError: string | null
  setProfile: (profile: Partial<UserProfile>) => void
  loadProfile: () => void
  syncProfile: () => Promise<void>
  clearProfile: () => void
  hydrateFromServer: () => Promise<void>
}

export const useUserProfileStore = create<UserProfileState>()((set, get) => ({
  profile: getUserData<UserProfile | null>(STORAGE_KEY, null),
  isLoading: false,
  lastError: null,

  setProfile: (updates) => {
    const current = get().profile || { id: `profile-${Date.now()}`, fullName: '' }
    const updated: UserProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    setUserData(STORAGE_KEY, updated)
    set({ profile: updated })

    const userId = getCurrentUserId()
    if (userId && userId !== 'demo') {
      supabaseDivespot
        .from('profiles')
        .upsert(toDbRow(updated, userId), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('[Profile] Error guardando en servidor:', error)
          else console.log('[Profile] Guardado en servidor OK')
        })
    }
  },

  loadProfile: () => {
    const profile = getUserData<UserProfile | null>(STORAGE_KEY, null)
    set({ profile })
  },

  syncProfile: async () => {
    set({ isLoading: true, lastError: null })
    try {
      const userId = getCurrentUserId()
      const profile = get().profile
      if (userId && userId !== 'demo' && profile) {
        const { error } = await supabaseDivespot
          .from('profiles')
          .upsert(toDbRow(profile, userId), { onConflict: 'id' })
        if (error) throw error
      }
    } catch (err) {
      set({ lastError: err instanceof Error ? err.message : 'Sync error' })
    } finally {
      set({ isLoading: false })
    }
  },

  clearProfile: () => {
    setUserData(STORAGE_KEY, null)
    set({ profile: null, lastError: null })
  },

  hydrateFromServer: async () => {
    const userId = getCurrentUserId()
    if (!userId || userId === 'demo') return

    console.log('[Profile] Hidratando desde servidor, userId:', userId)
    const serverProfile = await fetchProfileFromServer(userId)
    console.log('[Profile] Encontrado en servidor:', !!serverProfile)

    if (serverProfile) {
      setUserData(STORAGE_KEY, serverProfile)
      set({ profile: serverProfile })
    }
  },
}))

useDivespotAuthStore.subscribe((state, prevState) => {
  if (state.userId && state.userId !== prevState.userId) {
    const reloaded = getUserData<UserProfile | null>(STORAGE_KEY, null)
    useUserProfileStore.setState({ profile: reloaded })
  }
})