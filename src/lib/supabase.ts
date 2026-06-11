import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '@/lib/env'

export { isSupabaseConfigured, SUPABASE_CONFIG_ERROR } from '@/lib/env'

export type BrowserSupabaseClient = SupabaseClient

export const createClient = (): BrowserSupabaseClient => {
  const { url, anonKey } = getSupabasePublicConfig()
  if (!url || !anonKey) {
    throw new Error(SUPABASE_CONFIG_ERROR)
  }
  return createBrowserClient(url, anonKey) as BrowserSupabaseClient
}

let browserClient: BrowserSupabaseClient | null = null

export function getSupabase(): BrowserSupabaseClient {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

/** Lazy browser client — use getSupabase() in new code. */
export const supabase = new Proxy({} as BrowserSupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
