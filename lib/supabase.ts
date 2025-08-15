import { createClient } from "./supabase/client"
export { isSupabaseConfigured } from "./supabase/client"
export const supabase = createClient()
export type { Database } from "./supabase/types"
