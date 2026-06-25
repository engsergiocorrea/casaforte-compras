import { Badge } from '@/components/ui/badge'

const STATUS_STYLES: Record<string, string> = {
  ativa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ativo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pausada: 'bg-amber-100 text-amber-700 border-amber-200',
  inativo: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  concluida: 'bg-blue-100 text-blue-700 border-blue-200',
  arquivada: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  arquivado: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

const STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  ativo: 'Ativo',
  pausada: 'Pausada',
  inativo: 'Inativo',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
  arquivado: 'Arquivado',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={STATUS_STYLES[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
