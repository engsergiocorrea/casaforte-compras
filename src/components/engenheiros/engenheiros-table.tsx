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
import { EngenheiroFormDialog } from '@/components/engenheiros/engenheiro-form-dialog'
import { setEngenheiroAtivo } from '@/app/(app)/engenheiros/actions'
import type { Engenheiro } from '@/types/database'

export function EngenheirosTable({
  engenheiros,
  canManage,
}: {
  engenheiros: Engenheiro[]
  canManage: boolean
}) {
  if (engenheiros.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhum engenheiro cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead className="text-right">Ações</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {engenheiros.map((engenheiro) => (
            <TableRow key={engenheiro.id}>
              <TableCell className="font-medium">{engenheiro.nome}</TableCell>
              <TableCell>
                {[engenheiro.email, engenheiro.telefone].filter(Boolean).join(' · ') || '-'}
              </TableCell>
              <TableCell>{engenheiro.cargo || '-'}</TableCell>
              <TableCell>
                <StatusBadge status={engenheiro.ativo ? 'ativo' : 'inativo'} />
              </TableCell>
              {canManage ? (
                <TableCell className="flex justify-end gap-2">
                  <EngenheiroFormDialog
                    engenheiro={engenheiro}
                    trigger={<Button variant="outline" size="sm">Editar</Button>}
                  />
                  {engenheiro.ativo ? (
                    <ConfirmActionButton
                      label="Inativar"
                      title="Inativar engenheiro"
                      description={`Tem certeza que deseja inativar "${engenheiro.nome}"?`}
                      successMessage="Engenheiro inativado."
                      action={() => setEngenheiroAtivo(engenheiro.id, false)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Reativar"
                      title="Reativar engenheiro"
                      description={`Tem certeza que deseja reativar "${engenheiro.nome}"?`}
                      successMessage="Engenheiro reativado."
                      action={() => setEngenheiroAtivo(engenheiro.id, true)}
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
