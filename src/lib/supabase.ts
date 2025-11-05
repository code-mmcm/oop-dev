import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eyhnejxxcfpirdgpftea.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aG5lanh4Y2ZwaXJkZ3BmdGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDc4NjcsImV4cCI6MjA3Mjg4Mzg2N30.91JtVcTVHpMjTUanoxLasVYmscVUrGaKXK2jYUEeXu0'

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  
  console.error('Missing Supabase environment variables:', missing)
  console.error('Make sure your .env file contains:')
  console.error('VITE_SUPABASE_URL=your_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_key')
  console.error('And restart the dev server after adding them.')
  
  throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}. Please check your .env file and restart the dev server.`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
