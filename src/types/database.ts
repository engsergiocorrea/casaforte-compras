export type ProfileRole = 'admin' | 'diretoria' | 'compras' | 'engenheiro' | 'visualizador'

export type Profile = {
  id: string
  user_id: string
  nome: string
  email: string
  telefone: string | null
  role: ProfileRole
  ativo: boolean
  created_at: string
  updated_at: string
}

export type Obra = {
  id: string
  nome: string
  endereco: string | null
  cidade: string | null
  estado: string | null
  status: 'ativa' | 'pausada' | 'concluida' | 'arquivada'
  responsavel_tecnico: string | null
  data_inicio: string | null
  previsao_termino: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type Engenheiro = {
  id: string
  profile_id: string | null
  nome: string
  email: string | null
  telefone: string | null
  cargo: string | null
  registro_profissional: string | null
  assinatura_url: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export type CategoriaMaterial = {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
}

export type Fornecedor = {
  id: string
  nome_fantasia: string
  razao_social: string | null
  cnpj: string | null
  categoria_principal: string | null
  categorias_atendidas: string[]
  contato_principal: string | null
  telefone_whatsapp: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  endereco: string | null
  observacoes: string | null
  fornecedor_principal: boolean
  status: 'ativo' | 'inativo' | 'arquivado'
  created_at: string
  updated_at: string
}

export type MaterialCatalogo = {
  id: string
  nome_padronizado: string
  nome_normalizado: string
  categoria_id: string | null
  unidade_padrao: string | null
  descricao_padrao: string | null
  especificacao_padrao: string | null
  marcas_aceitas: string[] | null
  observacoes: string | null
  ativo: boolean
  criado_por_ia: boolean
  aprovado: boolean
  created_at: string
  updated_at: string
}

export type MaterialImage = {
  id: string
  material_catalogo_id: string | null
  categoria_id: string | null
  nome_material: string | null
  image_url: string
  origem: 'upload_manual' | 'pedido_anterior' | 'catalogo_interno' | 'busca_ia' | 'referencia_web' | 'imagem_ilustrativa'
  termos_busca: string[]
  aprovado: boolean
  principal: boolean
  created_by: string | null
  created_at: string
}

export type PedidoStatus =
  | 'rascunho'
  | 'pendente_revisao'
  | 'em_revisao'
  | 'pendente_aprovacao'
  | 'aprovado'
  | 'enviado'
  | 'respondido'
  | 'parcialmente_comprado'
  | 'comprado'
  | 'cancelado'
  | 'devolvido'

export type PedidoCompra = {
  id: string
  numero: number
  obra_id: string
  solicitante_id: string | null
  engenheiro_id: string | null
  status: PedidoStatus
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  data_necessidade: string | null
  observacoes_gerais: string | null
  pdf_url: string | null
  enviado_em: string | null
  aprovado_por: string | null
  aprovado_em: string | null
  ia_preparado_em: string | null
  created_at: string
  updated_at: string
}

export type PedidoCompraItem = {
  id: string
  pedido_compra_id: string
  material_catalogo_id: string | null
  categoria_id: string | null
  nome_material: string
  nome_padronizado: string | null
  descricao: string | null
  unidade: string | null
  quantidade: number
  marca_preferencial: string | null
  especificacao_tecnica: string | null
  local_de_aplicacao: string | null
  observacoes: string | null
  imagem_referencia_url: string | null
  imagem_origem: string | null
  imagem_aprovada: boolean
  ia_resumo: string | null
  ia_termos_busca: string[]
  ia_alertas: string[]
  ia_confianca: number | null
  precisa_revisao: boolean
  created_at: string
  updated_at: string
}

export type WhatsappEnvio = {
  id: string
  pedido_compra_id: string
  fornecedor_id: string | null
  telefone: string
  mensagem: string | null
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read'
  whatsapp_message_id: string | null
  error_message: string | null
  enviado_em: string | null
  created_at: string
}

export type ObraEngenheiro = {
  id: string
  obra_id: string
  engenheiro_id: string
  created_at: string
}

export type AprovacaoAcao =
  | 'criado'
  | 'enviado_revisao'
  | 'revisado'
  | 'enviado_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'devolvido'
  | 'enviado_whatsapp'
  | 'cancelado'
  | 'marcado_comprado'
  | 'pdf_gerado'
  | 'ia_preparado'

export type AprovacaoPedido = {
  id: string
  pedido_compra_id: string
  user_id: string | null
  acao: AprovacaoAcao
  comentario: string | null
  created_at: string
}

export type RespostaFornecedor = {
  id: string
  pedido_compra_id: string
  fornecedor_id: string
  respondeu: boolean
  valor_total: number | null
  prazo_entrega: string | null
  condicao_pagamento: string | null
  observacoes: string | null
  anexo_url: string | null
  created_at: string
  updated_at: string
}

export type ActivityLog = {
  id: string
  user_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
}
