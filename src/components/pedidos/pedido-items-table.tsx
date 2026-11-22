'use client'

import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { ItemFormDialog } from '@/components/pedidos/item-form-dialog'
import { deletePedidoItem } from '@/app/(app)/pedidos/actions'
import type { CategoriaMaterial, MaterialCatalogo, PedidoCompraItem } from '@/types/database'

const fmtQtd = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(n))

// Itens como lista com foto (estilo App Store/Lojas): imagem do material à
// esquerda, nome e especificação no meio, quantidade em destaque à direita.
export function PedidoItemsTable({
  pedidoId,
  itens,
  categorias,
  materiais,
  canEdit,
}: {
  pedidoId: string
  itens: PedidoCompraItem[]
  categorias: CategoriaMaterial[]
  materiais: MaterialCatalogo[]
  canEdit: boolean
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg">
          Itens <span className="font-normal text-muted-foreground">{itens.length}</span>
        </h2>
        {canEdit ? (
          <ItemFormDialog
            pedidoId={pedidoId}
            categorias={categorias}
            materiais={materiais}
            trigger={<Button size="sm" variant="ghost" className="rounded-full text-primary">Adicionar item</Button>}
          />
        ) : null}
      </div>

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Nenhum item ainda. Toque em “Adicionar item”.
        </div>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_oklch(0_0_0/4%),0_0_0_0.5px_oklch(0_0_0/5%)]">
          {itens.map((item) => (
            <li key={item.id} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-border/60 sm:size-20">
                {item.imagem_referencia_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imagem_referencia_url} alt="" loading="lazy" className="size-full object-contain" />
                ) : (
                  <div className="grid size-full place-items-center bg-muted text-muted-foreground/60">
                    <Package className="size-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{item.nome_padronizado || item.nome_material}</p>
                  <p className="shrink-0 text-right">
                    <span className="text-lg font-semibold tabular-nums">{fmtQtd(item.quantidade)}</span>
                    <span className="ml-1 text-[13px] text-muted-foreground">{item.unidade || 'un'}</span>
                  </p>
                </div>
                {item.especificacao_tecnica ? (
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{item.especificacao_tecnica}</p>
                ) : null}
                {item.marca_preferencial || item.local_de_aplicacao ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {[item.marca_preferencial && `Marca: ${item.marca_preferencial}`, item.local_de_aplicacao && `Local: ${item.local_de_aplicacao}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {item.precisa_revisao ? (
                  <p className="mt-1.5 inline-flex rounded-full bg-amber-500/14 px-2 py-0.5 text-[12px] font-medium text-amber-700 dark:text-amber-300">
                    Conferir
                  </p>
                ) : null}
                {canEdit ? (
                  <div className="mt-2 flex gap-1">
                    <ItemFormDialog
                      pedidoId={pedidoId}
                      item={item}
                      categorias={categorias}
                      materiais={materiais}
                      trigger={<Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-[13px] text-primary">Editar</Button>}
                    />
                    <ConfirmActionButton
                      label="Remover"
                      title="Remover item"
                      description={`Remover "${item.nome_material}" do pedido?`}
                      successMessage="Item removido."
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full px-2.5 text-[13px] text-destructive"
                      action={() => deletePedidoItem(pedidoId, item.id)}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
