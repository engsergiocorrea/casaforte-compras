import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PedidosFilters } from '@/components/pedidos/pedidos-filters'
import { PedidosTable, type PedidoListItem } from '@/components/pedidos/pedidos-table'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canCreatePedido } from '@/lib/permissions/pedido'
import type { Obra } from '@/types/database'

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridade?: string; obra_id?: string }>
}) {
  const { status, prioridade, obra_id } = await searchParams
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()

  let query = supabase
    .from('pedidos_compra')
    .select('id, numero, status, prioridade, created_at, obra:obras(nome), solicitante:profiles(nome)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (prioridade) query = query.eq('prioridade', prioridade)
  if (obra_id) query = query.eq('obra_id', obra_id)

  const [{ data: pedidos, error }, { data: obras }] = await Promise.all([
    query,
    supabase.from('obras').select('*').order('nome'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de Compra</h1>
          <p className="text-muted-foreground">Pedidos de materiais das obras da Casa Forte.</p>
        </div>
        {canCreatePedido(profile?.role) ? (
          <Button render={<Link href="/pedidos/novo" />}>Novo pedido</Button>
        ) : null}
      </div>

      <PedidosFilters
        obras={(obras as Obra[]) ?? []}
        currentStatus={status ?? 'todos'}
        currentPrioridade={prioridade ?? 'todas'}
        currentObraId={obra_id ?? 'todas'}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar pedidos: {error.message}
        </div>
      ) : (
        <PedidosTable pedidos={(pedidos as unknown as PedidoListItem[]) ?? []} />
      )}
    </div>
  )
}
