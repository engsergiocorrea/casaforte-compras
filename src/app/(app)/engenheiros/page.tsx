import { Button } from '@/components/ui/button'
import { EngenheirosTable } from '@/components/engenheiros/engenheiros-table'
import { EngenheiroFormDialog } from '@/components/engenheiros/engenheiro-form-dialog'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import type { Engenheiro } from '@/types/database'

export default async function EngenheirosPage() {
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()
  const canManage = canManageMasterData(profile?.role)

  const { data: engenheiros, error } = await supabase
    .from('engenheiros')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Engenheiros</h1>
          <p className="text-muted-foreground">Responsáveis técnicos das obras.</p>
        </div>
        {canManage ? (
          <EngenheiroFormDialog trigger={<Button>Novo engenheiro</Button>} />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar engenheiros: {error.message}
        </div>
      ) : (
        <EngenheirosTable engenheiros={(engenheiros as Engenheiro[]) ?? []} canManage={canManage} />
      )}
    </div>
  )
}
