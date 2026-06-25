import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { enrichMaterialWithAI } from '@/lib/ai/material-enrichment'
import { findOrCreateMaterialFromAI } from '@/lib/catalogo/find-or-create-material'
import { resolveMaterialImage } from '@/lib/ai/image-resolver'
import { registrarAprovacao, registrarLog } from '@/lib/logs/activity'
import type { OrderPreparationResult, PreparedOrderItem } from '@/types/ai'
import type { PedidoCompra, PedidoCompraItem } from '@/types/database'

export async function prepareOrderWithAI(
  pedidoId: string,
  preparadoPor: string | null
): Promise<OrderPreparationResult> {
  const supabase = createAdminSupabaseClient()

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', pedidoId)
    .single()

  if (pedidoError || !pedido) {
    throw new Error('Pedido não encontrado.')
  }

  const pedidoTyped = pedido as PedidoCompra

  if (pedidoTyped.status === 'aprovado' || pedidoTyped.status === 'cancelado') {
    throw new Error('Pedidos aprovados ou cancelados não podem ser preparados com IA.')
  }

  const { data: itens, error: itensError } = await supabase
    .from('pedido_compra_itens')
    .select('*')
    .eq('pedido_compra_id', pedidoId)

  if (itensError) {
    throw new Error(`Erro ao buscar itens: ${itensError.message}`)
  }

  if (!itens || itens.length === 0) {
    throw new Error('Não é possível preparar pedido sem itens.')
  }

  const preparedItems: PreparedOrderItem[] = []
  const alertasGerais: string[] = []

  for (const item of itens as PedidoCompraItem[]) {
    const enrichment = await enrichMaterialWithAI({
      nome_material: item.nome_material,
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      observacoes: item.observacoes,
    })

    const material = await findOrCreateMaterialFromAI(enrichment)
    const image = await resolveMaterialImage({ materialCatalogoId: material.id })

    const precisaRevisao =
      enrichment.confianca < 0.7 || enrichment.alertas.length > 0 || image.precisaRevisao

    const { error: updateItemError } = await supabase
      .from('pedido_compra_itens')
      .update({
        material_catalogo_id: material.id,
        nome_padronizado: enrichment.nome_padronizado,
        categoria_id: material.categoria_id,
        unidade: item.unidade || enrichment.unidade_sugerida,
        especificacao_tecnica: item.especificacao_tecnica || enrichment.especificacao_melhorada,
        observacoes: item.observacoes || enrichment.observacao_fornecedor,
        imagem_referencia_url: image.imageUrl,
        imagem_origem: image.origem,
        imagem_aprovada: image.aprovada,
        ia_resumo: enrichment.especificacao_melhorada,
        ia_termos_busca: enrichment.termos_busca_imagem,
        ia_alertas: enrichment.alertas,
        ia_confianca: enrichment.confianca,
        precisa_revisao: precisaRevisao,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    if (updateItemError) {
      throw new Error(`Erro ao atualizar item: ${updateItemError.message}`)
    }

    if (precisaRevisao) {
      alertasGerais.push(`Item "${item.nome_material}" precisa de revisão antes do envio.`)
    }

    preparedItems.push({
      item_id: item.id,
      nome_original: item.nome_material,
      nome_padronizado: enrichment.nome_padronizado,
      categoria_sugerida: enrichment.categoria_sugerida,
      unidade_sugerida: enrichment.unidade_sugerida,
      especificacao_melhorada: enrichment.especificacao_melhorada,
      observacao_fornecedor: enrichment.observacao_fornecedor,
      termos_busca_imagem: enrichment.termos_busca_imagem,
      alertas: enrichment.alertas,
      confianca: enrichment.confianca,
      material_catalogo_id: material.id,
      imagem_referencia_url: image.imageUrl,
      imagem_origem: image.origem,
      precisa_revisao: precisaRevisao,
    })
  }

  const preparadoEm = new Date().toISOString()

  await supabase
    .from('pedidos_compra')
    .update({ ia_preparado_em: preparadoEm, updated_at: preparadoEm })
    .eq('id', pedidoId)

  await registrarAprovacao(supabase, {
    pedidoCompraId: pedidoId,
    userId: preparadoPor,
    acao: 'ia_preparado',
    comentario:
      alertasGerais.length > 0
        ? `Preparado por IA com ${alertasGerais.length} item(ns) pendente(s) de revisão.`
        : 'Preparado por IA. Todos os itens ficaram com boa confiança.',
  })

  await registrarLog(supabase, {
    userId: preparadoPor,
    entityType: 'pedidos_compra',
    entityId: pedidoId,
    action: 'ia_preparado',
    metadata: {
      total_itens: itens.length,
      itens_precisam_revisao: preparedItems.filter((item) => item.precisa_revisao).length,
      alertas: alertasGerais,
    },
  })

  return {
    pedido_id: pedidoId,
    preparado_em: preparadoEm,
    itens: preparedItems,
    alertas_gerais: alertasGerais,
  }
}
