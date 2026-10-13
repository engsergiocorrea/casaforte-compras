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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createObra, updateObra } from '@/app/(app)/obras/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { Obra, SiengeEmpreendimento } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'arquivada', label: 'Arquivada' },
]

export function ObraFormDialog({
  obra,
  obras,
  empreendimentosSienge,
  trigger,
}: {
  obra?: Obra
  obras: Obra[]
  empreendimentosSienge: SiengeEmpreendimento[]
  trigger: React.ReactElement
}) {
  // A obra É o empreendimento do Sienge: obrigatório na criação; obra antiga sem
  // vínculo pode ser vinculada uma vez (depois o banco não deixa trocar).
  const vinculoFixo = obra?.sienge_enterprise_id ?? null
  const usados = new Map(
    obras.filter((o) => o.sienge_enterprise_id && o.id !== obra?.id).map((o) => [o.sienge_enterprise_id!, o.nome])
  )
  const [siengeId, setSiengeId] = useState<string>(vinculoFixo ? String(vinculoFixo) : '')
  const [nome, setNome] = useState(obra?.nome ?? '')
  const [cidade, setCidade] = useState(obra?.cidade ?? '')
  const [estado, setEstado] = useState(obra?.estado ?? '')

  function escolherSienge(value: string) {
    setSiengeId(value)
    const emp = empreendimentosSienge.find((e) => String(e.id) === value)
    if (!emp || obra) return
    setNome(emp.nome.charAt(0) + emp.nome.slice(1).toLowerCase())
    if (emp.cidade) setCidade(emp.cidade)
    if (emp.uf) setEstado(emp.uf)
  }
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()
  const action = obra ? updateObra : createObra

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await action(initialFormActionState, formData)
      setState(result)

      if (result.success) {
        toast.success(obra ? 'Obra atualizada com sucesso.' : 'Obra criada com sucesso.')
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
        if (next) {
          setState(initialFormActionState)
          setSiengeId(vinculoFixo ? String(vinculoFixo) : '')
          setNome(obra?.nome ?? '')
          setCidade(obra?.cidade ?? '')
          setEstado(obra?.estado ?? '')
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{obra ? 'Editar obra' : 'Nova obra'}</DialogTitle>
          <DialogDescription>
            Preencha os dados da obra. Campos marcados são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {obra ? <input type="hidden" name="id" value={obra.id} /> : null}

          <input type="hidden" name="sienge_enterprise_id" value={vinculoFixo ? '' : siengeId} />
          <div className="space-y-2">
            <Label>Empreendimento no Sienge {obra ? '' : '*'}</Label>
            {vinculoFixo ? (
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                ✓ {empreendimentosSienge.find((e) => e.id === vinculoFixo)?.nome ?? 'Empreendimento'}{' '}
                <span className="text-muted-foreground">(Sienge #{vinculoFixo}) — vínculo fixo</span>
              </p>
            ) : (
              <>
                <Select value={siengeId} onValueChange={(value) => escolherSienge(value as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o empreendimento no Sienge" />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendimentosSienge.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)} disabled={usados.has(e.id)}>
                        {e.nome}
                        {e.cidade ? ` — ${e.cidade}${e.uf ? '/' + e.uf : ''}` : ''}
                        {usados.has(e.id) ? ` · já é a obra "${usados.get(e.id)}"` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {obra
                    ? 'Obra sem vínculo com o Sienge: vincule para usá-la em novos pedidos.'
                    : 'A obra é o empreendimento do Sienge. Não está na lista? Cadastre no Sienge e atualize em Obras/RDO → “Atualizar do Sienge”.'}
                </p>
              </>
            )}
            {state.fieldErrors?.sienge_enterprise_id ? (
              <p className="text-sm text-destructive">{state.fieldErrors.sienge_enterprise_id[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome de exibição *</Label>
            <Input id="nome" name="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            {state.fieldErrors?.nome ? (
              <p className="text-sm text-destructive">{state.fieldErrors.nome[0]}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" name="estado" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" name="endereco" defaultValue={obra?.endereco ?? ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select name="status" defaultValue={obra?.status ?? 'ativa'}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de início</Label>
              <Input
                id="data_inicio"
                name="data_inicio"
                type="date"
                defaultValue={obra?.data_inicio ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previsao_termino">Previsão de término</Label>
              <Input
                id="previsao_termino"
                name="previsao_termino"
                type="date"
                defaultValue={obra?.previsao_termino ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel_tecnico">Responsável técnico</Label>
            <Input
              id="responsavel_tecnico"
              name="responsavel_tecnico"
              defaultValue={obra?.responsavel_tecnico ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" defaultValue={obra?.observacoes ?? ''} />
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
