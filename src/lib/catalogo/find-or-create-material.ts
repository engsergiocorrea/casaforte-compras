import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { normalizeText } from '@/lib/utils/normalize-text'
import type { MaterialEnrichmentOutput } from '@/types/ai'
import type { MaterialCatalogo } from '@/types/database'

export async function findOrCreateMaterialFromAI(
  enrichment: MaterialEnrichmentOutput
): Promise<MaterialCatalogo> {
  const supabase = createAdminSupabaseClient()
  const normalizedName = normalizeText(enrichment.nome_padronizado)

  const { data: existing } = await supabase
    .from('materiais_catalogo')
    .select('*')
    .eq('nome_normalizado', normalizedName)
    .maybeSingle()

  if (existing) {
    return existing as MaterialCatalogo
  }

  const { data: categoria } = await supabase
    .from('categorias_materiais')
    .select('id')
    .ilike('nome', enrichment.categoria_sugerida)
    .maybeSingle()

  const { data, error } = await supabase
    .from('materiais_catalogo')
    .insert({
      nome_padronizado: enrichment.nome_padronizado,
      nome_normalizado: normalizedName,
      categoria_id: categoria?.id || null,
      unidade_padrao: enrichment.unidade_sugerida,
      descricao_padrao: enrichment.especificacao_melhorada,
      especificacao_padrao: enrichment.especificacao_melhorada,
      observacoes: enrichment.observacao_fornecedor,
      criado_por_ia: true,
      aprovado: false,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Erro ao criar material no catálogo: ${error?.message}`)
  }

  return data as MaterialCatalogo
}
