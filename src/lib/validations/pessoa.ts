import { z } from 'zod'
import { PERMISSION_MODULES } from '@/lib/permissions/user-permissions'

export const perfilGeralValues = [
  'diretor_geral',
  'diretor_financeiro',
  'financeiro',
  'engenheiro',
  'obras',
  'compras',
  'rdo',
  'tabelas',
  'administrador',
] as const

export const roleValues = ['admin', 'diretoria', 'compras', 'engenheiro', 'visualizador'] as const

export const pessoaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.'),
  email: z.string().trim().email('E-mail inválido.'),
  telefone: z.string().trim().optional().or(z.literal('')),
  cargo: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal('')),
  role: z.enum(roleValues),
  ativo: z.coerce.boolean(),
  perfis_gerais: z.array(z.enum(perfilGeralValues)).default([]),
})

export type PessoaInput = z.infer<typeof pessoaSchema>

// permissions vem como uma lista de "module:permission" marcados no form.
export const permissionsListSchema = z.array(
  z.string().refine((value) => {
    const [module] = value.split(':')
    return PERMISSION_MODULES.includes(module as (typeof PERMISSION_MODULES)[number])
  })
)
