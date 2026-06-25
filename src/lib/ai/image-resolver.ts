import { findApprovedMaterialImage } from '@/lib/catalogo/find-material-image'

type ResolveImageInput = {
  materialCatalogoId: string
}

type ResolveImageResult = {
  imageUrl: string | null
  origem: string | null
  aprovada: boolean
  precisaRevisao: boolean
}

// Nunca inventa imagem: só aplica uma imagem já aprovada no catálogo interno.
// Quando não há imagem aprovada, retorna null e sinaliza precisa_revisao,
// deixando a curadoria manual decidir depois (Etapa de catálogo/imagens).
export async function resolveMaterialImage({
  materialCatalogoId,
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

  return {
    imageUrl: null,
    origem: null,
    aprovada: false,
    precisaRevisao: true,
  }
}
