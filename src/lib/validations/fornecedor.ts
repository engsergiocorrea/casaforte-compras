import { z } from 'zod'

export const fornecedorStatusValues = ['ativo', 'inativo', 'arquivado'] as const

export const fornecedorSchema = z.object({
  nome_fantasia: z.string().trim().min(2, 'Informe o nome fantasia.'),
  razao_social: z.string().trim().optional().or(z.literal('')),
  cnpj: z.string().trim().optional().or(z.literal('')),
  categoria_principal: z.string().trim().optional().or(z.literal('')),
  categorias_atendidas: z.string().trim().optional().or(z.literal('')),
  contato_principal: z.string().trim().optional().or(z.literal('')),
  telefone_whatsapp: z.string().trim().min(8, 'Informe um telefone/WhatsApp válido.'),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  cidade: z.string().trim().optional().or(z.literal('')),
  estado: z.string().trim().max(2, 'Use a sigla do estado (ex: SP).').optional().or(z.literal('')),
  endereco: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal('')),
  fornecedor_principal: z.coerce.boolean(),
  status: z.enum(fornecedorStatusValues),
})

export type FornecedorInput = z.infer<typeof fornecedorSchema>
