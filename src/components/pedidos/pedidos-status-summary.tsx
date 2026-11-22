import Link from 'next/link'
import type { PedidoStatus } from '@/types/database'

// Controle segmentado (estilo iOS) com a contagem de cada status. Substitui
// os 8 cartões e o filtro de status repetido. Rola de lado no celular.
const ITENS: { key: PedidoStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'rascunho', label: 'Rascunhos' },
  { key: 'pendente_aprovacao', label: 'Aguardando' },
  { key: 'aprovado', label: 'Aprovados' },
  { key: 'devolvido', label: 'Devolvidos' },
  { key: 'cancelado', label: 'Cancelados' },
]

export function PedidosStatusSummary({ counts, activeStatus }: { counts: Record<string, number>; activeStatus: string }) {
  return (
    <nav aria-label="Filtrar por status" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <div className="inline-flex gap-1 rounded-full bg-muted p-1">
        {ITENS.map((item) => {
          const ativo = activeStatus === item.key
          const href = item.key === 'todos' ? '/pedidos' : `/pedidos?status=${item.key}`
          return (
            <Link
              key={item.key}
              href={href}
              aria-current={ativo ? 'page' : undefined}
              className={`cf-press flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                ativo ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
              <span className={`tabular-nums text-[12px] ${ativo ? 'text-primary' : 'text-muted-foreground/70'}`}>
                {counts[item.key] ?? 0}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
