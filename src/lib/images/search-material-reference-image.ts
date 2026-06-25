import { searchImageWithGoogle } from '@/lib/images/providers/google-image-search'
import { searchImageWithBrave } from '@/lib/images/providers/brave-image-search'

type SearchMaterialReferenceImageInput = {
  termo: string
}

type SearchMaterialReferenceImageResult = {
  imageUrl: string
  sourceUrl?: string
  title?: string
} | null

// Busca de imagem de referência por provider externo. A imagem nunca é
// considerada aprovada automaticamente, nunca é gerada artificialmente e
// nunca deve ser apresentada como foto real do produto — é apenas
// referência visual para ajudar na revisão do item. Se nenhum provider
// estiver configurado ou a busca falhar, retorna null sem quebrar o pedido.
export async function searchMaterialReferenceImage({
  termo,
}: SearchMaterialReferenceImageInput): Promise<SearchMaterialReferenceImageResult> {
  const provider = (process.env.IMAGE_SEARCH_PROVIDER?.trim().toLowerCase() || 'none') as
    | 'none'
    | 'brave'
    | 'google'
    | string

  if (provider === 'none' || !termo) {
    return null
  }

  console.warn('[ImageSearch] provider:', provider)
  console.warn('[ImageSearch] termo:', termo)

  try {
    if (provider === 'brave') {
      return await searchImageWithBrave(termo)
    }

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
