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
import { PessoaFormDialog } from '@/components/pessoas/pessoa-form-dialog'
import { setPessoaAtiva } from '@/app/(app)/pessoas/actions'
import type { Profile } from '@/types/database'

const PERFIL_LABELS: Record<string, string> = {
  diretor_geral: 'Diretor geral',
  diretor_financeiro: 'Diretor financeiro',
  financeiro: 'Financeiro',
  engenheiro: 'Engenheiro',
  obras: 'Obras',
  compras: 'Compras',
  rdo: 'RDO',
  tabelas: 'Tabelas',
  administrador: 'Administrador',
}

export function PessoasTable({
  pessoas,
  permissionsByProfile,
}: {
  pessoas: Profile[]
  permissionsByProfile: Record<string, { module: string; permission: string }[]>
}) {
  if (pessoas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        Nenhuma pessoa cadastrada ainda.
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
            <TableHead>Perfis gerais</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pessoas.map((pessoa) => (
            <TableRow key={pessoa.id}>
              <TableCell className="font-medium">{pessoa.nome}</TableCell>
              <TableCell>
                {[pessoa.email, pessoa.telefone].filter(Boolean).join(' · ') || '-'}
              </TableCell>
              <TableCell>{pessoa.cargo || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {pessoa.perfis_gerais.length === 0 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    pessoa.perfis_gerais.map((perfil) => (
                      <Badge key={perfil} variant="outline">
                        {PERFIL_LABELS[perfil] ?? perfil}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={pessoa.ativo ? 'ativo' : 'inativo'} />
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <PessoaFormDialog
                  pessoa={pessoa}
                  permissoesAtuais={permissionsByProfile[pessoa.id] ?? []}
                  trigger={
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  }
                />
                {pessoa.ativo ? (
                  <ConfirmActionButton
                    label="Inativar"
                    title="Inativar pessoa"
                    description={`Tem certeza que deseja inativar "${pessoa.nome}"?`}
                    successMessage="Pessoa inativada."
                    action={() => setPessoaAtiva(pessoa.id, false)}
                  />
                ) : (
                  <ConfirmActionButton
                    label="Reativar"
                    title="Reativar pessoa"
                    description={`Tem certeza que deseja reativar "${pessoa.nome}"?`}
                    successMessage="Pessoa reativada."
                    action={() => setPessoaAtiva(pessoa.id, true)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
