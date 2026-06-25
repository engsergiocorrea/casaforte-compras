import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageCatalog } from '@/lib/permissions/can'
import { uploadMaterialImage } from '@/lib/catalogo/upload-material-image'
import type { MaterialCatalogo } from '@/types/database'

// Imagem cadastrada direto no catálogo é a imagem principal do material: já
// entra aprovada (curadoria explícita) e passa a ser reaproveitada
// automaticamente em qualquer pedido futuro com este material.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: materialId } = await params

    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida. Faça login novamente.' },
        { status: 401 }
      )
    }

    if (!canManageCatalog(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para gerenciar o catálogo.' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: material, error: materialError } = await supabase
      .from('materiais_catalogo')
      .select('*')
      .eq('id', materialId)
      .maybeSingle()

    if (materialError || !material) {
      return NextResponse.json({ success: false, error: 'Material não encontrado.' }, { status: 404 })
    }

    const materialTyped = material as MaterialCatalogo

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Selecione um arquivo de imagem.' },
        { status: 400 }
      )
    }

    const materialImage = await uploadMaterialImage({
      file,
      materialCatalogoId: materialTyped.id,
      categoriaId: materialTyped.categoria_id,
      nomeMaterial: materialTyped.nome_padronizado,
      aprovado: true,
      createdBy: profile.id,
    })

    const admin = createAdminSupabaseClient()
    await admin
      .from('material_images')
      .update({ principal: false })
      .eq('material_catalogo_id', materialTyped.id)
      .neq('id', materialImage.id)

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
