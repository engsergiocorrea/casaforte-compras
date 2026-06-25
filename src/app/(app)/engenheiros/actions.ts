'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import { engenheiroSchema } from '@/lib/validations/engenheiro'
import type { ActionResult, FormActionState } from '@/lib/action-result'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

async function assertCanManageEngenheiros() {
  const profile = await getCurrentUser()

  if (!profile || !canManageMasterData(profile.role)) {
    throw new Error('Você não tem permissão para gerenciar engenheiros.')
  }

  return profile
}

function parseEngenheiroForm(formData: FormData) {
  return engenheiroSchema.safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    telefone: formData.get('telefone'),
    cargo: formData.get('cargo'),
    registro_profissional: formData.get('registro_profissional'),
    ativo: formData.get('ativo'),
  })
}

export async function createEngenheiro(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageEngenheiros()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const parsed = parseEngenheiroForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { error } = await supabase.from('engenheiros').insert({
    nome: data.nome,
    email: nullableField(data.email),
    telefone: nullableField(data.telefone),
    cargo: nullableField(data.cargo),
    registro_profissional: nullableField(data.registro_profissional),
    ativo: data.ativo,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/engenheiros')
  return { success: true }
}

export async function updateEngenheiro(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageEngenheiros()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')

  if (!id) {
    return { success: false, error: 'Engenheiro inválido.' }
  }

  const parsed = parseEngenheiroForm(formData)

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
    .from('engenheiros')
    .update({
      nome: data.nome,
      email: nullableField(data.email),
      telefone: nullableField(data.telefone),
      cargo: nullableField(data.cargo),
      registro_profissional: nullableField(data.registro_profissional),
      ativo: data.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/engenheiros')
  return { success: true }
}

export async function setEngenheiroAtivo(id: string, ativo: boolean): Promise<ActionResult> {
  try {
    await assertCanManageEngenheiros()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('engenheiros')
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/engenheiros')
  return { success: true }
}
