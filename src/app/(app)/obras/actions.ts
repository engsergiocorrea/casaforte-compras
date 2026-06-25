'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import { obraSchema, obraStatusValues } from '@/lib/validations/obra'
import type { ActionResult, FormActionState } from '@/lib/action-result'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

async function assertCanManageObras() {
  const profile = await getCurrentUser()

  if (!profile || !canManageMasterData(profile.role)) {
    throw new Error('Você não tem permissão para gerenciar obras.')
  }

  return profile
}

export async function createObra(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageObras()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const parsed = obraSchema.safeParse({
    nome: formData.get('nome'),
    endereco: formData.get('endereco'),
    cidade: formData.get('cidade'),
    estado: formData.get('estado'),
    status: formData.get('status'),
    responsavel_tecnico: formData.get('responsavel_tecnico'),
    data_inicio: formData.get('data_inicio'),
    previsao_termino: formData.get('previsao_termino'),
    observacoes: formData.get('observacoes'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { error } = await supabase.from('obras').insert({
    nome: data.nome,
    endereco: nullableField(data.endereco),
    cidade: nullableField(data.cidade),
    estado: nullableField(data.estado),
    status: data.status,
    responsavel_tecnico: nullableField(data.responsavel_tecnico),
    data_inicio: nullableField(data.data_inicio),
    previsao_termino: nullableField(data.previsao_termino),
    observacoes: nullableField(data.observacoes),
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/obras')
  return { success: true }
}

export async function updateObra(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageObras()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')

  if (!id) {
    return { success: false, error: 'Obra inválida.' }
  }

  const parsed = obraSchema.safeParse({
    nome: formData.get('nome'),
    endereco: formData.get('endereco'),
    cidade: formData.get('cidade'),
    estado: formData.get('estado'),
    status: formData.get('status'),
    responsavel_tecnico: formData.get('responsavel_tecnico'),
    data_inicio: formData.get('data_inicio'),
    previsao_termino: formData.get('previsao_termino'),
    observacoes: formData.get('observacoes'),
  })

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
    .from('obras')
    .update({
      nome: data.nome,
      endereco: nullableField(data.endereco),
      cidade: nullableField(data.cidade),
      estado: nullableField(data.estado),
      status: data.status,
      responsavel_tecnico: nullableField(data.responsavel_tecnico),
      data_inicio: nullableField(data.data_inicio),
      previsao_termino: nullableField(data.previsao_termino),
      observacoes: nullableField(data.observacoes),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/obras')
  return { success: true }
}

export async function setObraStatus(
  id: string,
  status: (typeof obraStatusValues)[number]
): Promise<ActionResult> {
  try {
    await assertCanManageObras()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('obras')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/obras')
  return { success: true }
}
