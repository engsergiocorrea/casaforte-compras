import { notFound } from 'next/navigation'
import { PedidoHeaderCard } from '@/components/pedidos/pedido-header-card'
import { PedidoItemsTable } from '@/components/pedidos/pedido-items-table'
import { PedidoActionsPanel } from '@/components/pedidos/pedido-actions-panel'
import { AiPreparationPanel } from '@/components/pedidos/ai-preparation-panel'
import { PedidoHistory } from '@/components/pedidos/pedido-history'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import {
  canDecideApproval,
  canEditPedido,
  canCancelPedido,
  canGeneratePdf,
  canPrepareWithIA,
  canSendToApproval,
  canSendToReview,
  canStartReview,
} from '@/lib/permissions/pedido'
import type {
  AprovacaoPedido,
  CategoriaMaterial,
  Engenheiro,
  MaterialCatalogo,
  Obra,
  PedidoCompra,
  PedidoCompraItem,
  Profile,
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
  ])

  const pedidoTyped = pedido as PedidoCompra
  const canEdit = canEditPedido(profile, pedidoTyped)
  const itensTyped = (itens as PedidoCompraItem[]) ?? []
  const itensComRevisao = itensTyped.filter((item) => item.precisa_revisao).length

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
        canSendToReview={canSendToReview(profile, pedidoTyped)}
        canStartReview={canStartReview(profile, pedidoTyped)}
        canSendToApproval={canSendToApproval(profile, pedidoTyped)}
        canDecideApproval={canDecideApproval(profile, pedidoTyped)}
        canCancel={canCancelPedido(profile, pedidoTyped)}
        canPrepareWithIA={canPrepareWithIA(profile, pedidoTyped)}
        canGeneratePdf={canGeneratePdf(profile, pedidoTyped)}
        hasItens={itensTyped.length > 0}
        pdfUrl={pedidoTyped.pdf_url}
        itensComRevisao={itensComRevisao}
      />

      <PedidoItemsTable
        pedidoId={id}
        itens={itensTyped}
        categorias={(categorias as CategoriaMaterial[]) ?? []}
        materiais={(materiais as MaterialCatalogo[]) ?? []}
        canEdit={canEdit}
      />

      <AiPreparationPanel
        pedidoId={id}
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
    </div>
  )
}
