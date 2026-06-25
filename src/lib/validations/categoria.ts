import { z } from 'zod'

export const categoriaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da categoria.'),
  descricao: z.string().trim().optional().or(z.literal('')),
  ativo: z.coerce.boolean(),
})

export type CategoriaInput = z.infer<typeof categoriaSchema>
