'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { Obra } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'pendente_revisao', label: 'Pendente de revisão (legado)' },
  { value: 'em_revisao', label: 'Em revisão (legado)' },
  { value: 'pendente_aprovacao', label: 'Aguardando aprovação' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'devolvido', label: 'Devolvido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const PRIORIDADE_OPTIONS = [
  { value: 'todas', label: 'Todas as prioridades' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export function PedidosFilters({
  obras,
  currentStatus,
  currentPrioridade,
  currentObraId,
}: {
  obras: Obra[]
  currentStatus: string
  currentPrioridade: string
  currentObraId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'todos' || value === 'todas') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/pedidos?${params.toString()}`)
  }

  const hasActiveFilters =
    currentStatus !== 'todos' || currentPrioridade !== 'todas' || currentObraId !== 'todas'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={currentStatus} onValueChange={(value) => setParam('status', value)}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentPrioridade} onValueChange={(value) => setParam('prioridade', value)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          {PRIORIDADE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentObraId} onValueChange={(value) => setParam('obra_id', value)}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Obra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as obras</SelectItem>
          {obras.map((obra) => (
            <SelectItem key={obra.id} value={obra.id}>
              {obra.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="outline" size="sm" onClick={() => router.push('/pedidos')}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
