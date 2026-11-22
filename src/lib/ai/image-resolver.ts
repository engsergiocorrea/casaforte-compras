import { findApprovedMaterialImage } from '@/lib/catalogo/find-material-image'
import { gerarImagemMaterial } from './material-image'
import { geminiKey } from './gemini-client'

type ResolveImageInput = {
  materialCatalogoId: string
  categoriaId: string | null
  nomeMaterial: string
  especificacao?: string | null
  termosBusca: string[]
}

type ResolveImageResult = {
  imageUrl: string | null
  origem: string | null
  aprovada: boolean
  precisaRevisao: boolean
}

// Ordem: 1) imagem já aprovada no catálogo (reuso); 2) a IA gera uma imagem
// ilustrativa do material e ela passa a ser a imagem do catálogo. Se a IA
// falhar, o item fica sem imagem e marcado para revisão.
export async function resolveMaterialImage({
  materialCatalogoId,
  categoriaId,
  nomeMaterial,
  especificacao,
}: ResolveImageInput): Promise<ResolveImageResult> {
  const existente = await findApprovedMaterialImage(materialCatalogoId)
  if (existente) {
    return { imageUrl: existente.image_url, origem: 'catalogo_interno', aprovada: true, precisaRevisao: false }
  }

  if (geminiKey()) {
    try {
      const url = await gerarImagemMaterial({ materialCatalogoId, categoriaId, nome: nomeMaterial, especificacao })
      return { imageUrl: url, origem: 'imagem_ilustrativa', aprovada: true, precisaRevisao: false }
    } catch (error) {
      console.error('[IA imagem] falhou:', error instanceof Error ? error.message : error)
    }
  }

  return { imageUrl: null, origem: null, aprovada: false, precisaRevisao: true }
}
