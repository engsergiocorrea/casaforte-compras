import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { OrderStatusBadge } from '@/components/pedidos/order-status-badge'
import { PriorityBadge } from '@/components/pedidos/priority-badge'
import type { PedidoCompra } from '@/types/database'

export type PedidoListItem = {
  id: string
  numero: number
  status: PedidoCompra['status']
  prioridade: PedidoCompra['prioridade']
  created_at: string
  obra: { nome: string } | null
  solicitante: { nome: string } | null
}

const dataCurta = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))

// Lista agrupada (estilo Ajustes do iPhone): uma linha por pedido, toque
// em qualquer ponto da linha abre o pedido.
export function PedidosTable({ pedidos }: { pedidos: PedidoListItem[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <p className="font-medium">Nenhum pedido aqui</p>
        <p className="mt-1 text-sm text-muted-foreground">Mude o filtro ou crie um pedido novo.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_oklch(0_0_0/4%),0_0_0_0.5px_oklch(0_0_0/5%)]">
      {pedidos.map((p) => (
        <li key={p.id}>
          <Link href={`/pedidos/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 active:bg-muted">
            <span className="w-11 shrink-0 font-mono text-[13px] text-muted-foreground">#{p.numero}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{p.obra?.nome ?? 'Obra'}</span>
              <span className="block truncate text-[13px] text-muted-foreground">
                {p.solicitante?.nome ?? '—'} · {dataCurta(p.created_at)}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
              {p.prioridade === 'alta' || p.prioridade === 'urgente' ? <PriorityBadge prioridade={p.prioridade} /> : null}
              <OrderStatusBadge status={p.status} />
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
