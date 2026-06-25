import { FALLBACK_ALERT_MESSAGE } from '@/lib/ai/constants'
import { enrichWithGemini, enrichWithOpenAI } from '@/lib/ai/providers'
import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'

type AiProvider = 'openai' | 'gemini'

const MIN_KEY_LENGTH = 10

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

function resumirErro(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'erro desconhecido'
}

// Nunca lança: qualquer falha de configuração ou da API cai no fallback
// local seguro, para que o preparo do pedido nunca quebre por causa da IA.
export async function enrichMaterialWithAI(
  input: MaterialEnrichmentInput
): Promise<MaterialEnrichmentOutput> {
  const provider = resolveProvider()
  const material = input.nome_material

  if (provider === 'gemini') {
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

    console.log('[AI] provider:', provider)
    console.log('[AI] model:', model)
    console.log('[AI] GEMINI_API_KEY existe:', Boolean(geminiApiKey))
    console.log('[AI] GEMINI_API_KEY tamanho:', geminiApiKey?.length || 0)

    if (!geminiApiKey || geminiApiKey.length <= MIN_KEY_LENGTH) {
      console.warn(`[AI] GEMINI_API_KEY não configurada. material="${material}"`)
      return fallbackMaterialEnrichment(input, 'GEMINI_API_KEY não configurada.')
    }

    try {
      console.log(`[AI] chamando provider=gemini model=${model} material="${material}"`)
      const result = await enrichWithGemini(input, geminiApiKey, model)
      console.log(`[AI] provider=gemini OK material="${material}" confianca=${result.confianca}`)
      return result
    } catch (error) {
      const mensagem = resumirErro(error)
      console.error('[AI] Gemini falhou')
      console.error('[AI] status/mensagem:', mensagem)
      console.error('[AI] provider:', provider)
      console.error('[AI] model:', model)
      console.error('[AI] material:', material)
      return fallbackMaterialEnrichment(input, `Erro ao consultar Gemini: ${mensagem}`)
    }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  console.log('[AI] provider:', provider)
  console.log('[AI] model:', model)
  console.log('[AI] OPENAI_API_KEY existe:', Boolean(apiKey))
  console.log('[AI] OPENAI_API_KEY tamanho:', apiKey?.length || 0)

  if (!apiKey || apiKey.length <= MIN_KEY_LENGTH) {
    console.warn(`[AI] OPENAI_API_KEY não configurada. material="${material}"`)
    return fallbackMaterialEnrichment(input, 'OPENAI_API_KEY não configurada.')
  }

  try {
    console.log(`[AI] chamando provider=openai model=${model} material="${material}"`)
    const result = await enrichWithOpenAI(input, apiKey, model)
    console.log(`[AI] provider=openai OK material="${material}" confianca=${result.confianca}`)
    return result
  } catch (error) {
    const mensagem = resumirErro(error)
    console.error('[AI] OpenAI falhou')
    console.error('[AI] status/mensagem:', mensagem)
    console.error('[AI] provider:', provider)
    console.error('[AI] model:', model)
    console.error('[AI] material:', material)
    return fallbackMaterialEnrichment(input, `Erro ao consultar OpenAI: ${mensagem}`)
  }
}
