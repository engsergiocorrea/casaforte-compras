import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PedidoStatus } from '@/types/database'

const SUMMARY_ITEMS: { key: PedidoStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'rascunho', label: 'Rascunhos' },
  { key: 'pendente_revisao', label: 'Pendentes de revisão' },
  { key: 'em_revisao', label: 'Em revisão' },
  { key: 'pendente_aprovacao', label: 'Pendentes de aprovação' },
  { key: 'aprovado', label: 'Aprovados' },
  { key: 'devolvido', label: 'Devolvidos' },
  { key: 'cancelado', label: 'Cancelados' },
]

export function PedidosStatusSummary({
  counts,
  activeStatus,
}: {
  counts: Record<string, number>
  activeStatus: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {SUMMARY_ITEMS.map((item) => {
        const isActive = activeStatus === item.key || (item.key === 'todos' && activeStatus === 'todos')
        const href = item.key === 'todos' ? '/pedidos' : `/pedidos?status=${item.key}`

        return (
          <Link key={item.key} href={href}>
            <Card
              className={
                isActive ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40'
              }
            >
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{counts[item.key] ?? 0}</CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
