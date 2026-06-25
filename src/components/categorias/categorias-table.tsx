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
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmActionButton } from '@/components/shared/confirm-action-button'
import { CategoriaFormDialog } from '@/components/categorias/categoria-form-dialog'
import { setCategoriaAtivo } from '@/app/(app)/categorias/actions'
import type { CategoriaMaterial } from '@/types/database'

export function CategoriasTable({
  categorias,
  canManage,
}: {
  categorias: CategoriaMaterial[]
  canManage: boolean
}) {
  if (categorias.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhuma categoria cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead className="text-right">Ações</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {categorias.map((categoria) => (
            <TableRow key={categoria.id}>
              <TableCell className="font-medium">{categoria.nome}</TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">
                {categoria.descricao || '-'}
              </TableCell>
              <TableCell>
                <StatusBadge status={categoria.ativo ? 'ativo' : 'inativo'} />
              </TableCell>
              {canManage ? (
                <TableCell className="flex justify-end gap-2">
                  <CategoriaFormDialog
                    categoria={categoria}
                    trigger={<Button variant="outline" size="sm">Editar</Button>}
                  />
                  {categoria.ativo ? (
                    <ConfirmActionButton
                      label="Inativar"
                      title="Inativar categoria"
                      description={`Tem certeza que deseja inativar "${categoria.nome}"?`}
                      successMessage="Categoria inativada."
                      action={() => setCategoriaAtivo(categoria.id, false)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Reativar"
                      title="Reativar categoria"
                      description={`Tem certeza que deseja reativar "${categoria.nome}"?`}
                      successMessage="Categoria reativada."
                      action={() => setCategoriaAtivo(categoria.id, true)}
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
