import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client.
 * Uses the SERVICE ROLE key, which bypasses RLS.
 * NEVER import this file into a client component or expose it to the browser.
 * Only use inside API routes and server-only code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}