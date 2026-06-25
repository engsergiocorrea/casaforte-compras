import { z } from 'zod'

export const engenheiroSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do engenheiro.'),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  telefone: z.string().trim().optional().or(z.literal('')),
  cargo: z.string().trim().optional().or(z.literal('')),
  registro_profissional: z.string().trim().optional().or(z.literal('')),
  ativo: z.coerce.boolean(),
})

export type EngenheiroInput = z.infer<typeof engenheiroSchema>
