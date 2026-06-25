'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canSendWhatsapp } from '@/lib/permissions/can'
import { registrarAprovacao, registrarLog } from '@/lib/logs/activity'
import { sendWhatsappText } from '@/lib/whatsapp/evolution-client'
import type { ActionResult } from '@/lib/action-result'
import type { Fornecedor, PedidoCompra } from '@/types/database'

async function requireProfile() {
  const profile = await getCurrentUser()
  if (!profile) {
    throw new Error('Sessão inválida. Faça login novamente.')
  }
  return profile
}

function montarMensagem(pedido: PedidoCompra, fornecedor: Fornecedor) {
  const linhas = [
    `Olá, ${fornecedor.nome_fantasia}!`,
    `Segue o pedido de compra #${pedido.numero} da Casa Forte Construtora.`,
  ]

  if (pedido.pdf_url) {
    linhas.push(`Documento: ${pedido.pdf_url}`)
  }

  linhas.push('Por favor, confirme o recebimento e nos retorne com valores e prazo de entrega.')

  return linhas.join('\n\n')
}

export async function enviarPedidoPorWhatsapp(
  pedidoId: string,
  fornecedorId: string
): Promise<ActionResult> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!canSendWhatsapp(profile.role)) {
    return { success: false, error: 'Você não tem permissão para enviar pedidos por WhatsApp.' }
  }

  const supabase = await createServerSupabaseClient()

  const { data: pedidoData, error: pedidoError } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', pedidoId)
    .single()

  if (pedidoError || !pedidoData) {
    return { success: false, error: 'Pedido não encontrado.' }
  }

  const pedido = pedidoData as PedidoCompra

  if (!pedido.pdf_url) {
    return {
      success: false,
      error: 'Gere o PDF do pedido antes de enviar por WhatsApp.',
    }
  }

  const { data: fornecedorData, error: fornecedorError } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', fornecedorId)
    .single()

  if (fornecedorError || !fornecedorData) {
    return { success: false, error: 'Fornecedor não encontrado.' }
  }

  const fornecedor = fornecedorData as Fornecedor

  if (!fornecedor.telefone_whatsapp || fornecedor.telefone_whatsapp.trim().length < 8) {
    return {
      success: false,
      error: 'Este fornecedor não possui um telefone de WhatsApp válido cadastrado.',
    }
  }

  const mensagem = montarMensagem(pedido, fornecedor)

  const resultado = await sendWhatsappText({
    phone: fornecedor.telefone_whatsapp,
    message: mensagem,
  })

  const { error: insertError } = await supabase.from('whatsapp_envios').insert({
    pedido_compra_id: pedidoId,
    fornecedor_id: fornecedorId,
    telefone: fornecedor.telefone_whatsapp,
    mensagem,
    status: resultado.success ? 'sent' : 'failed',
    whatsapp_message_id: resultado.success ? resultado.messageId : null,
    error_message: resultado.success ? null : resultado.error,
    enviado_em: resultado.success ? new Date().toISOString() : null,
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  if (!resultado.success) {
    revalidatePath(`/pedidos/${pedidoId}`)
    return { success: false, error: resultado.error }
  }

  await registrarAprovacao(supabase, {
    pedidoCompraId: pedidoId,
    userId: profile.id,
    acao: 'enviado_whatsapp',
    comentario: `Enviado para ${fornecedor.nome_fantasia} (${fornecedor.telefone_whatsapp}).`,
  })
  await registrarLog(supabase, {
    userId: profile.id,
    entityType: 'pedidos_compra',
    entityId: pedidoId,
    action: 'enviado_whatsapp',
    metadata: { fornecedor_id: fornecedorId, telefone: fornecedor.telefone_whatsapp },
  })

  revalidatePath(`/pedidos/${pedidoId}`)
  return { success: true }
}
