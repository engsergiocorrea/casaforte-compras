import { findApprovedMaterialImage } from '@/lib/catalogo/find-material-image'
import { searchMaterialReferenceImage } from '@/lib/ai/image-search'

type ResolveImageInput = {
  materialCatalogoId: string
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
// configurado. Nunca gera/inventa imagem artificial de produto — quando
// nenhuma das duas fontes encontra algo, retorna null e sinaliza revisão.
export async function resolveMaterialImage({
  materialCatalogoId,
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

  const searchResult = await searchMaterialReferenceImage({ termos: termosBusca })

  if (searchResult) {
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
