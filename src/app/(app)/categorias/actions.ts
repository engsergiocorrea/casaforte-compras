'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import { categoriaSchema } from '@/lib/validations/categoria'
import type { ActionResult, FormActionState } from '@/lib/action-result'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

async function assertCanManageCategorias() {
  const profile = await getCurrentUser()

  if (!profile || !canManageMasterData(profile.role)) {
    throw new Error('Você não tem permissão para gerenciar categorias.')
  }

  return profile
}

function parseCategoriaForm(formData: FormData) {
  return categoriaSchema.safeParse({
    nome: formData.get('nome'),
    descricao: formData.get('descricao'),
    ativo: formData.get('ativo'),
  })
}

export async function createCategoria(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageCategorias()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const parsed = parseCategoriaForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { error } = await supabase.from('categorias_materiais').insert({
    nome: data.nome,
    descricao: nullableField(data.descricao),
    ativo: data.ativo,
  })

  if (error) {
    return {
      success: false,
      error: error.code === '23505' ? 'Já existe uma categoria com esse nome.' : error.message,
    }
  }

  revalidatePath('/categorias')
  return { success: true }
}

export async function updateCategoria(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageCategorias()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')

  if (!id) {
    return { success: false, error: 'Categoria inválida.' }
  }

  const parsed = parseCategoriaForm(formData)

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
    .from('categorias_materiais')
    .update({
      nome: data.nome,
      descricao: nullableField(data.descricao),
      ativo: data.ativo,
    })
    .eq('id', id)

  if (error) {
    return {
      success: false,
      error: error.code === '23505' ? 'Já existe uma categoria com esse nome.' : error.message,
    }
  }

  revalidatePath('/categorias')
  return { success: true }
}

export async function setCategoriaAtivo(id: string, ativo: boolean): Promise<ActionResult> {
  try {
    await assertCanManageCategorias()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('categorias_materiais').update({ ativo }).eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/categorias')
  return { success: true }
}
