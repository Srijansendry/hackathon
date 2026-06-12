import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const rawUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Normalize URL — strip any trailing /rest/v1/ or other paths so only the base origin is used
const supabaseUrl = rawUrl.replace(/\/(rest\/v1\/?.*)$/, '').replace(/\/$/, '')

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — Supabase client not initialized')
} else {
  console.log('Supabase: connecting to', supabaseUrl)
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
