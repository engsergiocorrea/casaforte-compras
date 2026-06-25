import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

export function PedidosTable({ pedidos }: { pedidos: PedidoListItem[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhum pedido encontrado com os filtros atuais.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Obra</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell className="font-medium">#{pedido.numero}</TableCell>
              <TableCell>{pedido.obra?.nome ?? '-'}</TableCell>
              <TableCell>{pedido.solicitante?.nome ?? '-'}</TableCell>
              <TableCell>
                <PriorityBadge prioridade={pedido.prioridade} />
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={pedido.status} />
              </TableCell>
              <TableCell>{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="text-right">
                <Link href={`/pedidos/${pedido.id}`} className="text-sm font-medium text-primary hover:underline">
                  Ver pedido
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
