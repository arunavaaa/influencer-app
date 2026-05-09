import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS.
 *
 * Use sparingly — only for trusted server-side flows where regular client
 * permissions aren't sufficient (e.g. inserting platform_fee transactions,
 * running 72h auto-approvals, writing audit logs). NEVER import this from a
 * client component (the SUPABASE_SERVICE_ROLE_KEY is not prefixed with
 * NEXT_PUBLIC_, so calling this from the browser will throw at runtime).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars',
    )
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
