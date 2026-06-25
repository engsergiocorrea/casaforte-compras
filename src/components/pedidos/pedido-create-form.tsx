'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
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
import { Card, CardContent } from '@/components/ui/card'
import { createPedido } from '@/app/(app)/pedidos/actions'
import { initialFormActionState } from '@/lib/action-result'
import type { FormActionState } from '@/lib/action-result'
import type { Engenheiro, Obra } from '@/types/database'

const PRIORIDADE_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export function PedidoCreateForm({
  obras,
  engenheiros,
}: {
  obras: Obra[]
  engenheiros: Engenheiro[]
}) {
  const [state, setState] = useState<FormActionState>(initialFormActionState)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await createPedido(initialFormActionState, formData)
      if (result && !result.success) {
        setState(result)
        if (result.error) toast.error(result.error)
      }
    })
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="obra_id">Obra *</Label>
            <Select name="obra_id" required>
              <SelectTrigger id="obra_id" className="w-full">
                <SelectValue placeholder="Selecione a obra" />
              </SelectTrigger>
              <SelectContent>
                {obras.map((obra) => (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.obra_id ? (
              <p className="text-sm text-destructive">{state.fieldErrors.obra_id[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="engenheiro_id">Engenheiro responsável</Label>
            <Select name="engenheiro_id">
              <SelectTrigger id="engenheiro_id" className="w-full">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {engenheiros.map((engenheiro) => (
                  <SelectItem key={engenheiro.id} value={engenheiro.id}>
                    {engenheiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <Select name="prioridade" defaultValue="normal">
                <SelectTrigger id="prioridade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_necessidade">Data de necessidade</Label>
              <Input id="data_necessidade" name="data_necessidade" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes_gerais">Observações gerais</Label>
            <Textarea id="observacoes_gerais" name="observacoes_gerais" />
          </div>

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Criando...' : 'Criar pedido (rascunho)'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
