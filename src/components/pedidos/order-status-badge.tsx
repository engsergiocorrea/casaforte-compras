import { Badge } from '@/components/ui/badge'
import type { PedidoStatus } from '@/types/database'

// Rótulos amigáveis exibidos na UI. O valor armazenado no banco para o
// fluxo simplificado continua sendo 'pendente_aprovacao' (não houve
// migration de enum); só o texto exibido mudou para "Aguardando aprovação".
// Os status legados de revisão (pendente_revisao/em_revisao) só existem em
// pedidos antigos e mantêm rótulo próprio apenas para não quebrar a
// renderização — não são mais oferecidos no fluxo de pedidos novos.
const STATUS_LABELS: Record<PedidoStatus, string> = {
  rascunho: 'Rascunho',
  pendente_revisao: 'Em revisão',
  em_revisao: 'Em revisão',
  pendente_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
  respondido: 'Respondido',
  parcialmente_comprado: 'Parcialmente comprado',
  comprado: 'Comprado',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
}

const STATUS_STYLES: Record<PedidoStatus, string> = {
  rascunho: 'bg-zinc-500/12 text-zinc-600 dark:text-zinc-300',
  pendente_revisao: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
  em_revisao: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  pendente_aprovacao: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  aprovado: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300',
  enviado: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300',
  respondido: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300',
  parcialmente_comprado: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  comprado: 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300',
  cancelado: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
  devolvido: 'bg-red-500/12 text-red-700 dark:text-red-300',
}

export function OrderStatusBadge({ status }: { status: PedidoStatus }) {
  return (
    <Badge variant="outline" className={`rounded-full border-transparent font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
