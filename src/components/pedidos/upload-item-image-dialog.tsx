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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { uploadItemImage } from '@/app/(app)/pedidos/actions'

export function UploadItemImageDialog({
  pedidoId,
  itemId,
  trigger,
}: {
  pedidoId: string
  itemId: string
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setErrorMessage(null)

    startTransition(async () => {
      const result = await uploadItemImage(pedidoId, itemId, formData)

      if (result.success) {
        toast.success('Imagem enviada.')
        setOpen(false)
      } else {
        setErrorMessage(result.error ?? 'Erro ao enviar imagem.')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setErrorMessage(null)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar imagem</DialogTitle>
          <DialogDescription>
            Envie uma foto de referência deste material. Ela ficará disponível no pedido e, se
            marcada como aprovada, poderá ser reutilizada automaticamente em pedidos futuros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Foto do material</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/*"
              required
              className="block w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="aprovado" name="aprovado" />
            <Label htmlFor="aprovado" className="text-sm font-normal">
              Marcar como aprovada para reutilização futura
            </Label>
          </div>

          {errorMessage ? (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar foto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
