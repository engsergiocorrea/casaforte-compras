import { Sparkles } from 'lucide-react'
import { isFallbackAlert } from '@/lib/ai/constants'
import { ItemImageActions } from '@/components/pedidos/item-image-actions'
import type { PedidoCompraItem } from '@/types/database'

function usedFallback(item: PedidoCompraItem) {
  return item.ia_alertas?.some(isFallbackAlert) ?? false
}

// Depois da preparação por IA: mostra só o que precisa de atenção (itens
// para conferir e seus avisos). A lista completa com fotos é a de Itens.
export function AiPreparationPanel({
  itens,
  preparadoEm,
  canEdit,
}: {
  itens: PedidoCompraItem[]
  preparadoEm: string | null
  canEdit: boolean
}) {
  if (!preparadoEm) return null

  const algumFallback = itens.some(usedFallback)
  const conferir = itens.filter((i) => i.precisa_revisao)
  const quando = new Date(preparadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg">
          <Sparkles className="size-4 text-primary" /> Revisão da IA
        </h2>
        <span className="text-[12px] text-muted-foreground">{quando}</span>
      </div>

      {algumFallback ? (
        <p className="rounded-xl bg-amber-500/12 px-3 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-200">
          A IA não respondeu para alguns itens; eles ficaram como foram digitados.
        </p>
      ) : null}

      {conferir.length === 0 ? (
        <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200">
          Tudo certo: nenhum item precisa de conferência.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_oklch(0_0_0/4%),0_0_0_0.5px_oklch(0_0_0/5%)]">
          {conferir.map((item) => (
            <li key={item.id} className="space-y-1.5 p-4">
              <p className="font-medium">{item.nome_padronizado || item.nome_material}</p>
              {item.nome_padronizado && item.nome_padronizado !== item.nome_material ? (
                <p className="text-[12px] text-muted-foreground">Pedido como: “{item.nome_material}”</p>
              ) : null}
              {item.ia_alertas && item.ia_alertas.filter((a) => !isFallbackAlert(a)).length > 0 ? (
                <ul className="space-y-1 text-[13px] text-amber-800 dark:text-amber-200">
                  {item.ia_alertas
                    .filter((a) => !isFallbackAlert(a))
                    .map((alerta, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden>•</span>
                        {alerta}
                      </li>
                    ))}
                </ul>
              ) : null}
              {canEdit && !item.imagem_referencia_url ? (
                <div className="pt-1">
                  <ItemImageActions item={item} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
