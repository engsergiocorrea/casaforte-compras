import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'
import { buildEnrichmentUserPrompt, ENRICHMENT_SYSTEM_PROMPT } from './prompt'
import { extractJsonFromText, normalizeEnrichmentOutput } from './shared'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Chaves do Google AI Studio têm o formato "AIza" + ~35 caracteres
// alfanuméricos. Isso não garante que a chave é válida na API (só o
// Google sabe isso), mas pega o caso comum de chave vazia, copiada
// errada ou de outro serviço (ex: colar a chave do Supabase aqui).
const GEMINI_KEY_FORMAT = /^AIza[0-9A-Za-z_-]{30,}$/

export const GEMINI_KEY_ERROR_MESSAGE =
  'GEMINI_API_KEY ausente ou inválida. Gere uma chave no Google AI Studio.'

export function isValidGeminiApiKeyFormat(apiKey: string | undefined): boolean {
  return !!apiKey && GEMINI_KEY_FORMAT.test(apiKey.trim())
}

export async function enrichWithGemini(
  input: MaterialEnrichmentInput,
  apiKey: string,
  model: string
): Promise<MaterialEnrichmentOutput> {
  if (!isValidGeminiApiKeyFormat(apiKey)) {
    // Nunca logar o valor da chave, só o fato de ela estar ausente/inválida.
    throw new Error(GEMINI_KEY_ERROR_MESSAGE)
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${ENRICHMENT_SYSTEM_PROMPT}\n\n${buildEnrichmentUserPrompt(input)}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Gemini respondeu HTTP ${response.status}: ${errorBody.slice(0, 200)}`)
  }

  const data = await response.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini não retornou conteúdo de texto na resposta.')
  }

  const parsed = JSON.parse(extractJsonFromText(text)) as Partial<MaterialEnrichmentOutput>

  return normalizeEnrichmentOutput(parsed, input)
}
