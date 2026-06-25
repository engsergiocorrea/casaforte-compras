'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addPedidoItem, updatePedidoItem } from '@/app/(app)/pedidos/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { CategoriaMaterial, MaterialCatalogo, PedidoCompraItem } from '@/types/database'

export function ItemFormDialog({
  pedidoId,
  item,
  categorias,
  materiais,
  trigger,
}: {
  pedidoId: string
  item?: PedidoCompraItem
  categorias: CategoriaMaterial[]
  materiais: MaterialCatalogo[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const action = item ? updatePedidoItem : addPedidoItem

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(item ? 'Item atualizado.' : 'Item adicionado ao pedido.')
        setOpen(false)
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setState(initialFormActionState)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar item' : 'Adicionar item'}</DialogTitle>
          <DialogDescription>Material a ser solicitado no pedido de compra.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="pedido_id" value={pedidoId} />
          {item ? <input type="hidden" name="item_id" value={item.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="nome_material">Material *</Label>
            <Input
              id="nome_material"
              name="nome_material"
              required
              defaultValue={item?.nome_material}
            />
            {state.fieldErrors?.nome_material ? (
              <p className="text-sm text-destructive">{state.fieldErrors.nome_material[0]}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_catalogo_id">Material do catálogo</Label>
              <Select name="material_catalogo_id" defaultValue={item?.material_catalogo_id ?? ''}>
                <SelectTrigger id="material_catalogo_id" className="w-full">
                  <SelectValue placeholder="Vincular (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {materiais.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nome_padronizado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria</Label>
              <Select name="categoria_id" defaultValue={item?.categoria_id ?? ''}>
                <SelectTrigger id="categoria_id" className="w-full">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={item?.quantidade ?? 1}
              />
              {state.fieldErrors?.quantidade ? (
                <p className="text-sm text-destructive">{state.fieldErrors.quantidade[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                name="unidade"
                placeholder="Ex: un, m², kg, saco"
                defaultValue={item?.unidade ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca_preferencial">Marca preferencial</Label>
              <Input
                id="marca_preferencial"
                name="marca_preferencial"
                defaultValue={item?.marca_preferencial ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="local_de_aplicacao">Local de aplicação</Label>
              <Input
                id="local_de_aplicacao"
                name="local_de_aplicacao"
                defaultValue={item?.local_de_aplicacao ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especificacao_tecnica">Especificação técnica</Label>
            <Textarea
              id="especificacao_tecnica"
              name="especificacao_tecnica"
              defaultValue={item?.especificacao_tecnica ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" defaultValue={item?.observacoes ?? ''} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
