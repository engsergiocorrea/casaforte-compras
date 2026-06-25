import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Pedido #{pedido.numero}</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <OrderStatusBadge status={pedido.status} />
            <PriorityBadge prioridade={pedido.prioridade} />
          </div>
        </div>
        {canEdit ? (
          <PedidoHeaderEditDialog
            pedido={pedido}
            obras={obras}
            engenheiros={engenheiros}
            trigger={<Button variant="outline" size="sm">Editar</Button>}
          />
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Obra</p>
          <p className="font-medium">{obra?.nome ?? '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Engenheiro responsável</p>
          <p className="font-medium">{engenheiro?.nome ?? '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Solicitante</p>
          <p className="font-medium">{solicitante?.nome ?? '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Data de necessidade</p>
          <p className="font-medium">
            {pedido.data_necessidade
              ? new Date(pedido.data_necessidade).toLocaleDateString('pt-BR')
              : '-'}
          </p>
        </div>
        {pedido.observacoes_gerais ? (
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Observações gerais</p>
            <p className="font-medium">{pedido.observacoes_gerais}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
