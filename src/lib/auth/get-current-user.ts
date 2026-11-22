import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/permissions/can'

// Desde a unificação do banco (16/07/2026), profiles.role usa os papéis do
// ecossistema (admin_geral, admin_comercial, financeiro, visualizador). As
// regras do Compras foram escritas com os papéis antigos dele; aqui os novos
// são traduzidos para os antigos, num lugar só.
const PAPEL_COMPRAS: Record<string, Role> = {
  admin_geral: 'admin',
  admin_comercial: 'diretoria',
  financeiro: 'compras',
  admin: 'admin',
  diretoria: 'diretoria',
  compras: 'compras',
  engenheiro: 'engenheiro',
  visualizador: 'visualizador',
}

export function papelCompras(role: string | null | undefined): Role {
  return (role && PAPEL_COMPRAS[role]) || 'visualizador'
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return null
  return { ...profile, role: papelCompras(profile.role as string) }
}
