import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — Supabase client not initialized')
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export function getSupabase() {
  if (!supabase) throw new Error('Supabase client is not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  return supabase
}
