import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canEditPedido } from '@/lib/permissions/pedido'
import type { PedidoCompra, PedidoCompraItem } from '@/types/database'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params

    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida. Faça login novamente.' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data: item, error: itemError } = await supabase
      .from('pedido_compra_itens')
      .select('*')
      .eq('id', itemId)
      .maybeSingle()

    if (itemError || !item) {
      return NextResponse.json({ success: false, error: 'Item não encontrado.' }, { status: 404 })
    }

    const itemTyped = item as PedidoCompraItem

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_compra')
      .select('*')
      .eq('id', itemTyped.pedido_compra_id)
      .maybeSingle()

    if (pedidoError || !pedido) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 })
    }

    if (!canEditPedido(profile, pedido as PedidoCompra)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para aprovar imagens deste pedido.' },
        { status: 403 }
      )
    }

    if (!itemTyped.imagem_referencia_url) {
      return NextResponse.json(
        { success: false, error: 'Este item não tem imagem para aprovar.' },
        { status: 400 }
      )
    }

    const admin = createAdminSupabaseClient()

    if (itemTyped.material_catalogo_id) {
      await admin
        .from('material_images')
        .update({ principal: false })
        .eq('material_catalogo_id', itemTyped.material_catalogo_id)
    }

    await admin
      .from('material_images')
      .update({ aprovado: true, principal: true })
      .eq('image_url', itemTyped.imagem_referencia_url)

    const { error: updateError } = await admin
      .from('pedido_compra_itens')
      .update({ imagem_aprovada: true, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao aprovar imagem.',
      },
      { status: 500 }
    )
  }
}
