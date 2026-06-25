'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { ItemFormDialog } from '@/components/pedidos/item-form-dialog'
import { deletePedidoItem } from '@/app/(app)/pedidos/actions'
import type { CategoriaMaterial, MaterialCatalogo, PedidoCompraItem } from '@/types/database'

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Itens do pedido ({itens.length})</CardTitle>
        {canEdit ? (
          <ItemFormDialog
            pedidoId={pedidoId}
            categorias={categorias}
            materiais={materiais}
            trigger={<Button size="sm">Adicionar item</Button>}
          />
        ) : null}
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Nenhum item adicionado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Local</TableHead>
                  {canEdit ? <TableHead className="text-right">Ações</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nome_padronizado || item.nome_material}
                      {item.especificacao_tecnica ? (
                        <p className="text-xs text-muted-foreground">{item.especificacao_tecnica}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>{item.unidade || '-'}</TableCell>
                    <TableCell>{item.marca_preferencial || '-'}</TableCell>
                    <TableCell>{item.local_de_aplicacao || '-'}</TableCell>
                    {canEdit ? (
                      <TableCell className="flex justify-end gap-2">
                        <ItemFormDialog
                          pedidoId={pedidoId}
                          item={item}
                          categorias={categorias}
                          materiais={materiais}
                          trigger={<Button variant="outline" size="sm">Editar</Button>}
                        />
                        <ConfirmActionButton
                          label="Remover"
                          title="Remover item"
                          description={`Remover "${item.nome_material}" do pedido?`}
                          successMessage="Item removido."
                          variant="destructive"
                          action={() => deletePedidoItem(pedidoId, item.id)}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
