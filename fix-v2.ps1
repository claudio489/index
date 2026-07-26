# fix-v2.ps1 - Correccion para buhlmann.ts + useSessionStore.ts
# Ejecutar:  cd C:\Users\csilv\Downloads\IndexApp
#            .\fix-v2.ps1
# Si da error de politica: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

param([string]$Base = "C:\Users\csilv\Downloads\IndexApp")

$ErrorActionPreference = "Stop"
$lib = Join-Path $Base "src\lib"
$hooks = Join-Path $Base "src\hooks"
New-Item -ItemType Directory -Path $lib, $hooks -Force | Out-Null

# ============ BACKUPS ============
$b = Join-Path $lib "buhlmann.ts"
$s = Join-Path $hooks "useSessionStore.ts"
if(Test-Path $b){ Copy-Item $b "$b.bak-$(Get-Date -Format 'yyyyMMddHHmmss')" -Force }
if(Test-Path $s){ Copy-Item $s "$s.bak-$(Get-Date -Format 'yyyyMMddHHmmss')" -Force }

# ============ buhlmann.ts ============
$buhlmann = @'
// buhlmann.ts v2.1 - ZHL-16C with Gradient Factors
export interface Gas { fO2: number; fHe: number; name: string; mod: number }
export interface DecoStop { depth: number; time: number; gas: Gas }
export interface DiveTimelinePoint { time: number; depth: number; event: string; gas: string }
export interface DivePlan { runtime: number; totalDecoTime: number; stops: DecoStop[]; timeline: DiveTimelinePoint[]; ceilings: number[]; maxCeiling: number; tissues: number[] }
export interface DiveInput { depth: number; bottomTime: number; bottomGas: Gas; decoGases: Gas[]; gfLow: number; gfHigh: number; descentRate: number; ascentRate: number }

const WVP = 0.627, SP = 1.013
const ZHL16C: [number, number, number][] = [
  [4.0, 1.2599, 0.5050], [8.0, 1.0000, 0.6514], [12.5, 0.8618, 0.7222],
  [18.5, 0.7562, 0.7825], [27.0, 0.6667, 0.8126], [38.3, 0.5933, 0.8434],
  [54.3, 0.5282, 0.8693], [77.0, 0.4701, 0.8910], [109.0, 0.4187, 0.9092],
  [146.0, 0.3798, 0.9222], [187.0, 0.3497, 0.9319], [239.0, 0.3223, 0.9403],
  [305.0, 0.2971, 0.9477], [390.0, 0.2737, 0.9544], [498.0, 0.2523, 0.9602],
  [635.0, 0.2327, 0.9653],
]

function amb(d: number) { return SP + d / 10 }
function alv(d: number, g: Gas, t: 'N2' | 'He' = 'N2') {
  return (amb(d) - WVP) * (t === 'N2' ? 1 - g.fO2 - g.fHe : g.fHe)
}
function sch(p0: number, ps: number, pe: number, ht: number, ti: number) {
  if (ti <= 0) return p0
  const k = Math.LN2 / ht, R = (pe - ps) / ti, et = Math.exp(-k * ti)
  return ps + (p0 - ps) * et + R * (ti - (1 - et) / k)
}
function hal(p0: number, pa: number, ht: number, ti: number) {
  if (ti <= 0) return p0
  const k = Math.LN2 / ht
  return pa + (p0 - pa) * Math.exp(-k * ti)
}
function tc(pt: number, a: number, b: number, gf: number) {
  const n = pt - a * gf, d = gf / b + 1 - gf
  return d <= 0 ? 0 : Math.max(0, n / d)
}
function mcp(t: number[], gf: number) {
  let m = 0
  for (let i = 0; i < 16; i++) {
    const [, a, b] = ZHL16C[i]
    const p = tc(t[i], a, b, gf)
    if (p > m) m = p
  }
  return m
}
function p2d(p: number) { return Math.max(0, (p - SP) * 10) }
function cgf(cd: number, fsd: number, gl: number, gh: number) {
  if (cd <= 0) return gh
  if (cd >= fsd) return gl
  return gl + (gh - gl) * (1 - cd / fsd)
}
function sbg(d: number, dg: Gas[], cg: Gas) {
  const ag = [...dg, cg].filter(g => g.mod >= d && g.fO2 <= 1)
  if (ag.length === 0) return cg
  ag.sort((a, b) => b.fO2 - a.fO2)
  return ag[0]
}

