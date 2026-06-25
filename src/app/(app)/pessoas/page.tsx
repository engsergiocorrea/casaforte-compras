import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PessoasTable } from '@/components/pessoas/pessoas-table'
import { PessoaFormDialog } from '@/components/pessoas/pessoa-form-dialog'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getUserPermissions } from '@/lib/permissions/user-permissions'
import type { Profile } from '@/types/database'

export default async function PessoasPage() {
  const profile = await getCurrentUser()

  // Só admin/diretoria podem acessar esta tela (cadastro de pessoas e
  // permissões). Mesma regra usada na sidebar e nas server actions.
  if (!profile || (profile.role !== 'admin' && profile.role !== 'diretoria')) {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()

  const { data: pessoas, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const pessoasTyped = (pessoas as Profile[]) ?? []

  const permissionsByProfile: Record<string, { module: string; permission: string }[]> = {}
  await Promise.all(
    pessoasTyped.map(async (pessoa) => {
      permissionsByProfile[pessoa.id] = await getUserPermissions(supabase, pessoa.id)
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pessoas e Acessos</h1>
          <p className="text-muted-foreground">
            Cadastro de pessoas, perfis gerais e permissões granulares do sistema.
          </p>
        </div>
        <PessoaFormDialog trigger={<Button>Nova pessoa</Button>} />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar pessoas: {error.message}
        </div>
      ) : (
        <PessoasTable pessoas={pessoasTyped} permissionsByProfile={permissionsByProfile} />
      )}
    </div>
  )
}
