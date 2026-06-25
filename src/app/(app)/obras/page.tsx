import { Button } from '@/components/ui/button'
import { ObrasTable } from '@/components/obras/obras-table'
import { ObraFormDialog } from '@/components/obras/obra-form-dialog'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import type { Obra } from '@/types/database'

export default async function ObrasPage() {
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()
  const canManage = canManageMasterData(profile?.role)

  const { data: obras, error } = await supabase
    .from('obras')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Obras</h1>
          <p className="text-muted-foreground">Obras da Casa Forte e seus responsáveis.</p>
        </div>
        {canManage ? (
          <ObraFormDialog trigger={<Button>Nova obra</Button>} />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar obras: {error.message}
        </div>
      ) : (
        <ObrasTable obras={(obras as Obra[]) ?? []} canManage={canManage} />
      )}
    </div>
  )
}
