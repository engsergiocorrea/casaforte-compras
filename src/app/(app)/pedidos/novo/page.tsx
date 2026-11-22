import { redirect } from 'next/navigation'
import { PedidoCreateForm } from '@/components/pedidos/pedido-create-form'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canCreatePedido } from '@/lib/permissions/pedido'
import type { Engenheiro, Obra } from '@/types/database'

export default async function NovoPedidoPage() {
  const profile = await getCurrentUser()

  if (!canCreatePedido(profile?.role)) {
    redirect('/pedidos')
  }

  const supabase = await createServerSupabaseClient()

  const [{ data: obras }, { data: engenheiros }] = await Promise.all([
    supabase.from('obras').select('*').eq('ativo', true).not('sienge_enterprise_id', 'is', null).order('nome'),
    supabase.from('engenheiros').select('*').eq('ativo', true).order('nome'),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-[28px] sm:text-3xl">Novo pedido</h1>
        <p className="text-muted-foreground">
          Escolha a obra e cole a lista de materiais. A IA organiza o resto.
        </p>
      </div>

      <PedidoCreateForm obras={(obras as Obra[]) ?? []} engenheiros={(engenheiros as Engenheiro[]) ?? []} />
    </div>
  )
}
