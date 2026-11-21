import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { opcoesCookie } from '@/lib/supabase/sso'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const hdrs = await headers()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis do Supabase ausentes')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: opcoesCookie(hdrs.get('x-forwarded-host') ?? hdrs.get('host')),
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll é chamado de um Server Component; ignorável quando há middleware refrescando a sessão.
        }
      },
    },
  })
}
