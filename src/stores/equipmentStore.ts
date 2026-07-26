import { create } from 'zustand'
import { supabaseDivespot } from '@/lib/supabaseDivespot'
import { getUserData, setUserData, getCurrentUserId } from '@/lib/userStorage'
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore'

export type EquipmentItem = Equipment

export interface EquipmentAlert {
  id: string
  type: string
  message: string
  severity: 'warning' | 'critical' | 'info'
  date: string
}

export const equipmentTypeLabels: Record<string, string> = {
  tank: 'Tanque',
  regulator: 'Regulador',
  bcd: 'BCD',
  wetsuit: 'Traje',
  computer: 'Computadora',
  fins: 'Aletas',
  mask: 'Mascara',
  weights: 'Lastre',
  other: 'Otro',
}

export const equipmentTypeIcons: Record<string, string> = {
  tank: '??',
  regulator: '???',
  bcd: '??',
  wetsuit: '??',
  computer: '?',
  fins: '??',
  mask: '??',
  weights: '??',
  other: '??',
}

export function getAllAlerts(equipment: Equipment[]): EquipmentAlert[] {
  const alerts: EquipmentAlert[] = []
  const now = new Date()
  const WARNING_DAYS = 30

  const addDateAlert = (
    item: Equipment,
    lastDate: string | undefined,
    intervalMonths: number | undefined,
    label: string,
    idSuffix: string
  ) => {
    if (!lastDate || !intervalMonths) return
    const last = new Date(lastDate)
    const due = new Date(last)
    due.setMonth(due.getMonth() + intervalMonths)
    const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const itemLabel = `${equipmentTypeLabels[item.type] || item.type}${item.brand ? ' ' + item.brand : ''}`

    if (daysUntilDue < 0) {
      alerts.push({
        id: `${item.id}-${idSuffix}`,
        type: 'critical',
        message: `${label} vencida hace ${Math.abs(daysUntilDue)} dias (${itemLabel})`,
        severity: 'critical',
        date: due.toISOString(),
      })
    } else if (daysUntilDue <= WARNING_DAYS) {
      alerts.push({
        id: `${item.id}-${idSuffix}`,
        type: 'warning',
        message: `${label} vence en ${daysUntilDue} dias (${itemLabel})`,
        severity: 'warning',
        date: due.toISOString(),
      })
    }
  }

  for (const item of equipment) {
    if (item.alertEnabled === false) continue

    addDateAlert(item, item.lastServiceDate, item.serviceIntervalMonths, 'Mantención', 'service')

    if (item.lastPhDate && item.phIntervalYears) {
      addDateAlert(item, item.lastPhDate, item.phIntervalYears * 12, 'Prueba PH', 'ph')
    }

    addDateAlert(item, item.lastVisualDate, item.visualIntervalMonths, 'Inspección Visual', 'visual')

    if (item.serviceIntervalDives && item.totalDives !== undefined) {
      const divesRemaining = item.serviceIntervalDives - item.totalDives
      const itemLabel = `${equipmentTypeLabels[item.type] || item.type}${item.brand ? ' ' + item.brand : ''}`
      if (divesRemaining <= 0) {
        alerts.push({
          id: `${item.id}-dives`,
          type: 'critical',
          message: `Mantención vencida por uso (${item.totalDives}/${item.serviceIntervalDives} inmersiones) — ${itemLabel}`,
          severity: 'critical',
          date: now.toISOString(),
        })
      } else if (divesRemaining <= 10) {
        alerts.push({
          id: `${item.id}-dives`,
          type: 'warning',
          message: `Mantención en ${divesRemaining} inmersiones más — ${itemLabel}`,
          severity: 'warning',
          date: now.toISOString(),
        })
      }
    }
  }

  return alerts
}

export interface Equipment {
  id: string
  type: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  lastServiceDate?: string
  serviceIntervalDives?: number
  serviceIntervalMonths?: number
  totalDives?: number
  volume?: string
  workingPressure?: string
  material?: string
  lastPhDate?: string
  phIntervalYears?: number
  lastVisualDate?: string
  visualIntervalMonths?: number
  notes?: string
  alertEnabled?: boolean
}

interface EquipmentState {
  equipment: Equipment[]
  items: Equipment[]
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void
  addItem: (equipment: Omit<Equipment, 'id'>) => void
  updateEquipment: (id: string, updates: Partial<Equipment>) => void
  updateItem: (id: string, updates: Partial<Equipment>) => void
  deleteEquipment: (id: string) => void
  deleteItem: (id: string) => void
  hydrateFromServer: () => Promise<void>
}

const STORAGE_KEY = 'equipment_storage'

function toDbRow(equipment: Equipment, userId: string) {
  return {
    id: equipment.id,
    user_id: userId,
    type: equipment.type,
    brand: equipment.brand || null,
    model: equipment.model || null,
    serial_number: equipment.serialNumber || null,
    purchase_date: equipment.purchaseDate || null,
    last_service_date: equipment.lastServiceDate || null,
    service_interval_dives: equipment.serviceIntervalDives ?? null,
    service_interval_months: equipment.serviceIntervalMonths ?? null,
    total_dives: equipment.totalDives ?? 0,
    tank_volume: equipment.volume ? Number(equipment.volume) : null,
    working_pressure: equipment.workingPressure ? Number(equipment.workingPressure) : null,
    material: equipment.material || null,
    last_ph_date: equipment.lastPhDate || null,
    ph_interval_years: equipment.phIntervalYears ?? null,
    last_visual_date: equipment.lastVisualDate || null,
    visual_interval_months: equipment.visualIntervalMonths ?? null,
    notes: equipment.notes || null,
    alert_enabled: equipment.alertEnabled ?? true,
    updated_at: new Date().toISOString(),
  }
}

