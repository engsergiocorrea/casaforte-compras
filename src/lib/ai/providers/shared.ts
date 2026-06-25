import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'

export function normalizeEnrichmentOutput(
  parsed: Partial<MaterialEnrichmentOutput>,
  input: MaterialEnrichmentInput
): MaterialEnrichmentOutput {
  return {
    nome_padronizado: parsed.nome_padronizado || input.nome_material,
    categoria_sugerida: parsed.categoria_sugerida || input.categoria || 'Outros',
    unidade_sugerida: parsed.unidade_sugerida || input.unidade || 'un',
    especificacao_melhorada:
      parsed.especificacao_melhorada ||
      input.descricao ||
      `Material solicitado: ${input.nome_material}`,
    observacao_fornecedor:
      parsed.observacao_fornecedor ||
      'Favor informar disponibilidade, prazo de entrega, valor e condição de pagamento.',
    termos_busca_imagem:
      parsed.termos_busca_imagem && parsed.termos_busca_imagem.length > 0
        ? parsed.termos_busca_imagem
        : [input.nome_material],
    alertas: parsed.alertas || [],
    confianca:
      typeof parsed.confianca === 'number'
        ? Math.max(0, Math.min(1, parsed.confianca))
        : 0.5,
  }
}

// Alguns modelos retornam o JSON envolto em ```json ... ``` ou com texto
// solto antes/depois. Extrai apenas o trecho que parece ser o objeto JSON.
export function extractJsonFromText(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced) return fenced[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }

  return text.trim()
}
