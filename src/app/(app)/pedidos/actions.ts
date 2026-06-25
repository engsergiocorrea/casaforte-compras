'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { registrarAprovacao, registrarLog } from '@/lib/logs/activity'
import {
  canCancelPedido,
  canCreatePedido,
  canDecideApprovalAsync,
  canEditPedido,
  canSendDirectToApproval,
  canSendToApproval,
  canSendToReview,
  canStartReview,
} from '@/lib/permissions/pedido'
import { devolverSchema, pedidoHeaderSchema, pedidoItemSchema } from '@/lib/validations/pedido'
import { generatePurchaseOrderDocument } from '@/lib/pdf/generate-purchase-order-document'
import { sendWhatsappDocument, sendWhatsappText } from '@/lib/whatsapp/evolution-client'
import type { ActionResult, FormActionState } from '@/lib/action-result'
import type { Engenheiro, Fornecedor, PedidoCompra, Profile } from '@/types/database'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

async function requireProfile() {
  const profile = await getCurrentUser()
  if (!profile) {
    throw new Error('Sessão inválida. Faça login novamente.')
  }
  return profile
}

async function fetchPedido(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  pedidoId: string
) {
  const { data, error } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', pedidoId)
    .single()

  if (error || !data) {
    throw new Error('Pedido não encontrado.')
  }

  return data as PedidoCompra
}

function parsePedidoHeaderForm(formData: FormData) {
  return pedidoHeaderSchema.safeParse({
    obra_id: formData.get('obra_id'),
    engenheiro_id: formData.get('engenheiro_id'),
    prioridade: formData.get('prioridade'),
    data_necessidade: formData.get('data_necessidade'),
    observacoes_gerais: formData.get('observacoes_gerais'),
  })
}

export async function createPedido(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!canCreatePedido(profile.role)) {
    return { success: false, error: 'Você não tem permissão para criar pedidos.' }
  }

  const parsed = parsePedidoHeaderForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { data: pedido, error } = await supabase
    .from('pedidos_compra')
    .insert({
      obra_id: data.obra_id,
      engenheiro_id: nullableField(data.engenheiro_id),
      solicitante_id: profile.id,
      prioridade: data.prioridade,
      data_necessidade: nullableField(data.data_necessidade),
      observacoes_gerais: nullableField(data.observacoes_gerais),
      status: 'rascunho',
    })
    .select('id')
    .single()

  if (error || !pedido) {
    return { success: false, error: error?.message ?? 'Erro ao criar pedido.' }
  }

  await registrarAprovacao(supabase, {
    pedidoCompraId: pedido.id,
    userId: profile.id,
    acao: 'criado',
  })
  await registrarLog(supabase, {
    userId: profile.id,
    entityType: 'pedidos_compra',
    entityId: pedido.id,
    action: 'criado',
  })

  revalidatePath('/pedidos')
  redirect(`/pedidos/${pedido.id}`)
}

