import { Badge } from '@/components/ui/badge'
import type { PedidoCompra } from '@/types/database'

const PRIORITY_LABELS: Record<PedidoCompra['prioridade'], string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const PRIORITY_STYLES: Record<PedidoCompra['prioridade'], string> = {
  baixa: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  alta: 'bg-amber-100 text-amber-700 border-amber-200',
  urgente: 'bg-red-100 text-red-700 border-red-200',
}

export function PriorityBadge({ prioridade }: { prioridade: PedidoCompra['prioridade'] }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[prioridade]}>
      {PRIORITY_LABELS[prioridade]}
    </Badge>
  )
}
