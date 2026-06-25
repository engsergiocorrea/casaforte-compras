'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { MaterialFormDialog } from '@/components/catalogo/material-form-dialog'
import { setMaterialCatalogoAtivo } from '@/app/(app)/catalogo/actions'
import type { CategoriaMaterial, MaterialCatalogo } from '@/types/database'

export function MateriaisTable({
  materiais,
  categorias,
  categoriasPorId,
  canManage,
}: {
  materiais: MaterialCatalogo[]
  categorias: CategoriaMaterial[]
  categoriasPorId: Record<string, string>
  canManage: boolean
}) {
  if (materiais.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhum material cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead className="text-right">Ações</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {materiais.map((material) => (
            <TableRow key={material.id}>
              <TableCell className="font-medium">{material.nome_padronizado}</TableCell>
              <TableCell>
                {material.categoria_id ? categoriasPorId[material.categoria_id] ?? '-' : '-'}
              </TableCell>
              <TableCell>{material.unidade_padrao || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {material.criado_por_ia ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      IA
                    </Badge>
                  ) : (
                    <Badge variant="outline">Manual</Badge>
                  )}
                  {material.aprovado ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Aprovado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Não aprovado
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={material.ativo ? 'ativo' : 'inativo'} />
              </TableCell>
              {canManage ? (
                <TableCell className="flex justify-end gap-2">
                  <MaterialFormDialog
                    material={material}
                    categorias={categorias}
                    trigger={<Button variant="outline" size="sm">Editar</Button>}
                  />
                  {material.ativo ? (
                    <ConfirmActionButton
                      label="Inativar"
                      title="Inativar material"
                      description={`Tem certeza que deseja inativar "${material.nome_padronizado}"?`}
                      successMessage="Material inativado."
                      action={() => setMaterialCatalogoAtivo(material.id, false)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Reativar"
                      title="Reativar material"
                      description={`Tem certeza que deseja reativar "${material.nome_padronizado}"?`}
                      successMessage="Material reativado."
                      action={() => setMaterialCatalogoAtivo(material.id, true)}
                    />
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
