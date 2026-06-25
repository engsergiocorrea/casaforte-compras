'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { registrarLog } from '@/lib/logs/activity'
import { pessoaSchema } from '@/lib/validations/pessoa'
import { MODULE_PERMISSIONS, type PermissionModule } from '@/lib/permissions/user-permissions'
import type { ActionResult, FormActionState } from '@/lib/action-result'
import type { PerfilGeral, ProfileRole } from '@/types/database'

function nullableField(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

// Somente admin/diretoria podem cadastrar pessoas e alterar permissões —
// regra de negócio explícita ("só diretor/admin pode cadastrar pessoas").
async function assertCanManagePeople() {
  const profile = await getCurrentUser()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'diretoria')) {
    throw new Error('Você não tem permissão para gerenciar pessoas e acessos.')
  }

  return profile
}

function parsePessoaForm(formData: FormData) {
  return pessoaSchema.safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    telefone: formData.get('telefone'),
    cargo: formData.get('cargo'),
    observacoes: formData.get('observacoes'),
    role: formData.get('role'),
    ativo: formData.get('ativo'),
    perfis_gerais: formData.getAll('perfis_gerais'),
  })
}

function parsePermissions(formData: FormData) {
  const raw = formData.getAll('permissions') as string[]
  const result: { module: string; permission: string }[] = []

  for (const value of raw) {
    const [module, permission] = value.split(':')
    if (!module || !permission) continue
    if (!(module in MODULE_PERMISSIONS)) continue
    if (!MODULE_PERMISSIONS[module as PermissionModule].includes(permission)) continue
    result.push({ module, permission })
  }

  return result
}

async function syncUserPermissions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  profileId: string,
  permissions: { module: string; permission: string }[]
) {
  // Estratégia simples e segura para este volume: apaga todas as
  // permissões do profile e reinsere apenas as marcadas como habilitadas.
  const { error: deleteError } = await supabase
    .from('user_permissions')
    .delete()
    .eq('profile_id', profileId)

  if (deleteError) {
    throw new Error(`Erro ao limpar permissões anteriores: ${deleteError.message}`)
  }

  if (permissions.length === 0) return

  const { error: insertError } = await supabase.from('user_permissions').insert(
    permissions.map((p) => ({
      profile_id: profileId,
      module: p.module,
      permission: p.permission,
      enabled: true,
    }))
  )

  if (insertError) {
    throw new Error(`Erro ao salvar permissões: ${insertError.message}`)
  }
}

export async function criarPessoa(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let gestor
  try {
    gestor = await assertCanManagePeople()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const parsed = parsePessoaForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data
  const permissions = parsePermissions(formData)

  // Criar uma pessoa nova significa criar o usuário no Supabase Auth
  // (convite por e-mail) e então a linha em profiles vinculada ao user_id
  // retornado. Isso exige a service role, por isso usamos o client admin —
  // que só pode ser usado aqui, no server.
  const adminClient = createAdminSupabaseClient()

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    data.email
  )

  if (inviteError || !inviteData?.user) {
    const message = inviteError?.message?.toLowerCase().includes('already')
      ? 'Já existe um usuário cadastrado com este e-mail.'
      : inviteError?.message ?? 'Erro ao convidar usuário pelo Supabase Auth.'
    return { success: false, error: message }
  }

  const supabase = await createServerSupabaseClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: inviteData.user.id,
      nome: data.nome,
      email: data.email,
      telefone: nullableField(data.telefone),
      cargo: nullableField(data.cargo),
      observacoes: nullableField(data.observacoes),
      role: data.role,
      ativo: data.ativo,
      perfis_gerais: data.perfis_gerais as PerfilGeral[],
    })
    .select('id')
    .single()

  if (profileError || !profile) {
    return {
      success: false,
      error: profileError?.message ?? 'Erro ao criar o cadastro da pessoa.',
    }
  }

  try {
    await syncUserPermissions(supabase, profile.id, permissions)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  await registrarLog(supabase, {
    userId: gestor.id,
    entityType: 'profiles',
    entityId: profile.id,
    action: 'pessoa_criada',
    metadata: { email: data.email, role: data.role },
  })
  await registrarLog(supabase, {
    userId: gestor.id,
    entityType: 'profiles',
    entityId: profile.id,
    action: 'permissoes_alteradas',
    metadata: { permissions },
  })

  revalidatePath('/pessoas')
  return { success: true }
}

export async function atualizarPessoa(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let gestor
  try {
    gestor = await assertCanManagePeople()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const id = String(formData.get('id') || '')
  if (!id) {
    return { success: false, error: 'Pessoa inválida.' }
  }

  const parsed = parsePessoaForm(formData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Verifique os campos do formulário.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data
  const permissions = parsePermissions(formData)
  const supabase = await createServerSupabaseClient()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      nome: data.nome,
      telefone: nullableField(data.telefone),
      cargo: nullableField(data.cargo),
      observacoes: nullableField(data.observacoes),
      role: data.role,
      ativo: data.ativo,
      perfis_gerais: data.perfis_gerais as PerfilGeral[],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  try {
    await syncUserPermissions(supabase, id, permissions)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  await registrarLog(supabase, {
    userId: gestor.id,
    entityType: 'profiles',
    entityId: id,
    action: 'pessoa_atualizada',
    metadata: { role: data.role },
  })
  await registrarLog(supabase, {
    userId: gestor.id,
    entityType: 'profiles',
    entityId: id,
    action: 'permissoes_alteradas',
    metadata: { permissions },
  })

  revalidatePath('/pessoas')
  return { success: true }
}

export async function setPessoaAtiva(id: string, ativo: boolean): Promise<ActionResult> {
  let gestor
  try {
    gestor = await assertCanManagePeople()
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('profiles')
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  await registrarLog(supabase, {
    userId: gestor.id,
    entityType: 'profiles',
    entityId: id,
    action: ativo ? 'pessoa_reativada' : 'pessoa_inativada',
  })

  revalidatePath('/pessoas')
  return { success: true }
}

export type ProfileRoleOption = ProfileRole
