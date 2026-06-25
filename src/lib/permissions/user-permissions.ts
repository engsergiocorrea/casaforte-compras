import type { SupabaseClient } from '@supabase/supabase-js'

// Catálogo de permissões granulares por módulo. Hoje só o módulo "compras"
// tem checagem real (canDecideApprovalAsync); rdo/tabelas/obras são
// estrutura preparada para o futuro (Portal Central, RDO, Tabelas), ainda
// sem telas/regras reais implementadas.
export type PermissionModule = 'compras' | 'rdo' | 'tabelas' | 'obras'

export const MODULE_PERMISSIONS: Record<PermissionModule, string[]> = {
  compras: [
    'criar_pedido',
    'ver_pedidos_proprios',
    'ver_todos_pedidos',
    'aprovar_pedido',
    'devolver_pedido',
    'enviar_pedido_fornecedor',
    'cadastrar_fornecedores',
    'cadastrar_materiais',
    'cadastrar_obras',
    'cadastrar_engenheiros',
    'acessar_configuracoes',
  ],
  rdo: ['criar_rdo', 'ver_rdos', 'enviar_rdo_cliente', 'cadastrar_clientes', 'ver_historico_envio'],
  tabelas: [
    'ver_tabela',
    'editar_unidades',
    'gerar_proposta',
    'aplicar_reajuste',
    'bloquear_unidade',
    'ver_relatorios',
  ],
  obras: ['ver_obras', 'cadastrar_obra', 'ver_cameras', 'ver_relatorios', 'gerenciar_equipe'],
}

export const PERMISSION_MODULES = Object.keys(MODULE_PERMISSIONS) as PermissionModule[]

export async function hasPermission(
  supabase: SupabaseClient,
  profileId: string,
  module: PermissionModule,
  permission: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_permissions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('module', module)
    .eq('permission', permission)
    .eq('enabled', true)
    .maybeSingle()

  return !!data
}

export async function getUserPermissions(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ module: string; permission: string }[]> {
  const { data } = await supabase
    .from('user_permissions')
    .select('module, permission')
    .eq('profile_id', profileId)
    .eq('enabled', true)

  return data ?? []
}
