import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncEngine } from '@/lib/syncEngine'
import { useSessionStore } from '@/stores/useSessionStore'
import { getUserData, setUserData } from '@/lib/userStorage'

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

interface UserProfileState {
  profile: UserProfile | null
  isLoading: boolean
  lastError: string | null
  setProfile: (profile: Partial<UserProfile>) => void
  loadProfile: () => void
  syncProfile: () => Promise<void>
  clearProfile: () => void
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
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

        const userId = useSessionStore.getState().token?.codeId || 'demo'
        syncEngine.addToQueue({
          table: 'profile',
          operation: 'insert',
          localId: updated.id,
          data: {
            ...updated,
            user_id: userId,
            local_id: updated.id,
            updated_at: new Date().toISOString(),
          },
          userId,
        })
      },

      loadProfile: () => {
        const profile = getUserData<UserProfile | null>(STORAGE_KEY, null)
        set({ profile })
      },

      syncProfile: async () => {
        set({ isLoading: true, lastError: null })
        try {
          await syncEngine.forceSync()
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
    }),
    {
      name: 'dds-user-profile',
    }
  )
)


