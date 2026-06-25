'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageCatalog } from '@/lib/permissions/can'
import { normalizeText } from '@/lib/utils/normalize-text'
import { materialCatalogoSchema } from '@/lib/validations/material-catalogo'
import type { ActionResult, FormActionState } from '@/lib/action-result'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

function parseMarcasAceitas(value: string | undefined) {
  if (!value) return null
  const marcas = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return marcas.length > 0 ? marcas : null
}

async function assertCanManageCatalogo() {
  const profile = await getCurrentUser()

  if (!profile || !canManageCatalog(profile.role)) {
    throw new Error('Você não tem permissão para gerenciar o catálogo de materiais.')
  }

  return profile
}

function parseMaterialForm(formData: FormData) {
  return materialCatalogoSchema.safeParse({
    nome_padronizado: formData.get('nome_padronizado'),
    categoria_id: formData.get('categoria_id'),
    unidade_padrao: formData.get('unidade_padrao'),
    descricao_padrao: formData.get('descricao_padrao'),
    especificacao_padrao: formData.get('especificacao_padrao'),
    marcas_aceitas: formData.get('marcas_aceitas'),
    observacoes: formData.get('observacoes'),
    ativo: formData.get('ativo'),
    aprovado: formData.get('aprovado'),
  })
}

export async function createMaterialCatalogo(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageCatalogo()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const parsed = parseMaterialForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { error } = await supabase.from('materiais_catalogo').insert({
    nome_padronizado: data.nome_padronizado,
    nome_normalizado: normalizeText(data.nome_padronizado),
    categoria_id: nullableField(data.categoria_id),
    unidade_padrao: nullableField(data.unidade_padrao),
    descricao_padrao: nullableField(data.descricao_padrao),
    especificacao_padrao: nullableField(data.especificacao_padrao),
    marcas_aceitas: parseMarcasAceitas(data.marcas_aceitas),
    observacoes: nullableField(data.observacoes),
    ativo: data.ativo,
    aprovado: data.aprovado,
    criado_por_ia: false,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/catalogo')
  return { success: true }
}

export async function updateMaterialCatalogo(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageCatalogo()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')

  if (!id) {
    return { success: false, error: 'Material inválido.' }
  }

  const parsed = parseMaterialForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { error } = await supabase
    .from('materiais_catalogo')
    .update({
      nome_padronizado: data.nome_padronizado,
      nome_normalizado: normalizeText(data.nome_padronizado),
      categoria_id: nullableField(data.categoria_id),
      unidade_padrao: nullableField(data.unidade_padrao),
      descricao_padrao: nullableField(data.descricao_padrao),
      especificacao_padrao: nullableField(data.especificacao_padrao),
      marcas_aceitas: parseMarcasAceitas(data.marcas_aceitas),
      observacoes: nullableField(data.observacoes),
      ativo: data.ativo,
      aprovado: data.aprovado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/catalogo')
  return { success: true }
}

export async function setMaterialCatalogoAtivo(id: string, ativo: boolean): Promise<ActionResult> {
  try {
    await assertCanManageCatalogo()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('materiais_catalogo')
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/catalogo')
  return { success: true }
}
