import { notFound } from 'next/navigation'
import { PedidoHeaderCard } from '@/components/pedidos/pedido-header-card'
import { PedidoItemsTable } from '@/components/pedidos/pedido-items-table'
import { PedidoActionsPanel } from '@/components/pedidos/pedido-actions-panel'
import { AiPreparationPanel } from '@/components/pedidos/ai-preparation-panel'
import { PedidoHistory } from '@/components/pedidos/pedido-history'
import { EnviarWhatsappDialog } from '@/components/pedidos/enviar-whatsapp-dialog'
import { WhatsappHistory } from '@/components/pedidos/whatsapp-history'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canSendWhatsapp } from '@/lib/permissions/can'
import {
  canDecideApprovalAsync,
  canEditPedido,
  canCancelPedido,
  canGeneratePdf,
  canPrepareWithIA,
  canSendDirectToApproval,
} from '@/lib/permissions/pedido'
import type {
  AprovacaoPedido,
  CategoriaMaterial,
  Engenheiro,
  Fornecedor,
  MaterialCatalogo,
  Obra,
  PedidoCompra,
  PedidoCompraItem,
  Profile,
  WhatsappEnvio,
} from '@/types/database'

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()

  const { data: pedido, error } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!pedido) {
    notFound()
  }

  const [
    { data: obra },
    { data: solicitante },
    { data: engenheiro },
    { data: itens },
    { data: historico },
    { data: obras },
    { data: engenheiros },
    { data: categorias },
    { data: materiais },
    { data: fornecedores },
    { data: whatsappEnvios },
  ] = await Promise.all([
    supabase.from('obras').select('*').eq('id', pedido.obra_id).maybeSingle(),
    pedido.solicitante_id
      ? supabase.from('profiles').select('*').eq('id', pedido.solicitante_id).maybeSingle()
      : Promise.resolve({ data: null }),
    pedido.engenheiro_id
      ? supabase.from('engenheiros').select('*').eq('id', pedido.engenheiro_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('pedido_compra_itens')
      .select('*')
      .eq('pedido_compra_id', id)
      .order('created_at'),
    supabase
      .from('aprovacoes_pedido')
      .select('id, acao, comentario, created_at, user:profiles(nome)')
      .eq('pedido_compra_id', id)
      .order('created_at'),
    supabase.from('obras').select('*').order('nome'),
    supabase.from('engenheiros').select('*').eq('ativo', true).order('nome'),
    supabase.from('categorias_materiais').select('*').eq('ativo', true).order('nome'),
    supabase.from('materiais_catalogo').select('*').eq('ativo', true).order('nome_padronizado'),
    supabase.from('fornecedores').select('*').eq('status', 'ativo').order('nome_fantasia'),
    supabase
      .from('whatsapp_envios')
      .select(
        'id, telefone, status, error_message, enviado_em, created_at, fornecedor:fornecedores(nome_fantasia)'
      )
      .eq('pedido_compra_id', id)
      .order('created_at', { ascending: false }),
  ])

  const pedidoTyped = pedido as PedidoCompra
  const canEdit = canEditPedido(profile, pedidoTyped)
  const itensTyped = (itens as PedidoCompraItem[]) ?? []
  const itensComRevisao = itensTyped.filter((item) => item.precisa_revisao).length
  const fornecedoresTyped = (fornecedores as Fornecedor[]) ?? []
  const podeEnviarWhatsapp = canSendWhatsapp(profile?.role) && !!pedidoTyped.pdf_url
  const podeDecidirAprovacao = await canDecideApprovalAsync(supabase, profile, pedidoTyped)

  return (
    <div className="space-y-6">
      <PedidoHeaderCard
        pedido={pedidoTyped}
        obra={obra as Obra | null}
        solicitante={solicitante as Profile | null}
        engenheiro={engenheiro as Engenheiro | null}
        obras={(obras as Obra[]) ?? []}
        engenheiros={(engenheiros as Engenheiro[]) ?? []}
        canEdit={canEdit}
      />

      <PedidoActionsPanel
        pedidoId={id}
        canSendDirectToApproval={canSendDirectToApproval(profile, pedidoTyped)}
        canDecideApproval={podeDecidirAprovacao}
        canCancel={canCancelPedido(profile, pedidoTyped)}
        canPrepareWithIA={canPrepareWithIA(profile, pedidoTyped)}
        canGeneratePdf={canGeneratePdf(profile, pedidoTyped)}
        hasItens={itensTyped.length > 0}
        pdfUrl={pedidoTyped.pdf_url}
        itensComRevisao={itensComRevisao}
        fornecedores={fornecedoresTyped}
        fornecedorIdAtual={pedidoTyped.fornecedor_id}
      />

      {podeEnviarWhatsapp ? (
        <EnviarWhatsappDialog pedidoId={id} fornecedores={fornecedoresTyped} />
      ) : null}

      <PedidoItemsTable
        pedidoId={id}
        itens={itensTyped}
        categorias={(categorias as CategoriaMaterial[]) ?? []}
        materiais={(materiais as MaterialCatalogo[]) ?? []}
        canEdit={canEdit}
      />

      <AiPreparationPanel
        itens={itensTyped}
        preparadoEm={pedidoTyped.ia_preparado_em}
        canEdit={canEdit}
      />

      <PedidoHistory
        entries={
          (historico as unknown as Array<
            Pick<AprovacaoPedido, 'id' | 'acao' | 'comentario' | 'created_at'> & {
              user: { nome: string } | null
            }
          >) ?? []
        }
      />

      <WhatsappHistory
        entries={
          (whatsappEnvios as unknown as Array<
            Pick<WhatsappEnvio, 'id' | 'telefone' | 'status' | 'error_message' | 'enviado_em' | 'created_at'> & {
              fornecedor: { nome_fantasia: string } | null
            }
          >) ?? []
        }
      />
    </div>
  )
}
