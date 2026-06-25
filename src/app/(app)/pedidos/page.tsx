import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PedidosFilters } from '@/components/pedidos/pedidos-filters'
import { PedidosStatusSummary } from '@/components/pedidos/pedidos-status-summary'
import { PedidosTable, type PedidoListItem } from '@/components/pedidos/pedidos-table'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canCreatePedido } from '@/lib/permissions/pedido'
import type { Obra, PedidoStatus } from '@/types/database'

// pedidos_compra tem duas FKs para profiles (solicitante_id e aprovado_por),
// então o embed precisa do nome explícito da relação, senão o PostgREST
// recusa a query com "more than one relationship was found" (PGRST201).
const PEDIDOS_SELECT =
  'id, numero, status, prioridade, created_at, obra:obras(nome), solicitante:profiles!pedidos_compra_solicitante_id_fkey(nome)'

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridade?: string; obra_id?: string }>
}) {
  const { status, prioridade, obra_id } = await searchParams
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()

  let query = supabase.from('pedidos_compra').select(PEDIDOS_SELECT).order('created_at', {
    ascending: false,
  })

  if (status) query = query.eq('status', status)
  if (prioridade) query = query.eq('prioridade', prioridade)
  if (obra_id) query = query.eq('obra_id', obra_id)

  const [{ data: pedidos, error }, { data: obras }, { data: todosStatus }] = await Promise.all([
    query,
    supabase.from('obras').select('*').order('nome'),
    supabase.from('pedidos_compra').select('status'),
  ])

  const LEGACY_STATUSES: PedidoStatus[] = [
    'pendente_revisao',
    'em_revisao',
    'enviado',
    'respondido',
    'parcialmente_comprado',
    'comprado',
  ]

  const counts: Record<string, number> = { todos: todosStatus?.length ?? 0, outros: 0 }
  for (const row of (todosStatus as { status: PedidoStatus }[]) ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
    if (LEGACY_STATUSES.includes(row.status)) {
      counts.outros += 1
    }
  }

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

      <PedidosStatusSummary counts={counts} activeStatus={status ?? 'todos'} />

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
