import { createClient } from '@supabase/supabase-js'

// Protect this endpoint with a secret header: x-cron-secret set to process.env.CRON_SECRET
// It uses the Supabase service role key to perform an elevated update. Make sure
// to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Vercel environment variables.

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Do not throw at import time in serverless environments, but warn in logs when executed.
  // The handler will fail gracefully.
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null

export default async function handler(req: any, res: any) {
  try {
    // Basic auth for the endpoint
    const incomingSecret = req.headers['x-cron-secret'] as string | undefined
    if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }

    // Perform a single batched update: set status = 'declined' where status = 'confirmed'
    // and confirmation_expires_at <= now.
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('booking')
      .update({ status: 'declined', updated_at: now })
      .lte('confirmation_expires_at', now)
      .eq('status', 'confirmed')

    if (error) {
      console.error('Error declining expired bookings:', error)
      return res.status(500).json({ error: error.message })
    }

    // Optionally return the count of affected rows if supabase returns data
    const d: any = data
    const declinedCount = Array.isArray(d) ? d.length : 0
    return res.status(200).json({ declined: declinedCount })
  } catch (err: any) {
    console.error('Unexpected error in decline-expired-bookings:', err)
    return res.status(500).json({ error: String(err) })
  }
}
