import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { MaterialImage } from '@/types/database'

export async function findApprovedMaterialImage(
  materialCatalogoId: string
): Promise<MaterialImage | null> {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('material_images')
    .select('*')
    .eq('material_catalogo_id', materialCatalogoId)
    .eq('aprovado', true)
    .order('principal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar imagem do material: ${error.message}`)
  }

  return data as MaterialImage | null
}
