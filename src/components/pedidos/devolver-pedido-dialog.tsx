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
import { Textarea } from '@/components/ui/textarea'
import { devolverPedido } from '@/app/(app)/pedidos/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'

export function DevolverPedidoDialog({ pedidoId }: { pedidoId: string }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await devolverPedido(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success('Pedido devolvido para ajustes.')
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
      <DialogTrigger render={<Button variant="outline" size="sm">Devolver</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolver pedido</DialogTitle>
          <DialogDescription>
            O solicitante poderá ajustar o pedido e enviá-lo novamente para aprovação. Uma
            mensagem de WhatsApp com o motivo será enviada ao engenheiro responsável.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="pedido_id" value={pedidoId} />

          <div className="space-y-2">
            <Label htmlFor="comentario">Motivo da devolução *</Label>
            <Textarea id="comentario" name="comentario" required />
            {state.fieldErrors?.comentario ? (
              <p className="text-sm text-destructive">{state.fieldErrors.comentario[0]}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Devolvendo...' : 'Confirmar devolução'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
