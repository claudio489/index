# Build-PWA-Sync-v1.2.ps1
# Script corregido para agregar sync Supabase a la PWA Dive Tools
# y generar dist para Netlify drag & drop
#
# UBICACION: C:\Users\csilv\Downloads\IndexApp
# EJECUCION: PowerShell -ExecutionPolicy Bypass -File .\Build-PWA-Sync-v1.2.ps1

$BasePath = "C:\Users\csilv\Downloads\IndexApp"
$DistPath = "$BasePath\index-dist\dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PWA Dive Tools - SDD v1.2 Sync" -ForegroundColor Cyan
Write-Host "  Supabase + localStorage fallback" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. VALIDACIONES
# ============================================
if (!(Test-Path $BasePath)) {
    Write-Host "ERROR: No se encontro IndexApp en:" -ForegroundColor Red
    Write-Host "  $BasePath" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Proyecto encontrado: $BasePath" -ForegroundColor Green

# Verificar package.json
$PackageJson = "$BasePath\package.json"
if (!(Test-Path $PackageJson)) {
    Write-Host "ERROR: No se encontro package.json" -ForegroundColor Red
    exit 1
}

# ============================================
# 2. INSTALAR DEPENDENCIAS SI FALTAN
# ============================================
Write-Host ""
Write-Host "Verificando dependencias..." -ForegroundColor Yellow

$packageContent = Get-Content $PackageJson -Raw
if ($packageContent -notmatch "@supabase/supabase-js") {
    Write-Host "Instalando @supabase/supabase-js..." -ForegroundColor Yellow
    Set-Location $BasePath
    npm install @supabase/supabase-js
    Write-Host "[OK] @supabase/supabase-js instalado" -ForegroundColor Green
} else {
    Write-Host "[OK] @supabase/supabase-js ya existe" -ForegroundColor Green
}

# ============================================
# 3. CREAR ARCHIVO SUPABASE CLIENT
# ============================================
Write-Host ""
Write-Host "Creando cliente Supabase..." -ForegroundColor Yellow

$SupabaseDir = "$BasePath\src\lib"
if (!(Test-Path $SupabaseDir)) {
    New-Item -ItemType Directory -Path $SupabaseDir -Force | Out-Null
}

$SupabaseClient = @'
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crifnfmvaihnapuxahdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaWZuZm12YWlobmFwdXhhaGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODQ5MjYsImV4cCI6MjA2MjA2MDkyNn0.-0wEsHH1b8y23l0bXQGpL9ozB2QTFJrRlFYv2U9nDlw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'deepspot_supabase_auth'
  }
});
'@

$SupabaseClient | Out-File -FilePath "$SupabaseDir\supabase.ts" -Encoding UTF8 -Force
Write-Host "[OK] src/lib/supabase.ts creado" -ForegroundColor Green

# ============================================
# 4. CREAR ARCHIVO DE SYNC
# ============================================
Write-Host ""
Write-Host "Creando funciones de sync..." -ForegroundColor Yellow

$SyncFile = @'
// divespotApi.ts - Funciones de sync con Supabase
// SDD v1.2 - DeepSpot Tools

import { supabase } from './supabase';

export interface LocalLogEntry {
  id: string;
  date: string;
  time: string;
  spotName: string;
  maxDepth: number;
  duration: number;
  gasType: string;
  startPressure: number;
  endPressure: number;
  tankSize: number;
  sacRate?: number;
  decoProfile?: any[];
  notes?: string;
  buddy?: string;
  waterTemp?: number;
  visibility?: number;
  isSynced?: boolean;
}

export interface LocalEquipmentItem {
  id: string;
  category: string;
  brand: string;
  model: string;
  serialNumber?: string;
  purchaseDate?: string;
  lastService?: string;
  nextService?: string;
  notes?: string;
  isActive: boolean;
  isSynced?: boolean;
}

export interface DeepSpotBackup {
  version: '1.0';
  exportedAt: string;
  app: 'deepspot-tools';
  bitacora: LocalLogEntry[];
  equipo: LocalEquipmentItem[];
  plantillas: any[];
  perfil: any | null;
}

/**
 * Descarga backup JSON de localStorage
 */
