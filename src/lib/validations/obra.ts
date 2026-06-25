import { z } from 'zod'

export const obraStatusValues = ['ativa', 'pausada', 'concluida', 'arquivada'] as const

export const obraSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da obra.'),
  endereco: z.string().trim().optional().or(z.literal('')),
  cidade: z.string().trim().optional().or(z.literal('')),
  estado: z.string().trim().max(2, 'Use a sigla do estado (ex: SP).').optional().or(z.literal('')),
  status: z.enum(obraStatusValues),
  responsavel_tecnico: z.string().trim().optional().or(z.literal('')),
  data_inicio: z.string().trim().optional().or(z.literal('')),
  previsao_termino: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal('')),
})

export type ObraInput = z.infer<typeof obraSchema>
