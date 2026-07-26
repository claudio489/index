// import { supabase } from '../lib/supabaseClient'; // TODO: usar para sync directo
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncEngine } from '@/lib/syncEngine'
import { useSessionStore } from '@/stores/useSessionStore'
import { getUserData, setUserData } from '@/lib/userStorage'

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
  tank: '🫙',
  regulator: '🌬️',
  bcd: '🦺',
  wetsuit: '👔',
  computer: '⌚',
  fins: '🦶',
  mask: '🥽',
  weights: '⚖️',
  other: '📦',
}

export function getAllAlerts(_equipment: Equipment[]): EquipmentAlert[] {
  return []
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
}

const STORAGE_KEY = 'equipment_storage'

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      equipment: getUserData<Equipment[]>(STORAGE_KEY, []),
      items: getUserData<Equipment[]>(STORAGE_KEY, []),

      addEquipment: (equipment) => {
        const localId = `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const newEquipment = { ...equipment, id: localId }

        const current = getUserData<Equipment[]>(STORAGE_KEY, [])
        const updated = [...current, newEquipment]
        setUserData(STORAGE_KEY, updated)

        set(() => ({
          equipment: updated,
          items: updated,
        }))

        const userId = useSessionStore.getState().token?.codeId || 'demo'
        console.log('[Equipment] Adding equipment, userId:', userId)

        syncEngine.addToQueue({
          table: 'equipment',
          operation: 'insert',
          localId,
          data: {
            ...newEquipment,
            user_id: userId,
            local_id: localId,
            created_at: new Date().toISOString(),
          },
          userId,
        })
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

        const userId = useSessionStore.getState().token?.codeId || 'demo'
        syncEngine.addToQueue({
          table: 'equipment',
          operation: 'update',
          localId: id,
          data: {
            ...updates,
            updated_at: new Date().toISOString(),
          },
          userId,
        })
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

        const userId = useSessionStore.getState().token?.codeId || 'demo'
        syncEngine.addToQueue({
          table: 'equipment',
          operation: 'delete',
          localId: id,
          data: {},
          userId,
        })
      },

      deleteItem: (id) => {
        get().deleteEquipment(id)
      },
    }),
    {
      name: 'dds-equipment-storage',
    }
  )
)





