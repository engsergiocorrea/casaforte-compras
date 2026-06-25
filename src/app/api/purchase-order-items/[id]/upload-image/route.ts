import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canEditPedido } from '@/lib/permissions/pedido'
import { uploadMaterialImage } from '@/lib/catalogo/upload-material-image'
import type { PedidoCompra, PedidoCompraItem } from '@/types/database'

async function loadItemAndPedido(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  itemId: string
) {
  const { data: item, error: itemError } = await supabase
    .from('pedido_compra_itens')
    .select('*')
    .eq('id', itemId)
    .maybeSingle()

  if (itemError || !item) {
    throw new Error('Item não encontrado.')
  }

  const itemTyped = item as PedidoCompraItem

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos_compra')
    .select('*')
    .eq('id', itemTyped.pedido_compra_id)
    .maybeSingle()

  if (pedidoError || !pedido) {
    throw new Error('Pedido não encontrado.')
  }

  return { item: itemTyped, pedido: pedido as PedidoCompra }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { item, pedido } = await loadItemAndPedido(supabase, itemId)

    if (!canEditPedido(profile, pedido)) {
      return NextResponse.json(
        { success: false, error: 'Não é possível alterar imagens deste pedido agora.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Selecione um arquivo de imagem.' },
        { status: 400 }
      )
    }

    const aprovado = formData.get('aprovado') === 'true' || formData.get('aprovado') === 'on'

    const materialImage = await uploadMaterialImage({
      file,
      materialCatalogoId: item.material_catalogo_id,
      categoriaId: item.categoria_id,
      nomeMaterial: item.nome_padronizado || item.nome_material,
      aprovado,
      createdBy: profile.id,
    })

    const admin = createAdminSupabaseClient()
    const { error: updateError } = await admin
      .from('pedido_compra_itens')
      .update({
        imagem_referencia_url: materialImage.image_url,
        imagem_origem: 'upload_manual',
        imagem_aprovada: aprovado,
        precisa_revisao: aprovado ? item.precisa_revisao : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { url: materialImage.image_url } })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar imagem.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { pedido } = await loadItemAndPedido(supabase, itemId)

    if (!canEditPedido(profile, pedido)) {
      return NextResponse.json(
        { success: false, error: 'Não é possível alterar imagens deste pedido agora.' },
        { status: 403 }
      )
    }

    const admin = createAdminSupabaseClient()
    const { error: updateError } = await admin
      .from('pedido_compra_itens')
      .update({
        imagem_referencia_url: null,
        imagem_origem: null,
        imagem_aprovada: false,
        precisa_revisao: true,
        updated_at: new Date().toISOString(),
      })
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
        error: error instanceof Error ? error.message : 'Erro ao remover imagem.',
      },
      { status: 500 }
    )
  }
}
