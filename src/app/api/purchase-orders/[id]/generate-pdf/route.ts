import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canGeneratePdf } from '@/lib/permissions/pedido'
import { generatePurchaseOrderDocument } from '@/lib/pdf/generate-purchase-order-document'
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

    if (!canGeneratePdf(profile, pedido as PedidoCompra)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para gerar o documento deste pedido.' },
        { status: 403 }
      )
    }

    const result = await generatePurchaseOrderDocument(id, profile.id)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar o documento do pedido.',
      },
      { status: 500 }
    )
  }
}
