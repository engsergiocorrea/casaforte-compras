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

export function PrepararIaButton({ pedidoId }: { pedidoId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleConfirm() {
    console.log('[PrepararIA] clique confirmado', pedidoId)
    setErrorMessage(null)

    startTransition(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
        console.log('[PrepararIA] iniciando fetch')
        const response = await fetch(`/api/purchase-orders/${pedidoId}/prepare-pdf`, {
          method: 'POST',
          signal: controller.signal,
        })
        console.log('[PrepararIA] resposta', response.status)

        const result = await response.json()

        if (result.success) {
          const alertas = result.data?.alertas_gerais?.length ?? 0
          toast.success(
            alertas > 0
              ? `Pedido preparado com IA. ${alertas} item(ns) precisam de revisão.`
              : 'Pedido preparado com IA. Todos os itens ficaram com boa confiança.'
          )
          setOpen(false)
          router.refresh()
        } else {
          const message = result.error ?? 'Não foi possível preparar o pedido com IA.'
          setErrorMessage(message)
          toast.error(message)
        }
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === 'AbortError'
            ? 'A preparação por IA demorou demais para responder. Tente novamente em instantes.'
            : 'Erro de conexão ao preparar o pedido com IA.'
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
        {isPending ? 'Preparando...' : 'Preparar com IA'}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Preparar pedido com IA</AlertDialogTitle>
          <AlertDialogDescription>
            A IA vai padronizar os nomes dos materiais, sugerir categoria e unidade, melhorar a
            especificação técnica e procurar imagens já aprovadas no catálogo. Itens ambíguos ou
            sem imagem aprovada ficarão marcados para revisão manual.
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
            {isPending ? 'Preparando...' : 'Preparar agora'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
