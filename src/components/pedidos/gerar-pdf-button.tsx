'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const TIMEOUT_MS = 30_000

export function GerarPdfButton({ pedidoId }: { pedidoId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleConfirm() {
    setErrorMessage(null)

    startTransition(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
        const response = await fetch(`/api/purchase-orders/${pedidoId}/generate-pdf`, {
          method: 'POST',
          signal: controller.signal,
        })
        const result = await response.json()

        if (result.success) {
          toast.success('Documento do pedido gerado com sucesso.')
          setOpen(false)
          router.refresh()
        } else {
          const message = result.error ?? 'Não foi possível gerar o documento do pedido.'
          setErrorMessage(message)
          toast.error(message)
        }
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === 'AbortError'
            ? 'A geração do documento demorou demais para responder. Tente novamente em instantes.'
            : 'Erro de conexão ao gerar o documento.'
        setErrorMessage(message)
        toast.error(message)
      } finally {
        clearTimeout(timeoutId)
      }
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setErrorMessage(null)
      }}
    >
      <AlertDialogTrigger render={<Button type="button" size="sm" disabled={isPending} />}>
        {isPending ? 'Gerando...' : 'Gerar PDF'}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar documento do pedido</AlertDialogTitle>
          <AlertDialogDescription>
            Se o pedido ainda não foi preparado com IA, isso será feito automaticamente antes de
            gerar o documento. O arquivo é salvo no Storage e fica disponível em &quot;Abrir
            documento&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage ? (
          <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Gerando...' : 'Gerar agora'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
