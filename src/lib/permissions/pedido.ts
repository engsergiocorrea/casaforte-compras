import type { SupabaseClient } from '@supabase/supabase-js'
import { canApprove, isStaff, type Role } from '@/lib/permissions/can'
import { hasPermission } from '@/lib/permissions/user-permissions'
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

// Fluxo simplificado (decisão de produto): pedidos novos não passam mais
// pelas etapas de revisão (pendente_revisao/em_revisao). O dono do pedido
// (ou staff) envia direto de rascunho/devolvido para pendente_aprovacao,
// que na UI é rotulado como "Aguardando aprovação" — o valor armazenado no
// banco continua sendo 'pendente_aprovacao', sem necessidade de migration
// de enum.
export function canSendToReview(profile: Profile | null, pedido: PedidoCompra) {
  if (!profile) return false
  if (!SOLICITANTE_EDITABLE_STATUSES.includes(pedido.status)) return false
  return isStaff(profile.role) || isOwner(profile, pedido)
}

// Mantido apenas para pedidos legados que já estejam em 'pendente_revisao'
// (a UI não oferece mais este caminho para pedidos novos).
export function canStartReview(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && isStaff(profile.role) && pedido.status === 'pendente_revisao'
}

// Mantido para compatibilidade com pedidos legados que já estejam em
// 'em_revisao' (action enviarParaAprovacao antiga). A UI não oferece mais
// este caminho para pedidos novos — ver canSendDirectToApproval.
export function canSendToApproval(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && isStaff(profile.role) && pedido.status === 'em_revisao'
}

// Novo caminho principal: envia direto de rascunho/devolvido para
// pendente_aprovacao ("Aguardando aprovação"), sem passar por revisão.
export function canSendDirectToApproval(profile: Profile | null, pedido: PedidoCompra) {
  if (!profile) return false
  if (!SOLICITANTE_EDITABLE_STATUSES.includes(pedido.status)) return false
  return isStaff(profile.role) || isOwner(profile, pedido)
}

export function canDecideApproval(profile: Profile | null, pedido: PedidoCompra) {
  return !!profile && canApprove(profile.role) && pedido.status === 'pendente_aprovacao'
}

// Versão assíncrona usada nos pontos novos (Server Components/actions):
// admin/diretoria sempre podem decidir; além disso, qualquer profile com a
// permissão granular 'compras.aprovar_pedido' habilitada também pode.
export async function canDecideApprovalAsync(
  supabase: SupabaseClient,
  profile: Profile | null,
  pedido: PedidoCompra
) {
  if (!profile || pedido.status !== 'pendente_aprovacao') return false
  if (canApprove(profile.role)) return true
  return hasPermission(supabase, profile.id, 'compras', 'aprovar_pedido')
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

// Gerar o documento é permitido mesmo depois de aprovado (é exatamente
// quando o PDF passa a ser necessário para enviar ao fornecedor), mas não
// para pedidos cancelados.
export function canGeneratePdf(profile: Profile | null, pedido: PedidoCompra) {
  if (!profile) return false
  if (pedido.status === 'cancelado') return false
  return isStaff(profile.role) || isOwner(profile, pedido)
}
