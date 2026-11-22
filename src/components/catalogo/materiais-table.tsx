'use client'

import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { MaterialFormDialog } from '@/components/catalogo/material-form-dialog'
import { MaterialImageDialog } from '@/components/catalogo/material-image-dialog'
import { setMaterialCatalogoAtivo } from '@/app/(app)/catalogo/actions'
import type { CategoriaMaterial, MaterialCatalogo } from '@/types/database'

// Catálogo em grade de fotos (estilo loja): a imagem é o principal, nome e
// unidade embaixo; ações discretas para quem gerencia o catálogo.
export function MateriaisTable({
  materiais,
  categorias,
  categoriasPorId,
  imagemPorMaterial,
  canManage,
}: {
  materiais: MaterialCatalogo[]
  categorias: CategoriaMaterial[]
  categoriasPorId: Record<string, string>
  imagemPorMaterial: Record<string, string>
  canManage: boolean
}) {
  if (materiais.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        Nenhum material ainda. Eles aparecem aqui conforme os pedidos são preparados pela IA.
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {materiais.map((material) => {
        const img = imagemPorMaterial[material.id]
        const categoria = material.categoria_id ? categoriasPorId[material.categoria_id] : null
        return (
          <li
            key={material.id}
            className={`flex flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_oklch(0_0_0/4%),0_0_0_0.5px_oklch(0_0_0/5%)] ${material.ativo ? '' : 'opacity-55'}`}
          >
            <div className="aspect-square bg-white">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={material.nome_padronizado} loading="lazy" className="size-full object-contain p-2" />
              ) : (
                <div className="grid size-full place-items-center bg-muted text-muted-foreground/50">
                  <Package className="size-8" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 p-3">
              <p className="line-clamp-2 text-[14px] font-medium leading-snug">{material.nome_padronizado}</p>
              <p className="text-[12px] text-muted-foreground">
                {[material.unidade_padrao, categoria].filter(Boolean).join(' · ') || '—'}
                {!material.ativo ? ' · inativo' : ''}
              </p>
              {canManage ? (
                <div className="-mx-1 mt-auto flex flex-wrap gap-0.5 pt-2">
                  <MaterialImageDialog
                    materialId={material.id}
                    trigger={<Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-[12px] text-primary">{img ? 'Foto' : 'Enviar foto'}</Button>}
                  />
                  <MaterialFormDialog
                    material={material}
                    categorias={categorias}
                    trigger={<Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-[12px] text-primary">Editar</Button>}
                  />
                  <ConfirmActionButton
                    label={material.ativo ? 'Inativar' : 'Reativar'}
                    title={material.ativo ? 'Inativar material' : 'Reativar material'}
                    description={`${material.ativo ? 'Inativar' : 'Reativar'} "${material.nome_padronizado}"?`}
                    successMessage={material.ativo ? 'Material inativado.' : 'Material reativado.'}
                    variant="ghost"
                    className="h-7 rounded-full px-2 text-[12px] text-muted-foreground"
                    action={() => setMaterialCatalogoAtivo(material.id, !material.ativo)}
                  />
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
