'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UploadItemImageDialog } from '@/components/pedidos/upload-item-image-dialog'
import type { PedidoCompraItem } from '@/types/database'

export function ItemImageActions({ item }: { item: PedidoCompraItem }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleApprove() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/purchase-order-items/${item.id}/approve-image`, {
          method: 'POST',
        })
        const result = await response.json()

        if (result.success) {
          toast.success('Imagem aprovada para reutilização futura.')
          router.refresh()
        } else {
          toast.error(result.error ?? 'Erro ao aprovar imagem.')
        }
      } catch {
        toast.error('Erro de conexão ao aprovar imagem.')
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/purchase-order-items/${item.id}/upload-image`, {
          method: 'DELETE',
        })
        const result = await response.json()

        if (result.success) {
          toast.success('Imagem removida.')
          router.refresh()
        } else {
          toast.error(result.error ?? 'Erro ao remover imagem.')
        }
      } catch {
        toast.error('Erro de conexão ao remover imagem.')
      }
    })
  }

  if (!item.imagem_referencia_url) {
    return (
      <UploadItemImageDialog
        itemId={item.id}
        title="Adicionar imagem"
        trigger={
          <Button type="button" variant="outline" size="sm" disabled={isPending}>
            Adicionar imagem
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!item.imagem_aprovada ? (
        <Button type="button" variant="outline" size="sm" onClick={handleApprove} disabled={isPending}>
          Aprovar imagem
        </Button>
      ) : null}
      <UploadItemImageDialog
        itemId={item.id}
        title="Trocar imagem"
        trigger={
          <Button type="button" variant="outline" size="sm" disabled={isPending}>
            Trocar imagem
          </Button>
        }
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRemove}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        Remover imagem
      </Button>
    </div>
  )
}
