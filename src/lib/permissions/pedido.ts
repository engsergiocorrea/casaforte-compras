import { canApprove, isStaff, type Role } from '@/lib/permissions/can'
import type { PedidoCompra, Profile } from '@/types/database'

const SOLICITANTE_EDITABLE_STATUSES: PedidoCompra['status'][] = ['rascunho', 'devolvido']

export function canCreatePedido(role: Role | null | undefined) {
  return role === 'admin' || role === 'diretoria' || role === 'compras' || role === 'engenheiro'
}

function isOwner(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && pedido.solicitante_id === profile.id
}

// Header e itens nunca podem ser editados livremente depois de aprovado.
export function canEditPedido(profile: Profile | null, pedido: PedidoCompra) {
  if (pedido.status === 'aprovado') return false
  if (!profile) return false
  if (isStaff(profile.role)) return true
  return isOwner(profile, pedido) && SOLICITANTE_EDITABLE_STATUSES.includes(pedido.status)
}

export function canSendToReview(profile: Profile | null, pedido: PedidoCompra) {
  if (!profile) return false
  if (!SOLICITANTE_EDITABLE_STATUSES.includes(pedido.status)) return false
  return isStaff(profile.role) || isOwner(profile, pedido)
}

export function canStartReview(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && isStaff(profile.role) && pedido.status === 'pendente_revisao'
}

export function canSendToApproval(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && isStaff(profile.role) && pedido.status === 'em_revisao'
}

export function canDecideApproval(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && canApprove(profile.role) && pedido.status === 'pendente_aprovacao'
}

export function canCancelPedido(profile: Profile | null, pedido: PedidoCompra) {
  if (!profile || !isStaff(profile.role)) return false
  return !['aprovado', 'cancelado', 'comprado'].includes(pedido.status)
}

// Preparar com IA é um passo prévio à geração do PDF: disponível para quem
// pode editar o pedido (dono em rascunho/devolvido, ou staff em qualquer
// status não finalizado), nunca depois de aprovado/cancelado.
export function canPrepareWithIA(profile: Profile | null, pedido: PedidoCompra) {
  if (!profile) return false
  if (['aprovado', 'cancelado'].includes(pedido.status)) return false
  return isStaff(profile.role) || isOwner(profile, pedido)
}
