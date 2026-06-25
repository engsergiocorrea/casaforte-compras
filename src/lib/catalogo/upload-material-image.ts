import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { MaterialImage } from '@/types/database'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

type UploadMaterialImageInput = {
  file: File
  materialCatalogoId: string | null
  categoriaId: string | null
  nomeMaterial: string
  aprovado: boolean
  createdBy: string | null
}

export async function uploadMaterialImage({
  file,
  materialCatalogoId,
  categoriaId,
  nomeMaterial,
  aprovado,
  createdBy,
}: UploadMaterialImageInput): Promise<MaterialImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie um arquivo de imagem (JPG, PNG ou WEBP).')
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('A imagem deve ter no máximo 5MB.')
  }

  const supabase = createAdminSupabaseClient()
  const extension = file.name.split('.').pop() || 'jpg'
  const pastaMaterial = materialCatalogoId || 'sem-material'
  const path = `materiais/${pastaMaterial}/${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('material-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    throw new Error(`Erro ao enviar imagem: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage.from('material-images').getPublicUrl(path)

  const { data, error } = await supabase
    .from('material_images')
    .insert({
      material_catalogo_id: materialCatalogoId,
      categoria_id: categoriaId,
      nome_material: nomeMaterial,
      image_url: publicUrlData.publicUrl,
      origem: 'upload_manual',
      aprovado,
      principal: aprovado,
      created_by: createdBy,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Erro ao registrar imagem: ${error?.message}`)
  }

  return data as MaterialImage
}
