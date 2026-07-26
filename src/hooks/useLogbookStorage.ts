import { useState, useEffect, useCallback } from 'react'
import { supabaseDivespot } from '@/lib/supabaseDivespot'
import { getUserData, setUserData, getCurrentUserId } from '@/lib/userStorage'

export interface LogEntry {
  id: string
  dive_number: string
  date: string
  location: string
  site: string
  siteName?: string
  entry_time: string
  exit_time: string
  bottom_time: string
  bottomTime?: string
  max_depth: string
  depth?: string
  avg_depth: string
  tank_size: string
  psi_start: string
  psi_end: string
  dive_type: string
  tank_type: string
  buddy: string
  diver_name: string
  comments: string
  notes?: string
  createdAt?: string
}

const STORAGE_KEY = 'logbook_entries'

function toDbRow(entry: LogEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    date: entry.date || null,
    site_name: entry.siteName || entry.site || entry.location || null,
    depth: entry.max_depth ? parseInt(entry.max_depth) || null : (entry.depth ? parseInt(entry.depth) || null : null),
    bottom_time: entry.bottom_time ? parseInt(entry.bottom_time) || null : (entry.bottomTime ? parseInt(entry.bottomTime) || null : null),
    notes: entry.comments || entry.notes || null,
    is_public: false,
    is_deleted: false,
    local_id: entry.id,
    data: {
      dive_number: entry.dive_number,
      location: entry.location,
      site: entry.site,
      entry_time: entry.entry_time,
      exit_time: entry.exit_time,
      avg_depth: entry.avg_depth,
      tank_size: entry.tank_size,
      psi_start: entry.psi_start,
      psi_end: entry.psi_end,
      dive_type: entry.dive_type,
      tank_type: entry.tank_type,
      buddy: entry.buddy,
      diver_name: entry.diver_name,
    },
    updated_at: new Date().toISOString(),
  }
}

function fromDbRow(row: any): LogEntry {
  const extra = row.data || {}
  return {
    id: row.id,
    dive_number: extra.dive_number || '',
    date: row.date || '',
    location: extra.location || '',
    site: extra.site || '',
    siteName: row.site_name || '',
    entry_time: extra.entry_time || '',
    exit_time: extra.exit_time || '',
    bottom_time: row.bottom_time != null ? String(row.bottom_time) : '',
    bottomTime: row.bottom_time != null ? String(row.bottom_time) : undefined,
    max_depth: row.depth != null ? String(row.depth) : '',
    depth: row.depth != null ? String(row.depth) : undefined,
    avg_depth: extra.avg_depth || '',
    tank_size: extra.tank_size || '',
    psi_start: extra.psi_start || '',
    psi_end: extra.psi_end || '',
    dive_type: extra.dive_type || '',
    tank_type: extra.tank_type || '',
    buddy: extra.buddy || '',
    diver_name: extra.diver_name || '',
    comments: row.notes || '',
    notes: row.notes || undefined,
    createdAt: row.created_at || undefined,
  }
}

export async function fetchLogbookFromServer(userId: string): Promise<LogEntry[]> {
  try {
    const { data, error } = await supabaseDivespot
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })

    if (error || !data) {
      console.warn('[Logbook] Error trayendo del servidor:', error)
      return []
    }
    return data.map(fromDbRow)
  } catch (err) {
    console.warn('[Logbook] Excepcion trayendo del servidor:', err)
    return []
  }
}

export function useLogbookStorage() {
  const [entries, setEntries] = useState<LogEntry[]>(() => {
    return getUserData<LogEntry[]>(STORAGE_KEY, [])
  })
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    setUserData(STORAGE_KEY, entries)
  }, [entries])

  useEffect(() => {
    if (entries.length > 0) return
    const userId = getCurrentUserId()
    if (!userId || userId === 'demo') return

    console.log('[Logbook] Hidratando desde servidor, userId:', userId)
    fetchLogbookFromServer(userId).then((serverEntries) => {
      console.log('[Logbook] Encontrados en servidor:', serverEntries.length)
      if (serverEntries.length > 0) {
        setEntries(serverEntries)
      }
    })
  }, [])

  const addEntry = useCallback((entry: Omit<LogEntry, 'id'>) => {
    const localId = crypto.randomUUID()
    const newEntry = { ...entry, id: localId, createdAt: new Date().toISOString() }
    setEntries(prev => [...prev, newEntry])

    const userId = getCurrentUserId()
    console.log('[Logbook] Agregando entrada, userId:', userId)

    if (userId && userId !== 'demo') {
      supabaseDivespot
        .from('logbook_entries')
        .insert(toDbRow(newEntry, userId))
        .then(({ error }) => {
          if (error) console.warn('[Logbook] Error guardando en servidor:', error)
          else console.log('[Logbook] Guardado en servidor OK')
        })
    }
  }, [])

  const updateEntry = useCallback((id: string, updates: Partial<LogEntry>) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      const userId = getCurrentUserId()
      const full = updated.find(e => e.id === id)
      if (userId && userId !== 'demo' && full) {
        supabaseDivespot
          .from('logbook_entries')
          .update(toDbRow(full, userId))
          .eq('id', id)
          .eq('user_id', userId)
          .then(({ error }) => {
            if (error) console.warn('[Logbook] Error actualizando en servidor:', error)
          })
      }
      return updated
    })
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))

    const userId = getCurrentUserId()
    if (userId && userId !== 'demo') {
      supabaseDivespot
        .from('logbook_entries')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('[Logbook] Error borrando en servidor:', error)
        })
    }
  }, [])

  const saveEntry = useCallback((entry: Omit<LogEntry, 'id'>) => {
    addEntry(entry)
  }, [addEntry])

  const syncNow = useCallback(async () => {
    setIsLoading(true)
    setLastError(null)
    try {
      const userId = getCurrentUserId()
      if (userId && userId !== 'demo') {
        const serverEntries = await fetchLogbookFromServer(userId)
        if (serverEntries.length > 0) setEntries(serverEntries)
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Sync error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    entries,
    isLoading,
    lastError,
    addEntry,
    updateEntry,
    deleteEntry,
    saveEntry,
    syncNow,
  }
}