export function downloadBackup(): void {
  const backup: DeepSpotBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    app: 'deepspot-tools',
    bitacora: JSON.parse(localStorage.getItem('deepspot_logbook') || '[]'),
    equipo: JSON.parse(localStorage.getItem('deepspot_equipment') || '[]'),
    plantillas: JSON.parse(localStorage.getItem('deepspot_templates') || '[]'),
    perfil: JSON.parse(localStorage.getItem('deepspot_profile') || 'null')
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = 'deepspot-backup-' + new Date().toISOString().split('T')[0] + '.json';

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Verifica conexion a internet
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Verifica autenticacion en Supabase
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

/**
 * Sincroniza bitacora con Supabase
 */
export async function syncLogbook(localEntries: LocalLogEntry[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: serverEntries, error: fetchError } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (fetchError) throw fetchError;

  const serverLocalIds = new Set(serverEntries?.map((e: any) => e.local_id) || []);
  const toCreate = localEntries.filter(e => !serverLocalIds.has(e.id));
  const alreadySynced = localEntries.filter(e => serverLocalIds.has(e.id));

  let created = 0;
  if (toCreate.length > 0) {
    const { error } = await supabase
      .from('logbook_entries')
      .insert(toCreate.map(e => ({
        user_id: user.id,
        local_id: e.id,
        date: e.date,
        time: e.time,
        spot_name: e.spotName,
        max_depth: e.maxDepth,
        duration: e.duration,
        gas_type: e.gasType,
        start_pressure: e.startPressure,
        end_pressure: e.endPressure,
        tank_size: e.tankSize,
        sac_rate: e.sacRate,
        deco_profile: e.decoProfile,
        notes: e.notes,
        buddy: e.buddy,
        water_temp: e.waterTemp,
        visibility: e.visibility,
        is_synced: true
      })));

    if (!error) created = toCreate.length;
  }

  const updated = [...toCreate, ...alreadySynced].map(e => ({ ...e, isSynced: true }));
  localStorage.setItem('deepspot_logbook', JSON.stringify(updated));

  return { created, updated: alreadySynced.length, total: updated.length };
}

/**
 * Sincroniza equipo con Supabase
 */
export async function syncEquipment(localItems: LocalEquipmentItem[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('equipment')
    .upsert(
      localItems.map(item => ({
        user_id: user.id,
        category: item.category,
        brand: item.brand,
        model: item.model,
        serial_number: item.serialNumber,
        purchase_date: item.purchaseDate,
        last_service: item.lastService,
        next_service: item.nextService,
        notes: item.notes,
        is_active: item.isActive,
        local_id: item.id
      })),
      { onConflict: 'user_id,local_id' }
    );

  if (error) throw error;

  const synced = localItems.map(i => ({ ...i, isSynced: true }));
  localStorage.setItem('deepspot_equipment', JSON.stringify(synced));

  return { synced: localItems.length };
}
'@

$SyncFile | Out-File -FilePath "$SupabaseDir\divespotApi.ts" -Encoding UTF8 -Force
Write-Host "[OK] src/lib/divespotApi.ts creado" -ForegroundColor Green

# ============================================
# 5. CREAR COMPONENTE BACKUP BUTTON
# ============================================
Write-Host ""
Write-Host "Creando componente BackupButton..." -ForegroundColor Yellow

$ComponentsDir = "$BasePath\src\components"
if (!(Test-Path $ComponentsDir)) {
    New-Item -ItemType Directory -Path $ComponentsDir -Force | Out-Null
}

$BackupButton = @'
import { Download } from 'lucide-react';
import { downloadBackup } from '../lib/divespotApi';

export function BackupButton() {
  return (
    <button
      onClick={downloadBackup}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      Descargar mis datos (.json)
    </button>
  );
}
'@

$BackupButton | Out-File -FilePath "$ComponentsDir\BackupButton.tsx" -Encoding UTF8 -Force
Write-Host "[OK] src/components/BackupButton.tsx creado" -ForegroundColor Green

# ============================================
# 6. CREAR COMPONENTE SYNC PANEL
# ============================================
Write-Host ""
Write-Host "Creando componente SyncPanel..." -ForegroundColor Yellow

$SyncPanel = @'
import { useState, useEffect } from 'react';
import { Cloud, CloudOff, ArrowUp, CheckCircle } from 'lucide-react';
import { syncLogbook, syncEquipment, isOnline, isAuthenticated } from '../lib/divespotApi';

export function SyncPanel() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'syncing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [pendingLogbook, setPendingLogbook] = useState(0);
  const [pendingEquipment, setPendingEquipment] = useState(0);

  useEffect(() => {
    checkPending();
  }, []);

  async function checkPending() {
    const logbook = JSON.parse(localStorage.getItem('deepspot_logbook') || '[]');
    const equipment = JSON.parse(localStorage.getItem('deepspot_equipment') || '[]');
    setPendingLogbook(logbook.length);
    setPendingEquipment(equipment.length);
  }

  async function handleSync() {
    if (!isOnline()) {
      setStatus('error');
      setMessage('Sin conexion a internet');
      return;
    }

    const auth = await isAuthenticated();
    if (!auth) {
      setStatus('error');
      setMessage('Inicia sesion en DeepSpot.cl para sincronizar');
      return;
    }

    setStatus('syncing');
    setMessage('Sincronizando...');

    try {
      const logbook = JSON.parse(localStorage.getItem('deepspot_logbook') || '[]');
      const equipment = JSON.parse(localStorage.getItem('deepspot_equipment') || '[]');

      let logbookResult = null;
      let equipmentResult = null;

      if (logbook.length > 0) {
        logbookResult = await syncLogbook(logbook);
      }
      if (equipment.length > 0) {
        equipmentResult = await syncEquipment(equipment);
      }

      setStatus('done');
      setMessage(
        'Sincronizado: ' + (logbookResult?.created || 0) + ' inmersiones nuevas, ' + (equipmentResult?.synced || 0) + ' equipos'
      );
      checkPending();
    } catch (err: any) {
      setStatus('error');
      setMessage('Error: ' + err.message);
    }
  }

  const totalPending = pendingLogbook + pendingEquipment;

  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
      <div className="flex items-center gap-2 text-white font-semibold">
        {status === 'error' ? <CloudOff className="w-5 h-5 text-red-400" /> : <Cloud className="w-5 h-5 text-cyan-400" />}
        Sincronizacion con DeepSpot.cl
      </div>

      <p className="text-sm text-slate-400">
        {totalPending > 0 
          ? pendingLogbook + ' inmersiones y ' + pendingEquipment + ' equipos pendientes' 
          : 'No hay datos pendientes'}
      </p>

      {totalPending > 0 && (
        <button
          onClick={handleSync}
          disabled={status === 'syncing'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
          {status === 'syncing' ? 'Subiendo...' : 'Sincronizar ahora'}
        </button>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      {status === 'error' && (
        <div className="text-sm text-red-400">{message}</div>
      )}
    </div>
  );
}
'@

$SyncPanel | Out-File -FilePath "$ComponentsDir\SyncPanel.tsx" -Encoding UTF8 -Force
Write-Host "[OK] src/components/SyncPanel.tsx creado" -ForegroundColor Green

# ============================================
# 7. BUILD
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Haciendo build..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $BasePath

# Verificar si hay node_modules
if (!(Test-Path "$BasePath\node_modules")) {
    Write-Host "Instalando dependencias (npm install)..." -ForegroundColor Yellow
    npm install
}

# Hacer build
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build fallo. Revisa los errores arriba." -ForegroundColor Red
    Write-Host "Si hay errores de TypeScript, ejecuta: npx tsc --noEmit" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[OK] Build completado exitosamente" -ForegroundColor Green

# ============================================
# 8. COPIAR DIST A INDEX-DIST
# ============================================
Write-Host ""
Write-Host "Copiando dist a index-dist..." -ForegroundColor Yellow

$SourceDist = "$BasePath\dist"
if (!(Test-Path $SourceDist)) {
    Write-Host "ERROR: No se encontro dist en $SourceDist" -ForegroundColor Red
    exit 1
}

# Limpiar y copiar
if (Test-Path $DistPath) {
    Remove-Item -Path $DistPath -Recurse -Force
}
Copy-Item -Path $SourceDist -Destination $DistPath -Recurse -Force

Write-Host "[OK] dist copiado a $DistPath" -ForegroundColor Green

# ============================================
# 9. CREAR ZIP PARA NETLIFY
# ============================================
Write-Host ""
Write-Host "Creando ZIP para Netlify..." -ForegroundColor Yellow

$ZipPath = "$BasePath\index-dist\deepspot-tools-sync-v1.2.zip"
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Compress-Archive -Path $DistPath -DestinationPath $ZipPath -Force

Write-Host "[OK] ZIP creado: $ZipPath" -ForegroundColor Green

# ============================================
# 10. RESUMEN
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SDD v1.2 COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor White
Write-Host "  - src/lib/supabase.ts" -ForegroundColor Green
Write-Host "  - src/lib/divespotApi.ts (backup + sync)" -ForegroundColor Green
Write-Host "  - src/components/BackupButton.tsx" -ForegroundColor Green
Write-Host "  - src/components/SyncPanel.tsx" -ForegroundColor Green
Write-Host ""
Write-Host "Build generado en:" -ForegroundColor White
Write-Host "  $DistPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "ZIP para Netlify:" -ForegroundColor White
Write-Host "  $ZipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Arrastra la carpeta 'dist' a Netlify (drag & drop)" -ForegroundColor White
Write-Host "  2. O sube el ZIP y descomprimelo en Netlify" -ForegroundColor White
Write-Host "  3. Testea el backup y sync en tu PWA" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: Agrega <BackupButton /> y <SyncPanel /> en tus paginas" -ForegroundColor Yellow
Write-Host "      de Logbook y Equipment para que aparezcan en la UI." -ForegroundColor Yellow
Write-Host ""
Write-Host "Contacto: contacto@deepspot.cl | @deepspot.cl" -ForegroundColor DarkGray
