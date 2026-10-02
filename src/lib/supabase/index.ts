export { createClient } from "./client";
export { createServerSupabase } from "./server";
// NOTE: admin client is exported separately to avoid accidental bundling in
// client components. Import it directly:  import { createAdminClient } from "@/lib/supabase/admin";