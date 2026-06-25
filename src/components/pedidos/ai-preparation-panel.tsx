import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isFallbackAlert } from '@/lib/ai/constants'
import { UploadItemImageDialog } from '@/components/pedidos/upload-item-image-dialog'
import type { PedidoCompraItem } from '@/types/database'

function usedFallback(item: PedidoCompraItem) {
  return item.ia_alertas?.some(isFallbackAlert) ?? false
}

function ItemStatus({ item }: { item: PedidoCompraItem }) {
  if (item.precisa_revisao) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        Revisar
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
      OK
    </Badge>
  )
}

function ConfidenceBadge({ confianca }: { confianca: number | null }) {
  if (confianca === null) return <span className="text-muted-foreground">-</span>

  const percent = Math.round(confianca * 100)
  const style =
    confianca >= 0.7
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : confianca >= 0.4
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200'

  return (
    <Badge variant="outline" className={style}>
      {percent}%
    </Badge>
  )
}

function imageStatusLabel(item: PedidoCompraItem) {
  if (!item.imagem_referencia_url) {
    return 'Sem imagem cadastrada. Cadastre uma imagem no catálogo ou configure busca de imagem.'
  }
  if (item.imagem_aprovada) {
    return 'Imagem aprovada'
  }
  return 'Imagem de referência — revisar'
}

export function AiPreparationPanel({
  pedidoId,
  itens,
  preparadoEm,
  canEdit,
}: {
  pedidoId: string
  itens: PedidoCompraItem[]
  preparadoEm: string | null
  canEdit: boolean
}) {
  if (!preparadoEm) return null

  const algumFallback = itens.some(usedFallback)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preparação por IA</CardTitle>
        <p className="text-sm text-muted-foreground">
          Preparado em {new Date(preparadoEm).toLocaleString('pt-BR')}. Revise os itens marcados
          como &quot;Revisar&quot; antes de seguir com o pedido.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {algumFallback ? (
          <p className="rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-800 border border-amber-200">
            A IA configurada falhou ou não está disponível. O sistema usou preparação básica de
            segurança.
          </p>
        ) : null}

        {itens.map((item) => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Item original</p>
                <p className="font-medium">{item.nome_material}</p>
              </div>
              <div className="flex gap-2">
                <ConfidenceBadge confianca={item.ia_confianca} />
                <ItemStatus item={item} />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[80px_1fr]">
              <div className="space-y-2">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted text-center text-xs text-muted-foreground">
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
                {canEdit ? (
                  <UploadItemImageDialog
                    pedidoId={pedidoId}
                    itemId={item.id}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        {item.imagem_referencia_url ? 'Enviar foto' : 'Adicionar imagem'}
                      </Button>
                    }
                  />
                ) : null}
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Nome padronizado: </span>
                  <span className="font-medium">{item.nome_padronizado || '-'}</span>
                </p>
                <p
                  className={
                    item.imagem_aprovada
                      ? 'text-emerald-700'
                      : !item.imagem_referencia_url
                        ? 'text-muted-foreground'
                        : 'text-amber-700'
                  }
                >
                  {imageStatusLabel(item)}
                </p>
                {item.ia_resumo ? (
                  <p className="text-muted-foreground">{item.ia_resumo}</p>
                ) : null}
                {item.ia_alertas && item.ia_alertas.length > 0 ? (
                  <ul className="list-inside list-disc text-amber-700">
                    {item.ia_alertas.map((alerta, index) => (
                      <li key={index}>{alerta}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
