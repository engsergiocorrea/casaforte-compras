type GoogleCustomSearchItem = {
  link?: string
}

type GoogleCustomSearchResponse = {
  items?: GoogleCustomSearchItem[]
}

type GoogleImageSearchResult = {
  imageUrl: string
} | null

const GOOGLE_CUSTOM_SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1'

// TODO: nesta primeira versão a URL retornada pelo Google é usada direto
// (hotlink). Quando a imagem precisar ficar disponível de forma confiável a
// longo prazo, baixar o conteúdo aqui e salvar no Supabase Storage
// (bucket material-images), em vez de apontar para a fonte externa.
export async function searchImageWithGoogle(termo: string): Promise<GoogleImageSearchResult> {
  const apiKey = process.env.GOOGLE_IMAGE_SEARCH_API_KEY?.trim()
  const cx = process.env.GOOGLE_IMAGE_SEARCH_CX?.trim()

  if (!apiKey || !cx) {
    console.warn('[ImageSearch] GOOGLE_IMAGE_SEARCH_API_KEY ou GOOGLE_IMAGE_SEARCH_CX não configurados.')
    return null
  }

  const url = new URL(GOOGLE_CUSTOM_SEARCH_ENDPOINT)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', cx)
  url.searchParams.set('q', termo)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('num', '3')
  url.searchParams.set('safe', 'active')

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Google Custom Search retornou ${response.status}`)
  }

  const data = (await response.json()) as GoogleCustomSearchResponse
  const primeiraImagem = data.items?.find(
    (item) => typeof item.link === 'string' && item.link.length > 0
  )

  if (!primeiraImagem?.link) {
    return null
  }

  return { imageUrl: primeiraImagem.link }
}
