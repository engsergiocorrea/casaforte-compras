'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import { fornecedorSchema, fornecedorStatusValues } from '@/lib/validations/fornecedor'
import type { ActionResult, FormActionState } from '@/lib/action-result'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

function parseCategoriasAtendidas(value: string | undefined) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

async function assertCanManageFornecedores() {
  const profile = await getCurrentUser()

  if (!profile || !canManageMasterData(profile.role)) {
    throw new Error('Você não tem permissão para gerenciar fornecedores.')
  }

  return profile
}

function parseFornecedorForm(formData: FormData) {
  return fornecedorSchema.safeParse({
    nome_fantasia: formData.get('nome_fantasia'),
    razao_social: formData.get('razao_social'),
    cnpj: formData.get('cnpj'),
    categoria_principal: formData.get('categoria_principal'),
    categorias_atendidas: formData.get('categorias_atendidas'),
    contato_principal: formData.get('contato_principal'),
    telefone_whatsapp: formData.get('telefone_whatsapp'),
    email: formData.get('email'),
    cidade: formData.get('cidade'),
    estado: formData.get('estado'),
    endereco: formData.get('endereco'),
    observacoes: formData.get('observacoes'),
    fornecedor_principal: formData.get('fornecedor_principal'),
    status: formData.get('status'),
  })
}

export async function createFornecedor(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageFornecedores()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const parsed = parseFornecedorForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const data = parsed.data

  const { error } = await supabase.from('fornecedores').insert({
    nome_fantasia: data.nome_fantasia,
    razao_social: nullableField(data.razao_social),
    cnpj: nullableField(data.cnpj),
    categoria_principal: nullableField(data.categoria_principal),
    categorias_atendidas: parseCategoriasAtendidas(data.categorias_atendidas),
    contato_principal: nullableField(data.contato_principal),
    telefone_whatsapp: data.telefone_whatsapp,
    email: nullableField(data.email),
    cidade: nullableField(data.cidade),
    estado: nullableField(data.estado),
    endereco: nullableField(data.endereco),
    observacoes: nullableField(data.observacoes),
    fornecedor_principal: data.fornecedor_principal,
    status: data.status,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/fornecedores')
  return { success: true }
}

export async function updateFornecedor(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    await assertCanManageFornecedores()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')

  if (!id) {
    return { success: false, error: 'Fornecedor inválido.' }
  }

  const parsed = parseFornecedorForm(formData)

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
    .from('fornecedores')
    .update({
      nome_fantasia: data.nome_fantasia,
      razao_social: nullableField(data.razao_social),
      cnpj: nullableField(data.cnpj),
      categoria_principal: nullableField(data.categoria_principal),
      categorias_atendidas: parseCategoriasAtendidas(data.categorias_atendidas),
      contato_principal: nullableField(data.contato_principal),
      telefone_whatsapp: data.telefone_whatsapp,
      email: nullableField(data.email),
      cidade: nullableField(data.cidade),
      estado: nullableField(data.estado),
      endereco: nullableField(data.endereco),
      observacoes: nullableField(data.observacoes),
      fornecedor_principal: data.fornecedor_principal,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/fornecedores')
  return { success: true }
}

export async function setFornecedorStatus(
  id: string,
  status: (typeof fornecedorStatusValues)[number]
): Promise<ActionResult> {
  try {
    await assertCanManageFornecedores()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('fornecedores')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/fornecedores')
  return { success: true }
}
