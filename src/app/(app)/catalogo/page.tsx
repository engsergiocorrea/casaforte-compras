import { Button } from '@/components/ui/button'
import { MateriaisTable } from '@/components/catalogo/materiais-table'
import { MaterialFormDialog } from '@/components/catalogo/material-form-dialog'
import { GerarImagensButton } from '@/components/catalogo/gerar-imagens-button'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canManageCatalog } from '@/lib/permissions/can'
import type { CategoriaMaterial, MaterialCatalogo } from '@/types/database'

export default async function CatalogoPage() {
  const supabase = await createServerSupabaseClient()
  const profile = await getCurrentUser()
  const canManage = canManageCatalog(profile?.role)

  const [
    { data: materiais, error: materiaisError },
    { data: categorias, error: categoriasError },
    { data: imagensAprovadas },
  ] = await Promise.all([
    supabase.from('materiais_catalogo').select('*').order('created_at', { ascending: false }),
    supabase.from('categorias_materiais').select('*').eq('ativo', true).order('nome'),
    supabase
      .from('material_images')
      .select('material_catalogo_id, image_url')
      .eq('aprovado', true)
      .eq('principal', true),
  ])

  const categoriasList = (categorias as CategoriaMaterial[]) ?? []
  const categoriasPorId = Object.fromEntries(categoriasList.map((c) => [c.id, c.nome]))
  const imagemPorMaterial: Record<string, string> = Object.fromEntries(
    (imagensAprovadas ?? [])
      .filter((img) => !!img.material_catalogo_id)
      .map((img) => [img.material_catalogo_id as string, img.image_url])
  )
  const error = materiaisError || categoriasError
  const semImagem = ((materiais as MaterialCatalogo[]) ?? []).filter((m) => !imagemPorMaterial[m.id]).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">
            Catálogo padronizado usado nos pedidos. A IA reaproveita estes materiais e as imagens.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <GerarImagensButton semImagem={semImagem} />
            <MaterialFormDialog
              categorias={categoriasList}
              trigger={<Button>Novo material</Button>}
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar catálogo: {error.message}
        </div>
      ) : (
        <MateriaisTable
          materiais={(materiais as MaterialCatalogo[]) ?? []}
          categorias={categoriasList}
          categoriasPorId={categoriasPorId}
          imagemPorMaterial={imagemPorMaterial}
          canManage={canManage}
        />
      )}
    </div>
  )
}
