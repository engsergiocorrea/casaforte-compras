import { Badge } from '@/components/ui/badge'
import type { PedidoStatus } from '@/types/database'

const STATUS_LABELS: Record<PedidoStatus, string> = {
  rascunho: 'Rascunho',
  pendente_revisao: 'Pendente de revisão',
  em_revisao: 'Em revisão',
  pendente_aprovacao: 'Pendente de aprovação',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
  respondido: 'Respondido',
  parcialmente_comprado: 'Parcialmente comprado',
  comprado: 'Comprado',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
}

const STATUS_STYLES: Record<PedidoStatus, string> = {
  rascunho: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  pendente_revisao: 'bg-amber-100 text-amber-700 border-amber-200',
  em_revisao: 'bg-blue-100 text-blue-700 border-blue-200',
  pendente_aprovacao: 'bg-purple-100 text-purple-700 border-purple-200',
  aprovado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  enviado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  respondido: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  parcialmente_comprado: 'bg-blue-100 text-blue-700 border-blue-200',
  comprado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelado: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  devolvido: 'bg-red-100 text-red-700 border-red-200',
}

export function OrderStatusBadge({ status }: { status: PedidoStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
