export type MaterialEnrichmentInput = {
  nome_material: string
  descricao?: string | null
  quantidade?: number | null
  unidade?: string | null
  categoria?: string | null
  observacoes?: string | null
}

export type MaterialEnrichmentOutput = {
  nome_padronizado: string
  categoria_sugerida: string
  unidade_sugerida: string
  especificacao_melhorada: string
  observacao_fornecedor: string
  termos_busca_imagem: string[]
  alertas: string[]
  confianca: number
}

export type PreparedOrderItem = {
  item_id: string
  nome_original: string
  nome_padronizado: string
  categoria_sugerida: string
  unidade_sugerida: string
  especificacao_melhorada: string
  observacao_fornecedor: string
  termos_busca_imagem: string[]
  alertas: string[]
  confianca: number
  material_catalogo_id?: string | null
  imagem_referencia_url?: string | null
  imagem_origem?: string | null
  precisa_revisao: boolean
}

export type OrderPreparationResult = {
  pedido_id: string
  preparado_em: string
  itens: PreparedOrderItem[]
  alertas_gerais: string[]
}
