import { Button } from '@/components/ui/button'
import { FornecedoresTable } from '@/components/fornecedores/fornecedores-table'
import { FornecedorFormDialog } from '@/components/fornecedores/fornecedor-form-dialog'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import type { Fornecedor } from '@/types/database'

export default async function FornecedoresPage() {
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()
  const canManage = canManageMasterData(profile?.role)

  const { data: fornecedores, error } = await supabase
    .from('fornecedores')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-3xl">Fornecedores</h1>
          <p className="text-muted-foreground">Fornecedores cadastrados para envio de pedidos.</p>
        </div>
        {canManage ? (
          <FornecedorFormDialog trigger={<Button>Novo fornecedor</Button>} />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar fornecedores: {error.message}
        </div>
      ) : (
        <FornecedoresTable
          fornecedores={(fornecedores as Fornecedor[]) ?? []}
          canManage={canManage}
        />
      )}
    </div>
  )
}
