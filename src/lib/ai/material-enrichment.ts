import OpenAI from 'openai'
import type { MaterialEnrichmentInput, MaterialEnrichmentOutput } from '@/types/ai'

function fallbackMaterialEnrichment(
  input: MaterialEnrichmentInput
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
    alertas: ['IA indisponível ou retorno inválido. Conferir informações manualmente.'],
    confianca: 0.3,
  }
}

export async function enrichMaterialWithAI(
  input: MaterialEnrichmentInput
): Promise<MaterialEnrichmentOutput> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return fallbackMaterialEnrichment(input)
  }

  const openai = new OpenAI({ apiKey })

  const systemPrompt = `
Você é o Assistente de Materiais da Casa Forte, uma construtora brasileira.

Sua função é padronizar materiais de construção para pedidos de compra.

Regras:
- Responda exclusivamente em JSON válido.
- Não invente marca, medida, norma ou modelo.
- Se faltar informação, inclua alerta.
- Use português do Brasil.
- Seja prático e orientado para fornecedor.
- Gere termos de busca de imagem úteis.
- A imagem será apenas referência, então os termos devem ser objetivos.
- Para materiais ambíguos, reduza a confiança e sinalize revisão.
`

  const userPrompt = `
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

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return fallbackMaterialEnrichment(input)
    }

    const parsed = JSON.parse(content) as Partial<MaterialEnrichmentOutput>

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
  } catch (error) {
    console.error('Erro ao enriquecer material com IA:', error)
    return fallbackMaterialEnrichment(input)
  }
}
