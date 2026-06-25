type SearchMaterialReferenceImageInput = {
  termos: string[]
}

type SearchMaterialReferenceImageResult = {
  imageUrl: string
  termos: string[]
} | null

// Busca de imagem de referência por provider externo (ex.: Google Custom
// Search, Bing Images). Hoje nenhum provider está integrado: se as variáveis
// de ambiente não estiverem configuradas, retorna null sem quebrar o fluxo
// de preparação do pedido. Nunca gera/inventa imagem artificial de produto.
export async function searchMaterialReferenceImage({
  termos,
}: SearchMaterialReferenceImageInput): Promise<SearchMaterialReferenceImageResult> {
  const provider = process.env.IMAGE_SEARCH_PROVIDER?.trim().toLowerCase()
  const apiKey = process.env.IMAGE_SEARCH_API_KEY?.trim()
  const engineId = process.env.IMAGE_SEARCH_ENGINE_ID?.trim()

  if (!provider || !apiKey) {
    console.warn('[ImageSearch] Provider de busca de imagem não configurado.')
    return null
  }

  console.warn(
    `[ImageSearch] Provider "${provider}" configurado (engineId presente: ${Boolean(engineId)}, termos="${termos.join(', ')}"), mas a integração ainda não foi implementada.`
  )

  return null
}
