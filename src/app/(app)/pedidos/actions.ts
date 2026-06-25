'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { registrarAprovacao, registrarLog } from '@/lib/logs/activity'
import {
  canCancelPedido,
  canCreatePedido,
  canDecideApproval,
  canEditPedido,
  canSendToApproval,
  canSendToReview,
  canStartReview,
} from '@/lib/permissions/pedido'
import { devolverSchema, pedidoHeaderSchema, pedidoItemSchema } from '@/lib/validations/pedido'
import { uploadMaterialImage } from '@/lib/catalogo/upload-material-image'
import type { ActionResult, FormActionState } from '@/lib/action-result'
import type { PedidoCompra } from '@/types/database'

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

export async function uploadItemImage(
  pedidoId: string,
  itemId: string,
  formData: FormData
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

  if (!canEditPedido(profile, pedido)) {
    return { success: false, error: 'Não é possível alterar imagens deste pedido agora.' }
  }

  const { data: item, error: itemError } = await supabase
    .from('pedido_compra_itens')
    .select('*')
    .eq('id', itemId)
    .eq('pedido_compra_id', pedidoId)
    .single()

  if (itemError || !item) {
    return { success: false, error: 'Item não encontrado.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Selecione um arquivo de imagem.' }
  }

  const aprovado = formData.get('aprovado') === 'on'

  let materialImage
  try {
    materialImage = await uploadMaterialImage({
      file,
      materialCatalogoId: item.material_catalogo_id,
      categoriaId: item.categoria_id,
      nomeMaterial: item.nome_padronizado || item.nome_material,
      aprovado,
      createdBy: profile.id,
    })
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const { error: updateError } = await supabase
    .from('pedido_compra_itens')
    .update({
      imagem_referencia_url: materialImage.image_url,
      imagem_origem: 'upload_manual',
      imagem_aprovada: aprovado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (updateError) {
    return { success: false, error: updateError.message }
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

export async function aprovarPedido(pedidoId: string): Promise<ActionResult> {
  let profile
  try {
    profile = await requireProfile()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  return transitionPedido(
    pedidoId,
    'aprovado',
    'aprovado',
    canDecideApproval,
    'Você não tem permissão para aprovar este pedido.',
    { aprovado_por: profile.id, aprovado_em: new Date().toISOString() }
  )
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

  const result = await transitionPedido(
    pedidoId,
    'devolvido',
    'devolvido',
    canDecideApproval,
    'Você não tem permissão para devolver este pedido.',
    {},
    parsed.data.comentario
  )

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
