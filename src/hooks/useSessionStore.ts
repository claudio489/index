// src/hooks/useSessionStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { encryptCode } from '@/lib/accessControl'
import { generateAccessCode } from '@/lib/accessCodeGenerator'

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

export interface CreateCodeParams {
  label: string
  role?: 'admin' | 'instructor' | 'user'
  expiresInDays?: number
  maxUses?: number
}

interface SessionState {
  codes: AccessCode[]
  isLoading: boolean
  error: string | null
  loadCodes: () => Promise<void>
  createCode: (p: CreateCodeParams) => Promise<AccessCode | null>
  revokeCode: (id: string) => Promise<void>
  refreshCodes: () => Promise<void>
  clearError: () => void
}

const TBL = 'access_codes'

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      codes: [],
      isLoading: false,
      error: null,

      loadCodes: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase
            .from(TBL)
            .select('*')
            .order('created_at', { ascending: false })
          if (error) throw error
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
          })
        } catch (e: any) {
          set({ error: e.message, isLoading: false })
        }
      },

      createCode: async (p) => {
        set({ isLoading: true, error: null })
        try {
          const pc = generateAccessCode()
          const ec = encryptCode(pc)
          const ed = p.expiresInDays
            ? new Date(Date.now() + p.expiresInDays * 86400000).toISOString()
            : null
          const ins: any = {
            encrypted_code: ec,
            code: pc,
            label: p.label,
            role: p.role || 'user',
            expires_at: ed,
            max_uses: p.maxUses,
            is_active: true,
            used_count: 0,
          }
          const { data, error } = await supabase
            .from(TBL)
            .insert(ins)
            .select()
            .single()
          if (error) throw error
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
          }
          set((st) => ({ codes: [nc, ...st.codes], isLoading: false }))
          return nc
        } catch (e: any) {
          set({ error: e.message, isLoading: false })
          return null
        }
      },

      revokeCode: async (id) => {
        if (id.startsWith('local-')) {
          set((st) => ({ codes: st.codes.filter((c) => c.id !== id) }))
          return
        }
        try {
          const { error } = await supabase.from(TBL).update({ is_active: false }).eq('id', id)
          if (error) throw error
        } catch (e: any) {
          set({ error: e.message })
        }
        set((st) => ({
          codes: st.codes.map((c) =>
            c.id === id ? { ...c, isActive: false } : c
          ),
        }))
      },

      refreshCodes: async () => {
        await get().loadCodes()
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'session-store',
      partialize: (st) => ({ codes: st.codes }),
    }
  )
)

export function useSessionCodes() {
  const st = useSessionStore()
  return {
    codes: st.codes,
    isLoading: st.isLoading,
    error: st.error,
    loadCodes: st.loadCodes,
    createCode: st.createCode,
    revokeCode: st.revokeCode,
    refreshCodes: st.refreshCodes,
    clearError: st.clearError,
  }
}
