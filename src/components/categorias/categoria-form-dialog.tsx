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
import { createCategoria, updateCategoria } from '@/app/(app)/categorias/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { CategoriaMaterial } from '@/types/database'

export function CategoriaFormDialog({
  categoria,
  trigger,
}: {
  categoria?: CategoriaMaterial
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const action = categoria ? updateCategoria : createCategoria

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(
          categoria ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.'
        )
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{categoria ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>Categorias usadas para classificar materiais.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {categoria ? <input type="hidden" name="id" value={categoria.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" required defaultValue={categoria?.nome} />
            {state.fieldErrors?.nome ? (
              <p className="text-sm text-destructive">{state.fieldErrors.nome[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" defaultValue={categoria?.descricao ?? ''} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="ativo">Categoria ativa</Label>
            <Switch id="ativo" name="ativo" defaultChecked={categoria ? categoria.ativo : true} />
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
