import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

let cachedClient: SupabaseClient<Database> | null = null

function createDummyClient(): SupabaseClient<Database> {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } }, error: null }),
    },
    from: () => {
      const builder = {
        select: () => builder,
        insert: async () => ({ data: null, error: new Error("Supabase not configured") }),
        update: async () => ({ data: null, error: new Error("Supabase not configured") }),
        delete: async () => ({ error: new Error("Supabase not configured") }),
        eq: () => builder,
        order: () => builder,
        single: async () => ({ data: null, error: new Error("Supabase not configured") }),
      }
      return builder
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error("Supabase not configured") }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: async () => ({ error: new Error("Supabase not configured") }),
      }),
    },
  } as unknown as SupabaseClient<Database>
}

export function createClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient

  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    cachedClient = createDummyClient()
    return cachedClient
  }

  cachedClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return cachedClient
}

// Create a singleton instance for backward compatibility
export const supabase = createClient()
