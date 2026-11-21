import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { desviarParaLoginUnico } from '@/lib/supabase/sso-middleware'

export async function proxy(request: NextRequest) {
  const desvio = desviarParaLoginUnico(request, { '/login': '/dashboard' })
  if (desvio) return desvio

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
