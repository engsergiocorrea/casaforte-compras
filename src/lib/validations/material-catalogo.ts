import { z } from 'zod'

export const materialCatalogoSchema = z.object({
  nome_padronizado: z.string().trim().min(2, 'Informe o nome do material.'),
  categoria_id: z.string().trim().optional().or(z.literal('')),
  unidade_padrao: z.string().trim().optional().or(z.literal('')),
  descricao_padrao: z.string().trim().optional().or(z.literal('')),
  especificacao_padrao: z.string().trim().optional().or(z.literal('')),
  marcas_aceitas: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal('')),
  ativo: z.coerce.boolean(),
  aprovado: z.coerce.boolean(),
})

export type MaterialCatalogoInput = z.infer<typeof materialCatalogoSchema>
