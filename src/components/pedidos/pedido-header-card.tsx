import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/pedidos/order-status-badge'
import { PriorityBadge } from '@/components/pedidos/priority-badge'
import { PedidoHeaderEditDialog } from '@/components/pedidos/pedido-header-edit-dialog'
import type { Engenheiro, Obra, PedidoCompra, Profile } from '@/types/database'

export function PedidoHeaderCard({
  pedido,
  obra,
  solicitante,
  engenheiro,
  obras,
  engenheiros,
  canEdit,
}: {
  pedido: PedidoCompra
  obra: Obra | null
  solicitante: Profile | null
  engenheiro: Engenheiro | null
  obras: Obra[]
  engenheiros: Engenheiro[]
  canEdit: boolean
}) {
  const linhas: [string, string][] = [
    ['Engenheiro', engenheiro?.nome ?? '—'],
    ['Solicitante', solicitante?.nome ?? '—'],
    [
      'Precisa até',
      pedido.data_necessidade
        ? new Date(`${pedido.data_necessidade}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
    ],
  ]
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[13px] text-muted-foreground">Pedido #{pedido.numero}</p>
          <h1 className="truncate text-[28px] sm:text-3xl">{obra?.nome ?? 'Obra'}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <OrderStatusBadge status={pedido.status} />
            {pedido.prioridade !== 'normal' ? <PriorityBadge prioridade={pedido.prioridade} /> : null}
          </div>
        </div>
        {canEdit ? (
          <PedidoHeaderEditDialog
            pedido={pedido}
            obras={obras}
            engenheiros={engenheiros}
            trigger={<Button variant="ghost" size="sm" className="rounded-full text-primary">Editar</Button>}
          />
        ) : null}
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="divide-y divide-border/70 px-4 text-[15px]">
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex items-center justify-between gap-4 py-3">
              <span className="text-muted-foreground">{rotulo}</span>
              <span className="truncate text-right font-medium">{valor}</span>
            </div>
          ))}
          {pedido.observacoes_gerais ? (
            <div className="py-3">
              <p className="text-muted-foreground">Observações</p>
              <p className="mt-0.5">{pedido.observacoes_gerais}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
