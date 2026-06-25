import type { SupabaseClient } from '@supabase/supabase-js'
import type { AprovacaoAcao } from '@/types/database'

export async function registrarAprovacao(
  supabase: SupabaseClient,
  params: {
    pedidoCompraId: string
    userId: string | null
    acao: AprovacaoAcao
    comentario?: string | null
  }
) {
  await supabase.from('aprovacoes_pedido').insert({
    pedido_compra_id: params.pedidoCompraId,
    user_id: params.userId,
    acao: params.acao,
    comentario: params.comentario ?? null,
  })
}

export async function registrarLog(
  supabase: SupabaseClient,
  params: {
    userId: string | null
    entityType: string
    entityId: string | null
    action: string
    metadata?: Record<string, unknown>
  }
) {
  await supabase.from('activity_logs').insert({
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    metadata: params.metadata ?? {},
  })
}
