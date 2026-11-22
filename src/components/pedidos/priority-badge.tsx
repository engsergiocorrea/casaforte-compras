import { Badge } from '@/components/ui/badge'
import type { PedidoCompra } from '@/types/database'

const PRIORITY_LABELS: Record<PedidoCompra['prioridade'], string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const PRIORITY_STYLES: Record<PedidoCompra['prioridade'], string> = {
  baixa: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
  normal: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  alta: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  urgente: 'bg-red-500/12 text-red-700 dark:text-red-300',
}

export function PriorityBadge({ prioridade }: { prioridade: PedidoCompra['prioridade'] }) {
  return (
    <Badge variant="outline" className={`rounded-full border-transparent font-medium ${PRIORITY_STYLES[prioridade]}`}>
      {PRIORITY_LABELS[prioridade]}
    </Badge>
  )
}
