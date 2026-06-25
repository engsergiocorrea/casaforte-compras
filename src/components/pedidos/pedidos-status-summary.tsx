import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PedidoStatus } from '@/types/database'

// Resumo simplificado: foca nos 5 status principais do fluxo novo. Status
// legados de revisão (pendente_revisao/em_revisao) e de pós-aprovação
// (enviado/respondido/parcialmente_comprado/comprado) são agrupados no
// card "Outros" (contagem calculada em page.tsx) para não perder
// visibilidade de pedidos antigos. O clique em "Outros" leva para a lista
// completa sem filtro de status, já que não há suporte a filtro multi-status.
const SUMMARY_ITEMS: { key: PedidoStatus | 'todos' | 'outros'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'rascunho', label: 'Rascunhos' },
  { key: 'pendente_aprovacao', label: 'Aguardando aprovação' },
  { key: 'aprovado', label: 'Aprovados' },
  { key: 'devolvido', label: 'Devolvidos' },
  { key: 'cancelado', label: 'Cancelados' },
  { key: 'outros', label: 'Outros' },
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
        const href =
          item.key === 'todos' || item.key === 'outros' ? '/pedidos' : `/pedidos?status=${item.key}`

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
