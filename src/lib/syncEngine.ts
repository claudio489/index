
import { supabase, checkSupabaseHealth, setSupabaseUserId } from './supabaseClient'

export type SyncTable = 'logbook' | 'equipment' | 'profile'

export interface SyncQueueItem {
  id: string
  table: SyncTable
  operation: 'insert' | 'update' | 'delete'
  localId: string
  data: Record<string, any>
  timestamp: number
  retries: number
  error?: string
  userId: string
}

interface SyncConflict {
  item: SyncQueueItem
  error: string
  timestamp: number
  resolved: boolean
}

export interface SyncEngineState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSync: Date | null
  conflicts: SyncConflict[]
}

const STORAGE_KEY = 'dds_sync_queue'
const CONFLICTS_KEY = 'dds_sync_conflicts'
const ID_MAP_KEY = 'dds_id_map'
const LAST_SYNC_KEY = 'dds_last_sync'
const MAX_RETRIES = 3
const SYNC_INTERVAL_MS = 30000

class IdMap {
  private map: Map<string, string> = new Map()

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(ID_MAP_KEY)
      if (stored) {
        const obj = JSON.parse(stored)
        this.map = new Map(Object.entries(obj))
      }
    } catch { }
  }

  private save(): void {
    const obj = Object.fromEntries(this.map)
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(obj))
  }

  set(localId: string, remoteId: string): void {
    this.map.set(localId, remoteId)
    this.save()
  }

  get(localId: string): string | undefined {
    return this.map.get(localId)
  }

  has(localId: string): boolean {
    return this.map.has(localId)
  }

  delete(localId: string): void {
    this.map.delete(localId)
    this.save()
  }
}

class SyncEngine {
  private queue: SyncQueueItem[] = []
  private isOnline: boolean = navigator.onLine
  private isSyncing: boolean = false
  private idMap: IdMap
  private listeners: Set<(state: SyncEngineState) => void> = new Set()
  private intervalId: number | null = null

  constructor() {
    this.idMap = new IdMap()
    this.loadQueue()
    this.setupNetworkListeners()
    this.startPeriodicSync()
  }

  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const fullItem: SyncQueueItem = {
      ...item,
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      retries: 0,
    }

    const existingIndex = this.queue.findIndex(
      q => q.localId === item.localId && q.table === item.table
    )
    if (existingIndex !== -1) {
      const existing = this.queue[existingIndex]
      
      if (item.operation === 'delete' && existing.operation === 'insert') {
        this.queue.splice(existingIndex, 1)
        this.saveQueue()
        this.notify()
        return
      }
      
      if (item.operation === 'update' && existing.operation === 'insert') {
        this.queue[existingIndex] = {
          ...existing,
          data: { ...existing.data, ...item.data },
          timestamp: Date.now(),
        }
        this.saveQueue()
        this.notify()
        return
      }
      
      if (item.operation === 'update' && existing.operation === 'update') {
        this.queue[existingIndex] = {
          ...existing,
          data: { ...existing.data, ...item.data },
          timestamp: Date.now(),
        }
        this.saveQueue()
        this.notify()
        return
      }
    }

    this.queue.push(fullItem)
    this.saveQueue()
    this.notify()

    console.log('[Sync] Added to queue:', item.table, item.operation, 'user:', item.userId, 'queue size:', this.queue.length)

