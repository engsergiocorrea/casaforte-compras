import { findApprovedMaterialImage } from '@/lib/catalogo/find-material-image'
import { searchMaterialReferenceImage } from '@/lib/images/search-material-reference-image'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

type ResolveImageInput = {
  materialCatalogoId: string
  categoriaId: string | null
  nomeMaterial: string
  termosBusca: string[]
}

type ResolveImageResult = {
  imageUrl: string | null
  origem: string | null
  aprovada: boolean
  precisaRevisao: boolean
}

// Ordem de resolução: 1) imagem já aprovada no catálogo interno (reuso
// automático); 2) busca de imagem de referência via provider externo, se
// configurado, usando o primeiro termo de busca gerado pela IA. Nunca
// gera/inventa imagem artificial de produto — quando nenhuma das duas
// fontes encontra algo, retorna null e sinaliza revisão.
export async function resolveMaterialImage({
  materialCatalogoId,
  categoriaId,
  nomeMaterial,
  termosBusca,
}: ResolveImageInput): Promise<ResolveImageResult> {
  const existingImage = await findApprovedMaterialImage(materialCatalogoId)

  if (existingImage) {
    return {
      imageUrl: existingImage.image_url,
      origem: 'catalogo_interno',
      aprovada: true,
      precisaRevisao: false,
    }
  }

  const primeiroTermo = termosBusca[0]
  const searchResult = primeiroTermo
    ? await searchMaterialReferenceImage({ termo: primeiroTermo })
    : null

  if (searchResult) {
    const supabase = createAdminSupabaseClient()
    await supabase.from('material_images').insert({
      material_catalogo_id: materialCatalogoId,
      categoria_id: categoriaId,
      nome_material: nomeMaterial,
      image_url: searchResult.imageUrl,
      origem: 'referencia_web',
      termos_busca: termosBusca,
      aprovado: false,
      principal: false,
    })

    return {
      imageUrl: searchResult.imageUrl,
      origem: 'referencia_web',
      aprovada: false,
      precisaRevisao: true,
    }
  }

  return {
    imageUrl: null,
    origem: null,
    aprovada: false,
    precisaRevisao: true,
  }
}
