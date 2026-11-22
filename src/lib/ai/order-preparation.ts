import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { enrichMaterialWithAI } from '@/lib/ai/material-enrichment'
import { findOrCreateMaterialFromAI } from '@/lib/catalogo/find-or-create-material'
import { resolveMaterialImage } from '@/lib/ai/image-resolver'
import { after } from 'next/server'
import { emLotes, geminiKey } from '@/lib/ai/gemini-client'
import { findApprovedMaterialImage } from '@/lib/catalogo/find-material-image'
import { revisarPedido } from '@/lib/ai/order-review'
import { registrarAprovacao, registrarLog } from '@/lib/logs/activity'
import type { OrderPreparationResult, PreparedOrderItem } from '@/types/ai'
import type { MaterialCatalogo, PedidoCompra, PedidoCompraItem } from '@/types/database'

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
  const itensTyped = itens as PedidoCompraItem[]

  // Catálogo atual: a IA reaproveita o material em vez de criar duplicado.
  const { data: catalogoRows } = await supabase
    .from('materiais_catalogo')
    .select('id, nome_padronizado, unidade_padrao')
    .eq('ativo', true)
    .order('nome_padronizado')
    .limit(400)
  const catalogo = (catalogoRows ?? []).map((c) => ({
    id: c.id as string,
    nome: c.nome_padronizado as string,
    unidade: (c.unidade_padrao as string | null) ?? null,
  }))

  // 1) Padroniza todos os itens em paralelo (até 4 por vez).
  const enrichments = await emLotes(itensTyped, 4, (item) =>
    enrichMaterialWithAI({
      nome_material: item.nome_material,
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      observacoes: item.observacoes,
      catalogo,
    })
  )

  // 2) Liga cada item ao catálogo — em sequência, para dois itens iguais
  //    não criarem o mesmo material duas vezes.
  const materiais: MaterialCatalogo[] = []
  for (const enrichment of enrichments) {
    materiais.push(await findOrCreateMaterialFromAI(enrichment))
  }

  // 3) Imagem: reusa a do catálogo na hora. As que faltam a IA gera DEPOIS
  //    de responder (after), para a preparação levar segundos e não minutos;
  //    cada item recebe a imagem assim que ela fica pronta.
  const unicos = [...new Map(materiais.map((m, i) => [m.id, i])).entries()]
  const imagens = new Map<string, { imageUrl: string | null; origem: string | null; aprovada: boolean; precisaRevisao: boolean }>()
  const gerarDepois: { materialId: string; i: number }[] = []
  await Promise.all(
    unicos.map(async ([materialId, i]) => {
      const existente = await findApprovedMaterialImage(materialId)
      if (existente) {
        imagens.set(materialId, { imageUrl: existente.image_url, origem: 'catalogo_interno', aprovada: true, precisaRevisao: false })
      } else {
        imagens.set(materialId, { imageUrl: null, origem: null, aprovada: false, precisaRevisao: !geminiKey() })
        if (geminiKey()) gerarDepois.push({ materialId, i })
      }
    })
  )

  if (gerarDepois.length > 0) {
    after(async () => {
      const admin = createAdminSupabaseClient()
      await emLotes(gerarDepois, 3, async ({ materialId, i }) => {
        const r = await resolveMaterialImage({
          materialCatalogoId: materialId,
          categoriaId: materiais[i].categoria_id,
          nomeMaterial: materiais[i].nome_padronizado || enrichments[i].nome_padronizado,
          especificacao: enrichments[i].especificacao_melhorada,
          termosBusca: enrichments[i].termos_busca_imagem,
        })
        if (r.imageUrl) {
          await admin
            .from('pedido_compra_itens')
            .update({ imagem_referencia_url: r.imageUrl, imagem_origem: r.origem, imagem_aprovada: r.aprovada, updated_at: new Date().toISOString() })
            .eq('pedido_compra_id', pedidoId)
            .eq('material_catalogo_id', materialId)
        }
      })
    })
  }

  for (let i = 0; i < itensTyped.length; i++) {
    const item = itensTyped[i]
    const enrichment = enrichments[i]
    const material = materiais[i]
    const image = imagens.get(material.id)!

    const precisaRevisao =
      enrichment.confianca < 0.7 || enrichment.alertas.length > 0 || image.precisaRevisao

    const { error: updateItemError } = await supabase
      .from('pedido_compra_itens')
      .update({
        material_catalogo_id: material.id,
        nome_padronizado: material.nome_padronizado || enrichment.nome_padronizado,
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
      nome_padronizado: material.nome_padronizado || enrichment.nome_padronizado,
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

  // 4) Revisão do pedido inteiro (duplicados, quantidades estranhas).
  const alertasPedido = await revisarPedido(
    preparedItems.map((p, i) => ({
      nome: p.nome_padronizado,
      quantidade: Number(itensTyped[i].quantidade),
      unidade: itensTyped[i].unidade || p.unidade_sugerida,
      materialId: p.material_catalogo_id ?? null,
    }))
  )
  alertasGerais.unshift(...alertasPedido)

  const preparadoEm = new Date().toISOString()

  await supabase
    .from('pedidos_compra')
    .update({ ia_preparado_em: preparadoEm, updated_at: preparadoEm })
    .eq('id', pedidoId)

  await registrarAprovacao(supabase, {
    pedidoCompraId: pedidoId,
    userId: preparadoPor,
    acao: 'ia_preparado',
    comentario: [
      preparedItems.some((p) => p.precisa_revisao)
        ? `Preparado por IA com ${preparedItems.filter((p) => p.precisa_revisao).length} item(ns) para revisar.`
        : 'Preparado por IA. Todos os itens ficaram com boa confiança.',
      ...alertasPedido.map((a) => `Atenção: ${a}`),
    ].join('\n'),
  })

  await registrarLog(supabase, {
    userId: preparadoPor,
    entityType: 'pedidos_compra',
    entityId: pedidoId,
    action: 'ia_preparado',
    metadata: {
      total_itens: itens.length,
      alertas_pedido: alertasPedido,
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