    if (this.isOnline && !this.isSyncing) {
      await this.processQueue()
    }
  }

  getState(): SyncEngineState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.queue.length,
      lastSync: this.getLastSync(),
      conflicts: this.getConflicts(),
    }
  }

  subscribe(callback: (state: SyncEngineState) => void): () => void {
    this.listeners.add(callback)
    callback(this.getState())
    return () => this.listeners.delete(callback)
  }

  async forceSync(): Promise<void> {
    if (!this.isOnline) return
    await this.processQueue()
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote'): Promise<void> {
    const conflicts = this.getConflicts()
    const conflict = conflicts.find(c => c.item.id === conflictId)
    if (!conflict) return

    if (resolution === 'local') {
      await this.addToQueue({
        table: conflict.item.table,
        operation: conflict.item.operation,
        localId: conflict.item.localId,
        data: conflict.item.data,
        userId: conflict.item.userId,
      })
    }

    conflict.resolved = true
    this.saveConflicts(conflicts.filter(c => !c.resolved))
    this.notify()
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notify()
      this.processQueue()
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notify()
    })
  }

  private startPeriodicSync(): void {
    this.intervalId = window.setInterval(() => {
      if (this.isOnline && this.queue.length > 0 && !this.isSyncing) {
        this.processQueue()
      }
    }, SYNC_INTERVAL_MS)
  }

  private async processQueue(): Promise<void> {
    if ('locks' in navigator) {
      try {
        await navigator.locks.request('dds-sync', { ifAvailable: true }, async (lock) => {
          if (!lock) return
          await this.doProcessQueue()
        })
      } catch {
        await this.doProcessQueue()
      }
    } else {
      await this.doProcessQueue()
    }
  }

  private async doProcessQueue(): Promise<void> {
    if (this.isSyncing || this.queue.length === 0) return
    this.isSyncing = true
    this.notify()

    const batch = this.queue.slice(0, 10)
    const remaining = this.queue.slice(10)

    const userId = batch[0].userId
    if (!userId) {
      console.log('[Sync] No userId in batch, skipping')
      this.isSyncing = false
      this.notify()
      return
    }

    const health = await checkSupabaseHealth()
    if (!health) {
      console.log('[Sync] Supabase health check failed')
      this.isSyncing = false
      this.notify()
      return
    }

    setSupabaseUserId(userId)

    console.log('[Sync] Processing batch:', batch.length, 'items for user:', userId)

    try {
      const items = batch.map(item => ({
        table: item.table === 'logbook' ? 'logbook_entries' : item.table === 'profile' ? 'profiles' : item.table,
        operation: item.operation.toUpperCase(),
        local_id: item.localId,
        data: item.data,
      }))

      const { data, error } = await supabase.rpc('sync_batch', {
        p_user_id: userId,
        p_items: items,
      })

      if (error) throw error

      console.log('[Sync] Batch result:', data)

      if (data?.results) {
        for (const result of data.results) {
          if (result.remote_id && result.local_id) {
            this.idMap.set(result.local_id, result.remote_id)
          }
        }
      }

      this.queue = remaining
      this.saveQueue()
      this.updateLastSync()
      console.log('[Sync] Sync completed successfully')

    } catch (error) {
      console.error('[Sync] Batch error:', error)
      for (const item of batch) {
        item.retries++
        if (item.retries > MAX_RETRIES) {
          this.logConflict(item, error)
          const idx = this.queue.findIndex(q => q.id === item.id)
          if (idx !== -1) this.queue.splice(idx, 1)
        }
      }
      this.saveQueue()
    }

    this.isSyncing = false
    this.notify()

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }

  private logConflict(item: SyncQueueItem, error: any): void {
    const conflicts = this.getConflicts()
    conflicts.push({
      item,
      error: error?.message || String(error),
      timestamp: Date.now(),
      resolved: false,
    })
    this.saveConflicts(conflicts)
  }

  private getConflicts(): SyncConflict[] {
    try {
      const stored = localStorage.getItem(CONFLICTS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveConflicts(conflicts: SyncConflict[]): void {
    localStorage.setItem(CONFLICTS_KEY, JSON.stringify(conflicts))
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) this.queue = JSON.parse(stored)
    } catch { }
  }

  private saveQueue(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue))
  }

  private getLastSync(): Date | null {
    try {
      const stored = localStorage.getItem(LAST_SYNC_KEY)
      return stored ? new Date(stored) : null
    } catch {
      return null
    }
  }

  private updateLastSync(): void {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
  }

  private notify(): void {
    const state = this.getState()
    this.listeners.forEach(cb => {
      try { cb(state) } catch { }
    })
  }

  destroy(): void {
    if (this.intervalId) clearInterval(this.intervalId)
  }
}



// Singleton export para compatibilidad
export const syncEngine = new SyncEngine()













