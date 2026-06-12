import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

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
      },
      realtime: {
        transport: ws
      }
    })
  : null

export function getSupabase() {
  if (!supabase) throw new Error('Supabase client is not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  return supabase
}