export async function updatePedidoHeader(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')
  if (!id) return { success: false, error: 'Pedido inválido.' }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, id)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!canEditPedido(profile, pedido)) {
    return { success: false, error: 'Este pedido não pode ser editado no status atual.' }
  }

  const parsed = parsePedidoHeaderForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data

  const { error } = await supabase
    .from('pedidos_compra')
    .update({
      obra_id: data.obra_id,
      engenheiro_id: nullableField(data.engenheiro_id),
      prioridade: data.prioridade,
      data_necessidade: nullableField(data.data_necessidade),
      observacoes_gerais: nullableField(data.observacoes_gerais),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/pedidos/${id}`)
  return { success: true }
}

export async function addPedidoItem(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const pedidoId = String(formData.get('pedido_id') || '')
  if (!pedidoId) return { success: false, error: 'Pedido inválido.' }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!canEditPedido(profile, pedido)) {
    return { success: false, error: 'Não é possível adicionar itens a este pedido agora.' }
  }

  const parsed = pedidoItemSchema.safeParse({
    nome_material: formData.get('nome_material'),
    material_catalogo_id: formData.get('material_catalogo_id'),
    categoria_id: formData.get('categoria_id'),
    quantidade: formData.get('quantidade'),
    unidade: formData.get('unidade'),
    marca_preferencial: formData.get('marca_preferencial'),
    especificacao_tecnica: formData.get('especificacao_tecnica'),
    local_de_aplicacao: formData.get('local_de_aplicacao'),
    observacoes: formData.get('observacoes'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do item.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data

  const { error } = await supabase.from('pedido_compra_itens').insert({
    pedido_compra_id: pedidoId,
    material_catalogo_id: nullableField(data.material_catalogo_id),
    categoria_id: nullableField(data.categoria_id),
    nome_material: data.nome_material,
    quantidade: data.quantidade,
    unidade: nullableField(data.unidade),
    marca_preferencial: nullableField(data.marca_preferencial),
    especificacao_tecnica: nullableField(data.especificacao_tecnica),
    local_de_aplicacao: nullableField(data.local_de_aplicacao),
    observacoes: nullableField(data.observacoes),
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  return { success: true }
}

export async function updatePedidoItem(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const itemId = String(formData.get('item_id') || '')
  const pedidoId = String(formData.get('pedido_id') || '')
  if (!itemId || !pedidoId) return { success: false, error: 'Item inválido.' }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!canEditPedido(profile, pedido)) {
    return { success: false, error: 'Não é possível editar itens deste pedido agora.' }
  }

  const parsed = pedidoItemSchema.safeParse({
    nome_material: formData.get('nome_material'),
    material_catalogo_id: formData.get('material_catalogo_id'),
    categoria_id: formData.get('categoria_id'),
    quantidade: formData.get('quantidade'),
    unidade: formData.get('unidade'),
    marca_preferencial: formData.get('marca_preferencial'),
    especificacao_tecnica: formData.get('especificacao_tecnica'),
    local_de_aplicacao: formData.get('local_de_aplicacao'),
    observacoes: formData.get('observacoes'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do item.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data

  const { error } = await supabase
    .from('pedido_compra_itens')
    .update({
      material_catalogo_id: nullableField(data.material_catalogo_id),
      categoria_id: nullableField(data.categoria_id),
      nome_material: data.nome_material,
      quantidade: data.quantidade,
      unidade: nullableField(data.unidade),
      marca_preferencial: nullableField(data.marca_preferencial),
      especificacao_tecnica: nullableField(data.especificacao_tecnica),
      local_de_aplicacao: nullableField(data.local_de_aplicacao),
      observacoes: nullableField(data.observacoes),
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  return { success: true }
}

export async function deletePedidoItem(pedidoId: string, itemId: string): Promise<ActionResult> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!canEditPedido(profile, pedido)) {
    return { success: false, error: 'Não é possível remover itens deste pedido agora.' }
  }

  const { error } = await supabase.from('pedido_compra_itens').delete().eq('id', itemId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  return { success: true }
}

async function transitionPedido(
  pedidoId: string,
  novoStatus: PedidoCompra['status'],
  acao: Parameters<typeof registrarAprovacao>[1]['acao'],
  guard: (profile: Awaited<ReturnType<typeof requireProfile>>, pedido: PedidoCompra) => boolean,
  guardMessage: string,
  extraUpdate: Record<string, unknown> = {},
  comentario?: string
): Promise<ActionResult> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!guard(profile, pedido)) {
    return { success: false, error: guardMessage }
  }

  const { error } = await supabase
    .from('pedidos_compra')
    .update({ status: novoStatus, updated_at: new Date().toISOString(), ...extraUpdate })
    .eq('id', pedidoId)

  if (error) {
    return { success: false, error: error.message }
  }

  await registrarAprovacao(supabase, {
    pedidoCompraId: pedidoId,
    userId: profile.id,
    acao,
    comentario,
  })
  await registrarLog(supabase, {
    userId: profile.id,
    entityType: 'pedidos_compra',
    entityId: pedidoId,
    action: acao,
    metadata: { de: pedido.status, para: novoStatus },
  })

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
  return { success: true }
}

export async function enviarParaRevisao(pedidoId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { count } = await supabase
    .from('pedido_compra_itens')
    .select('id', { count: 'exact', head: true })
    .eq('pedido_compra_id', pedidoId)

  if (!count || count === 0) {
    return { success: false, error: 'Adicione ao menos um item antes de enviar para revisão.' }
  }

  return transitionPedido(
    pedidoId,
    'pendente_revisao',
    'enviado_revisao',
    canSendToReview,
    'Você não tem permissão para enviar este pedido para revisão.'
  )
}

export async function iniciarRevisao(pedidoId: string): Promise<ActionResult> {
  return transitionPedido(
    pedidoId,
    'em_revisao',
    'revisado',
    canStartReview,
    'Apenas a equipe de compras pode iniciar a revisão.'
  )
}

export async function enviarParaAprovacao(pedidoId: string): Promise<ActionResult> {
  return transitionPedido(
    pedidoId,
    'pendente_aprovacao',
    'enviado_aprovacao',
    canSendToApproval,
    'O pedido precisa estar em revisão para ser enviado à aprovação.'
  )
}

// Fluxo simplificado: envia direto de rascunho/devolvido para
// pendente_aprovacao ("Aguardando aprovação" na UI), sem passar por revisão.
export async function enviarDiretoParaAprovacao(
  pedidoId: string,
  fornecedorId?: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()
  const { count } = await supabase
    .from('pedido_compra_itens')
    .select('id', { count: 'exact', head: true })
    .eq('pedido_compra_id', pedidoId)

  if (!count || count === 0) {
    return { success: false, error: 'Adicione ao menos um item antes de enviar para aprovação.' }
  }

  return transitionPedido(
    pedidoId,
    'pendente_aprovacao',
    'enviado_aprovacao',
    canSendDirectToApproval,
    'Você não tem permissão para enviar este pedido para aprovação.',
    fornecedorId ? { fornecedor_id: fornecedorId } : {}
  )
}

function buscarTelefoneSolicitante(solicitante: Profile | null, engenheiro: Engenheiro | null) {
  if (solicitante?.telefone) return solicitante.telefone
  if (engenheiro?.telefone) return engenheiro.telefone
  return null
}

function montarLegendaFornecedor(pedido: PedidoCompra, nomeObra: string) {
  return [
    'Olá, tudo bem?',
    `Segue em anexo o Pedido de Compra #${pedido.numero} da Casa Forte Construtora.`,
    `Obra: ${nomeObra}`,
    'Por favor, informe valores, disponibilidade, prazo de entrega, forma de pagamento e validade da proposta.',
    'Obrigado.',
  ].join('\n\n')
}

