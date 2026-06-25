import { z } from 'zod'

export const prioridadeValues = ['baixa', 'normal', 'alta', 'urgente'] as const

export const pedidoHeaderSchema = z.object({
  obra_id: z.string().trim().min(1, 'Selecione a obra.'),
  engenheiro_id: z.string().trim().optional().or(z.literal('')),
  prioridade: z.enum(prioridadeValues),
  data_necessidade: z.string().trim().optional().or(z.literal('')),
  observacoes_gerais: z.string().trim().optional().or(z.literal('')),
})

export type PedidoHeaderInput = z.infer<typeof pedidoHeaderSchema>

export const pedidoItemSchema = z.object({
  nome_material: z.string().trim().min(2, 'Informe o material.'),
  material_catalogo_id: z.string().trim().optional().or(z.literal('')),
  categoria_id: z.string().trim().optional().or(z.literal('')),
  quantidade: z.coerce.number().positive('Informe uma quantidade válida.'),
  unidade: z.string().trim().optional().or(z.literal('')),
  marca_preferencial: z.string().trim().optional().or(z.literal('')),
  especificacao_tecnica: z.string().trim().optional().or(z.literal('')),
  local_de_aplicacao: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal('')),
})

export type PedidoItemInput = z.infer<typeof pedidoItemSchema>

export const devolverSchema = z.object({
  comentario: z.string().trim().min(5, 'Informe o motivo da devolução.'),
})
