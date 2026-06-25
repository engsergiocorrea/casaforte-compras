'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { DevolverPedidoDialog } from '@/components/pedidos/devolver-pedido-dialog'
import { PrepararIaButton } from '@/components/pedidos/preparar-ia-button'
import { GerarPdfButton } from '@/components/pedidos/gerar-pdf-button'
import {
  aprovarPedido,
  cancelarPedido,
  enviarDiretoParaAprovacao,
} from '@/app/(app)/pedidos/actions'
import type { Fornecedor } from '@/types/database'

export function PedidoActionsPanel({
  pedidoId,
  canSendDirectToApproval,
  canDecideApproval,
  canCancel,
  canPrepareWithIA,
  canGeneratePdf,
  hasItens,
  pdfUrl,
  itensComRevisao,
  fornecedores,
  fornecedorIdAtual,
}: {
  pedidoId: string
  canSendDirectToApproval: boolean
  canDecideApproval: boolean
  canCancel: boolean
  canPrepareWithIA: boolean
  canGeneratePdf: boolean
  hasItens: boolean
  pdfUrl: string | null
  itensComRevisao: number
  fornecedores: Fornecedor[]
  fornecedorIdAtual: string | null
}) {
  const [fornecedorId, setFornecedorId] = useState<string>(fornecedorIdAtual ?? '')

  const fornecedorSelecionado = fornecedores.find((f) => f.id === fornecedorId)
  const fornecedorValido = !!fornecedorSelecionado?.telefone_whatsapp

  const hasActions =
    canSendDirectToApproval ||
    canDecideApproval ||
    canCancel ||
    canPrepareWithIA ||
    canGeneratePdf ||
    !!pdfUrl

  if (!hasActions) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {itensComRevisao > 0 ? (
          <p className="rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-800 border border-amber-200">
            {itensComRevisao} item(ns) deste pedido precisam de revisão manual.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canPrepareWithIA ? <PrepararIaButton pedidoId={pedidoId} /> : null}

          {canGeneratePdf && hasItens ? <GerarPdfButton pedidoId={pedidoId} /> : null}

          {hasItens ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link href={`/pedidos/${pedidoId}/pdf`} />}
            >
              Pré-visualizar documento
            </Button>
          ) : null}

          {pdfUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<a href={pdfUrl} target="_blank" rel="noopener noreferrer" />}
            >
              Abrir documento
            </Button>
          ) : null}

          {canSendDirectToApproval ? (
            <ConfirmActionButton
              label="Enviar para aprovação"
              title="Enviar pedido para aprovação"
              description="O pedido será enviado para aprovação da diretoria (Aguardando aprovação)."
              successMessage="Pedido enviado para aprovação."
              action={() => enviarDiretoParaAprovacao(pedidoId)}
            />
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
        </div>

        {canDecideApproval ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-2">
              <Label htmlFor="fornecedor-aprovacao">Fornecedor para envio do pedido</Label>
              <Select value={fornecedorId} onValueChange={(value) => setFornecedorId(value ?? '')}>
                <SelectTrigger id="fornecedor-aprovacao" className="w-full sm:w-80">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome_fantasia}
                      {fornecedor.telefone_whatsapp ? ` · ${fornecedor.telefone_whatsapp}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fornecedorSelecionado && !fornecedorValido ? (
                <p className="text-sm text-destructive">
                  Este fornecedor não possui telefone de WhatsApp cadastrado. Selecione outro para
                  poder aprovar.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <ConfirmActionButton
                label="Aprovar pedido"
                title="Aprovar pedido"
                description="O pedido será aprovado, o documento será gerado (se ainda não existir) e enviado ao fornecedor selecionado por WhatsApp."
                successMessage="Pedido aprovado e enviado ao fornecedor."
                disabled={!fornecedorId || !fornecedorValido}
                action={() => aprovarPedido(pedidoId, fornecedorId)}
              />
              <DevolverPedidoDialog pedidoId={pedidoId} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
