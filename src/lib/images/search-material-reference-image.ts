import { searchImageWithGoogle } from '@/lib/images/providers/google-image-search'

type SearchMaterialReferenceImageInput = {
  termo: string
}

type SearchMaterialReferenceImageResult = {
  imageUrl: string
} | null

// Busca de imagem de referência por provider externo. A imagem nunca é
// considerada aprovada automaticamente, nunca é gerada artificialmente e
// nunca deve ser apresentada como foto real do produto — é apenas
// referência visual para ajudar na revisão do item. Se nenhum provider
// estiver configurado ou a busca falhar, retorna null sem quebrar o pedido.
export async function searchMaterialReferenceImage({
  termo,
}: SearchMaterialReferenceImageInput): Promise<SearchMaterialReferenceImageResult> {
  const provider = process.env.IMAGE_SEARCH_PROVIDER?.trim().toLowerCase()

  if (!provider) {
    console.warn('[ImageSearch] Provider de busca de imagem não configurado.')
    return null
  }

  if (!termo) {
    return null
  }

  try {
    if (provider === 'google') {
      return await searchImageWithGoogle(termo)
    }

    console.warn(`[ImageSearch] Provider "${provider}" não suportado.`)
    return null
  } catch (error) {
    console.error('[ImageSearch] Falha ao buscar imagem de referência.')
    console.error('[ImageSearch] provider:', provider, 'termo:', termo)
    console.error('[ImageSearch] erro:', error instanceof Error ? error.message : error)
    return null
  }
}
