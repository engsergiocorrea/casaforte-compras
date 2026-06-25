'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { DevolverPedidoDialog } from '@/components/pedidos/devolver-pedido-dialog'
import { PrepararIaButton } from '@/components/pedidos/preparar-ia-button'
import {
  aprovarPedido,
  cancelarPedido,
  enviarParaAprovacao,
  enviarParaRevisao,
  iniciarRevisao,
} from '@/app/(app)/pedidos/actions'

export function PedidoActionsPanel({
  pedidoId,
  canSendToReview,
  canStartReview,
  canSendToApproval,
  canDecideApproval,
  canCancel,
  canPrepareWithIA,
}: {
  pedidoId: string
  canSendToReview: boolean
  canStartReview: boolean
  canSendToApproval: boolean
  canDecideApproval: boolean
  canCancel: boolean
  canPrepareWithIA: boolean
}) {
  const hasActions =
    canSendToReview ||
    canStartReview ||
    canSendToApproval ||
    canDecideApproval ||
    canCancel ||
    canPrepareWithIA

  if (!hasActions) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ações</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {canPrepareWithIA ? <PrepararIaButton pedidoId={pedidoId} /> : null}

        {canSendToReview ? (
          <ConfirmActionButton
            label="Enviar para revisão"
            title="Enviar pedido para revisão"
            description="O pedido será enviado para a equipe de compras revisar os itens."
            successMessage="Pedido enviado para revisão."
            action={() => enviarParaRevisao(pedidoId)}
          />
        ) : null}

        {canStartReview ? (
          <ConfirmActionButton
            label="Iniciar revisão"
            title="Iniciar revisão do pedido"
            description="O pedido passará para 'em revisão' enquanto você confere os itens."
            successMessage="Revisão iniciada."
            action={() => iniciarRevisao(pedidoId)}
          />
        ) : null}

        {canSendToApproval ? (
          <ConfirmActionButton
            label="Enviar para aprovação"
            title="Enviar pedido para aprovação"
            description="O pedido será enviado para aprovação da diretoria."
            successMessage="Pedido enviado para aprovação."
            action={() => enviarParaAprovacao(pedidoId)}
          />
        ) : null}

        {canDecideApproval ? (
          <>
            <ConfirmActionButton
              label="Aprovar"
              title="Aprovar pedido"
              description="O pedido será aprovado e não poderá mais ser editado livremente."
              successMessage="Pedido aprovado."
              action={() => aprovarPedido(pedidoId)}
            />
            <DevolverPedidoDialog pedidoId={pedidoId} />
          </>
        ) : null}

        {canCancel ? (
          <ConfirmActionButton
            label="Cancelar pedido"
            title="Cancelar pedido"
            description="Esta ação cancela o pedido. Ele deixará de seguir o fluxo de aprovação."
            successMessage="Pedido cancelado."
            variant="destructive"
            action={() => cancelarPedido(pedidoId)}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
