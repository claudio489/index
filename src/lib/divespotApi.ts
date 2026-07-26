// divespotApi.ts - Funciones de sync con Supabase
// SDD v1.2 - Dive Tools Tools

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

export interface DiveToolsBackup {
  version: '1.0';
  exportedAt: string;
  app: 'divetools-tools';
  bitacora: LocalLogEntry[];
  equipo: LocalEquipmentItem[];
  plantillas: any[];
  perfil: any | null;
}

/**
 * Descarga backup JSON de localStorage
 */
export function downloadBackup(): void {
  const backup: DiveToolsBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    app: 'divetools-tools',
    bitacora: JSON.parse(localStorage.getItem('Dive Tools_logbook') || '[]'),
    equipo: JSON.parse(localStorage.getItem('Dive Tools_equipment') || '[]'),
    plantillas: JSON.parse(localStorage.getItem('Dive Tools_templates') || '[]'),
    perfil: JSON.parse(localStorage.getItem('Dive Tools_profile') || 'null')
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = 'Dive Tools-backup-' + new Date().toISOString().split('T')[0] + '.json';

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
  localStorage.setItem('Dive Tools_logbook', JSON.stringify(updated));

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
  localStorage.setItem('Dive Tools_equipment', JSON.stringify(synced));

  return { synced: localItems.length };
}

