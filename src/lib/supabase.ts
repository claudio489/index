import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ooaxzsnwprtodfmixiyz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2iVGGjQ_JVxzRTH5r5spIw_4kv7g1xD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);