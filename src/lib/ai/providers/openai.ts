import OpenAI from 'openai'
import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'
import { buildEnrichmentUserPrompt, ENRICHMENT_SYSTEM_PROMPT } from './prompt'
import { extractJsonFromText, normalizeEnrichmentOutput } from './shared'

export async function enrichWithOpenAI(
  input: MaterialEnrichmentInput,
  apiKey: string,
  model: string
): Promise<MaterialEnrichmentOutput> {
  const openai = new OpenAI({ apiKey })

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: ENRICHMENT_SYSTEM_PROMPT },
      { role: 'user', content: buildEnrichmentUserPrompt(input) },
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI não retornou conteúdo na resposta.')
  }

  const parsed = JSON.parse(extractJsonFromText(content)) as Partial<MaterialEnrichmentOutput>

  return normalizeEnrichmentOutput(parsed, input)
}
