import { create } from 'zustand'
import { syncEngine } from '@/lib/syncEngine'

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline' | 'error' | 'pending'

interface SyncState {
  status: SyncStatus
  lastSync: number
  pendingCount: number
  latency: number
  error: string | null
  isOnline: boolean
  isSupabaseConnected: boolean
  isSyncing: boolean
  conflicts: any[]
  initialize: () => void
  sync: () => Promise<void>
  forceSync: () => Promise<void>
  setOnline: (online: boolean) => void
  clearError: () => void
}

export const useSyncStore = create<SyncState>()((set, get) => ({
  status: 'idle',
  lastSync: 0,
  pendingCount: 0,
  latency: 0,
  error: null,
  isOnline: navigator.onLine,
  isSupabaseConnected: false,
  isSyncing: false,
  conflicts: [],

  initialize: () => {
    set({
      status: navigator.onLine ? 'online' : 'offline',
      isOnline: navigator.onLine,
    })
  },

  sync: async () => {
    const { isOnline } = get()
    if (!isOnline) {
      set({ status: 'offline', error: 'Sin conexión' })
      return
    }
    set({ status: 'syncing', isSyncing: true, error: null })
    try {
      await syncEngine.forceSync()
      set({ status: 'online', lastSync: Date.now(), isSyncing: false, pendingCount: 0 })
    } catch (err) {
      set({ status: 'error', isSyncing: false, error: (err as Error).message })
    }
  },

  forceSync: async () => {
    await get().sync()
  },

  setOnline: (online: boolean) => {
    set({ isOnline: online, status: online ? 'online' : 'offline' })
  },

  clearError: () => set({ error: null, status: get().isOnline ? 'online' : 'offline' }),
}))