function montarMensagemAprovacaoEngenheiro(
  pedido: PedidoCompra,
  nomeObra: string,
  nomeFornecedor: string
) {
  return [
    `Pedido de Compra #${pedido.numero} aprovado pela diretoria.`,
    `Obra: ${nomeObra}`,
    `O pedido foi enviado ao fornecedor: ${nomeFornecedor}.`,
  ].join('\n\n')
}

function montarMensagemDevolucaoEngenheiro(pedido: PedidoCompra, nomeObra: string, motivo: string) {
  return [
    `Pedido de Compra #${pedido.numero} devolvido pela diretoria.`,
    `Obra: ${nomeObra}`,
    `Motivo:\n${motivo}`,
    'Faça os ajustes necessários e envie novamente para aprovação.',
  ].join('\n\n')
}

async function enviarPedidoAoFornecedorInterno(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  pedido: PedidoCompra,
  fornecedor: Fornecedor,
  nomeObra: string
) {
  if (!fornecedor.telefone_whatsapp || fornecedor.telefone_whatsapp.trim().length < 8) {
    return { success: false as const, error: 'Fornecedor sem telefone de WhatsApp válido.' }
  }

  if (!pedido.pdf_url) {
    return { success: false as const, error: 'Pedido sem documento PDF gerado.' }
  }

  const legenda = montarLegendaFornecedor(pedido, nomeObra)
  const fileName = `pedido-compra-${pedido.numero}.pdf`

  const resultado = await sendWhatsappDocument({
    phone: fornecedor.telefone_whatsapp,
    mediaUrl: pedido.pdf_url,
    fileName,
    caption: legenda,
  })

  await supabase.from('whatsapp_envios').insert({
    pedido_compra_id: pedido.id,
    fornecedor_id: fornecedor.id,
    telefone: fornecedor.telefone_whatsapp,
    mensagem: legenda,
    status: resultado.success ? 'sent' : 'failed',
    whatsapp_message_id: resultado.success ? resultado.messageId : null,
    error_message: resultado.success ? null : resultado.error,
    enviado_em: resultado.success ? new Date().toISOString() : null,
  })

  return resultado.success
    ? { success: true as const }
    : { success: false as const, error: resultado.error }
}

