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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFornecedor, updateFornecedor } from '@/app/(app)/fornecedores/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { Fornecedor } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'arquivado', label: 'Arquivado' },
]

export function FornecedorFormDialog({
  fornecedor,
  trigger,
}: {
  fornecedor?: Fornecedor
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const action = fornecedor ? updateFornecedor : createFornecedor

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(
          fornecedor ? 'Fornecedor atualizado com sucesso.' : 'Fornecedor cadastrado com sucesso.'
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
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
          <DialogDescription>
            Cadastre os dados do fornecedor para envio de pedidos por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fornecedor ? <input type="hidden" name="id" value={fornecedor.id} /> : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome fantasia *</Label>
              <Input
                id="nome_fantasia"
                name="nome_fantasia"
                required
                defaultValue={fornecedor?.nome_fantasia}
              />
              {state.fieldErrors?.nome_fantasia ? (
                <p className="text-sm text-destructive">{state.fieldErrors.nome_fantasia[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão social</Label>
              <Input
                id="razao_social"
                name="razao_social"
                defaultValue={fornecedor?.razao_social ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" defaultValue={fornecedor?.cnpj ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone_whatsapp">WhatsApp *</Label>
              <Input
                id="telefone_whatsapp"
                name="telefone_whatsapp"
                required
                placeholder="5511999999999"
                defaultValue={fornecedor?.telefone_whatsapp ?? ''}
              />
              {state.fieldErrors?.telefone_whatsapp ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.telefone_whatsapp[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contato_principal">Contato principal</Label>
              <Input
                id="contato_principal"
                name="contato_principal"
                defaultValue={fornecedor?.contato_principal ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={fornecedor?.email ?? ''} />
              {state.fieldErrors?.email ? (
                <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria_principal">Categoria principal</Label>
              <Input
                id="categoria_principal"
                name="categoria_principal"
                placeholder="Ex: Elétrica"
                defaultValue={fornecedor?.categoria_principal ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categorias_atendidas">Categorias atendidas</Label>
              <Input
                id="categorias_atendidas"
                name="categorias_atendidas"
                placeholder="Separadas por vírgula"
                defaultValue={fornecedor?.categorias_atendidas?.join(', ') ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" defaultValue={fornecedor?.cidade ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                name="estado"
                maxLength={2}
                defaultValue={fornecedor?.estado ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" name="endereco" defaultValue={fornecedor?.endereco ?? ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select name="status" defaultValue={fornecedor?.status ?? 'ativo'}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="fornecedor_principal">Fornecedor principal</Label>
            <Switch
              id="fornecedor_principal"
              name="fornecedor_principal"
              defaultChecked={fornecedor?.fornecedor_principal ?? false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={fornecedor?.observacoes ?? ''}
            />
          </div>

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
