type BraveImageResult = {
  url?: string
  title?: string
  properties?: { url?: string }
  thumbnail?: { src?: string }
}

type BraveImageSearchResponse = {
  results?: BraveImageResult[]
}

type BraveImageSearchResult = {
  imageUrl: string
  sourceUrl?: string
  title?: string
} | null

const BRAVE_IMAGE_SEARCH_ENDPOINT = 'https://api.search.brave.com/res/v1/images/search'

// TODO: nesta primeira versão a URL retornada pela Brave é usada direto
// (hotlink). Quando a imagem precisar ficar disponível de forma confiável a
// longo prazo, baixar o conteúdo aqui e salvar no Supabase Storage
// (bucket material-images), em vez de apontar para a fonte externa.
export async function searchImageWithBrave(termo: string): Promise<BraveImageSearchResult> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim()

  if (!apiKey) {
    console.warn('[ImageSearch] BRAVE_SEARCH_API_KEY não configurada.')
    return null
  }

  const url = new URL(BRAVE_IMAGE_SEARCH_ENDPOINT)
  url.searchParams.set('q', termo)
  url.searchParams.set('count', '3')
  url.searchParams.set('safesearch', 'strict')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey,
    },
  })

  console.warn('[ImageSearch] status:', response.status)

  if (!response.ok) {
    throw new Error(`Brave Image Search retornou ${response.status}`)
  }

  const data = (await response.json()) as BraveImageSearchResponse
  const resultados = data.results ?? []

  console.warn('[ImageSearch] imagens encontradas:', resultados.length)

  const primeiroResultado = resultados.find(
    (resultado) => resultado.properties?.url || resultado.thumbnail?.src
  )

  const imageUrl = primeiroResultado?.properties?.url || primeiroResultado?.thumbnail?.src

  if (!imageUrl) {
    return null
  }

  console.warn('[ImageSearch] imagem escolhida:', imageUrl)

  return {
    imageUrl,
    sourceUrl: primeiroResultado?.url,
    title: primeiroResultado?.title,
  }
}
