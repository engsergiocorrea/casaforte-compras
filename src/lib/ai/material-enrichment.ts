import { FALLBACK_ALERT_MESSAGE } from '@/lib/ai/constants'
import { enrichWithGemini, enrichWithOpenAI, GEMINI_KEY_ERROR_MESSAGE } from '@/lib/ai/providers'
import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'

type AiProvider = 'openai' | 'gemini'

function fallbackMaterialEnrichment(
  input: MaterialEnrichmentInput,
  alerta: string = FALLBACK_ALERT_MESSAGE
): MaterialEnrichmentOutput {
  return {
    nome_padronizado: input.nome_material,
    categoria_sugerida: input.categoria || 'Outros',
    unidade_sugerida: input.unidade || 'un',
    especificacao_melhorada:
      input.descricao || `Material solicitado: ${input.nome_material}`,
    observacao_fornecedor:
      'Favor informar disponibilidade, prazo de entrega, valor e condição de pagamento.',
    termos_busca_imagem: [input.nome_material],
    alertas: [alerta],
    confianca: 0.3,
  }
}

function resolveProvider(): AiProvider {
  const configured = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase()
  return configured === 'gemini' ? 'gemini' : 'openai'
}

// Nunca lança: qualquer falha de configuração ou da API cai no fallback
// local seguro, para que o preparo do pedido nunca quebre por causa da IA.
export async function enrichMaterialWithAI(
  input: MaterialEnrichmentInput
): Promise<MaterialEnrichmentOutput> {
  const provider = resolveProvider()
  const material = input.nome_material

  try {
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

      // A validação de presença/formato da chave acontece dentro do
      // provider (enrichWithGemini), que lança GEMINI_KEY_ERROR_MESSAGE
      // sem nunca expor o valor da chave em log.
      console.log(`[IA] chamando provider=gemini modelo=${model} material="${material}"`)
      const result = await enrichWithGemini(input, apiKey ?? '', model)
      console.log(`[IA] provider=gemini OK material="${material}" confianca=${result.confianca}`)
      return result
    }

    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    if (!apiKey) {
      console.warn(
        `[IA] provider=openai sem OPENAI_API_KEY configurada — usando fallback local. material="${material}"`
      )
      return fallbackMaterialEnrichment(input)
    }

    console.log(`[IA] chamando provider=openai modelo=${model} material="${material}"`)
    const result = await enrichWithOpenAI(input, apiKey, model)
    console.log(`[IA] provider=openai OK material="${material}" confianca=${result.confianca}`)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido'
    console.error(`[IA] provider=${provider} falhou material="${material}": ${message}`)

    // A mensagem de chave ausente/inválida é segura para mostrar ao usuário
    // (não contém a chave); demais erros (rede, cota, JSON inválido) usam o
    // alerta genérico para não expor detalhes técnicos da API no pedido.
    const alertaUsuario = message === GEMINI_KEY_ERROR_MESSAGE ? message : undefined
    return fallbackMaterialEnrichment(input, alertaUsuario)
  }
}
