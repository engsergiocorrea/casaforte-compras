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
import { ObraFormDialog } from '@/components/obras/obra-form-dialog'
import { setObraStatus } from '@/app/(app)/obras/actions'
import type { Obra } from '@/types/database'

export function ObrasTable({ obras, canManage }: { obras: Obra[]; canManage: boolean }) {
  if (obras.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhuma obra cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável técnico</TableHead>
            {canManage ? <TableHead className="text-right">Ações</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {obras.map((obra) => (
            <TableRow key={obra.id}>
              <TableCell className="font-medium">{obra.nome}</TableCell>
              <TableCell>
                {[obra.cidade, obra.estado].filter(Boolean).join(' / ') || '-'}
              </TableCell>
              <TableCell>
                <StatusBadge status={obra.status} />
              </TableCell>
              <TableCell>{obra.responsavel_tecnico || '-'}</TableCell>
              {canManage ? (
                <TableCell className="flex justify-end gap-2">
                  <ObraFormDialog
                    obra={obra}
                    trigger={<Button variant="outline" size="sm">Editar</Button>}
                  />
                  {obra.status !== 'arquivada' ? (
                    <ConfirmActionButton
                      label="Arquivar"
                      title="Arquivar obra"
                      description={`Tem certeza que deseja arquivar a obra "${obra.nome}"? Ela deixará de aparecer como ativa.`}
                      successMessage="Obra arquivada."
                      action={() => setObraStatus(obra.id, 'arquivada')}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Reativar"
                      title="Reativar obra"
                      description={`Tem certeza que deseja reativar a obra "${obra.nome}"?`}
                      successMessage="Obra reativada."
                      action={() => setObraStatus(obra.id, 'ativa')}
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
