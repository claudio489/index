/**
 * Supabase client for INDEX
 * Provides real database persistence for dive plans and logbook entries
 * 
 * To configure:
 * 1. Create account at https://supabase.com
 * 2. Create a new project
 * 3. Go to Project Settings → API
 * 4. Copy URL and anon public key
 * 5. Update SUPABASE_URL and SUPABASE_ANON_KEY below
 */

import { createClient } from '@supabase/supabase-js';

// ==== CONFIGURATION - PRODUCTION ====
const SUPABASE_URL = 'https://ooaxzsnwprtodfmixiyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh6c253cHJ0b2RmbWl4aXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTk1NjMsImV4cCI6MjA5Njc5NTU2M30.GRr1aVJJyNctrf_YmBH7WmCZZdC-Jtr4cVprrYMU3ug';
// ======================================

const isConfigured = !SUPABASE_URL.includes('your-project');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

// Types matching database tables
export interface DivePlanDB {
  id?: string;
  user_name: string;
  device_fp: string;
  depth: number;
  bottom_time: number;
  bottom_gas: string;
  gf_low: number;
  gf_high: number;
  deco_time: number;
  runtime: number;
  stops_json: string;      // JSON array of DecoStop
  timeline_json: string;   // JSON array of TimelineEntry
  created_at?: string;
}

export interface LogbookEntryDB {
  id?: string;
  device_fp: string;
  dive_number: string;
  date: string;
  location: string;
  site: string;
  entry_time: string;
  exit_time: string;
  bottom_time: string;
  max_depth: string;
  avg_depth: string;
  psi_start: string;
  psi_end: string;
  tank_size: string;
  dive_type: string[];
  tank_type: string[];
  equipment: string[];
  conditions: string[];
  participants: string;
  buddy: string;
  guide: string;
  comments: string;
  diver_name: string;
  cert_number: string;
  club: string;
  operator: string;
  created_at?: string;
}

// Save dive plan
export async function saveDivePlan(plan: DivePlanDB): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) return { success: false, error: 'Supabase no configurado' };
  try {
    const { error } = await supabase.from('dive_plans').insert(plan);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Load dive plans for device
export async function loadDivePlans(deviceFp: string): Promise<DivePlanDB[]> {
  if (!isConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('dive_plans')
      .select('*')
      .eq('device_fp', deviceFp)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// Save logbook entry
export async function saveLogbookEntry(entry: LogbookEntryDB): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) return { success: false, error: 'Supabase no configurado' };
  try {
    const { error } = await supabase.from('logbook_entries').insert(entry);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Load logbook entries for device
export async function loadLogbookEntries(deviceFp: string): Promise<LogbookEntryDB[]> {
  if (!isConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('device_fp', deviceFp)
      .order('date', { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// Delete logbook entry
export async function deleteLogbookEntry(id: string): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    await supabase.from('logbook_entries').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

// SQL to create tables (run in Supabase SQL Editor):
export const CREATE_TABLES_SQL = `
-- Dive Plans table
CREATE TABLE IF NOT EXISTS dive_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  device_fp TEXT NOT NULL,
  depth INTEGER NOT NULL,
  bottom_time INTEGER NOT NULL,
  bottom_gas TEXT NOT NULL,
  gf_low INTEGER NOT NULL,
  gf_high INTEGER NOT NULL,
  deco_time INTEGER NOT NULL,
  runtime INTEGER NOT NULL,
  stops_json JSONB NOT NULL,
  timeline_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logbook Entries table
CREATE TABLE IF NOT EXISTS logbook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fp TEXT NOT NULL,
  dive_number TEXT,
  date TEXT NOT NULL,
  location TEXT,
  site TEXT,
  entry_time TEXT,
  exit_time TEXT,
  bottom_time TEXT,
  max_depth TEXT,
  avg_depth TEXT,
  psi_start TEXT,
  psi_end TEXT,
  tank_size TEXT,
  dive_type TEXT[] DEFAULT '{}',
  tank_type TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  participants TEXT,
  buddy TEXT,
  guide TEXT,
  comments TEXT,
  diver_name TEXT,
  cert_number TEXT,
  club TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE dive_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/insert (we control access via device fingerprint + access codes)
CREATE POLICY "Allow all" ON dive_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON logbook_entries FOR ALL USING (true) WITH CHECK (true);
`;
