'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

export function MaterialImageDialog({
  materialId,
  trigger,
}: {
  materialId: string
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/materiais-catalogo/${materialId}/upload-image`, {
          method: 'POST',
          body: formData,
        })
        const result = await response.json()

        if (result.success) {
          toast.success('Imagem do material atualizada.')
          setOpen(false)
          router.refresh()
        } else {
          setErrorMessage(result.error ?? 'Erro ao enviar imagem.')
        }
      } catch {
        setErrorMessage('Erro de conexão ao enviar imagem.')
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
          <DialogTitle>Imagem principal do material</DialogTitle>
          <DialogDescription>
            Esta imagem fica marcada como aprovada e será usada automaticamente em qualquer
            pedido futuro com este material.
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

          {errorMessage ? (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Salvar imagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
