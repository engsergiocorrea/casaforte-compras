import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { prepareOrderWithAI } from '@/lib/ai/order-preparation'
import { generatePurchaseOrderHtml } from '@/lib/pdf/purchase-order-html'
import { registrarAprovacao, registrarLog } from '@/lib/logs/activity'
import type {
  Engenheiro,
  Obra,
  PedidoCompra,
  PedidoCompraItem,
  Profile,
} from '@/types/database'

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7

export async function generatePurchaseOrderDocument(pedidoId: string, geradoPor: string | null) {
  const supabase = createAdminSupabaseClient()

  const { data: pedidoData, error: pedidoError } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', pedidoId)
    .single()

  if (pedidoError || !pedidoData) {
    throw new Error('Pedido não encontrado.')
  }

  const pedido = pedidoData as PedidoCompra

  if (pedido.status === 'cancelado') {
    throw new Error('Pedidos cancelados não podem gerar documento.')
  }

  const { count, error: countError } = await supabase
    .from('pedido_compra_itens')
    .select('id', { count: 'exact', head: true })
    .eq('pedido_compra_id', pedidoId)

  if (countError) {
    throw new Error(`Erro ao verificar itens do pedido: ${countError.message}`)
  }

  if (!count || count === 0) {
    throw new Error('Não é possível gerar o documento de um pedido sem itens.')
  }

  if (!pedido.ia_preparado_em) {
    await prepareOrderWithAI(pedidoId, geradoPor)
  }

  const [
    { data: pedidoAtualizado },
    { data: obra },
    { data: solicitante },
    { data: engenheiro },
    { data: itens },
  ] = await Promise.all([
    supabase.from('pedidos_compra').select('*').eq('id', pedidoId).single(),
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
      .eq('pedido_compra_id', pedidoId)
      .order('created_at'),
  ])

  const pedidoFinal = (pedidoAtualizado as PedidoCompra) ?? pedido

  const html = generatePurchaseOrderHtml({
    pedido: pedidoFinal,
    obra: obra as Obra | null,
    solicitante: solicitante as Profile | null,
    engenheiro: engenheiro as Engenheiro | null,
    itens: (itens as PedidoCompraItem[]) ?? [],
  })

  const path = `pedidos/${pedidoId}/pedido-${pedidoFinal.numero}.html`

  const { error: uploadError } = await supabase.storage
    .from('purchase-orders')
    .upload(path, html, {
      contentType: 'text/html; charset=utf-8',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Erro ao salvar documento no Storage: ${uploadError.message}`)
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from('purchase-orders')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (signedError || !signed) {
    throw new Error(`Erro ao gerar link do documento: ${signedError?.message}`)
  }

  const pdfUrl = signed.signedUrl

  const { error: updateError } = await supabase
    .from('pedidos_compra')
    .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
    .eq('id', pedidoId)

  if (updateError) {
    throw new Error(`Erro ao atualizar pdf_url do pedido: ${updateError.message}`)
  }

  await registrarAprovacao(supabase, {
    pedidoCompraId: pedidoId,
    userId: geradoPor,
    acao: 'pdf_gerado',
    comentario: 'Documento do pedido gerado e salvo no Storage.',
  })

  await registrarLog(supabase, {
    userId: geradoPor,
    entityType: 'pedidos_compra',
    entityId: pedidoId,
    action: 'pdf_gerado',
    metadata: { path, url: pdfUrl },
  })

  return { url: pdfUrl, path }
}