function fromDbRow(row: any): Equipment {
  return {
    id: row.id,
    type: row.type,
    brand: row.brand || undefined,
    model: row.model || undefined,
    serialNumber: row.serial_number || undefined,
    purchaseDate: row.purchase_date || undefined,
    lastServiceDate: row.last_service_date || undefined,
    serviceIntervalDives: row.service_interval_dives ?? undefined,
    serviceIntervalMonths: row.service_interval_months ?? undefined,
    totalDives: row.total_dives ?? undefined,
    volume: row.tank_volume != null ? String(row.tank_volume) : undefined,
    workingPressure: row.working_pressure != null ? String(row.working_pressure) : undefined,
    material: row.material || undefined,
    lastPhDate: row.last_ph_date || undefined,
    phIntervalYears: row.ph_interval_years ?? undefined,
    lastVisualDate: row.last_visual_date || undefined,
    visualIntervalMonths: row.visual_interval_months ?? undefined,
    notes: row.notes || undefined,
    alertEnabled: row.alert_enabled ?? true,
  }
}

export async function fetchEquipmentFromServer(userId: string): Promise<Equipment[]> {
  try {
    const { data, error } = await supabaseDivespot
      .from('equipment_items')
      .select('*')
      .eq('user_id', userId)

    if (error || !data) {
      console.warn('[Equipment] Error trayendo del servidor:', error)
      return []
    }
    return data.map(fromDbRow)
  } catch (err) {
    console.warn('[Equipment] Excepcion trayendo del servidor:', err)
    return []
  }
}

export const useEquipmentStore = create<EquipmentState>()((set, get) => ({
  equipment: getUserData<Equipment[]>(STORAGE_KEY, []),
  items: getUserData<Equipment[]>(STORAGE_KEY, []),

  addEquipment: (equipment) => {
    const localId = crypto.randomUUID()
    const newEquipment = { ...equipment, id: localId }

    const current = getUserData<Equipment[]>(STORAGE_KEY, [])
    const updated = [...current, newEquipment]
    setUserData(STORAGE_KEY, updated)

    set(() => ({
      equipment: updated,
      items: updated,
    }))

    const userId = getCurrentUserId()
    console.log('[Equipment] Agregando equipo, userId:', userId)

    if (userId && userId !== 'demo') {
      supabaseDivespot
        .from('equipment_items')
        .insert(toDbRow(newEquipment, userId))
        .then(({ error }) => {
          if (error) console.warn('[Equipment] Error guardando en servidor:', error)
          else console.log('[Equipment] Guardado en servidor OK')
        })
    }
  },

  addItem: (equipment) => {
    get().addEquipment(equipment)
  },

  updateEquipment: (id, updates) => {
    const current = getUserData<Equipment[]>(STORAGE_KEY, [])
    const updated = current.map((eq) =>
      eq.id === id ? { ...eq, ...updates } : eq
    )
    setUserData(STORAGE_KEY, updated)

    set(() => ({
      equipment: updated,
      items: updated,
    }))

    const userId = getCurrentUserId()
    if (userId && userId !== 'demo') {
      supabaseDivespot
        .from('equipment_items')
        .update(toDbRow({ ...(updated.find((e) => e.id === id) as Equipment) }, userId))
        .eq('id', id)
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('[Equipment] Error actualizando en servidor:', error)
        })
    }
  },

  updateItem: (id, updates) => {
    get().updateEquipment(id, updates)
  },

  deleteEquipment: (id) => {
    const current = getUserData<Equipment[]>(STORAGE_KEY, [])
    const updated = current.filter((eq) => eq.id !== id)
    setUserData(STORAGE_KEY, updated)

    set(() => ({
      equipment: updated,
      items: updated,
    }))

    const userId = getCurrentUserId()
    if (userId && userId !== 'demo') {
      supabaseDivespot
        .from('equipment_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('[Equipment] Error borrando en servidor:', error)
        })
    }
  },

  deleteItem: (id) => {
    get().deleteEquipment(id)
  },

  hydrateFromServer: async () => {
    const current = get().items
    if (current.length > 0) {
      console.log('[Equipment] Ya hay equipo local, no se trae del servidor')
      return
    }

    const userId = getCurrentUserId()
    if (!userId || userId === 'demo') {
      console.log('[Equipment] Sin sesion real, no se puede hidratar')
      return
    }

    console.log('[Equipment] Hidratando desde servidor, userId:', userId)
    const serverEquipment = await fetchEquipmentFromServer(userId)
    console.log('[Equipment] Encontrados en servidor:', serverEquipment.length)

    if (serverEquipment.length > 0) {
      setUserData(STORAGE_KEY, serverEquipment)
      set({ equipment: serverEquipment, items: serverEquipment })
    }
  },
}))

useDivespotAuthStore.subscribe((state, prevState) => {
  if (state.userId && state.userId !== prevState.userId) {
    const reloaded = getUserData<Equipment[]>(STORAGE_KEY, [])
    useEquipmentStore.setState({ equipment: reloaded, items: reloaded })
  }
})