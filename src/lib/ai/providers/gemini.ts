import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'
import { buildEnrichmentUserPrompt, ENRICHMENT_SYSTEM_PROMPT } from './prompt'
import { extractJsonFromText, normalizeEnrichmentOutput } from './shared'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function enrichWithGemini(
  input: MaterialEnrichmentInput,
  apiKey: string,
  model: string
): Promise<MaterialEnrichmentOutput> {
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
