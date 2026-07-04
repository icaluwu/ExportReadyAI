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
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return ''
  const message = error.message || ''
  const status = error.status

  if (status === 429 || message.toLowerCase().includes('rate limit')) {
    return 'Batas pengiriman email terlampaui (maksimal 3 email per jam untuk SMTP bawaan Supabase). Silakan tunggu beberapa saat atau hubungi admin.'
  }
  
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Email Anda belum diverifikasi. Silakan cek inbox/spam email Anda, atau kirim ulang tautan verifikasi.'
  }

  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Email atau password salah. Silakan periksa kembali.'
  }

  if (message.toLowerCase().includes('user already exists')) {
    return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
  }

  return message
}