export function calculateDivePlan(i: DiveInput): DivePlan {
  const { depth: de, bottomTime: bt, bottomGas: bg, decoGases: dg, gfLow: gl, gfHigh: gh, descentRate: dr, ascentRate: ar } = i
  const tl: DiveTimelinePoint[] = []
  let ct = 0
  const ps = alv(0, bg, 'N2')
  const t: number[] = ZHL16C.map(() => ps)

  // Descent
  const dst = de / dr, pds = alv(0, bg, 'N2'), pde = alv(de, bg, 'N2')
  for (let i = 0; i < 16; i++) { const [ht] = ZHL16C[i]; t[i] = sch(t[i], pds, pde, ht, dst) }
  ct += dst
  tl.push({ time: 0, depth: 0, event: 'Start', gas: bg.name })
  tl.push({ time: Math.round(ct), depth: de, event: 'Descent', gas: bg.name })

  // Bottom
  const pb = alv(de, bg, 'N2')
  for (let i = 0; i < 16; i++) { const [ht] = ZHL16C[i]; t[i] = hal(t[i], pb, ht, bt) }
  ct += bt
  tl.push({ time: Math.round(ct), depth: de, event: 'Bottom', gas: bg.name })

  // Deco stops
  const s: DecoStop[] = [], c: number[] = []
  const clp = mcp(t, gl / 100)
  const fsd = Math.ceil(p2d(clp) / 3) * 3

  if (fsd <= 0) {
    const at = de / ar
    ct += at
    tl.push({ time: Math.round(ct), depth: 0, event: 'Surface', gas: bg.name })
    return { runtime: Math.round(ct), totalDecoTime: 0, stops: [], timeline: tl, ceilings: [0], maxCeiling: 0, tissues: [...t] }
  }

  let wd = de, td = fsd, cg = bg, lsd = -1, sc = 0
  while (td > 0 && wd > 0 && sc < 50) {
    sc++
    const gf = cgf(td, fsd, gl / 100, gh / 100)
    const cp = mcp(t, gf)
    c.push(Math.round(p2d(cp)))
    const nd = Math.max(0, td - 3)

    const bg2 = sbg(td, dg, cg)
    if (bg2.name !== cg.name && td <= bg2.mod && lsd !== td) {
      cg = bg2; lsd = td
      tl.push({ time: Math.round(ct), depth: td, event: 'Gas to ' + bg2.name, gas: bg2.name })
    }

    if (wd > td) {
      const aseg = (wd - td) / ar, pas = alv(wd, cg, 'N2'), pae = alv(td, cg, 'N2')
      for (let i = 0; i < 16; i++) { const [ht] = ZHL16C[i]; t[i] = sch(t[i], pas, pae, ht, aseg) }
      ct += aseg; wd = td
    }

    const pas = alv(td, cg, 'N2')
    let st = 0
    const sti = [...t]
    const icp = mcp(sti, gf), icd = p2d(icp), tcd = nd

    if (icd > tcd && td > 0) {
      while (st < 300) {
        for (let i = 0; i < 16; i++) { const [ht] = ZHL16C[i]; sti[i] = hal(sti[i], pas, ht, 1) }
        st++
        const ccp = mcp(sti, gf)
        if (p2d(ccp) <= tcd) break
      }
      if (st > 0) {
        s.push({ depth: td, time: st, gas: { ...cg } })
        tl.push({ time: Math.round(ct + st), depth: td, event: td + 'm x ' + st + 'min', gas: cg.name })
        for (let i = 0; i < 16; i++) { const [ht] = ZHL16C[i]; t[i] = hal(t[i], pas, ht, st) }
        ct += st
      }
    }
    td = nd
  }

  if (wd > 0) { const ft = wd / ar; ct += ft }
  tl.push({ time: Math.round(ct), depth: 0, event: 'Surface', gas: cg.name })
  const tdt = s.reduce((a, b) => a + b.time, 0)
  return { runtime: Math.round(ct), totalDecoTime: tdt, stops: s, timeline: tl, ceilings: c, maxCeiling: fsd, tissues: [...t] }
}

export function calculateNDL(d: number, g: Gas, gl = 30, gh = 70) {
  let l = 0, h = 180
  while (h - l > 1) {
    const m = (l + h) >> 1
    const p = calculateDivePlan({ depth: d, bottomTime: m, bottomGas: g, decoGases: [], gfLow: gl, gfHigh: gh, descentRate: 18, ascentRate: 9 })
    p.stops.length === 0 ? l = m : h = m
  }
  return l
}
export { ZHL16C as ZHL16C_TISSUES }
'@

# ============ useSessionStore.ts ============
$store = @'
// useSessionStore.ts v2.1 - Supabase sync
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { encryptCode, decryptCode } from '@/lib/accessControl'

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
}

export interface CreateCodeParams {
  label: string
  role?: 'admin' | 'instructor' | 'user'
  expiresInDays?: number
  maxUses?: number
}

