'use client'

import { useTransition } from 'react'
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

export function PrepararIaButton({ pedidoId }: { pedidoId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirm() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/purchase-orders/${pedidoId}/prepare-pdf`, {
          method: 'POST',
        })
        const result = await response.json()

        if (result.success) {
          const alertas = result.data?.alertas_gerais?.length ?? 0
          toast.success(
            alertas > 0
              ? `Pedido preparado com IA. ${alertas} item(ns) precisam de revisão.`
              : 'Pedido preparado com IA. Todos os itens ficaram com boa confiança.'
          )
          router.refresh()
        } else {
          toast.error(result.error ?? 'Não foi possível preparar o pedido com IA.')
        }
      } catch {
        toast.error('Erro de conexão ao preparar o pedido com IA.')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" disabled={isPending} />}>
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
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            Preparar agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
