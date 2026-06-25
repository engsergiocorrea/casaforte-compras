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
import { Switch } from '@/components/ui/switch'
import { createEngenheiro, updateEngenheiro } from '@/app/(app)/engenheiros/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { Engenheiro } from '@/types/database'

export function EngenheiroFormDialog({
  engenheiro,
  trigger,
}: {
  engenheiro?: Engenheiro
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const action = engenheiro ? updateEngenheiro : createEngenheiro

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(
          engenheiro ? 'Engenheiro atualizado com sucesso.' : 'Engenheiro cadastrado com sucesso.'
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{engenheiro ? 'Editar engenheiro' : 'Novo engenheiro'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do engenheiro responsável técnico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {engenheiro ? <input type="hidden" name="id" value={engenheiro.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" required defaultValue={engenheiro?.nome} />
            {state.fieldErrors?.nome ? (
              <p className="text-sm text-destructive">{state.fieldErrors.nome[0]}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={engenheiro?.email ?? ''} />
              {state.fieldErrors?.email ? (
                <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" defaultValue={engenheiro?.telefone ?? ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" name="cargo" defaultValue={engenheiro?.cargo ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro_profissional">Registro profissional</Label>
              <Input
                id="registro_profissional"
                name="registro_profissional"
                defaultValue={engenheiro?.registro_profissional ?? ''}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="ativo">Engenheiro ativo</Label>
            <Switch
              id="ativo"
              name="ativo"
              defaultChecked={engenheiro ? engenheiro.ativo : true}
            />
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
