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
    supabase.from('obras').select('*').eq('status', 'ativa').order('nome'),
    supabase.from('engenheiros').select('*').eq('ativo', true).order('nome'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Novo pedido de compra</h1>
        <p className="text-muted-foreground">
          Informe os dados básicos. Os itens são adicionados na tela do pedido.
        </p>
      </div>

      <PedidoCreateForm obras={(obras as Obra[]) ?? []} engenheiros={(engenheiros as Engenheiro[]) ?? []} />
    </div>
  )
}
