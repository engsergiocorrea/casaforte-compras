import type { MaterialEnrichmentInput } from '@/types/ai'

export const ENRICHMENT_SYSTEM_PROMPT = `
Você é o Assistente de Materiais da Casa Forte, uma construtora brasileira.

Sua função é padronizar materiais de construção para pedidos de compra.

Regras:
- Responda exclusivamente em JSON válido, sem texto antes ou depois.
- Não invente marca, medida, norma ou modelo.
- Se faltar informação, inclua alerta.
- Use português do Brasil.
- Seja prático e orientado para fornecedor.
- Gere termos de busca de imagem úteis.
- A imagem será apenas referência, então os termos devem ser objetivos.
- Para materiais ambíguos, reduza a confiança e sinalize revisão.
`

export function buildEnrichmentUserPrompt(input: MaterialEnrichmentInput) {
  return `
Analise este material e retorne JSON com:
{
  "nome_padronizado": string,
  "categoria_sugerida": string,
  "unidade_sugerida": string,
  "especificacao_melhorada": string,
  "observacao_fornecedor": string,
  "termos_busca_imagem": string[],
  "alertas": string[],
  "confianca": number
}

Material:
${JSON.stringify(input, null, 2)}
`
}
