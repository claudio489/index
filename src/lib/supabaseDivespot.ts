import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crifnfmvaihnapuxahdc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7cv9Q7S5cOLwDn7aYYsEpQ_FZ1C_DOM';

export const supabaseDivespot = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);