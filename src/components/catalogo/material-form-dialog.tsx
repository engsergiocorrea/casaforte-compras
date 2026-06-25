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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMaterialCatalogo, updateMaterialCatalogo } from '@/app/(app)/catalogo/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { CategoriaMaterial, MaterialCatalogo } from '@/types/database'

export function MaterialFormDialog({
  material,
  categorias,
  trigger,
}: {
  material?: MaterialCatalogo
  categorias: CategoriaMaterial[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const action = material ? updateMaterialCatalogo : createMaterialCatalogo

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(material ? 'Material atualizado com sucesso.' : 'Material criado com sucesso.')
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
          <DialogTitle>{material ? 'Editar material' : 'Novo material'}</DialogTitle>
          <DialogDescription>
            Materiais padronizados usados nos pedidos de compra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {material ? <input type="hidden" name="id" value={material.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="nome_padronizado">Nome padronizado *</Label>
            <Input
              id="nome_padronizado"
              name="nome_padronizado"
              required
              defaultValue={material?.nome_padronizado}
            />
            {state.fieldErrors?.nome_padronizado ? (
              <p className="text-sm text-destructive">{state.fieldErrors.nome_padronizado[0]}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria</Label>
              <Select name="categoria_id" defaultValue={material?.categoria_id ?? ''}>
                <SelectTrigger id="categoria_id" className="w-full">
                  <SelectValue placeholder="Selecione" />
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
            <div className="space-y-2">
              <Label htmlFor="unidade_padrao">Unidade padrão</Label>
              <Input
                id="unidade_padrao"
                name="unidade_padrao"
                placeholder="Ex: un, m², kg, saco"
                defaultValue={material?.unidade_padrao ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao_padrao">Descrição padrão</Label>
            <Textarea
              id="descricao_padrao"
              name="descricao_padrao"
              defaultValue={material?.descricao_padrao ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="especificacao_padrao">Especificação padrão</Label>
            <Textarea
              id="especificacao_padrao"
              name="especificacao_padrao"
              defaultValue={material?.especificacao_padrao ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marcas_aceitas">Marcas aceitas</Label>
            <Input
              id="marcas_aceitas"
              name="marcas_aceitas"
              placeholder="Separadas por vírgula"
              defaultValue={material?.marcas_aceitas?.join(', ') ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" defaultValue={material?.observacoes ?? ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="ativo">Ativo</Label>
              <Switch id="ativo" name="ativo" defaultChecked={material ? material.ativo : true} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="aprovado">Aprovado</Label>
              <Switch
                id="aprovado"
                name="aprovado"
                defaultChecked={material ? material.aprovado : false}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
