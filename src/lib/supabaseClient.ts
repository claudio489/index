import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ooaxzsnwprtodfmixiyz.supabase.co'
const supabaseKey = 'sb_publishable_2iVGGjQ_JVxzRTH5r5spIw_4kv7g1xD'
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: { schema: 'public' },
  global: {
    headers: {
      'x-application-name': 'divetools',
      'Content-Type': 'application/json',
    }
  }
})
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .abortSignal(controller.signal)
    clearTimeout(timeout)
    return !error
  } catch {
    return false
  }
}
export function setSupabaseUserId(userId: string | null): void {
  if (userId) {
    // @ts-ignore
    supabase.headers = { ...supabase.headers, 'x-user-id': userId }
  }
}