export interface SessionState {
  codes: AccessCode[]
  isLoading: boolean
  error: string | null
  loadCodes: () => Promise<void>
  createCode: (p: CreateCodeParams) => Promise<AccessCode | null>
  revokeCode: (id: string) => Promise<void>
  validateCode: (plain: string) => Promise<AccessCode | null>
  refreshCodes: () => Promise<void>
  clearError: () => void
}

const TBL = 'access_codes'

function genCode() {
  const cs = 'ABCDEFGHJKLMNPQRSTUVWXYZ', ns = '23456789'
  const sg = (c: string, n: number) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('')
  return sg(cs, 3) + '-' + sg(ns, 3) + '-' + sg(cs, 3)
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      codes: [],
      isLoading: false,
      error: null,

      loadCodes: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.from(TBL).select('*').order('created_at', { ascending: false })
          if (error) throw error
          const codes: AccessCode[] = (data || []).map((r: any) => {
            let pc = 'Codigo no disponible'
            try {
              if (r.encrypted_code) pc = decryptCode(r.encrypted_code)
              else if (r.code) pc = r.code
            } catch { /* ignore */ }
            return {
              id: r.id,
              code: pc,
              encryptedCode: r.encrypted_code || r.code || '',
              label: r.label || '',
              role: r.role || 'user',
              createdAt: r.created_at,
              expiresAt: r.expires_at,
              usedCount: r.used_count || 0,
              maxUses: r.max_uses,
              isActive: r.is_active ?? true,
              createdBy: r.created_by,
            }
          })
          set({ codes, isLoading: false })
        } catch (e: any) {
          set({ error: e.message || 'Error', isLoading: false })
        }
      },

      createCode: async (p) => {
        set({ isLoading: true, error: null })
        try {
          const pc = genCode()
          const ec = encryptCode(pc)
          const ed = p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 86400000).toISOString() : null
          const { data: ud } = await supabase.auth.getUser()
          const cb = ud?.user?.id
          const ins: any = {
            encrypted_code: ec,
            label: p.label,
            role: p.role || 'user',
            expires_at: ed,
            max_uses: p.maxUses,
            is_active: true,
            used_count: 0,
            created_by: cb,
          }
          // Detect if plain 'code' column exists
          try {
            await supabase.from(TBL).select('code').limit(0)
            ins.code = pc
          } catch { /* column may not exist */ }
          const { data, error } = await supabase.from(TBL).insert(ins).select().single()
          if (error) throw error
          if (!data) throw new Error('No data')
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
          }
          set(st => ({ codes: [nc, ...st.codes], isLoading: false }))
          return nc
        } catch (e: any) {
          console.error(e)
          set({ error: e.message || 'Error', isLoading: false })
          return null
        }
      },

      revokeCode: async (id) => {
        try {
          await supabase.from(TBL).update({ is_active: false }).eq('id', id)
        } catch (e: any) {
          set({ error: e.message })
        }
        set(st => ({ codes: st.codes.map(c => c.id === id ? { ...c, isActive: false } : c) }))
      },

      validateCode: async (pl) => {
        const { codes } = get()
        const lm = codes.find(c => c.code === pl && c.isActive)
        if (lm) return lm
        try {
          const { data, error } = await supabase.from(TBL).select('*').eq('is_active', true)
          if (error) throw error
          for (const r of data || []) {
            try {
              const dc = r.encrypted_code ? decryptCode(r.encrypted_code) : r.code
              if (dc === pl) {
                await supabase.from(TBL).update({ used_count: (r.used_count || 0) + 1 }).eq('id', r.id)
                return {
                  id: r.id, code: dc, encryptedCode: r.encrypted_code,
                  label: r.label, role: r.role, createdAt: r.created_at,
                  expiresAt: r.expires_at, usedCount: (r.used_count || 0) + 1,
                  maxUses: r.max_uses, isActive: true, createdBy: r.created_by,
                }
              }
            } catch { continue }
          }
          return null
        } catch { return null }
      },

      refreshCodes: async () => { await get().loadCodes() },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'session-store',
      partialize: (st) => ({ codes: st.codes.filter(c => c.encryptedCode === 'local') }),
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
    validateCode: st.validateCode,
    refreshCodes: st.refreshCodes,
    clearError: st.clearError,
  }
}
'@

# ============ Write files ============
Set-Content -Path $b -Value $buhlmann -Encoding UTF8
Set-Content -Path $s -Value $store -Encoding UTF8
Write-Host "Files written OK" -ForegroundColor Green
Write-Host "  $b" -ForegroundColor Gray
Write-Host "  $s" -ForegroundColor Gray

# ============ Build ============
Push-Location $Base
$env:VITE_MINIFY = 'false'
npm run build
Pop-Location
'@

Set-Content -Path (Join-Path $Base "fix-v2.ps1") -Value $script -Encoding UTF8
Write-Host "fix-v2.ps1 created at $Base" -ForegroundColor Green
