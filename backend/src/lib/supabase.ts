import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return supabaseCreateClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function createAuthClient(accessToken: string) {
  return supabaseCreateClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
}
