import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isFallbackAlert } from '@/lib/ai/constants'
import { ItemImageActions } from '@/components/pedidos/item-image-actions'
import type { PedidoCompraItem } from '@/types/database'

function usedFallback(item: PedidoCompraItem) {
  return item.ia_alertas?.some(isFallbackAlert) ?? false
}

function ItemStatus({ item }: { item: PedidoCompraItem }) {
  if (item.precisa_revisao) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
        Revisar
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
      OK
    </Badge>
  )
}

function ConfidenceBadge({ confianca }: { confianca: number | null }) {
  if (confianca === null) return <span className="text-muted-foreground">-</span>

  const percent = Math.round(confianca * 100)
  const style =
    confianca >= 0.7
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : confianca >= 0.4
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-red-200 bg-red-50 text-red-700'

  return (
    <Badge variant="outline" className={style}>
      {percent}%
    </Badge>
  )
}

function imageStatusLabel(item: PedidoCompraItem) {
  if (!item.imagem_referencia_url) {
    return 'Sem imagem cadastrada'
  }
  if (item.imagem_aprovada) {
    return 'Imagem aprovada'
  }
  return 'Imagem de referência — revisar'
}

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preparação por IA</CardTitle>
        <p className="text-sm text-muted-foreground">
          Preparado em {new Date(preparadoEm).toLocaleString('pt-BR')}. Revise os itens marcados
          como &quot;Revisar&quot; antes de seguir com o pedido.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {algumFallback ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
            A IA configurada falhou ou não está disponível. O sistema usou preparação básica de
            segurança.
          </p>
        ) : null}

        {itens.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-foreground/8 bg-card/60 p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Item original</p>
                <p className="font-medium">{item.nome_material}</p>
              </div>
              <div className="flex gap-2">
                <ConfidenceBadge confianca={item.ia_confianca} />
                <ItemStatus item={item} />
              </div>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-[96px_1fr]">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-foreground/8 bg-muted text-center text-xs text-muted-foreground">
                {item.imagem_referencia_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imagem_referencia_url}
                    alt={item.nome_padronizado || item.nome_material}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="px-1">Sem imagem</span>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                <p className="font-heading text-base font-semibold tracking-tight">
                  {item.nome_padronizado || '-'}
                </p>
                <p
                  className={
                    item.imagem_aprovada
                      ? 'text-xs font-medium text-emerald-700'
                      : !item.imagem_referencia_url
                        ? 'text-xs text-muted-foreground'
                        : 'text-xs font-medium text-amber-700'
                  }
                >
                  {imageStatusLabel(item)}
                </p>
                {item.ia_resumo ? (
                  <p className="text-muted-foreground">{item.ia_resumo}</p>
                ) : null}
                {item.ia_alertas && item.ia_alertas.length > 0 ? (
                  <ul className="list-inside list-disc space-y-0.5 text-amber-700/90">
                    {item.ia_alertas.map((alerta, index) => (
                      <li key={index}>{alerta}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {canEdit ? (
              <div className="mt-3 border-t border-foreground/8 pt-3">
                <ItemImageActions item={item} />
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
