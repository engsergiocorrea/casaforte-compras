'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { criarPessoa, atualizarPessoa } from '@/app/(app)/pessoas/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import { perfilGeralValues, roleValues } from '@/lib/validations/pessoa'
import { MODULE_PERMISSIONS, type PermissionModule } from '@/lib/permissions/user-permissions'
import type { Profile } from '@/types/database'

const ROLE_LABELS: Record<(typeof roleValues)[number], string> = {
  admin: 'Administrador',
  diretoria: 'Diretoria',
  compras: 'Compras',
  engenheiro: 'Engenheiro',
  visualizador: 'Visualizador',
}

const PERFIL_LABELS: Record<(typeof perfilGeralValues)[number], string> = {
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

const MODULE_LABELS: Record<PermissionModule, string> = {
  compras: 'Compras',
  rdo: 'RDO',
  tabelas: 'Tabelas',
  obras: 'Obras',
}

const PERMISSION_LABELS: Record<string, string> = {
  criar_pedido: 'Criar pedido',
  ver_pedidos_proprios: 'Ver pedidos próprios',
  ver_todos_pedidos: 'Ver todos os pedidos',
  aprovar_pedido: 'Aprovar pedido',
  devolver_pedido: 'Devolver pedido',
  enviar_pedido_fornecedor: 'Enviar pedido ao fornecedor',
  cadastrar_fornecedores: 'Cadastrar fornecedores',
  cadastrar_materiais: 'Cadastrar materiais',
  cadastrar_obras: 'Cadastrar obras',
  cadastrar_engenheiros: 'Cadastrar engenheiros',
  acessar_configuracoes: 'Acessar configurações',
  criar_rdo: 'Criar RDO',
  ver_rdos: 'Ver RDOs',
  enviar_rdo_cliente: 'Enviar RDO ao cliente',
  cadastrar_clientes: 'Cadastrar clientes',
  ver_historico_envio: 'Ver histórico de envio',
  ver_tabela: 'Ver tabela',
  editar_unidades: 'Editar unidades',
  gerar_proposta: 'Gerar proposta',
  aplicar_reajuste: 'Aplicar reajuste',
  bloquear_unidade: 'Bloquear unidade',
  ver_relatorios: 'Ver relatórios',
  ver_obras: 'Ver obras',
  cadastrar_obra: 'Cadastrar obra',
  ver_cameras: 'Ver câmeras',
  gerenciar_equipe: 'Gerenciar equipe',
}

export function PessoaFormDialog({
  pessoa,
  permissoesAtuais = [],
  trigger,
}: {
  pessoa?: Profile
  permissoesAtuais?: { module: string; permission: string }[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<string>(pessoa?.role ?? 'visualizador')
  const action = pessoa ? atualizarPessoa : criarPessoa

  const permissoesAtuaisSet = new Set(permissoesAtuais.map((p) => `${p.module}:${p.permission}`))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(
          pessoa ? 'Pessoa atualizada com sucesso.' : 'Pessoa cadastrada. Um convite foi enviado por e-mail.'
        )
        setOpen(false)
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setState(initialFormActionState)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pessoa ? 'Editar pessoa' : 'Nova pessoa'}</DialogTitle>
          <DialogDescription>
            {pessoa
              ? 'Atualize os dados, perfis gerais e permissões desta pessoa.'
              : 'Um convite por e-mail será enviado via Supabase Auth para esta pessoa definir sua senha.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {pessoa ? <input type="hidden" name="id" value={pessoa.id} /> : null}
          <input type="hidden" name="role" value={role} />

          <Tabs defaultValue="dados">
            <TabsList>
              <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
              <TabsTrigger value="perfis">Perfis gerais</TabsTrigger>
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" name="nome" required defaultValue={pessoa?.nome} />
                {state.fieldErrors?.nome ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.nome[0]}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={!!pessoa}
                    defaultValue={pessoa?.email}
                  />
                  {state.fieldErrors?.email ? (
                    <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
                  ) : null}
                  {pessoa ? (
                    <p className="text-xs text-muted-foreground">
                      O e-mail não pode ser alterado após o convite.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" defaultValue={pessoa?.telefone ?? ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input id="cargo" name="cargo" defaultValue={pessoa?.cargo ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-select">Papel no sistema (acesso) *</Label>
                  <Select value={role} onValueChange={(value) => setRole(value ?? 'visualizador')}>
                    <SelectTrigger id="role-select" className="w-full">
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ROLE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" defaultValue={pessoa?.observacoes ?? ''} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="ativo">Pessoa ativa</Label>
                <Switch id="ativo" name="ativo" defaultChecked={pessoa ? pessoa.ativo : true} />
              </div>
            </TabsContent>

            <TabsContent value="perfis" className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Os perfis gerais são apenas rótulos informativos para organizar as pessoas — a
                permissão real de acesso é controlada na aba &quot;Permissões&quot;.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {perfilGeralValues.map((perfil) => (
                  <label key={perfil} className="group/field flex items-center gap-2 text-sm">
                    <Checkbox
                      name="perfis_gerais"
                      value={perfil}
                      defaultChecked={pessoa?.perfis_gerais?.includes(perfil)}
                    />
                    {PERFIL_LABELS[perfil]}
                  </label>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="permissoes" className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Permissões granulares por módulo. Admin e diretoria já têm acesso total
                independentemente destas marcações.
              </p>
              {(Object.keys(MODULE_PERMISSIONS) as PermissionModule[]).map((module) => (
                <div key={module} className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-semibold">{MODULE_LABELS[module]}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULE_PERMISSIONS[module].map((permission) => {
                      const key = `${module}:${permission}`
                      return (
                        <label key={key} className="group/field flex items-center gap-2 text-sm">
                          <Checkbox
                            name="permissions"
                            value={key}
                            defaultChecked={permissoesAtuaisSet.has(key)}
                          />
                          {PERMISSION_LABELS[permission] ?? permission}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
