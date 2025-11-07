import { createClient } from '@supabase/supabase-js'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.PROD
  ? import.meta.env.VITE_SUPABASE_PROXY_URL
  : import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error(
    import.meta.env.PROD
      ? 'Missing VITE_SUPABASE_PROXY_URL for production'
      : 'Missing VITE_SUPABASE_URL for development'
  )
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
