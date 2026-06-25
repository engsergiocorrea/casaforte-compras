export type Role = 'admin' | 'diretoria' | 'compras' | 'engenheiro' | 'visualizador'

const STAFF_ROLES: Role[] = ['admin', 'diretoria', 'compras']

export function isStaff(role: Role | null | undefined) {
  return !!role && STAFF_ROLES.includes(role)
}

export function canApprove(role: Role | null | undefined) {
  return role === 'admin' || role === 'diretoria'
}

export function canSendWhatsapp(role: Role | null | undefined) {
  return role === 'admin' || role === 'compras'
}

export function canManageCatalog(role: Role | null | undefined) {
  return isStaff(role) || role === 'engenheiro'
}

// obras, engenheiros, fornecedores e categorias seguem a mesma regra de
// escrita das policies RLS: somente staff (admin, diretoria, compras).
export function canManageMasterData(role: Role | null | undefined) {
  return isStaff(role)
}
