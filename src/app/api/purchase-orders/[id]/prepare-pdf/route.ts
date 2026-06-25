import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canPrepareWithIA } from '@/lib/permissions/pedido'
import { prepareOrderWithAI } from '@/lib/ai/order-preparation'
import type { PedidoCompra } from '@/types/database'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const profile = await getCurrentUser()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida. Faça login novamente.' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_compra')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado.' },
        { status: 404 }
      )
    }

    if (!canPrepareWithIA(profile, pedido as PedidoCompra)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para preparar este pedido com IA.' },
        { status: 403 }
      )
    }

    const result = await prepareOrderWithAI(id, profile.id)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao preparar pedido com IA.',
      },
      { status: 500 }
    )
  }
}
