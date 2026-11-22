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
    currentPrioridade !== 'todas' || currentObraId !== 'todas'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={currentPrioridade} onValueChange={(value) => setParam('prioridade', value)}>
        <SelectTrigger className="h-9 w-[calc(50%-4px)] rounded-full sm:w-44">
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
        <SelectTrigger className="h-9 w-[calc(50%-4px)] rounded-full sm:w-52">
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
        <Button variant="ghost" size="sm" className="rounded-full text-primary" onClick={() => router.push('/pedidos')}>
          Limpar
        </Button>
      ) : null}
    </div>
  )
}