export async function aprovarPedido(pedidoId: string, fornecedorId?: string): Promise<ActionResult> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const podeDecidir = await canDecideApprovalAsync(supabase, profile, pedido)
  if (!podeDecidir) {
    return { success: false, error: 'Você não tem permissão para aprovar este pedido.' }
  }

  const fornecedorAlvoId = fornecedorId ?? pedido.fornecedor_id
  if (!fornecedorAlvoId) {
    return { success: false, error: 'Selecione um fornecedor para enviar o pedido aprovado.' }
  }

  const { data: fornecedorData, error: fornecedorError } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', fornecedorAlvoId)
    .single()

  if (fornecedorError || !fornecedorData) {
    return { success: false, error: 'Fornecedor não encontrado.' }
  }
  const fornecedor = fornecedorData as Fornecedor

  if (!fornecedor.telefone_whatsapp || fornecedor.telefone_whatsapp.trim().length < 8) {
    return {
      success: false,
      error: 'O fornecedor selecionado não possui telefone de WhatsApp válido.',
    }
  }

  // 1. Transição de status + persistência do fornecedor escolhido.
  const transitionResult = await transitionPedido(
    pedidoId,
    'aprovado',
    'aprovado',
    () => true,
    'Você não tem permissão para aprovar este pedido.',
    {
      aprovado_por: profile.id,
      aprovado_em: new Date().toISOString(),
      fornecedor_id: fornecedorAlvoId,
    }
  )

  if (!transitionResult.success) {
    return transitionResult
  }

  // 2. Garante PDF gerado.
  let pedidoAtualizado: PedidoCompra
  try {
    pedidoAtualizado = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  if (!pedidoAtualizado.pdf_url) {
    try {
      const gerado = await generatePurchaseOrderDocument(pedidoId, profile.id)
      pedidoAtualizado = { ...pedidoAtualizado, pdf_url: gerado.url }
    } catch (error) {
      await registrarLog(supabase, {
        userId: profile.id,
        entityType: 'pedidos_compra',
        entityId: pedidoId,
        action: 'erro_envio_fornecedor',
        metadata: { motivo: 'falha_geracao_pdf', erro: (error as Error).message },
      })
      return { success: true }
    }
  }

  const { data: obraData } = await supabase
    .from('obras')
    .select('nome')
    .eq('id', pedidoAtualizado.obra_id)
    .maybeSingle()
  const nomeObra = obraData?.nome ?? 'Obra não identificada'

  // 3. Envia PDF ao fornecedor.
  const envioFornecedor = await enviarPedidoAoFornecedorInterno(
    supabase,
    pedidoAtualizado,
    fornecedor,
    nomeObra
  )

  if (envioFornecedor.success) {
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
      action: 'whatsapp_enviado_fornecedor',
      metadata: { fornecedor_id: fornecedor.id, telefone: fornecedor.telefone_whatsapp },
    })
  } else {
    await registrarLog(supabase, {
      userId: profile.id,
      entityType: 'pedidos_compra',
      entityId: pedidoId,
      action: 'erro_envio_fornecedor',
      metadata: { fornecedor_id: fornecedor.id, erro: envioFornecedor.error },
    })
  }

  // 4. Notifica engenheiro/solicitante (não falha a aprovação se der erro).
  const { data: solicitanteData } = pedidoAtualizado.solicitante_id
    ? await supabase
        .from('profiles')
        .select('*')
        .eq('id', pedidoAtualizado.solicitante_id)
        .maybeSingle()
    : { data: null }
  const { data: engenheiroData } = pedidoAtualizado.engenheiro_id
    ? await supabase
        .from('engenheiros')
        .select('*')
        .eq('id', pedidoAtualizado.engenheiro_id)
        .maybeSingle()
    : { data: null }

  const telefoneEngenheiro = buscarTelefoneSolicitante(
    solicitanteData as Profile | null,
    engenheiroData as Engenheiro | null
  )

  if (telefoneEngenheiro) {
    const mensagem = montarMensagemAprovacaoEngenheiro(
      pedidoAtualizado,
      nomeObra,
      fornecedor.nome_fantasia
    )
    const resultadoEngenheiro = await sendWhatsappText({ phone: telefoneEngenheiro, message: mensagem })

    if (resultadoEngenheiro.success) {
      await registrarLog(supabase, {
        userId: profile.id,
        entityType: 'pedidos_compra',
        entityId: pedidoId,
        action: 'whatsapp_enviado_engenheiro',
        metadata: { telefone: telefoneEngenheiro },
      })
    } else {
      await registrarLog(supabase, {
        userId: profile.id,
        entityType: 'pedidos_compra',
        entityId: pedidoId,
        action: 'erro_envio_engenheiro',
        metadata: { telefone: telefoneEngenheiro, erro: resultadoEngenheiro.error },
      })
    }
  } else {
    await registrarLog(supabase, {
      userId: profile.id,
      entityType: 'pedidos_compra',
      entityId: pedidoId,
      action: 'erro_notificacao_engenheiro',
      metadata: { motivo: 'telefone_nao_encontrado' },
    })
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  return { success: true }
}

