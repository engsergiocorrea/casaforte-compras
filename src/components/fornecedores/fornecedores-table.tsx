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
import { FornecedorFormDialog } from '@/components/fornecedores/fornecedor-form-dialog'
import { setFornecedorStatus } from '@/app/(app)/fornecedores/actions'
import type { Fornecedor } from '@/types/database'

export function FornecedoresTable({
  fornecedores,
  canManage,
}: {
  fornecedores: Fornecedor[]
  canManage: boolean
}) {
  if (fornecedores.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhum fornecedor cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead className="text-right">Ações</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {fornecedores.map((fornecedor) => (
            <TableRow key={fornecedor.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {fornecedor.nome_fantasia}
                  {fornecedor.fornecedor_principal ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                      Principal
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{fornecedor.categoria_principal || '-'}</TableCell>
              <TableCell>{fornecedor.telefone_whatsapp}</TableCell>
              <TableCell>
                <StatusBadge status={fornecedor.status} />
              </TableCell>
              {canManage ? (
                <TableCell className="flex justify-end gap-2">
                  <FornecedorFormDialog
                    fornecedor={fornecedor}
                    trigger={<Button variant="outline" size="sm">Editar</Button>}
                  />
                  {fornecedor.status === 'ativo' ? (
                    <ConfirmActionButton
                      label="Inativar"
                      title="Inativar fornecedor"
                      description={`Tem certeza que deseja inativar "${fornecedor.nome_fantasia}"?`}
                      successMessage="Fornecedor inativado."
                      action={() => setFornecedorStatus(fornecedor.id, 'inativo')}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Reativar"
                      title="Reativar fornecedor"
                      description={`Tem certeza que deseja reativar "${fornecedor.nome_fantasia}"?`}
                      successMessage="Fornecedor reativado."
                      action={() => setFornecedorStatus(fornecedor.id, 'ativo')}
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
