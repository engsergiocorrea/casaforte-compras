import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WhatsappEnvio } from '@/types/database'

const STATUS_LABELS: Record<WhatsappEnvio['status'], string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  failed: 'Falhou',
  delivered: 'Entregue',
  read: 'Lido',
}

const STATUS_CLASSES: Record<WhatsappEnvio['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  read: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

type WhatsappHistoryEntry = Pick<
  WhatsappEnvio,
  'id' | 'telefone' | 'status' | 'error_message' | 'enviado_em' | 'created_at'
> & {
  fornecedor: { nome_fantasia: string } | null
}

export function WhatsappHistory({ entries }: { entries: WhatsappHistoryEntry[] }) {
  if (entries.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Envios por WhatsApp</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 border-l pl-4">
          {entries.map((entry) => (
            <li key={entry.id} className="text-sm">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {entry.fornecedor?.nome_fantasia ?? 'Fornecedor removido'}
                </p>
                <Badge variant="outline" className={STATUS_CLASSES[entry.status]}>
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.telefone} ·{' '}
                {new Date(entry.enviado_em ?? entry.created_at).toLocaleString('pt-BR')}
              </p>
              {entry.error_message ? (
                <p className="mt-1 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {entry.error_message}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
