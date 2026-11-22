import { Button } from '@/components/ui/button'
import { CategoriasTable } from '@/components/categorias/categorias-table'
import { CategoriaFormDialog } from '@/components/categorias/categoria-form-dialog'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageMasterData } from '@/lib/permissions/can'
import type { CategoriaMaterial } from '@/types/database'

export default async function CategoriasPage() {
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()
  const canManage = canManageMasterData(profile?.role)

  const { data: categorias, error } = await supabase
    .from('categorias_materiais')
    .select('*')
    .order('nome', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-3xl">Categorias</h1>
          <p className="text-muted-foreground">Categorias usadas no catálogo e nos pedidos.</p>
        </div>
        {canManage ? (
          <CategoriaFormDialog trigger={<Button>Nova categoria</Button>} />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar categorias: {error.message}
        </div>
      ) : (
        <CategoriasTable
          categorias={(categorias as CategoriaMaterial[]) ?? []}
          canManage={canManage}
        />
      )}
    </div>
  )
}
