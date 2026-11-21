import { createBrowserClient } from '@supabase/ssr'
import { opcoesCookie } from '@/lib/supabase/sso'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis públicas do Supabase ausentes')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, { cookieOptions: opcoesCookie(typeof window !== 'undefined' ? window.location.hostname : null) })
}