export async function devolverPedido(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const pedidoId = String(formData.get('pedido_id') || '')
  if (!pedidoId) return { success: false, error: 'Pedido inválido.' }

  const parsed = devolverSchema.safeParse({ comentario: formData.get('comentario') })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Informe o motivo da devolução.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()
  let pedido: PedidoCompra
  try {
    pedido = await fetchPedido(supabase, pedidoId)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const podeDecidir = await canDecideApprovalAsync(supabase, profile, pedido)
  if (!podeDecidir) {
    return { success: false, error: 'Você não tem permissão para devolver este pedido.' }
  }

  const result = await transitionPedido(
    pedidoId,
    'devolvido',
    'devolvido',
    () => true,
    'Você não tem permissão para devolver este pedido.',
    {},
    parsed.data.comentario
  )

  if (!result.success) {
    return result
  }

  const { data: obraData } = await supabase
    .from('obras')
    .select('nome')
    .eq('id', pedido.obra_id)
    .maybeSingle()
  const nomeObra = obraData?.nome ?? 'Obra não identificada'

  const { data: solicitanteData } = pedido.solicitante_id
    ? await supabase.from('profiles').select('*').eq('id', pedido.solicitante_id).maybeSingle()
    : { data: null }
  const { data: engenheiroData } = pedido.engenheiro_id
    ? await supabase.from('engenheiros').select('*').eq('id', pedido.engenheiro_id).maybeSingle()
    : { data: null }

  const telefoneEngenheiro = buscarTelefoneSolicitante(
    solicitanteData as Profile | null,
    engenheiroData as Engenheiro | null
  )

  if (telefoneEngenheiro) {
    const mensagem = montarMensagemDevolucaoEngenheiro(pedido, nomeObra, parsed.data.comentario)
    const resultadoEngenheiro = await sendWhatsappText({ phone: telefoneEngenheiro, message: mensagem })

    if (resultadoEngenheiro.success) {
      await registrarLog(supabase, {
        userId: profile.id,
        entityType: 'pedidos_compra',
        entityId: pedidoId,
        action: 'whatsapp_enviado_engenheiro',
        metadata: { telefone: telefoneEngenheiro, motivo: 'devolucao' },
      })
    } else {
      await registrarLog(supabase, {
        userId: profile.id,
        entityType: 'pedidos_compra',
        entityId: pedidoId,
        action: 'erro_envio_engenheiro',
        metadata: { telefone: telefoneEngenheiro, erro: resultadoEngenheiro.error },
      })
    }
  } else {
    await registrarLog(supabase, {
      userId: profile.id,
      entityType: 'pedidos_compra',
      entityId: pedidoId,
      action: 'erro_notificacao_engenheiro',
      metadata: { motivo: 'telefone_nao_encontrado' },
    })
  }

  return result
}

export async function cancelarPedido(pedidoId: string): Promise<ActionResult> {
  return transitionPedido(
    pedidoId,
    'cancelado',
    'cancelado',
    canCancelPedido,
    'Você não tem permissão para cancelar este pedido.'
  )
}
