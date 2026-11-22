import { findApprovedMaterialImage } from '@/lib/catalogo/find-material-image'
import { buscarFotoMaterial } from '@/lib/images/foto-web'
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

// Ordem: 1) foto já aprovada no catálogo (reuso); 2) foto real de produto
// achada na internet (lojas brasileiras), que passa a ser a do catálogo.
// Se nada for achado, o item fica sem foto (dá para enviar uma à mão).
export async function resolveMaterialImage({ materialCatalogoId, categoriaId, nomeMaterial, termosBusca }: ResolveImageInput): Promise<ResolveImageResult> {
  const existente = await findApprovedMaterialImage(materialCatalogoId)
  if (existente) {
    return { imageUrl: existente.image_url, origem: 'catalogo_interno', aprovada: true, precisaRevisao: false }
  }
  if (geminiKey()) {
    try {
      const url = await buscarFotoMaterial({ materialCatalogoId, categoriaId, nome: nomeMaterial, termos: termosBusca })
      if (url) return { imageUrl: url, origem: 'referencia_web', aprovada: true, precisaRevisao: false }
    } catch (error) {
      console.error('[foto web] falhou:', error instanceof Error ? error.message : error)
    }
  }
  return { imageUrl: null, origem: null, aprovada: false, precisaRevisao: false }
}
